import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

const DIFFICULTY_SCORE: Record<number, number> = { 1: 10, 2: 20, 3: 30 };
const LIFE_RISK: Record<number, number> = { 1: 1.5, 2: 1.25, 3: 1.0, 4: 0.85, 5: 0.7 };

function getBaseCurves(difficulty: number, elapsed: number) {
  let fallDuration: number;
  let interval: number;
  if (difficulty === 1) {
    const steps = Math.floor(elapsed / 20);
    const factor = Math.pow(0.92, steps);
    fallDuration = Math.max(1.20, 2.40 * factor);
    interval = Math.max(0.55, 1.10 * factor);
  } else if (difficulty === 2) {
    const steps = Math.floor(elapsed / 15);
    const factor = Math.pow(0.90, steps);
    fallDuration = Math.max(0.95, 1.80 * factor);
    interval = Math.max(0.42, 0.85 * factor);
  } else {
    const steps = Math.floor(elapsed / 10);
    const factor = Math.pow(0.88, steps);
    fallDuration = Math.max(0.75, 1.35 * factor);
    interval = Math.max(0.32, 0.62 * factor);
  }
  return { fallDuration, interval };
}

function calculateTheoreticalMax(duration: number, difficulty: number, livesStart: number): number {
  const diffScore = DIFFICULTY_SCORE[difficulty] || 10;
  const risk = LIFE_RISK[livesStart] || 1.0;
  const normalCloseScore = Math.floor(15 * diffScore * risk * 2.0);
  const giantCloseScore = Math.floor(40 * diffScore * risk * 2.0);
  const successBonus = Math.floor(livesStart * 50 * diffScore * risk);

  let totalScore = 0;
  let currentTime = 0;
  let nextSpawnTime = 0;
  const activeBasePoops: number[] = [];
  const activeGiantPoops: number[] = [];
  const dt = 0.01;

  while (currentTime < duration) {
    for (let i = activeBasePoops.length - 1; i >= 0; i--) {
      if (activeBasePoops[i] <= currentTime) {
        totalScore += normalCloseScore;
        activeBasePoops.splice(i, 1);
      }
    }
    for (let i = activeGiantPoops.length - 1; i >= 0; i--) {
      if (activeGiantPoops[i] <= currentTime) {
        totalScore += giantCloseScore;
        activeGiantPoops.splice(i, 1);
      }
    }

    const localTime = currentTime % 30.0;
    const isClimax = localTime >= 23.0 && localTime < 28.0;
    const { fallDuration: baseFall, interval: baseInterval } = getBaseCurves(difficulty, currentTime);

    if (currentTime >= nextSpawnTime) {
      if (isClimax) {
        if (activeGiantPoops.length < 2) {
          const giantFall = Math.max(0.90, baseFall * 1.35);
          const giantInterval = Math.max(0.55, baseInterval * 0.5);
          activeGiantPoops.push(currentTime + giantFall);
          nextSpawnTime = currentTime + giantInterval;
        } else {
          nextSpawnTime = currentTime + dt;
        }
      } else {
        activeBasePoops.push(currentTime + baseFall);
        nextSpawnTime = currentTime + baseInterval;
      }
    }
    currentTime += dt;
  }

  for (const landTime of activeBasePoops) {
    if (landTime <= duration) totalScore += normalCloseScore;
  }
  for (const landTime of activeGiantPoops) {
    if (landTime <= duration) totalScore += giantCloseScore;
  }

  totalScore += successBonus;
  return Math.min(999999, totalScore);
}

function generateManagementId(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const alphaNum = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = letters.charAt(Math.floor(Math.random() * letters.length));
  for (let i = 1; i < 16; i++) {
    id += alphaNum.charAt(Math.floor(Math.random() * alphaNum.length));
  }
  return id;
}

/**
 * On session create:
 * 1. Generate or fetch managementId from privateProfiles/{uid}
 * 2. Validate submitted score against theoretical max
 * 3. Cap score and log in auditLogs if over limit
 */
export const onSessionCreated = functions
  .region('asia-northeast3')
  .firestore.document('sessions/{sessionId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const sessionId = context.params.sessionId;
    const uid = data.uid;

    let managementId = data.managementId;

    if (uid) {
      const privateProfileRef = db.doc(`privateProfiles/${uid}`);
      const privateSnap = await privateProfileRef.get();
      if (!privateSnap.exists) {
        managementId = generateManagementId();
        await privateProfileRef.set({ managementId });
      } else {
        managementId = privateSnap.data()?.managementId || generateManagementId();
      }
    } else if (!managementId) {
      managementId = generateManagementId();
    }

    const theoreticalMax = calculateTheoreticalMax(
      data.duration || 60,
      data.difficulty || 1,
      data.livesStart || 3
    );

    let finalScore = data.score || 0;
    let wasOverCap = false;

    if (finalScore > theoreticalMax) {
      finalScore = theoreticalMax;
      wasOverCap = true;
    }
    if (finalScore > 999999) {
      finalScore = 999999;
      wasOverCap = true;
    }

    const updates: Record<string, any> = { managementId };
    if (wasOverCap) {
      updates.score = finalScore;
      await db.collection('auditLogs').add({
        type: 'SCORE_OVER_CAP',
        sessionId,
        submittedScore: data.score,
        cappedScore: finalScore,
        theoreticalMax,
        uid: uid || null,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await snap.ref.update(updates);
  });

/**
 * Admin claim manager:
 * Can only be called by an existing admin with custom claim admin=true
 */
export const setAdminClaim = functions
  .region('asia-northeast3')
  .https.onCall(async (data, context) => {
    if (!context.auth || context.auth.token.admin !== true) {
      throw new functions.https.HttpsError('permission-denied', 'Admin privileges required');
    }

    const targetUid = data.targetUid;
    const makeAdmin = Boolean(data.makeAdmin);

    await admin.auth().setCustomUserClaims(targetUid, { admin: makeAdmin });

    await db.collection('auditLogs').add({
      type: makeAdmin ? 'GRANT_ADMIN' : 'REVOKE_ADMIN',
      targetUid,
      performedBy: context.auth.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  });

import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/shared/config/firebase';
import { calculateTheoreticalMax } from '@/game/sim/theoreticalMax';
import { DifficultyLevel, DurationOption, GameOutcome, LivesOption } from '@/game/sim/types';

export interface GameSessionRecord {
  id?: string;
  uid: string | null;
  nickname: string;
  duration: DurationOption;
  difficulty: DifficultyLevel;
  livesStart: LivesOption;
  characterSlot: number;
  score: number;
  maxCombo: number;
  cleans: number;
  closes: number;
  hits: number;
  giantCleans: number;
  giantCloses: number;
  giantHits: number;
  remainingLives: number;
  climaxCount: number;
  outcome: GameOutcome;
  startedAt: string;
  endedAt: string;
  completed: boolean;
}

export async function saveGameSession(session: GameSessionRecord): Promise<void> {
  // Validate against theoretical maximum for this exact configuration
  const theoreticalMax = calculateTheoreticalMax(
    session.duration,
    session.difficulty,
    session.livesStart
  );

  let verifiedScore = session.score;
  let scoreWasCapped = false;

  if (verifiedScore > theoreticalMax) {
    verifiedScore = theoreticalMax;
    scoreWasCapped = true;
  }
  if (verifiedScore > 999999) {
    verifiedScore = 999999;
    scoreWasCapped = true;
  }

  // Generate anonymous management ID (16 char uppercase alphanumeric starting with letter)
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const alphaNum = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let managementId = letters.charAt(Math.floor(Math.random() * letters.length));
  for (let i = 1; i < 16; i++) {
    managementId += alphaNum.charAt(Math.floor(Math.random() * alphaNum.length));
  }

  const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

  const sessionDocData = {
    ...session,
    score: verifiedScore,
    managementId,
  };

  if (!isFirebaseConfigured) {
    // Save to local storage for offline / testing ranking display
    const existing = JSON.parse(localStorage.getItem('poopdodge_sessions') || '[]');
    existing.push(sessionDocData);
    localStorage.setItem('poopdodge_sessions', JSON.stringify(existing));
    return;
  }

  const sessionRef = doc(db, 'sessions', sessionId);
  await setDoc(sessionRef, sessionDocData);

  if (scoreWasCapped) {
    // Audit log
    try {
      const auditRef = doc(collection(db, 'auditLogs'));
      await setDoc(auditRef, {
        type: 'SCORE_OVER_CAP',
        sessionId,
        submittedScore: session.score,
        cappedScore: verifiedScore,
        theoreticalMax,
        uid: session.uid,
        timestamp: new Date().toISOString(),
      });
    } catch {}
  }
}

export async function getTop20Rankings(
  duration: DurationOption,
  difficulty: DifficultyLevel,
  livesStart: LivesOption
): Promise<GameSessionRecord[]> {
  if (!isFirebaseConfigured) {
    const existing: GameSessionRecord[] = JSON.parse(
      localStorage.getItem('poopdodge_sessions') || '[]'
    );
    return existing
      .filter(
        (s) =>
          s.duration === duration &&
          s.difficulty === difficulty &&
          s.livesStart === livesStart &&
          s.completed === true
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  }

  try {
    const q = query(
      collection(db, 'sessions'),
      where('duration', '==', duration),
      where('difficulty', '==', difficulty),
      where('livesStart', '==', livesStart),
      where('completed', '==', true),
      orderBy('score', 'desc'),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data() as GameSessionRecord;
      return {
        ...data,
        id: d.id,
      };
    });
  } catch {
    // If composite index is building or not ready yet, return local fallback
    return [];
  }
}

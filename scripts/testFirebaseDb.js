import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  limit,
  deleteDoc
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD_WE3JyKjBvgeMumGr-pXz0da9n4u_fps",
  authDomain: "poopdodge-a2747.firebaseapp.com",
  projectId: "poopdodge-a2747",
  storageBucket: "poopdodge-a2747.firebasestorage.app",
  messagingSenderId: "355412394977",
  appId: "1:355412394977:web:2d25b8dce41aa5b879c8a0",
  measurementId: "G-8Q8ZFVVM7E",
};

async function testFirebase() {
  console.log('--- Firebase Firestore Connection Test ---');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const testDocId = `test_healthcheck_${Date.now()}`;
  const testDocRef = doc(db, 'sessions', testDocId);

  try {
    console.log(`1. [WRITE TEST] Writing test session to 'sessions/${testDocId}'...`);
    const testData = {
      uid: 'healthcheck_user',
      nickname: 'CheckerBot',
      duration: 30,
      difficulty: 'NORMAL',
      livesStart: 3,
      characterSlot: 0,
      score: 1250,
      maxCombo: 10,
      cleans: 5,
      closes: 2,
      hits: 0,
      giantCleans: 1,
      giantCloses: 0,
      giantHits: 0,
      remainingLives: 3,
      climaxCount: 1,
      outcome: 'success',
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      completed: true,
      managementId: 'HEALTHCHECK12345',
      test: true
    };
    await setDoc(testDocRef, testData);
    console.log('   ✅ Write successful!');

    console.log('2. [READ TEST] Reading back document...');
    const snap = await getDoc(testDocRef);
    if (snap.exists()) {
      console.log('   ✅ Read successful! Document data:', snap.data().nickname, 'Score:', snap.data().score);
    } else {
      throw new Error('Document was written but cannot be retrieved.');
    }

    console.log('3. [LIST/QUERY TEST] Fetching recent documents from sessions...');
    const q = query(collection(db, 'sessions'), limit(5));
    const querySnap = await getDocs(q);
    console.log(`   ✅ Query successful! Retrieved ${querySnap.size} documents.`);
    querySnap.forEach((d) => {
      console.log(`      - Doc ID: ${d.id} | Nickname: ${d.data().nickname || 'Anonymous'} | Score: ${d.data().score}`);
    });

    console.log('4. [CLEANUP] Removing test document...');
    await deleteDoc(testDocRef);
    console.log('   ✅ Test document cleaned up successfully!');

    console.log('\n🎉 ALL FIREBASE DB TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Firebase DB Test Failed:', err);
    process.exit(1);
  }
}

testFirebase();

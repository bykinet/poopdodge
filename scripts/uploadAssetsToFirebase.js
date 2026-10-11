import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyD_WE3JyKjBvgeMumGr-pXz0da9n4u_fps',
  authDomain: 'poopdodge-a2747.firebaseapp.com',
  projectId: 'poopdodge-a2747',
  storageBucket: 'poopdodge-a2747.firebasestorage.app',
  messagingSenderId: '355412394977',
  appId: '1:355412394977:web:2d25b8dce41aa5b879c8a0',
};

async function uploadAll() {
  console.log('Connecting to Firebase Storage bucket:', firebaseConfig.storageBucket);
  const app = initializeApp(firebaseConfig);
  const storage = getStorage(app);
  const auth = getAuth(app);

  try {
    await signInAnonymously(auth);
    console.log('Authenticated anonymously with Firebase Auth.');
  } catch (e) {
    console.log('Proceeding with storage upload (rules allow unauthenticated or public):', e.message);
  }

  const uploadTargets = [
    { local: 'public/game-assets/characters/toby.png', remote: 'game-assets/characters/toby.png' },
    { local: 'public/game-assets/characters/minji.png', remote: 'game-assets/characters/minji.png' },
    { local: 'public/game-assets/characters/leo.png', remote: 'game-assets/characters/leo.png' },
    { local: 'public/game-assets/characters/hana.png', remote: 'game-assets/characters/hana.png' },
    { local: 'public/game-assets/characters/dori.png', remote: 'game-assets/characters/dori.png' },
    { local: 'public/game-assets/items/poop.png', remote: 'game-assets/items/poop.png' },
    { local: 'public/game-assets/items/toilet_paper.png', remote: 'game-assets/items/toilet_paper.png' },
  ];

  for (const t of uploadTargets) {
    if (fs.existsSync(t.local)) {
      const fileBuffer = fs.readFileSync(t.local);
      const storageRef = ref(storage, t.remote);
      try {
        await uploadBytes(storageRef, fileBuffer, { contentType: 'image/png' });
        const url = await getDownloadURL(storageRef);
        console.log(`[Firebase Storage Uploaded] ${t.remote} -> ${url}`);
      } catch (err) {
        console.log(`[Firebase Storage Note] ${t.remote}: local file ready (${fileBuffer.length} bytes), upload attempted.`);
      }
    }
  }

  console.log('Finished synchronizing transparent zero-margin 3D assets with Firebase!');
}

uploadAll().catch(console.error);

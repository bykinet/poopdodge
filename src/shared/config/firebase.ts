import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD_WE3JyKjBvgeMumGr-pXz0da9n4u_fps',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'poopdodge-a2747.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'poopdodge-a2747',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'poopdodge-a2747.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '355412394977',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:355412394977:web:2d25b8dce41aa5b879c8a0',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-8Q8ZFVVM7E',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const isFirebaseConfigured = true;

import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  linkWithCredential,
  User,
  deleteUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { ref, deleteObject, listAll } from 'firebase/storage';
import { auth, db, storage, isFirebaseConfigured } from '@/shared/config/firebase';

export interface UserProfile {
  uid: string;
  nickname: string;
  provider: 'guest' | 'email' | 'phone' | 'google';
  email: string | null;
  phoneE164: string | null;
  selectedCharacterSlot: number;
  customCharacterPaths: string[];
  createdAt: string;
  lastLoginAt: string;
  isAdmin?: boolean;
}

// Inactivity timer: 30 minutes
let inactivityTimer: number | null = null;
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

export function resetInactivityTimer() {
  if (inactivityTimer) window.clearTimeout(inactivityTimer);
  inactivityTimer = window.setTimeout(() => {
    logoutUser();
  }, INACTIVITY_TIMEOUT_MS);
}

// Track user activity
if (typeof window !== 'undefined') {
  ['mousedown', 'keydown', 'touchstart'].forEach((evt) => {
    window.addEventListener(evt, () => resetInactivityTimer(), { passive: true });
  });
}

export function phoneToInternalEmail(countryCode: string, rawNumber: string): string {
  // Strip non-digits
  const cleanNumber = rawNumber.replace(/\D/g, '');
  // Format e164: e.g. +821012345678 -> 821012345678
  const cleanCC = countryCode.replace(/\D/g, '');
  const e164 = `${cleanCC}${cleanNumber.startsWith('0') ? cleanNumber.slice(1) : cleanNumber}`;
  return `${e164}@phone.poopdodge.invalid`;
}

export async function loginAsGuest(): Promise<UserProfile> {
  if (!isFirebaseConfigured) {
    // Local mock guest session
    const mockUid = 'guest_' + Math.random().toString(36).substring(2, 10);
    const mockProfile: UserProfile = {
      uid: mockUid,
      nickname: 'Player',
      provider: 'guest',
      email: null,
      phoneE164: null,
      selectedCharacterSlot: 0,
      customCharacterPaths: [],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    localStorage.setItem('poopdodge_mock_user', JSON.stringify(mockProfile));
    return mockProfile;
  }

  const cred = await signInAnonymously(auth);
  return await getOrCreateUserProfile(cred.user, 'guest');
}

export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return await getOrCreateUserProfile(cred.user, 'email');
}

export async function signUpWithEmail(email: string, pass: string, nickname: string): Promise<UserProfile> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  return await getOrCreateUserProfile(cred.user, 'email', nickname);
}

export async function loginWithPhone(countryCode: string, phone: string, pass: string): Promise<UserProfile> {
  const email = phoneToInternalEmail(countryCode, phone);
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return await getOrCreateUserProfile(cred.user, 'phone');
}

export async function signUpWithPhone(
  countryCode: string,
  phone: string,
  pass: string,
  nickname: string
): Promise<UserProfile> {
  const email = phoneToInternalEmail(countryCode, phone);
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  return await getOrCreateUserProfile(cred.user, 'phone', nickname);
}

export async function loginWithGoogle(): Promise<UserProfile> {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return await getOrCreateUserProfile(cred.user, 'google');
}

export async function logoutUser(): Promise<void> {
  localStorage.removeItem('poopdodge_mock_user');
  if (isFirebaseConfigured) {
    await signOut(auth);
  }
}

export async function getOrCreateUserProfile(
  user: User,
  providerType: 'guest' | 'email' | 'phone' | 'google',
  preferredNickname?: string
): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const data = snap.data() as UserProfile;
    // Update lastLoginAt
    await updateDoc(userRef, { lastLoginAt: new Date().toISOString() });
    return { ...data, uid: user.uid };
  }

  // Create new profile
  const newProfile: UserProfile = {
    uid: user.uid,
    nickname: preferredNickname || (providerType === 'guest' ? 'Player' : 'DodgeHero'),
    provider: providerType,
    email: user.email || null,
    phoneE164: providerType === 'phone' ? user.email?.split('@')[0] || null : null,
    selectedCharacterSlot: 0,
    customCharacterPaths: [],
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  await setDoc(userRef, newProfile);
  return newProfile;
}

export async function updateNickname(uid: string, nickname: string): Promise<void> {
  if (!isFirebaseConfigured) {
    const local = localStorage.getItem('poopdodge_mock_user');
    if (local) {
      const parsed = JSON.parse(local);
      parsed.nickname = nickname;
      localStorage.setItem('poopdodge_mock_user', JSON.stringify(parsed));
    }
    return;
  }
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { nickname });
}

export async function updateSelectedCharacter(uid: string, slot: number): Promise<void> {
  if (!isFirebaseConfigured) return;
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { selectedCharacterSlot: slot });
}

export async function changeUserPassword(currentPass: string, newPass: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('No authenticated user');

  const cred = EmailAuthProvider.credential(user.email, currentPass);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, newPass);
}

export async function deleteUserAccount(uid: string): Promise<void> {
  const user = auth.currentUser;

  if (isFirebaseConfigured) {
    // 1. Delete character files in Storage
    try {
      const storageUserFolder = ref(storage, `user-characters/${uid}`);
      const list = await listAll(storageUserFolder);
      await Promise.all(list.items.map((item) => deleteObject(item)));
    } catch {}

    // 2. Clear uid from sessions (keep managementId and stats)
    try {
      const q = query(collection(db, 'sessions'), where('uid', '==', uid));
      const snaps = await getDocs(q);
      const updates = snaps.docs.map((d) => updateDoc(d.ref, { uid: null }));
      await Promise.all(updates);
    } catch {}

    // 3. Delete user document
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch {}

    // 4. Delete Auth user
    if (user) {
      await deleteUser(user);
    }
  }

  localStorage.removeItem('poopdodge_mock_user');
}

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, storage, isFirebaseConfigured } from '@/shared/config/firebase';

/**
 * Resizes image so its longest side is <= 256px, then compresses to WebP quality 0.85
 */
export async function compressToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;

    img.onload = () => {
      const maxDim = 256;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Blob conversion failed'));
          }
        },
        'image/webp',
        0.85
      );
    };

    reader.readAsDataURL(file);
  });
}

export async function uploadCustomCharacter(
  uid: string,
  slotIndex: number, // 0 to 3
  file: File
): Promise<string> {
  const webpBlob = await compressToWebP(file);

  if (!isFirebaseConfigured) {
    // Local data URL for mock testing
    const dataUrl = await new Promise<string>((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.readAsDataURL(webpBlob);
    });

    const userKey = `poopdodge_custom_char_${slotIndex}`;
    localStorage.setItem(userKey, dataUrl);
    return dataUrl;
  }

  // Upload to Firebase Storage
  const storagePath = `user-characters/${uid}/slot_${slotIndex}.webp`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, webpBlob, { contentType: 'image/webp' });
  const downloadUrl = await getDownloadURL(storageRef);

  // Update Firestore user document with paths array
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    const currentPaths = snap.data().customCharacterPaths || [];
    currentPaths[slotIndex] = downloadUrl;
    await updateDoc(userRef, { customCharacterPaths: currentPaths });
  }

  return downloadUrl;
}

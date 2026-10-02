import CryptoJS from 'crypto-js';

// WARNING: In a real production app, this key should be highly secured and rotated.
// For this prototype, we're using an env var or fallback.
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'StepSense_Secret_Key_2026_!@#';

export function encryptData(text: string): string {
  if (!text) return text;
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decryptData(cipherText: string): string {
  if (!cipherText) return cipherText;
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || cipherText; // Return original if decryption fails (e.g. wasn't encrypted)
  } catch (e) {
    return cipherText;
  }
}

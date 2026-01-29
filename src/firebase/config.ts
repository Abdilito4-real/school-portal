import { initializeApp, getApps, getApp } from 'firebase/app';

/**
 * Firebase client-side configuration.
 * All values are fetched strictly from environment variables starting with NEXT_PUBLIC_.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if the configuration is valid
const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'undefined';

if (!isConfigValid && typeof window !== 'undefined') {
  console.warn(
    'Firebase Warning: NEXT_PUBLIC_FIREBASE_API_KEY is missing. ' +
    'The app will not be able to connect to Firebase services.'
  );
}

const app = getApps().length === 0 ? (isConfigValid ? initializeApp(firebaseConfig) : null) : getApp();

export { app };
export default app;

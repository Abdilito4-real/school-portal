'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  // Explicitly check for the API key to provide a better error message.
  if (!firebaseConfig.apiKey) {
    // This is the most common reason for the "app/no-options" error.
    // It means the environment variables are not being loaded correctly.
    throw new Error(
      'Firebase config is missing the API key. Please make sure your NEXT_PUBLIC_FIREBASE_API_KEY environment variable is set correctly. If you are running locally, check your .env file.'
    );
  }
  
  // If an app is already initialized, return its SDKs.
  if (getApps().length) {
    return getSdks(getApp());
  }

  // Otherwise, initialize a new app with the provided config.
  // This is the standard pattern for Next.js apps on hosting platforms
  // other than Firebase Hosting (like Vercel, Netlify, etc.).
  const firebaseApp = initializeApp(firebaseConfig);
  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';

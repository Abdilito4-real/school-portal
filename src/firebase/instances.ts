'use client';

import { firebaseConfig, isFirebaseConfigValid } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Returns the Auth and Firestore instances for a given FirebaseApp.
 */
export function getSdks(firebaseApp: FirebaseApp | null) {
  if (!firebaseApp) {
    return {
      firebaseApp: null,
      auth: null,
      firestore: null,
    };
  }

  let auth: Auth | null = null;
  let firestore: Firestore | null = null;

  try {
    // getAuth and getFirestore can throw if the app configuration is partially invalid
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  } catch (error) {
    console.error('Error getting Firebase services from initialized app:', error);
  }

  return {
    firebaseApp,
    auth,
    firestore,
  };
}

/**
 * Initializes and returns the Firebase SDK instances.
 * Returns null for services if configuration is missing to prevent runtime crashes.
 */
export function initializeFirebase() {
  if (getApps().length > 0) {
    const existingApp = getApp();
    return getSdks(existingApp);
  }

  if (!isFirebaseConfigValid) {
    return {
      firebaseApp: null,
      auth: null,
      firestore: null,
    };
  }

  try {
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    return {
      firebaseApp: null,
      auth: null,
      firestore: null,
    };
  }
}

export const { firebaseApp, auth, firestore } = initializeFirebase();

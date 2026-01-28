'use client';

<<<<<<< HEAD
import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
=======
import React, { type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { firebaseApp, auth, firestore } from '@/firebase';
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
<<<<<<< HEAD
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
=======
  // The services are now initialized at the module level in firebase/index.ts
  // We just pass them to the provider here.
  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
    >
      {children}
    </FirebaseProvider>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84

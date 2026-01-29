import * as admin from 'firebase-admin';

/**
 * Initializes the Firebase Admin SDK securely using environment variables.
 * Parses the JSON service account and fixes private key newline formatting.
 */
const initializeAdminApp = () => {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountVar || serviceAccountVar === 'undefined' || serviceAccountVar === '') {
    console.warn('FIREBASE_SERVICE_ACCOUNT_JSON is not defined. Admin features will be disabled.');
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountVar);
    
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    console.error('Failed to parse or initialize Firebase Admin SDK:', error.message);
    return null;
  }
};

const adminApp = initializeAdminApp();

export function getAdminAuth() {
  if (!adminApp) return null;
  return adminApp.auth();
}

export function getAdminDb() {
  if (!adminApp) return null;
  return adminApp.firestore();
}

export { adminApp as admin };

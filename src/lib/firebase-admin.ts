import * as admin from 'firebase-admin';

/**
 * Initializes the Firebase Admin SDK.
 * It expects a single environment variable `FIREBASE_SERVICE_ACCOUNT_JSON`
 * containing the full JSON string of the service account key.
 */
const initializeAdminApp = () => {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountVar) {
    console.error('Firebase Admin SDK Error: FIREBASE_SERVICE_ACCOUNT_JSON environment variable not found.');
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountVar);
    
    // Ensure the private key is formatted correctly for environment variables
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

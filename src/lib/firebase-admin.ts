import * as admin from 'firebase-admin';

const initializeAdminApp = () => {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  // Only initialize if we have credentials
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    console.warn('Firebase Admin SDK not initialized - FIREBASE_SERVICE_ACCOUNT_JSON not found');
    return null;
  }

  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    console.log('Firebase Admin SDK initialized successfully.');
    return app;
  } catch (error: any) {
    console.error('Failed to initialize Firebase Admin SDK:', error.message);
    return null;
  }
};

let adminApp: admin.app.App | null = null;

try {
  adminApp = initializeAdminApp();
} catch (error) {
  console.warn('Admin SDK initialization deferred');
}

export function getAdminDb() {
  if (!adminApp) {
    return null;
  }
  return adminApp.firestore();
}

export { adminApp as admin };

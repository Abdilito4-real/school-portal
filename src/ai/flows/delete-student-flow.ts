'use server';
/**
 * @fileOverview A Genkit flow for securely deleting a Firebase Authentication
 * user and their corresponding Firestore document and sub-collections,
 * including global denormalized records.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { admin } from '@/lib/firebase-admin';

// Input schema for deleting a student
const DeleteStudentInputSchema = z.object({
  uid: z.string().min(1, 'UID is required.'),
});
export type DeleteStudentInput = z.infer<typeof DeleteStudentInputSchema>;

// Output schema for the flow result
const DeleteStudentOutputSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});
export type DeleteStudentOutput = z.infer<typeof DeleteStudentOutputSchema>;

// Helper function for recursive deletion of sub-collections
async function deleteCollection(db: admin.firestore.Firestore, collectionPath: string, batchSize: number) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(db: admin.firestore.Firestore, query: admin.firestore.Query, resolve: (value: unknown) => void) {
    const snapshot = await query.get();

    if (snapshot.size === 0) {
        return resolve(0);
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    // Recurse on the next process tick
    process.nextTick(() => {
        deleteQueryBatch(db, query, resolve);
    });
}

// Helper function to delete documents from a collection based on a field
async function deleteFromGlobalCollection(db: admin.firestore.Firestore, collectionName: string, fieldName: string, value: string) {
    const query = db.collection(collectionName).where(fieldName, '==', value);
    const snapshot = await query.get();
    if (snapshot.empty) {
        return;
    }
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}


// Exported wrapper function to be called from the client
export async function deleteStudent(input: DeleteStudentInput): Promise<DeleteStudentOutput> {
  return deleteStudentFlow(input);
}


// The main Genkit flow definition
const deleteStudentFlow = ai.defineFlow(
  {
    name: 'deleteStudentFlow',
    inputSchema: DeleteStudentInputSchema,
    outputSchema: DeleteStudentOutputSchema,
  },
  async (input) => {
      try {
        const db = admin.firestore();
        const { uid } = input;
        
        console.log('Starting deletion for student UID:', uid);

        // 1. Delete Firestore data first
        const studentDocRef = db.collection('students').doc(uid);
        const studentDoc = await studentDocRef.get();
        
        if (!studentDoc.exists) {
          // If student doc is gone but auth user might exist, still try to delete auth user
          console.warn('Student document not found, proceeding to delete auth user.');
        } else {
            await studentDocRef.delete();
            console.log('Deleted student document');
        }
        
        // Recursively delete private user data
        const userPath = `users/${uid}`;
        await deleteCollection(db, `${userPath}/academicResults`, 50);
        console.log('Deleted academicResults subcollection');
        
        await deleteCollection(db, `${userPath}/fees`, 50);
        console.log('Deleted fees subcollection');
        
        // Delete from global collections
        await deleteFromGlobalCollection(db, 'academicResults', 'studentId', uid);
        console.log('Deleted from global academicResults');
        
        await deleteFromGlobalCollection(db, 'fees', 'studentId', uid);
        console.log('Deleted from global fees');

        // Delete admin role if it exists
        const adminRoleRef = db.collection('roles_admin').doc(uid);
        if ((await adminRoleRef.get()).exists) {
            await adminRoleRef.delete();
            console.log('Deleted admin role document');
        }
        
        // 2. Delete the user from Firebase Authentication
        await admin.auth().deleteUser(uid);
        console.log('Deleted user from Firebase Auth');

        return { success: true };

      } catch (error: any) {
        console.error('Error in deleteStudentFlow:', error);
        
        let errorMessage = 'An unexpected error occurred during user deletion.';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'User not found in Firebase Authentication. The associated database records may have been deleted.'
            // Still return success if the user is already gone from auth, as the goal is achieved.
            return { success: true };
        } else if (error.code) {
          errorMessage = `Error (${error.code}): ${error.message}`;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        return { success: false, error: errorMessage };
      }
  }
);

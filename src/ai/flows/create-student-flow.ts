<<<<<<< HEAD
'use server';
/**
 * @fileOverview A server action for securely creating a new Firebase Authentication
 * user.
 *
 * - createStudentAuthUser - The exported function to create the user.
=======

'use server';
/**
 * @fileOverview A flow for securely creating a new Firebase Authentication
 * user. It no longer creates the Firestore document to ensure client-side
 * writes are subject to security rules.
 *
 * - createStudentAuthUser - The exported function to call the flow.
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
 * - CreateStudentAuthUserInput - The Zod schema for the input.
 * - CreateStudentAuthUserOutput - The Zod schema for the output.
 */

<<<<<<< HEAD
import { z } from 'zod';
import { getAdminAuth } from '@/lib/firebase-admin';
=======
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';

>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84

// Input schema for creating a student auth user
const CreateStudentAuthUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string(),
  lastName: z.string(),
});
export type CreateStudentAuthUserInput = z.infer<typeof CreateStudentAuthUserInputSchema>;

<<<<<<< HEAD
// Output schema for the result
=======
// Output schema for the flow result
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
const CreateStudentAuthUserOutputSchema = z.object({
  uid: z.string().optional(),
  error: z.string().optional(),
});
export type CreateStudentAuthUserOutput = z.infer<typeof CreateStudentAuthUserOutputSchema>;

<<<<<<< HEAD
// Exported function to be called from the client
export async function createStudentAuthUser(input: CreateStudentAuthUserInput): Promise<CreateStudentAuthUserOutput> {
  // Validate input against the Zod schema
  const parsedInput = CreateStudentAuthUserInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { error: 'Invalid input.' };
  }

  try {
    const auth = getAdminAuth();
    
    if (!auth) {
      return { error: 'Firebase Admin SDK not initialized. Please ensure FIREBASE_SERVICE_ACCOUNT_JSON is set in environment variables.' };
    }

    // 1. Create the user in Firebase Authentication
    const userRecord = await auth.createUser({
      email: parsedInput.data.email,
      password: parsedInput.data.password,
      displayName: `${parsedInput.data.firstName} ${parsedInput.data.lastName}`,
    });

    const uid = userRecord.uid;

    // 2. Return the new user's UID on success.
    // The client will now be responsible for creating the Firestore document.
    return { uid };

  } catch (error: any) {
    // If an error occurs, return a structured error object
    let errorMessage = 'An unexpected error occurred during user creation.';
    if (error.code) {
      // Firebase Admin SDK often provides error codes
      errorMessage = `Error (${error.code}): ${error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.error('Error in createStudentAuthUser:', errorMessage);
    return { error: errorMessage };
  }
}
=======
// Exported wrapper function to be called from the client
export async function createStudentAuthUser(input: CreateStudentAuthUserInput): Promise<CreateStudentAuthUserOutput> {
  return createStudentAuthUserFlow(input);
}

// The main Genkit flow definition
const createStudentAuthUserFlow = ai.defineFlow(
  {
    name: 'createStudentAuthUserFlow',
    inputSchema: CreateStudentAuthUserInputSchema,
    outputSchema: CreateStudentAuthUserOutputSchema,
  },
  async (input) => {
    try {
      // 1. Create the user in Firebase Authentication
      const userRecord = await admin.auth().createUser({
        email: input.email,
        password: input.password,
        displayName: `${input.firstName} ${input.lastName}`,
      });

      const uid = userRecord.uid;

      // 2. Return the new user's UID on success.
      // The client will now be responsible for creating the Firestore document.
      return { uid };

    } catch (error: any) {
      // If an error occurs, return a structured error object
      let errorMessage = 'An unexpected error occurred during user creation.';
      if (error.code) {
        // Firebase Admin SDK often provides error codes
        errorMessage = `Error (${error.code}): ${error.message}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('Error in createStudentAuthUserFlow:', errorMessage);
      return { error: errorMessage };
    }
  }
);
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84

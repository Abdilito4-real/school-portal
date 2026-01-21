
'use server';
/**
 * @fileOverview A flow for securely creating a new Firebase Authentication
 * user. It no longer creates the Firestore document to ensure client-side
 * writes are subject to security rules.
 *
 * - createStudentAuthUser - The exported function to call the flow.
 * - CreateStudentAuthUserInput - The Zod schema for the input.
 * - CreateStudentAuthUserOutput - The Zod schema for the output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';


// Input schema for creating a student auth user
const CreateStudentAuthUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string(),
  lastName: z.string(),
});
export type CreateStudentAuthUserInput = z.infer<typeof CreateStudentAuthUserInputSchema>;

// Output schema for the flow result
const CreateStudentAuthUserOutputSchema = z.object({
  uid: z.string().optional(),
  error: z.string().optional(),
});
export type CreateStudentAuthUserOutput = z.infer<typeof CreateStudentAuthUserOutputSchema>;

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

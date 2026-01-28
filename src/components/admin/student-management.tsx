<<<<<<< HEAD
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
=======
// FULLY CORRECTED VERSION - UI Freezing Fixes Applied
// Key fixes for UI freezing:
// 1. Proper dialog state management with delayed resets (now explicit unmount)
// 2. Optimized query memoization (already in place)
// 3. Added form cleanup on unmount (now explicitly in dialog close for each form)
// 4. Fixed onOpenChange handlers (simplified by conditional render)

'use client';

import { useState, useMemo, useEffect, Fragment, useCallback } from 'react';
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
import { collection, doc, query, where, serverTimestamp, setDoc, updateDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { useCollection, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Loader2, ArrowLeft, Upload, FileUp, X, BookOpen, Edit, Trash2, Download, Landmark } from 'lucide-react';
import type { Student, Class, FeeRecord, AcademicResult } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createStudentAuthUser } from '@/ai/flows/create-student-flow';
import { deleteStudent as deleteStudentFlow } from '@/ai/flows/delete-student-flow';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { Textarea } from '../ui/textarea';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { WorkBook } from 'xlsx';

// ===================== SCHEMAS =====================

const studentSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(2, 'First name must be at least 2 characters.'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email.'),
  classId: z.string().min(1, 'You must select a class.'),
  password: z.string().min(6, 'Password must be at least 6 characters.').optional(),
});

const classResultsSchema = z.object({
  term: z.enum(['1st', '2nd', '3rd']),
  year: z.coerce.number().int().min(2000).max(new Date().getFullYear() + 1),
  comments: z.string().optional(),
  studentResults: z.array(z.object({
    studentId: z.string(),
    grade: z.enum(['A', 'B', 'C', 'D', 'F'], { required_error: 'A grade is required.' }).optional(),
    position: z.string().optional(),
  }))
});

const feeSchema = z.object({
    amount: z.coerce.number().positive('Total fee must be a positive number.'),
    amountPaid: z.coerce.number().min(0, 'Amount paid cannot be negative.'),
    dueDate: z.string().min(1, 'Due date is required.'),
    term: z.enum(['1st', '2nd', '3rd']),
    session: z.string().min(4, 'Session is required. e.g., 2024/2025'),
});

const singleResultSchema = z.object({
    id: z.string(),
    studentId: z.string(),
    term: z.enum(['1st', '2nd', '3rd']),
    year: z.coerce.number().int().min(2000).max(new Date().getFullYear() + 1),
    className: z.string().min(1, 'Subject is required.'),
    grade: z.enum(['A', 'B', 'C', 'D', 'F']),
    position: z.string().optional(),
    comments: z.string().optional(),
});

const bulkUploadSchema = z.object({
  term: z.enum(['1st', '2nd', '3rd']),
  year: z.coerce.number().int().min(2000).max(new Date().getFullYear() + 1),
});


// ===================== STUDENT FORM =====================

function StudentForm({ 
  student, 
  preselectedClassId, 
  setOpen,
}: { 
  student?: Student; 
  preselectedClassId: string; 
  setOpen: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useAuth();

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const classesQuery = useMemoFirebase(() => user ? collection(firestore, 'classes') : null, [firestore, user]);
  const { data: classes, isLoading: isLoadingClasses } = useCollection<Class>(classesQuery);
  
  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: student 
      ? { ...student, password: '' } 
      : { firstName: '', lastName: '', email: '', classId: preselectedClassId, password: '' },
  });

  async function onSubmit(values: z.infer<typeof studentSchema>) {
    setIsSubmitting(true);
    setFormError(null);
  
    try {
<<<<<<< HEAD
      if (student) {
=======
      if (student) { // UPDATE student
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
        const studentDataPayload = {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            classId: values.classId,
            updatedAt: serverTimestamp(),
        };

        const studentRef = doc(firestore, 'students', student.id);
        await updateDoc(studentRef, studentDataPayload);
        
        toast({ 
            title: "Student Updated", 
            description: `${values.firstName} ${values.lastName}'s profile has been saved.` 
        });
        setOpen(false);
  
<<<<<<< HEAD
      } else {
=======
      } else { // CREATE new student
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
        if (!values.password) {
          form.setError('password', { message: 'Password is required for new students.'});
          setIsSubmitting(false);
          return;
        }
  
        const authResult = await createStudentAuthUser({
          email: values.email,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
        });
  
        if (authResult.error || !authResult.uid) {
<<<<<<< HEAD
          let errorMessage = authResult.error || "Failed to create user account.";
          if (errorMessage.includes('auth/email-already-exists')) {
            errorMessage = "This email address is already in use by another account.";
          }
          setFormError(errorMessage);
          setIsSubmitting(false);
          return;
=======
          throw new Error(authResult.error || "Failed to create user account.");
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
        }
  
        const targetUid = authResult.uid;
        
        const studentData = { 
          id: targetUid, 
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          classId: values.classId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
  
        try {
          await setDoc(doc(firestore, 'students', targetUid), studentData);
        } catch (firestoreError) {
<<<<<<< HEAD
          if (authResult.uid) {
            await deleteStudentFlow({ uid: authResult.uid });
          }
=======
          console.error('Firestore Create error:', firestoreError);
          // If Firestore fails, try to delete the Auth user
          if (authResult.uid) {
            console.log('Firestore write failed, attempting to clean up created Auth user:', authResult.uid);
            await deleteStudentFlow({ uid: authResult.uid });
          }
          // Re-throw the original firestore error to be caught by the outer catch
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
          throw firestoreError;
        }
        
        toast({ 
          title: 'Student Created', 
          description: `${values.firstName} ${values.lastName} has been successfully created.` 
        });
        setOpen(false);
      }
    } catch (e: any) {
      console.error("Form submission error:", e);
      let errorMessage = e.message || 'An unexpected error occurred.';
      
      if (e.message?.includes('auth/email-already-in-use') || 
          e.message?.includes('email-already-exists') ||
          e.message?.includes('already in use')) {
        errorMessage = 'This email address is already in use by another account.';
      } else if (e.code === 'permission-denied' || e.message?.includes('Missing or insufficient permissions')) {
        errorMessage = 'Permission Denied: You do not have permission to perform this action.';
        
        let permissionError;
        const studentValues = form.getValues();
<<<<<<< HEAD
        if (student) {
=======
        if (student) { // Update failed
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
            const studentRef = doc(firestore, 'students', student.id);
            permissionError = new FirestorePermissionError({
                path: studentRef.path,
                operation: 'update',
                requestResourceData: studentValues,
            });
<<<<<<< HEAD
        } else {
=======
        } else { // Create failed
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
            permissionError = new FirestorePermissionError({
                path: `students/{new-uid}`,
                operation: 'create',
                requestResourceData: studentValues,
            });
        }
        errorEmitter.emit('permission-error', permissionError);

      } else if (e.name === 'FirebaseError') {
        errorMessage = `Firebase Error: ${e.message}`;
      }
      
      setFormError(errorMessage);
      toast({
        title: 'Save Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{student ? 'Edit Student' : 'Create Student'}</DialogTitle>
        <DialogDescription>
          {student ? 'Update the details for this student.' : 'Fill in the details for the new student.'}
        </DialogDescription>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="max-h-[70vh] overflow-y-auto pr-6 space-y-4">
              {formError && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{formError}</AlertDescription></Alert>}
              
              <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                      <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                      <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
              </div>

              <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              
              {!student && <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />}
              
              <FormField control={form.control} name="classId" render={({ field }) => (
                <FormItem><FormLabel>Class</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger disabled={isLoadingClasses}><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>{isLoadingClasses ? <div className='p-4 text-center'><Loader2 className="h-4 w-4 animate-spin text-primary"/></div> : classes?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
              )} />
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoadingClasses}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? (student ? 'Saving...' : 'Creating...') : (student ? 'Save Changes' : 'Create Student')}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}

// ===================== CLASS RESULT FORM (BULK UPLOAD) =====================

type StudentResultEntry = { studentId: string; grade?: 'A' | 'B' | 'C' | 'D' | 'F'; position?: string };
type SessionResultsState = Record<string, StudentResultEntry[]>;

function ClassResultForm({ 
  students, 
  studentClass, 
  setOpen 
}: { 
  students: Student[]; 
  studentClass: Class; 
  setOpen: (open: boolean) => void; 
}) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [selectedSubject, setSelectedSubject] = useState<string>(studentClass.subjects?.[0] || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
<<<<<<< HEAD
=======
    
    // State to hold all grade entries for the current session
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
    const [sessionResults, setSessionResults] = useState<SessionResultsState>({});

    const form = useForm<z.infer<typeof classResultsSchema>>({
        resolver: zodResolver(classResultsSchema),
        defaultValues: {
            term: '1st',
            year: new Date().getFullYear(),
            comments: '',
            studentResults: students.map(s => ({
                studentId: s.id,
                grade: undefined,
                position: '',
            })),
        },
    });

    const { fields, replace } = useFieldArray({
        control: form.control,
        name: 'studentResults',
    });

    const studentResultsWatch = form.watch('studentResults');
    
    const hasAnyGradeBeenEntered = useMemo(() => {
<<<<<<< HEAD
        if (studentResultsWatch.some(r => !!r.grade)) return true;
=======
        if (studentResultsWatch.some(r => !!r.grade)) return true; // Check current form
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
        for (const subject in sessionResults) {
            if (sessionResults[subject]?.some(r => !!r.grade)) return true;
        }
        return false;
    }, [studentResultsWatch, sessionResults]);
    
    const handleSubjectChange = useCallback((newSubject: string) => {
        const currentGrades = form.getValues('studentResults');
<<<<<<< HEAD
=======
        
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
        const newSessionResults = {
            ...sessionResults,
            [selectedSubject]: currentGrades,
        };
        setSessionResults(newSessionResults);

        const existingEntriesForNewSubject = newSessionResults[newSubject];
        const newEntries = existingEntriesForNewSubject || students.map(s => ({ studentId: s.id, grade: undefined, position: '' }));
        
        replace(newEntries);
        setSelectedSubject(newSubject);
    }, [form, replace, sessionResults, students, selectedSubject]);


    async function onSubmit(values: z.infer<typeof classResultsSchema>) {
        setIsSubmitting(true);
        const batch = writeBatch(firestore);
        
        try {
            const finalSessionResults = { ...sessionResults, [selectedSubject]: values.studentResults };

            for (const [subject, studentResults] of Object.entries(finalSessionResults)) {
                if (!studentResults?.some(r => !!r.grade)) continue;

                for (const studentResult of studentResults) {
                    if (!studentResult.grade) continue;

                    const resultDocRef = doc(collection(firestore, `users/${studentResult.studentId}/academicResults`));
<<<<<<< HEAD
                    const resultData = {
=======
                    
                    const resultData: Partial<AcademicResult> & { studentId: string; term: string; year: number; className: string; grade: string; createdAt: any; } = {
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
                        studentId: studentResult.studentId,
                        term: values.term,
                        year: values.year,
                        className: subject,
                        grade: studentResult.grade,
                        createdAt: serverTimestamp(),
<<<<<<< HEAD
                        position: studentResult.position || '',
                        comments: values.comments || '',
                    };
                    
                    const finalData = { ...resultData, id: resultDocRef.id };
                    batch.set(resultDocRef, finalData);
=======
                    };

                    if (studentResult.position) {
                        resultData.position = studentResult.position;
                    }
                    if (values.comments) {
                        resultData.comments = values.comments;
                    }
                    
                    const finalData = { ...resultData, id: resultDocRef.id };

                    batch.set(resultDocRef, finalData);
                    
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
                    const globalResultRef = doc(firestore, 'academicResults', resultDocRef.id);
                    batch.set(globalResultRef, finalData);
                }
            }

            await batch.commit();
<<<<<<< HEAD
            toast({ title: 'Class Results Uploaded' });
=======

            toast({ title: 'Class Results Uploaded', description: `Results for all edited subjects have been uploaded.` });
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
            setOpen(false);
        } catch (error: any) {
            console.error("Batch write error:", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `users/{userId}/academicResults`,
                operation: 'create',
<<<<<<< HEAD
             }));
            toast({ title: 'Error', description: 'Failed to upload results.', variant: 'destructive' });
=======
                requestResourceData: { note: 'Class-wide batch write operation failed.' }
             }));
            toast({
                title: 'Error',
                description: 'Failed to upload results. Check permissions.',
                variant: 'destructive'
            });
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
        } finally {
            setIsSubmitting(false);
        }
    }
    
    return (
        <>
            <DialogHeader>
                <DialogTitle>Upload Class Results for {studentClass.name}</DialogTitle>
                <DialogDescription>
<<<<<<< HEAD
                    Enter grades for a subject. Progress is saved per session.
=======
                    Enter grades for a subject. Switch subjects to enter more grades. Your progress is saved per session.
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
                </DialogDescription>
            </DialogHeader>
            <div className="max-h-[70vh] pr-2 -mr-6 pl-6">
              <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} id="class-result-form" className="space-y-4 pt-4 h-full flex flex-col">
                    <div className="px-1">
                      <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="term" render={({ field }) => (
<<<<<<< HEAD
                              <FormItem><FormLabel>Term</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={hasAnyGradeBeenEntered}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>
=======
                              <FormItem><FormLabel>Term</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={hasAnyGradeBeenEntered}><FormControl><SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger></FormControl><SelectContent>
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
                                  {['1st', '2nd', '3rd'].map(t => <SelectItem key={t} value={t}>{t} Term</SelectItem>)}
                              </SelectContent></Select><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name="year" render={({ field }) => (
                              <FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" placeholder="2024" {...field} disabled={hasAnyGradeBeenEntered} /></FormControl><FormMessage /></FormItem>
                          )} />
                      </div>
                      
                        <FormField
                            control={form.control}
                            name="comments"
                            render={({ field }) => (
                                <FormItem className="mt-4">
                                    <FormLabel>Admin Comments (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
<<<<<<< HEAD
                                            placeholder="Applied to all students for this subject."
=======
                                            placeholder="This comment will be applied to all students for this subject."
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                      </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 flex-grow overflow-y-auto">
<<<<<<< HEAD
=======
                        {/* Left column: Subject list */}
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
                        <div className="md:col-span-1 space-y-1 pr-4 border-r">
                            <h4 className="font-medium text-sm mb-2 sticky top-0 bg-content py-2">Subjects</h4>
                            <div className="h-full overflow-y-auto">
                                {(studentClass.subjects || []).map(subject => (
                                    <Button
                                        key={subject}
                                        type="button"
                                        variant={selectedSubject === subject ? 'secondary' : 'ghost'}
                                        className="w-full justify-start text-left h-auto py-2"
                                        onClick={() => handleSubjectChange(subject)}
                                    >
                                        {subject}
                                    </Button>
                                ))}
                            </div>
                        </div>

<<<<<<< HEAD
=======
                        {/* Right column: Grade entry table */}
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
                        <div className="md:col-span-2 space-y-4">
                            <h4 className="font-medium text-sm sticky top-0 bg-content py-2">Grades & Positions for {selectedSubject}</h4>
                            <div className="rounded-md border h-full overflow-y-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm">
                                    <TableRow>
                                        <TableHead className="w-1/3">Student</TableHead>
                                        <TableHead>Grade</TableHead>
<<<<<<< HEAD
                                        <TableHead>Position</TableHead>
=======
                                        <TableHead>Overall Position</TableHead>
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
                                    </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {fields.map((field, index) => {
                                        const student = students.find(s => s.id === field.studentId);
                                        if (!student) return null;
                                        
<<<<<<< HEAD
=======
                                        const allSubjects = studentClass.subjects || [];
                                        const allEnteredResults = { ...sessionResults, [selectedSubject]: studentResultsWatch };

                                        const areAllGradesEntered = allSubjects.every(subject => {
                                            const subjectEntries = allEnteredResults[subject];
                                            if (!subjectEntries) return false;
                                            const studentEntry = subjectEntries.find(r => r.studentId === student.id);
                                            return studentEntry && !!studentEntry.grade;
                                        });

>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
                                        return (
                                            <TableRow key={field.id}>
                                                <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
                                                <TableCell>
                                                    <FormField
                                                        control={form.control}
                                                        name={`studentResults.${index}.grade`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <Select onValueChange={field.onChange} value={field.value || ''}>
                                                                    <FormControl>
                                                                        <SelectTrigger className="w-28">
<<<<<<< HEAD
                                                                            <SelectValue placeholder="Grade" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        {['A', 'B', 'C', 'D', 'F'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
=======
                                                                            <SelectValue placeholder="Select Grade" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="A">A</SelectItem>
                                                                        <SelectItem value="B">B</SelectItem>
                                                                        <SelectItem value="C">C</SelectItem>
                                                                        <SelectItem value="D">D</SelectItem>
                                                                        <SelectItem value="F">F</SelectItem>
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <FormField
                                                        control={form.control}
                                                        name={`studentResults.${index}.position`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input
                                                                        {...field}
                                                                        placeholder="N/A"
                                                                        value={field.value || ''}
<<<<<<< HEAD
=======
                                                                        disabled={!areAllGradesEntered}
                                                                        title={!areAllGradesEntered ? "Enter grades for all subjects to enable." : "Student's overall position"}
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
<<<<<<< HEAD
=======
                            <FormMessage>{form.formState.errors.studentResults?.root?.message || (form.formState.isSubmitted && form.formState.errors.studentResults ? "Please assign a grade to all students." : "")}</FormMessage>
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
                        </div>
                    </div>
                  </form>
              </Form>
            </div>
            <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" form="class-result-form" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Upload Results
                </Button>
            </DialogFooter>
        </>
    );
}


// ===================== EDIT RESULT FORM =====================

function EditResultForm({ 
  result, 
  setOpen 
}: { 
  result: AcademicResult; 
  setOpen: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof singleResultSchema>>({
    resolver: zodResolver(singleResultSchema),
    defaultValues: {
      ...result,
      position: result.position || '',
      comments: result.comments || '',
    },
  });

  async function onSubmit(values: z.infer<typeof singleResultSchema>) {
    setIsSubmitting(true);
    try {
<<<<<<< HEAD
      const resultData = {
=======
      const resultData: Partial<AcademicResult> = {
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
        term: values.term,
        year: values.year,
        className: values.className,
        grade: values.grade,
        position: values.position,
        comments: values.comments,
      };

      const userResultRef = doc(firestore, `users/${result.studentId}/academicResults`, result.id);
      const globalResultRef = doc(firestore, 'academicResults', result.id);

      const batch = writeBatch(firestore);
      batch.update(userResultRef, resultData);
      batch.update(globalResultRef, resultData);
<<<<<<< HEAD
      await batch.commit();

      toast({ title: 'Result Updated' });
=======
      
      await batch.commit();

      toast({ title: 'Result Updated', description: 'The academic result has been successfully updated.' });
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
      setOpen(false);
    } catch (e: any) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `users/${result.studentId}/academicResults/${result.id}`,
            operation: 'update',
<<<<<<< HEAD
        }));
      toast({ title: 'Update Failed', variant: 'destructive' });
=======
            requestResourceData: values,
        }));
      toast({ title: 'Update Failed', description: 'Could not update the result. Check permissions.', variant: 'destructive' });
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Academic Result</DialogTitle>
      </DialogHeader>
      <div className="max-h-[70vh] overflow-y-auto pr-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="edit-result-form" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="term" render={({ field }) => (
<<<<<<< HEAD
                  <FormItem><FormLabel>Term</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>
=======
                  <FormItem><FormLabel>Term</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger></FormControl><SelectContent>
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
                      {['1st', '2nd', '3rd'].map(t => <SelectItem key={t} value={t}>{t} Term</SelectItem>)}
                  </SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="year" render={({ field }) => (
                  <FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <FormField control={form.control} name="className" render={({ field }) => (
                  <FormItem><FormLabel>Subject</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
               <FormField control={form.control} name="grade" render={({ field }) => (
                  <FormItem><FormLabel>Grade</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>
                      {['A', 'B', 'C', 'D', 'F'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent></Select><FormMessage /></FormItem>
              )} />
            </div>
             <FormField control={form.control} name="position" render={({ field }) => (
                <FormItem><FormLabel>Overall Position</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="comments" render={({ field }) => (
                <FormItem><FormLabel>Comments</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </form>
        </Form>
      </div>
      <DialogFooter className="pt-4">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" form="edit-result-form" disabled={isSubmitting}>
<<<<<<< HEAD
=======
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
            Save Changes
        </Button>
      </DialogFooter>
    </>
  );
}



// ===================== MANAGE RESULTS DIALOG =====================

<<<<<<< HEAD
function ManageResultsDialog({ 
    student, 
    setOpen,
    onEditResult,
    onDeleteResult
}: { 
    student: Student; 
    setOpen: (open: boolean) => void;
    onEditResult: (result: AcademicResult) => void;
    onDeleteResult: (result: AcademicResult) => void;
}) {
  const firestore = useFirestore();
=======
function ManageResultsDialog({ student, setOpen }: { student: Student; setOpen: (open: boolean) => void }) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [resultToEdit, setResultToEdit] = useState<AcademicResult | null>(null);
  const [isEditFormOpen, setEditFormOpen] = useState(false);
  const [deletingResultId, setDeletingResultId] = useState<string | null>(null);


>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
  const resultsQuery = useMemoFirebase(() =>
    query(collection(firestore, `users/${student.id}/academicResults`)),
    [firestore, student.id]
  );
  const { data: results, isLoading } = useCollection<AcademicResult>(resultsQuery);
  
  const groupedResults = useMemo(() => {
    if (!results) return {};
    return results.reduce((acc, result) => {
      const key = `${result.year} - ${result.term} Term`;
<<<<<<< HEAD
      if (!acc[key]) acc[key] = [];
=======
      if (!acc[key]) {
        acc[key] = [];
      }
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
      acc[key].push(result);
      return acc;
    }, {} as Record<string, AcademicResult[]>);
  }, [results]);

  const sortedGroupKeys = Object.keys(groupedResults).sort((a, b) => b.localeCompare(a));

<<<<<<< HEAD
=======

  const handleEdit = (result: AcademicResult) => {
    setResultToEdit(result);
    setEditFormOpen(true);
  };

  const handleDelete = async (result: AcademicResult) => {
    if (confirm(`Are you sure you want to delete the result for ${result.className}?`)) {
      setDeletingResultId(result.id);
      try {
        const userResultRef = doc(firestore, `users/${student.id}/academicResults`, result.id);
        const globalResultRef = doc(firestore, 'academicResults', result.id);
        
        const batch = writeBatch(firestore);
        batch.delete(userResultRef);
        batch.delete(globalResultRef);
        
        await batch.commit();
        toast({ title: 'Result Deleted' });
      } catch (e: any) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `users/${student.id}/academicResults/${result.id}`,
            operation: 'delete',
        }));
        toast({ title: 'Delete Failed', description: 'Could not delete result. Check permissions.', variant: 'destructive' });
      } finally {
        setDeletingResultId(null);
      }
    }
  };

>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
  return (
    <>
      <DialogHeader>
        <DialogTitle>Manage Results for {student.firstName}</DialogTitle>
<<<<<<< HEAD
        <DialogDescription>View, edit, or delete academic results.</DialogDescription>
=======
        <DialogDescription>View, edit, or delete academic results for this student.</DialogDescription>
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
      </DialogHeader>
      <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2 space-y-6">
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : sortedGroupKeys.length === 0 ? (
<<<<<<< HEAD
          <p className="text-center text-muted-foreground py-8">No results found.</p>
=======
          <p className="text-center text-muted-foreground py-8">No results found for this student.</p>
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
        ) : (
          sortedGroupKeys.map(groupKey => (
            <div key={groupKey}>
              <h3 className="font-semibold mb-2">{groupKey}</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Grade</TableHead>
<<<<<<< HEAD
=======
                    <TableHead>Date</TableHead>
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedResults[groupKey].map(res => (
                    <TableRow key={res.id}>
                      <TableCell>{res.className}</TableCell>
                      <TableCell><Badge variant="secondary">{res.grade}</Badge></TableCell>
<<<<<<< HEAD
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => onEditResult(res)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => onDeleteResult(res)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
=======
                      <TableCell>{res.createdAt ? format(res.createdAt.toDate(), 'P') : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(res)} disabled={!!deletingResultId}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(res)} disabled={!!deletingResultId}>
                            {deletingResultId === res.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                        </Button>
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))
        )}
      </div>
       <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Close</Button>
      </DialogFooter>
<<<<<<< HEAD
=======

      {/* Edit Result Dialog */}
      <Dialog open={isEditFormOpen} onOpenChange={setEditFormOpen}>
        <DialogContent>
          {resultToEdit && <EditResultForm result={resultToEdit} setOpen={setEditFormOpen} />}
        </DialogContent>
      </Dialog>
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
    </>
  );
}


// ===================== FEE FORM =====================

function FeeForm({ student, setOpen }: { student: Student; setOpen: (open: boolean) => void; }) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof feeSchema>>({
      resolver: zodResolver(feeSchema),
      defaultValues: { amount: 0, amountPaid: 0, dueDate: '', term: '1st', session: '' },
    });

    const feesQuery = useMemoFirebase(() => query(collection(firestore, `users/${student.id}/fees`)), [firestore, student.id]);
    const { data: fees, isLoading } = useCollection<FeeRecord>(feesQuery);
    const currentFee = fees?.[0];
    
    const watchedAmount = form.watch("amount");
    const watchedAmountPaid = form.watch("amountPaid");
<<<<<<< HEAD
=======

>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
    const balance = (watchedAmount || 0) - (watchedAmountPaid || 0);
    
    let status: 'Paid' | 'Pending' | 'Partial' = 'Pending';
    if ((watchedAmount || 0) > 0) {
<<<<<<< HEAD
        if (balance <= 0) status = 'Paid';
        else if ((watchedAmountPaid || 0) > 0) status = 'Partial';
    }

=======
        if (balance <= 0) {
            status = 'Paid';
        } else if ((watchedAmountPaid || 0) > 0) {
            status = 'Partial';
        }
    }


>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
    useEffect(() => {
        if (currentFee) {
            form.reset({
                amount: currentFee.amount,
                amountPaid: currentFee.amountPaid || 0,
                dueDate: currentFee.dueDate ? new Date(currentFee.dueDate).toISOString().split('T')[0] : '',
                term: currentFee.term,
                session: currentFee.session,
            });
<<<<<<< HEAD
=======
        } else {
            const currentYear = new Date().getFullYear();
            form.reset({
                amount: 1200,
                amountPaid: 0,
                dueDate: new Date().toISOString().split('T')[0],
                term: '1st',
                session: `${currentYear}/${currentYear + 1}`
            });
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
        }
    }, [currentFee, form]);


    async function onSubmit(values: z.infer<typeof feeSchema>) {
      setIsSubmitting(true);
      try {
<<<<<<< HEAD
=======
        const totalAmount = values.amount;
        const amountPaid = values.amountPaid;
        const balanceRemaining = totalAmount - amountPaid;

        let calculatedStatus: 'Paid' | 'Pending' | 'Partial';
        if (balanceRemaining <= 0) {
            calculatedStatus = 'Paid';
        } else if (amountPaid > 0) {
            status = 'Partial';
        } else {
            status = 'Pending';
        }

>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
        const feeDocRef = currentFee ? 
          doc(firestore, `users/${student.id}/fees`, currentFee.id) : 
          doc(collection(firestore, `users/${student.id}/fees`));
        
<<<<<<< HEAD
        const feeData = { 
=======
        const feeData: Partial<FeeRecord> = { 
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
          id: feeDocRef.id, 
          studentId: student.id, 
          term: values.term,
          session: values.session,
<<<<<<< HEAD
          amount: values.amount,
          amountPaid: values.amountPaid,
          balanceRemaining: values.amount - values.amountPaid,
          status: status,
=======
          amount: totalAmount,
          amountPaid: amountPaid,
          balanceRemaining: balanceRemaining,
          status: calculatedStatus,
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
          dueDate: new Date(values.dueDate).toISOString(),
          createdAt: serverTimestamp()
        };

<<<<<<< HEAD
        const batch = writeBatch(firestore);
        batch.set(feeDocRef, feeData, { merge: true });
        batch.set(doc(firestore, 'fees', feeDocRef.id), feeData, { merge: true });
        await batch.commit();
        
        toast({ title: 'Fee Status Updated' });
        setOpen(false);
      } catch (error) {
        toast({ title: 'Error', variant: 'destructive' });
=======
        if (calculatedStatus === 'Paid' && (!currentFee || currentFee.status !== 'Paid')) {
            feeData.paidDate = new Date().toISOString();
        }
        
        await setDoc(feeDocRef, feeData, { merge: true }).catch(error => {
            const permissionError = new FirestorePermissionError({
                path: feeDocRef.path,
                operation: 'write',
                requestResourceData: feeData,
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        });
        
        const globalFeeRef = doc(firestore, 'fees', feeDocRef.id);
        await setDoc(globalFeeRef, feeData, { merge: true }).catch(error => {
            const permissionError = new FirestorePermissionError({
                path: globalFeeRef.path,
                operation: 'write',
                requestResourceData: feeData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
        
        toast({ 
          title: 'Fee Status Updated', 
          description: `Fee status for ${student.firstName} has been updated.` 
        });
        setOpen(false);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update fee status. Check permissions.',
          variant: 'destructive'
        });
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
      } finally {
        setIsSubmitting(false);
      }
    }

    return (
      <>
        <DialogHeader>
<<<<<<< HEAD
          <DialogTitle>Update Fees: {student.firstName}</DialogTitle>
          <DialogDescription>Amount paid will automatically update status.</DialogDescription>
=======
          <DialogTitle>Update Fee Status for {student.firstName}</DialogTitle>
          <DialogDescription>
            Update the fee amount, amount paid, and due date for this student. The status will be calculated automatically.
          </DialogDescription>
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="fee-form" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                 <FormField control={form.control} name="term" render={({ field }) => (
<<<<<<< HEAD
                    <FormItem><FormLabel>Term</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>
=======
                    <FormItem><FormLabel>Term</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger></FormControl><SelectContent>
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
                        {['1st', '2nd', '3rd'].map(t => <SelectItem key={t} value={t}>{t} Term</SelectItem>)}
                    </SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="session" render={({ field }) => (
<<<<<<< HEAD
                    <FormItem><FormLabel>Session</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem><FormLabel>Total Amount</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                )} />
              <FormField control={form.control} name="amountPaid" render={({ field }) => (
                  <FormItem><FormLabel>Amount Paid</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                )} />
              <FormField control={form.control} name="dueDate" render={({ field }) => (
                  <FormItem><FormLabel>Due Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="rounded-lg bg-muted/50 p-4 flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Status: <Badge variant={status === 'Paid' ? 'success' : status === 'Partial' ? 'warning' : 'destructive'}>{status}</Badge></span>
                    <span className="font-bold">Bal: ₦{balance.toLocaleString()}</span>
=======
                    <FormItem>
                        <FormLabel>Session</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., 2024/2025" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Fee Amount</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} disabled={isLoading}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

              <FormField control={form.control} name="amountPaid" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Paid</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} disabled={isLoading}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

              <FormField control={form.control} name="dueDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isLoading}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <div className="space-y-2 rounded-lg bg-muted/50 p-4">
                    <h4 className="font-medium text-sm">Calculated Status</h4>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Balance Remaining:</span>
                        <span className="font-bold">₦{balance.toLocaleString()}</span>
                    </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={status === 'Paid' ? 'success' : status === 'Partial' ? 'warning' : 'destructive'}>{status}</Badge>
                    </div>
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
                </div>
            </form>
          </Form>
        </div>
        <DialogFooter className="pt-4">
<<<<<<< HEAD
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" form="fee-form" disabled={isSubmitting}>Update Status</Button>
=======
            <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
            >
                Cancel
            </Button>
            <Button type="submit" form="fee-form" disabled={isSubmitting || isLoading}>
                {(isSubmitting || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Status
            </Button>
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
        </DialogFooter>
      </>
    );
}


// ===================== BULK UPLOAD FORM =====================

function BulkResultUploadForm({ students, studentClass, setOpen }: { students: Student[], studentClass: Class, setOpen: (open: boolean) => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof bulkUploadSchema>>({
    resolver: zodResolver(bulkUploadSchema),
    defaultValues: { term: '1st', year: new Date().getFullYear() },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
<<<<<<< HEAD
    setFileName(file.name);
    setIsProcessing(true);
    setError(null);
    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data) as WorkBook;
      const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      if (json.length === 0 || !json[0].hasOwnProperty('studentId')) throw new Error("Invalid format.");
      setParsedData(json);
    } catch (err: any) {
      setError(err.message);
=======

    setFileName(file.name);
    setIsProcessing(true);
    setError(null);
    setParsedData([]);

    try {
      // Dynamically import xlsx
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data) as WorkBook;
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      
      if (json.length === 0) {
          throw new Error("The uploaded file is empty or in an incorrect format.");
      }

      const firstRow: any = json[0];
      if (!firstRow.hasOwnProperty('studentId')) {
          throw new Error(`The file is missing the required 'studentId' column.`);
      }

      setParsedData(json);
      toast({ title: "File Processed", description: `${json.length} rows ready for upload.` });
    } catch (err: any) {
      setError(err.message || "Failed to read or parse the file.");
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
      setFileName(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof bulkUploadSchema>) => {
<<<<<<< HEAD
    setIsProcessing(true);
    const batch = writeBatch(firestore);
    const subjectsInClass = studentClass?.subjects || [];
    try {
        for (const row of parsedData) {
            const { studentId, position, comments, ...subjectGrades } = row as any;
            for (const subjectName of subjectsInClass) {
                const grade = subjectGrades[subjectName];
                if (grade && ['A', 'B', 'C', 'D', 'F'].includes(grade.toString().toUpperCase())) {
                    const resultDocRef = doc(collection(firestore, `users/${studentId}/academicResults`));
                    const finalData = {
=======
    if (parsedData.length === 0) {
        setError("No data to upload. Please select a valid file.");
        return;
    }

    setIsProcessing(true);
    setError(null);

    const batch = writeBatch(firestore);
    const studentIdsInClass = new Set(students.map(s => s.id));
    const subjectsInClass = studentClass?.subjects || [];
    let processedCount = 0;
    
    if (subjectsInClass.length === 0) {
        setError("This class has no subjects configured. Please edit the class to add subjects first.");
        setIsProcessing(false);
        return;
    }
    
    try {
        for (const row of parsedData) {
            const { studentId, position, comments, ...subjectGrades } = row as any;
            
            // Validation
            if (!studentId || !studentIdsInClass.has(studentId.toString())) {
                console.warn(`Skipping row: Student ID "${studentId}" not found in this class.`);
                continue;
            }
            
            let studentHasGrades = false;
            for (const subjectName of subjectsInClass) {
                const grade = subjectGrades[subjectName];
                
                // If a grade exists for this subject column
                if (grade && ['A', 'B', 'C', 'D', 'F'].includes(grade.toString().toUpperCase())) {
                    const resultDocRef = doc(collection(firestore, `users/${studentId}/academicResults`));
                    
                    const resultData: Partial<AcademicResult> & { id: string, studentId: string; term: string; year: number; className: string; grade: string; createdAt: any; } = {
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
                        id: resultDocRef.id,
                        studentId: studentId.toString(),
                        term: values.term,
                        year: values.year,
                        className: subjectName,
                        grade: grade.toString().toUpperCase(),
                        createdAt: serverTimestamp(),
<<<<<<< HEAD
                        position: position?.toString() || '',
                        comments: comments?.toString() || '',
                    };
                    batch.set(resultDocRef, finalData);
                    batch.set(doc(firestore, 'academicResults', resultDocRef.id), finalData);
                }
            }
        }
        await batch.commit();
        toast({ title: "Upload Successful" });
        setOpen(false);
    } catch (e: any) {
        toast({ title: "Upload Failed", variant: "destructive" });
=======
                    };
                    if (position) resultData.position = position.toString();
                    if (comments) resultData.comments = comments.toString();

                    batch.set(resultDocRef, resultData);
                    const globalResultRef = doc(firestore, 'academicResults', resultDocRef.id);
                    batch.set(globalResultRef, resultData);
                    studentHasGrades = true;
                }
            }
            if (studentHasGrades) {
              processedCount++;
            }
        }

        if (processedCount === 0) {
          throw new Error("No valid student rows with grades were found to upload. Please check student IDs and ensure grades are entered.");
        }

        await batch.commit();
        toast({ title: "Bulk Upload Successful", description: `${processedCount} students' results have been saved.` });
        setOpen(false);

    } catch (e: any) {
        console.error("Bulk upload error:", e);
        setError(e.message || "An error occurred during the bulk upload.");
        toast({ title: "Upload Failed", description: e.message, variant: "destructive" });
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
    } finally {
        setIsProcessing(false);
    }
  };
  
  return (
    <>
      <DialogHeader>
        <DialogTitle>Bulk Upload Results</DialogTitle>
<<<<<<< HEAD
      </DialogHeader>
      <div className="space-y-4 pt-4">
=======
        <DialogDescription>
            Upload results for multiple students and subjects using an Excel or CSV file.
        </DialogDescription>
      </DialogHeader>
      <div className="max-h-[70vh] overflow-y-auto pr-6 -mr-6 pl-6 space-y-4 pt-4">
        <Alert>
            <AlertTitle>Instructions</AlertTitle>
            <AlertDescription>
                <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>Click <strong>Download List</strong> to get a CSV template.</li>
                    <li>The file will have one row per student. The columns will be <strong>`studentId`</strong> (the primary identifier), student name/email, followed by a column for each subject in this class (e.g., <strong>`Mathematics`</strong>, <strong>`English`</strong>).</li>
                    <li>For each student, enter their grade under the corresponding subject column.</li>
                    <li>You can also fill in the optional <strong>`position`</strong> and <strong>`comments`</strong> columns for each student row.</li>
                    <li>Save your file and upload it below.</li>
                </ol>
            </AlertDescription>
        </Alert>

>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
        <Form {...form}>
          <form id="bulk-upload-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="term" render={({ field }) => (
                      <FormItem><FormLabel>Term</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>
                          {['1st', '2nd', '3rd'].map(t => <SelectItem key={t} value={t}>{t} Term</SelectItem>)}
                      </SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="year" render={({ field }) => (
                      <FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
              </div>
<<<<<<< HEAD
              <FormItem>
                <FormLabel>File</FormLabel>
                <div className="flex items-center gap-4">
                    <Input id="bulk-file-upload" type="file" onChange={handleFileChange} />
                </div>
                {error && <FormMessage>{error}</FormMessage>}
=======
              
              <FormItem>
                <FormLabel>Upload File</FormLabel>
                <div className="flex items-center gap-4">
                    <FormControl>
                        <Input
                            id="bulk-file-upload"
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </FormControl>
                    <label
                        htmlFor="bulk-file-upload"
                        className={cn(
                            buttonVariants({ variant: 'outline' }),
                            "cursor-pointer"
                        )}
                    >
                        <FileUp className="mr-2 h-4 w-4" />
                        <span>{fileName ? 'Change File' : 'Choose File'}</span>
                    </label>
                    {fileName && !error && (
                        <span className="text-sm text-muted-foreground">{fileName}</span>
                    )}
                </div>
                {error && <FormMessage className="mt-2">{error}</FormMessage>}
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
            </FormItem>
          </form>
        </Form>
      </div>
<<<<<<< HEAD
      <DialogFooter className="pt-4">
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={isProcessing}>Cancel</Button>
        <Button type="submit" form="bulk-upload-form" disabled={isProcessing || parsedData.length === 0}>Upload</Button>
=======

      <DialogFooter className="pt-4">
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={isProcessing}>Cancel</Button>
        <Button type="submit" form="bulk-upload-form" disabled={isProcessing || parsedData.length === 0}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload {parsedData.length > 0 ? `${parsedData.length} Records` : 'Records'}
        </Button>
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
      </DialogFooter>
    </>
  );
}

// ===================== MAIN COMPONENT =====================

export default function StudentManagement({ classId }: { classId: string }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useAuth();
<<<<<<< HEAD
  
  const [filter, setFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [resultToDelete, setResultToDelete] = useState<{ studentId: string, result: AcademicResult } | null>(null);
  const [resultToEdit, setResultToEdit] = useState<AcademicResult | null>(null);

=======
  const [filter, setFilter] = useState('');
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
  const [isStudentFormOpen, setStudentFormOpen] = useState(false);
  const [isClassResultFormOpen, setClassResultFormOpen] = useState(false);
  const [isFeeFormOpen, setFeeFormOpen] = useState(false);
  const [isManageResultsOpen, setManageResultsOpen] = useState(false);
<<<<<<< HEAD
  const [isEditResultOpen, setEditResultOpen] = useState(false);
  const [isBulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const studentsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'students'), where('classId', '==', classId)) : null, [firestore, classId, user]);
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);
  const classDocRef = useMemoFirebase(() => user ? doc(firestore, 'classes', classId) : null, [firestore, classId, user]);
  const { data: studentClass } = useDoc<Class>(classDocRef);
  const { data: allFees } = useCollection<FeeRecord>(useMemoFirebase(() => user ? collection(firestore, 'fees') : null, [firestore, user]));

  const feesByStudentId = useMemo(() => {
    const map = new Map<string, FeeRecord>();
    allFees?.forEach(fee => map.set(fee.studentId, fee));
=======
  const [isBulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);


  const studentsQuery = useMemoFirebase(() => user ? query(
    collection(firestore, 'students'), 
    where('classId', '==', classId)
  ) : null, [firestore, classId, user]);
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);
  
  const classDocRef = useMemoFirebase(() => user ? doc(firestore, 'classes', classId) : null, [firestore, classId, user]);
  const { data: studentClass, isLoading: isLoadingClass } = useDoc<Class>(classDocRef);

  const allFeesQuery = useMemoFirebase(() => user ? collection(firestore, 'fees') : null, [firestore, user]);
  const { data: allFees, isLoading: isLoadingFees } = useCollection<FeeRecord>(allFeesQuery);

  const isLoading = isLoadingStudents || isLoadingFees || isLoadingClass;

  const feesByStudentId = useMemo(() => {
    if (!allFees) return new Map();
    const map = new Map<string, FeeRecord>();
    for (const fee of allFees) {
      map.set(fee.studentId, fee);
    }
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
    return map;
  }, [allFees]);

  const filteredStudents = useMemo(() => 
<<<<<<< HEAD
    students?.filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(filter.toLowerCase())) ?? [], 
    [students, filter]
  );
  
  const performDeleteStudent = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
        const res = await deleteStudentFlow({ uid: studentToDelete.id });
        if (res.success) toast({ title: 'Student Deleted' });
        else throw new Error(res.error);
    } catch (e: any) {
        toast({ title: 'Deletion Failed', variant: 'destructive' });
    } finally {
        setIsDeleting(false);
        setStudentToDelete(null);
    }
  };

  const performDeleteResult = async () => {
      if (!resultToDelete) return;
      setIsDeleting(true);
      try {
          const { studentId, result } = resultToDelete;
          const batch = writeBatch(firestore);
          batch.delete(doc(firestore, `users/${studentId}/academicResults`, result.id));
          batch.delete(doc(firestore, 'academicResults', result.id));
          await batch.commit();
          toast({ title: 'Result Deleted' });
      } catch (e: any) {
          toast({ title: 'Delete Failed', variant: 'destructive' });
      } finally {
          setIsDeleting(false);
          setResultToDelete(null);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <Button asChild variant="outline"><Link href="/admin/classes"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <Input placeholder="Filter..." value={filter} onChange={e => setFilter(e.target.value)} className="w-40 sm:w-64" />
          <Button onClick={() => setBulkUploadOpen(true)} variant="outline">Bulk Upload</Button>
          <Button onClick={() => setClassResultFormOpen(true)} variant="outline">Manual Upload</Button>
          <Button onClick={() => { setSelectedStudent(null); setStudentFormOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" />Create</Button>
=======
    students?.filter(s => 
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(filter.toLowerCase())
    ) ?? [], 
    [students, filter]
  );
  
  const getStatusBadgeVariant = (status: FeeRecord['status'] | undefined) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Pending': return 'destructive';
      case 'Partial': return 'warning';
      default: return 'secondary';
    }
  };

  const handleCreateStudent = () => {
    setSelectedStudent(null);
    setStudentFormOpen(true);
  };
  
  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentFormOpen(true);
  };
  
  const handleUpdateFee = (student: Student) => {
    setSelectedStudent(student);
    setFeeFormOpen(true);
  };

  const handleManageResults = (student: Student) => {
    setSelectedStudent(student);
    setManageResultsOpen(true);
  };
  
  const performDelete = async () => {
    if (!studentToDelete) return;

    setDeletingStudentId(studentToDelete.id);
    const studentName = `${studentToDelete.firstName} ${studentToDelete.lastName}`;
    setStudentToDelete(null); // Close dialog

    try {
        console.log('Attempting to delete student:', studentToDelete.id);
        const res = await deleteStudentFlow({ uid: studentToDelete.id });
        console.log('Delete response:', res);
        
        if (res.success) {
            toast({ 
            title: 'Student Deleted', 
            description: `${studentName} has been permanently removed.` 
            });
        } else {
            console.error('Delete failed:', res.error);
            throw new Error(res.error || 'An unknown error occurred during deletion.');
        }
    } catch (e: any) {
        console.error('Delete error caught:', e);
        toast({ 
            title: 'Deletion Failed', 
            description: e.message || 'Failed to delete student. Please check console for details.', 
            variant: 'destructive' 
        });
    } finally {
        setDeletingStudentId(null);
    }
  };

  const handleDownloadStudentList = () => {
    if (!students || students.length === 0) {
      toast({ title: "No Students", description: "There are no students in this class to download." });
      return;
    }
    
    if (!studentClass || !studentClass.subjects || studentClass.subjects.length === 0) {
        toast({ title: "No Subjects", description: "This class has no subjects defined. Please edit the class to add subjects.", variant: 'destructive' });
        return;
    }

    const escapeCsv = (val: string | null | undefined) => {
        const str = String(val || '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const baseHeaders = ["studentId", "firstName", "lastName", "email"];
    const subjectHeaders = studentClass.subjects;
    const tailHeaders = ["position", "comments"];
    const headers = [...baseHeaders, ...subjectHeaders, ...tailHeaders];
    
    const rows: string[] = students.map(student => {
        const studentData = [
            student.id,
            student.firstName,
            student.lastName,
            student.email,
        ];
        const subjectPlaceholders = subjectHeaders.map(() => '');
        const tailPlaceholders = tailHeaders.map(() => '');
        
        const rowData = [...studentData, ...subjectPlaceholders, ...tailPlaceholders];
        return rowData.map(escapeCsv).join(',');
    });

    const csvContent = [
      headers.join(','),
      ...rows
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `results_template-${studentClass?.name?.replace(/\s/g, '_') || classId}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    toast({ title: "Download Started", description: "Your result template is being downloaded." });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <Button asChild variant="outline"><Link href="/admin/classes"><ArrowLeft className="mr-2 h-4 w-4" />Back to Classes</Link></Button>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <Input placeholder="Filter students..." value={filter} onChange={e => setFilter(e.target.value)} className="w-40 sm:w-64" />
          <Button onClick={handleDownloadStudentList} variant="outline"><Download className="mr-2 h-4 w-4" />List</Button>
          <Button onClick={() => setBulkUploadOpen(true)} variant="outline" disabled={!students || students.length === 0}><FileUp className="mr-2 h-4 w-4" />Bulk Upload</Button>
          <Button onClick={() => setClassResultFormOpen(true)} variant="outline" disabled={!students || students.length === 0}>
            <Upload className="mr-2 h-4 w-4" />
            Manual Upload
          </Button>
          <Button onClick={handleCreateStudent}><PlusCircle className="mr-2 h-4 w-4" />Create</Button>
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
        </div>
      </div>

      <TooltipProvider>
        <Card>
          <CardContent className="p-0">
              <Table>
<<<<<<< HEAD
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Fee Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                  {isLoadingStudents ? (
                      <TableRow><TableCell colSpan={3} className="text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></TableCell></TableRow>
                  ) : filteredStudents.map(student => {
                      const feeStatus = feesByStudentId.get(student.id)?.status;
                      const badgeVariant = feeStatus === 'Paid' ? 'success' : feeStatus === 'Partial' ? 'warning' : feeStatus === 'Pending' ? 'destructive' : 'outline';
                      
                      return (
                        <TableRow key={student.id}>
                            <TableCell>{student.firstName} {student.lastName}</TableCell>
                            <TableCell><Badge variant={badgeVariant}>{feeStatus || 'N/A'}</Badge></TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => { setSelectedStudent(student); setStudentFormOpen(true); }}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => { setSelectedStudent(student); setManageResultsOpen(true); }}><BookOpen className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => { setSelectedStudent(student); setFeeFormOpen(true); }}><Landmark className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => setStudentToDelete(student)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </TableCell>
                        </TableRow>
                      );
                  })}
=======
              <TableHeader>
                  <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead>Fee Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {isLoading ? (
                      <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></TableCell></TableRow>
                  ) : filteredStudents.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="h-24 text-center">No students found.</TableCell></TableRow>
                  ) : (
                      filteredStudents.map(student => {
                        const feeRecord = feesByStudentId.get(student.id);
                        return (
                          <TableRow key={student.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                  <span>{student.firstName} {student.lastName}</span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">{student.email}</TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(feeRecord?.status)}>
                                  {feeRecord?.status || 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => handleEditStudent(student)} disabled={!!deletingStudentId}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Edit Profile</p></TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => handleManageResults(student)} disabled={!!deletingStudentId}>
                                                <BookOpen className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Manage Results</p></TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => handleUpdateFee(student)} disabled={!!deletingStudentId}>
                                                <Landmark className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Update Fee Status</p></TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => setStudentToDelete(student)} disabled={!!deletingStudentId}>
                                                {deletingStudentId === student.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Delete Student</p></TooltipContent>
                                    </Tooltip>
                                </div>
                              </TableCell>
                          </TableRow>
                        )
                      })
                  )}
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
              </TableBody>
              </Table>
          </CardContent>
        </Card>
      </TooltipProvider>

<<<<<<< HEAD
      {/* MODALS */}
      <Dialog open={isStudentFormOpen} onOpenChange={setStudentFormOpen}>
        <DialogContent>{isStudentFormOpen && <StudentForm setOpen={setStudentFormOpen} student={selectedStudent || undefined} preselectedClassId={classId} />}</DialogContent>
      </Dialog>
      
      <Dialog open={isClassResultFormOpen} onOpenChange={setClassResultFormOpen}>
        <DialogContent className="sm:max-w-4xl h-[90vh]">{isClassResultFormOpen && students && studentClass && <ClassResultForm students={students} studentClass={studentClass} setOpen={setClassResultFormOpen} />}</DialogContent>
      </Dialog>
      
      <Dialog open={isFeeFormOpen} onOpenChange={setFeeFormOpen}>
        <DialogContent>{isFeeFormOpen && selectedStudent && <FeeForm student={selectedStudent} setOpen={setFeeFormOpen} />}</DialogContent>
      </Dialog>

       <Dialog open={isManageResultsOpen} onOpenChange={setManageResultsOpen}>
         <DialogContent className="sm:max-w-2xl">
           {isManageResultsOpen && selectedStudent && (
              <ManageResultsDialog 
                student={selectedStudent} 
                setOpen={setManageResultsOpen} 
                onEditResult={(r) => { setResultToEdit(r); setEditResultOpen(true); }}
                onDeleteResult={(r) => setResultToDelete({ studentId: selectedStudent.id, result: r })}
              />
=======
      <Dialog open={isStudentFormOpen} onOpenChange={setStudentFormOpen}>
        <DialogContent key={`student-form-${selectedStudent?.id || 'new'}`}>
          {isStudentFormOpen && (
            <StudentForm 
              setOpen={setStudentFormOpen}
              student={selectedStudent || undefined} 
              preselectedClassId={classId} 
            />
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isClassResultFormOpen} onOpenChange={setClassResultFormOpen}>
        <DialogContent className="sm:max-w-4xl h-[90vh]" key={`class-result-form-${classId}`}>
          {isClassResultFormOpen && students && studentClass &&(
              <ClassResultForm students={students} studentClass={studentClass} setOpen={setClassResultFormOpen} />
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isFeeFormOpen} onOpenChange={setFeeFormOpen}>
        <DialogContent key={`fee-form-${selectedStudent?.id}`}>
          {isFeeFormOpen && selectedStudent && (
              <FeeForm student={selectedStudent} setOpen={setFeeFormOpen} />
          )}
        </DialogContent>
      </Dialog>

       <Dialog open={isManageResultsOpen} onOpenChange={setManageResultsOpen}>
         <DialogContent className="sm:max-w-2xl" key={`manage-results-${selectedStudent?.id}`}>
           {isManageResultsOpen && selectedStudent && (
              <ManageResultsDialog student={selectedStudent} setOpen={setManageResultsOpen} />
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
           )}
         </DialogContent>
      </Dialog>

<<<<<<< HEAD
      <Dialog open={isEditResultOpen} onOpenChange={setEditResultOpen}>
          <DialogContent>{isEditResultOpen && resultToEdit && <EditResultForm result={resultToEdit} setOpen={setEditResultOpen} />}</DialogContent>
      </Dialog>

      <Dialog open={isBulkUploadOpen} onOpenChange={setBulkUploadOpen}>
        <DialogContent className="sm:max-w-2xl">{isBulkUploadOpen && students && studentClass && <BulkResultUploadForm students={students} studentClass={studentClass} setOpen={setBulkUploadOpen} />}</DialogContent>
      </Dialog>
      
      {/* CONFIRMATIONS */}
      <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Student?</AlertDialogTitle><AlertDialogDescription>This permanently removes the student and all data.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={performDeleteStudent} className={buttonVariants({ variant: 'destructive' })} disabled={isDeleting}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!resultToDelete} onOpenChange={(open) => !open && setResultToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete Result?</AlertDialogTitle><AlertDialogDescription>Delete result for {resultToDelete?.result.className}?</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={performDeleteResult} className={buttonVariants({ variant: 'destructive' })} disabled={isDeleting}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
=======
      <Dialog open={isBulkUploadOpen} onOpenChange={setBulkUploadOpen}>
        <DialogContent
          className="sm:max-w-2xl"
          key={`bulk-upload-form-${classId}`}
        >
          {isBulkUploadOpen && students && studentClass && (
            <BulkResultUploadForm students={students} studentClass={studentClass} setOpen={setBulkUploadOpen} />
          )}
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the student account for{' '}
              <span className="font-semibold">{studentToDelete?.firstName} {studentToDelete?.lastName}</span>
              {' '}and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={performDelete}
              className={buttonVariants({ variant: 'destructive' })}
            >
              Delete Student
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
    </div>
  );
}

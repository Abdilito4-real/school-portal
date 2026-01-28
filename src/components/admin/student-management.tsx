'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { collection, doc, query, where, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { useCollection, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Loader2, ArrowLeft, BookOpen, Edit, Trash2, Landmark } from 'lucide-react';
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
import { TooltipProvider } from '@/components/ui/tooltip';

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
      if (student) {
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
  
      } else {
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
          let errorMessage = authResult.error || "Failed to create user account.";
          if (errorMessage.includes('auth/email-already-exists')) {
            errorMessage = "This email address is already in use by another account.";
          }
          setFormError(errorMessage);
          setIsSubmitting(false);
          return;
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
          if (authResult.uid) {
            await deleteStudentFlow({ uid: authResult.uid });
          }
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
        if (student) {
            const studentRef = doc(firestore, 'students', student.id);
            permissionError = new FirestorePermissionError({
                path: studentRef.path,
                operation: 'update',
                requestResourceData: studentValues,
            });
        } else {
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
        if (studentResultsWatch.some(r => !!r.grade)) return true;
        for (const subject in sessionResults) {
            if (sessionResults[subject]?.some(r => !!r.grade)) return true;
        }
        return false;
    }, [studentResultsWatch, sessionResults]);
    
    const handleSubjectChange = useCallback((newSubject: string) => {
        const currentGrades = form.getValues('studentResults');
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
                    const resultData: any = {
                        studentId: studentResult.studentId,
                        term: values.term,
                        year: values.year,
                        className: subject,
                        grade: studentResult.grade,
                        createdAt: serverTimestamp(),
                        position: studentResult.position || '',
                        comments: values.comments || '',
                    };
                    
                    const finalData = { ...resultData, id: resultDocRef.id };
                    batch.set(resultDocRef, finalData);
                    const globalResultRef = doc(firestore, 'academicResults', resultDocRef.id);
                    batch.set(globalResultRef, finalData);
                }
            }

            await batch.commit();
            toast({ title: 'Class Results Uploaded' });
            setOpen(false);
        } catch (error: any) {
            console.error("Batch write error:", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `users/{userId}/academicResults`,
                operation: 'create',
             }));
            toast({ title: 'Error', description: 'Failed to upload results.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    return (
        <>
            <DialogHeader>
                <DialogTitle>Upload Class Results for {studentClass.name}</DialogTitle>
                <DialogDescription>
                    Enter grades for a subject. Progress is saved per session.
                </DialogDescription>
            </DialogHeader>
            <div className="max-h-[70vh] pr-2 -mr-6 pl-6">
              <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} id="class-result-form" className="space-y-4 pt-4 h-full flex flex-col">
                    <div className="px-1">
                      <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="term" render={({ field }) => (
                              <FormItem><FormLabel>Term</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={hasAnyGradeBeenEntered}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>
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
                                            placeholder="Applied to all students for this subject."
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

                        <div className="md:col-span-2 space-y-4">
                            <h4 className="font-medium text-sm sticky top-0 bg-content py-2">Grades & Positions for {selectedSubject}</h4>
                            <div className="rounded-md border h-full overflow-y-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm">
                                    <TableRow>
                                        <TableHead className="w-1/3">Student</TableHead>
                                        <TableHead>Grade</TableHead>
                                        <TableHead>Position</TableHead>
                                    </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {fields.map((field, index) => {
                                        const student = students.find(s => s.id === field.studentId);
                                        if (!student) return null;
                                        
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
                                                                            <SelectValue placeholder="Grade" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        {['A', 'B', 'C', 'D', 'F'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
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
      const resultData = {
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
      await batch.commit();

      toast({ title: 'Result Updated' });
      setOpen(false);
    } catch (e: any) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `users/${result.studentId}/academicResults/${result.id}`,
            operation: 'update',
        }));
      toast({ title: 'Update Failed', variant: 'destructive' });
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
                  <FormItem><FormLabel>Term</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>
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
            Save Changes
        </Button>
      </DialogFooter>
    </>
  );
}



// ===================== MANAGE RESULTS DIALOG =====================

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
  const resultsQuery = useMemoFirebase(() =>
    query(collection(firestore, `users/${student.id}/academicResults`)),
    [firestore, student.id]
  );
  const { data: results, isLoading } = useCollection<AcademicResult>(resultsQuery);
  
  const groupedResults = useMemo(() => {
    if (!results) return {};
    return results.reduce((acc, result) => {
      const key = `${result.year} - ${result.term} Term`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(result);
      return acc;
    }, {} as Record<string, AcademicResult[]>);
  }, [results]);

  const sortedGroupKeys = Object.keys(groupedResults).sort((a, b) => b.localeCompare(a));

  return (
    <>
      <DialogHeader>
        <DialogTitle>Manage Results for {student.firstName}</DialogTitle>
        <DialogDescription>View, edit, or delete academic results.</DialogDescription>
      </DialogHeader>
      <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2 space-y-6">
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : sortedGroupKeys.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No results found.</p>
        ) : (
          sortedGroupKeys.map(groupKey => (
            <div key={groupKey}>
              <h3 className="font-semibold mb-2">{groupKey}</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedResults[groupKey].map(res => (
                    <TableRow key={res.id}>
                      <TableCell>{res.className}</TableCell>
                      <TableCell><Badge variant="secondary">{res.grade}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => onEditResult(res)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => onDeleteResult(res)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
    const balance = (watchedAmount || 0) - (watchedAmountPaid || 0);
    
    let calculatedStatus: 'Paid' | 'Pending' | 'Partial' = 'Pending';
    if ((watchedAmount || 0) > 0) {
        if (balance <= 0) calculatedStatus = 'Paid';
        else if ((watchedAmountPaid || 0) > 0) calculatedStatus = 'Partial';
    }

    useEffect(() => {
        if (currentFee) {
            form.reset({
                amount: currentFee.amount,
                amountPaid: currentFee.amountPaid || 0,
                dueDate: currentFee.dueDate ? new Date(currentFee.dueDate).toISOString().split('T')[0] : '',
                term: currentFee.term,
                session: currentFee.session,
            });
        }
    }, [currentFee, form]);


    async function onSubmit(values: z.infer<typeof feeSchema>) {
      setIsSubmitting(true);
      try {
        const feeDocRef = currentFee ? 
          doc(firestore, `users/${student.id}/fees`, currentFee.id) : 
          doc(collection(firestore, `users/${student.id}/fees`));
        
        const feeData = { 
          id: feeDocRef.id, 
          studentId: student.id, 
          term: values.term,
          session: values.session,
          amount: values.amount,
          amountPaid: values.amountPaid,
          balanceRemaining: values.amount - values.amountPaid,
          status: calculatedStatus,
          dueDate: new Date(values.dueDate).toISOString(),
          createdAt: serverTimestamp()
        };

        const batch = writeBatch(firestore);
        batch.set(feeDocRef, feeData, { merge: true });
        batch.set(doc(firestore, 'fees', feeDocRef.id), feeData, { merge: true });
        await batch.commit();
        
        toast({ title: 'Fee Status Updated' });
        setOpen(false);
      } catch (error) {
        toast({ title: 'Error', variant: 'destructive' });
      } finally {
        setIsSubmitting(false);
      }
    }

    return (
      <>
        <DialogHeader>
          <DialogTitle>Update Fees: {student.firstName}</DialogTitle>
          <DialogDescription>Amount paid will automatically update status.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="fee-form" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                 <FormField control={form.control} name="term" render={({ field }) => (
                    <FormItem><FormLabel>Term</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>
                        {['1st', '2nd', '3rd'].map(t => <SelectItem key={t} value={t}>{t} Term</SelectItem>)}
                    </SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="session" render={({ field }) => (
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
                    <span className="text-muted-foreground">Status: <Badge variant={calculatedStatus === 'Paid' ? 'success' : calculatedStatus === 'Partial' ? 'warning' : 'destructive'}>{calculatedStatus}</Badge></span>
                    <span className="font-bold">Bal: ₦{balance.toLocaleString()}</span>
                </div>
            </form>
          </Form>
        </div>
        <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" form="fee-form" disabled={isSubmitting}>Update Status</Button>
        </DialogFooter>
      </>
    );
}


// ===================== MAIN COMPONENT =====================

export default function StudentManagement({ classId }: { classId: string }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [filter, setFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [resultToDelete, setResultToDelete] = useState<{ studentId: string, result: AcademicResult } | null>(null);
  const [resultToEdit, setResultToEdit] = useState<AcademicResult | null>(null);

  const [isStudentFormOpen, setStudentFormOpen] = useState(false);
  const [isClassResultFormOpen, setClassResultFormOpen] = useState(false);
  const [isFeeFormOpen, setFeeFormOpen] = useState(false);
  const [isManageResultsOpen, setManageResultsOpen] = useState(false);
  const [isEditResultOpen, setEditResultOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const studentsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'students'), where('classId', '==', classId)) : null, [firestore, classId, user]);
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);
  const { data: allFees } = useCollection<FeeRecord>(useMemoFirebase(() => user ? collection(firestore, 'fees') : null, [firestore, user]));

  const feesByStudentId = useMemo(() => {
    const map = new Map<string, FeeRecord>();
    allFees?.forEach(fee => map.set(fee.studentId, fee));
    return map;
  }, [allFees]);

  const filteredStudents = useMemo(() => 
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
          <Button onClick={() => setClassResultFormOpen(true)} variant="outline">Bulk Upload Results</Button>
          <Button onClick={() => { setSelectedStudent(null); setStudentFormOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" />Create Student</Button>
        </div>
      </div>

      <TooltipProvider>
        <Card>
          <CardContent className="p-0">
              <Table>
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
              </TableBody>
              </Table>
          </CardContent>
        </Card>
      </TooltipProvider>

      {/* MODALS */}
      <Dialog open={isStudentFormOpen} onOpenChange={setStudentFormOpen}>
        <DialogContent>{isStudentFormOpen && <StudentForm setOpen={setStudentFormOpen} student={selectedStudent || undefined} preselectedClassId={classId} />}</DialogContent>
      </Dialog>
      
      <Dialog open={isClassResultFormOpen} onOpenChange={setClassResultFormOpen}>
        <DialogContent className="sm:max-w-4xl h-[90vh]">{isClassResultFormOpen && students && <ClassResultForm students={students} studentClass={{ id: classId, name: 'Current Class', description: '', subjects: ['Math', 'English', 'Science'] } as Class} setOpen={setClassResultFormOpen} />}</DialogContent>
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
           )}
         </DialogContent>
      </Dialog>

      <Dialog open={isEditResultOpen} onOpenChange={setEditResultOpen}>
          <DialogContent>{isEditResultOpen && resultToEdit && <EditResultForm result={resultToEdit} setOpen={setEditResultOpen} />}</DialogContent>
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
    </div>
  );
}

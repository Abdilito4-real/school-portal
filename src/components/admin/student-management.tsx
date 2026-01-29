'use client';

import { useState, useMemo } from 'react';
import { collection, doc, query, where, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Loader2, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import type { Student, Class, FeeRecord } from '@/lib/types';
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
import { useForm } from 'react-hook-form';
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
import { TooltipProvider } from '@/components/ui/tooltip';

const studentSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(2, 'First name must be at least 2 characters.'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email.'),
  classId: z.string().min(1, 'You must select a class.'),
  password: z.string().min(6, 'Password must be at least 6 characters.').optional(),
});

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
          (e.message?.includes('email-already-exists')) ||
          (e.message?.includes('already in use'))) {
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
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger disabled={isLoadingClasses}><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>{isLoadingClasses ? <div className='p-4 text-center'><Loader2 className="h-4 w-4 animate-spin text-primary"/></div> : classes?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
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

export default function StudentManagement({ classId }: { classId: string }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [filter, setFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isStudentFormOpen, setStudentFormOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const studentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'students'), where('classId', '==', classId));
  }, [firestore, classId, user]);
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);
  const { data: allFees } = useCollection<FeeRecord>(useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'fees');
  }, [firestore, user]));

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <Button asChild variant="outline"><Link href="/admin/classes"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <Input placeholder="Filter..." value={filter} onChange={e => setFilter(e.target.value)} className="w-40 sm:w-64" />
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

      <Dialog open={isStudentFormOpen} onOpenChange={setStudentFormOpen}>
        <DialogContent>{isStudentFormOpen && <StudentForm setOpen={setStudentFormOpen} student={selectedStudent || undefined} preselectedClassId={classId} />}</DialogContent>
      </Dialog>
      
      <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Student?</AlertDialogTitle><AlertDialogDescription>This permanently removes the student and all data.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={performDeleteStudent} className={buttonVariants({ variant: 'destructive' })} disabled={isDeleting}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

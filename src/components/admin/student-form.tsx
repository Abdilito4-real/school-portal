'use client';

import { useState } from 'react';
import { collection, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import type { Student, Class } from '@/lib/types';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createStudentAuthUser } from '@/ai/flows/create-student-flow';
import { deleteStudent as deleteStudentFlow } from '@/ai/flows/delete-student-flow';
import { useAuth } from '@/hooks/use-auth';

const studentSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters.'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email.'),
  classId: z.string().min(1, 'You must select a class.'),
  password: z.string().min(6, 'Password must be at least 6 characters.').optional(),
});

export default function StudentForm({ 
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
  
  const classesQuery = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'classes') : null, [firestore, user]);
  const { data: classes, isLoading: isLoadingClasses } = useCollection<Class>(classesQuery);
  
  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: student 
      ? { ...student, password: '' } 
      : { firstName: '', lastName: '', email: '', classId: preselectedClassId, password: '' },
  });

  async function onSubmit(values: z.infer<typeof studentSchema>) {
    if (!firestore) {
        setFormError("Firestore is not available.");
        return;
    }
    setIsSubmitting(true);
    setFormError(null);
  
    try {
      if (student) {
        await updateDoc(doc(firestore, 'students', student.id), {
            ...values,
            updatedAt: serverTimestamp(),
        });
        toast({ title: "Profile Updated" });
        setOpen(false);
      } else {
        if (!values.password) {
          form.setError('password', { message: 'Required for new students.'});
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
          throw new Error(authResult.error || "Auth creation failed.");
        }
  
        const targetUid = authResult.uid;
        await setDoc(doc(firestore, 'students', targetUid), {
          id: targetUid,
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          classId: values.classId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        toast({ title: 'Student Created' });
        setOpen(false);
      }
    } catch (e: any) {
      setFormError(e.message);
      toast({ title: 'Operation Failed', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{student ? 'Edit Student' : 'Create Student'}</DialogTitle>
        <DialogDescription>Enter account information for the student portal.</DialogDescription>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
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
            <FormItem><FormLabel>Temporary Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
          )} />}
          
          <FormField control={form.control} name="classId" render={({ field }) => (
            <FormItem><FormLabel>Class</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>{classes?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <FormMessage />
            </FormItem>
          )} />

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {student ? 'Save Changes' : 'Create Student'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}

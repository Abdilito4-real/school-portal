'use client';
import { useState, useMemo } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import type { Class, Student } from '@/lib/types';
import { Trash2, Edit, Loader2, PlusCircle, ChevronRight, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import Link from 'next/link';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const classSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  description: z.string().optional(),
  subjects: z.array(z.object({
    value: z.string().min(1, 'Subject name required.'),
  })).min(1, "Add at least one subject."),
});

function ClassForm({
  setOpen,
  currentClass,
}: {
  setOpen: (open: boolean) => void;
  currentClass?: Class;
}) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof classSchema>>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: currentClass?.name || '',
      description: currentClass?.description || '',
      subjects: currentClass?.subjects?.map(s => ({ value: s })) || [{ value: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subjects"
  });

  async function onSubmit(values: z.infer<typeof classSchema>) {
    setIsSubmitting(true);
    const classData = {
      name: values.name,
      description: values.description || '',
      subjects: values.subjects?.map(s => s.value).filter(Boolean) || [],
    };
    try {
      if (!firestore) throw new Error("Firestore not available");
      if (currentClass) {
        await updateDoc(doc(firestore, 'classes', currentClass.id), classData);
        toast({ title: 'Class Updated!' });
      } else {
        await addDoc(collection(firestore, 'classes'), classData);
        toast({ title: 'Class Created!' });
      }
      setOpen(false);
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `classes/${currentClass?.id || ''}`, operation: 'write' }));
      toast({ title: 'Save Failed', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DialogContent className="sm:max-w-md">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader><DialogTitle>{currentClass ? 'Edit Class' : 'New Class'}</DialogTitle></DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div>
              <FormLabel>Subjects</FormLabel>
              <div className="space-y-2 mt-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <FormField control={form.control} name={`subjects.${index}.value`} render={({ field }) => (
                      <FormControl><Input {...field} /></FormControl>
                    )} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ value: "" })}><PlusCircle className="mr-2 h-4 w-4" />Add Subject</Button>
            </div>
          </div>
          <DialogFooter><Button type="submit" disabled={isSubmitting}>Save Class</Button></DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}

export default function ClassManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: classes, isLoading: isLoadingClasses } = useCollection<Class>(useMemoFirebase(() => firestore ? collection(firestore, 'classes') : null, [firestore]));
  const { data: students } = useCollection<Student>(useMemoFirebase(() => firestore ? collection(firestore, 'students') : null, [firestore]));

  const studentCountByClass = useMemo(() => {
    const acc: Record<string, number> = {};
    students?.forEach(s => acc[s.classId] = (acc[s.classId] || 0) + 1);
    return acc;
  }, [students]);

  const sortedClasses = useMemo(() => {
    if (!classes) return [];
    return [...classes].sort((a, b) => a.name.localeCompare(b.name));
  }, [classes]);

  const performDelete = async () => {
      if (!classToDelete || !firestore) return;
      setIsDeleting(true);
      try {
          await deleteDoc(doc(firestore, 'classes', classToDelete.id));
          toast({ title: 'Class Deleted' });
      } catch (e: any) {
          toast({ title: 'Delete failed', variant: 'destructive' });
      } finally {
          setIsDeleting(false);
          setClassToDelete(null);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end"><Button onClick={() => { setSelectedClass(null); setFormOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" />Create New Class</Button></div>
      <Card>
        <CardHeader><CardTitle>School Classes</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {isLoadingClasses ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : sortedClasses.length > 0 ? (
            sortedClasses.map(cls => (
              <Card key={cls.id} className="hover:bg-muted/50 transition-colors">
                <div className="p-4 flex items-center justify-between">
                  <Link href={`/admin/classes/${cls.id}`} className="flex-grow">
                    <p className="font-semibold text-lg">{cls.name}</p>
                    <p className="text-sm text-muted-foreground">{studentCountByClass[cls.id] || 0} Students</p>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); setSelectedClass(cls); setFormOpen(true); }}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); setClassToDelete(cls); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">No classes found. Create one to get started.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
        <ClassForm setOpen={setFormOpen} currentClass={selectedClass || undefined} />
      </Dialog>

      <AlertDialog open={!!classToDelete} onOpenChange={(open) => !open && setClassToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete Class?</AlertDialogTitle><AlertDialogDescription>This removes class {classToDelete?.name}. Ensure no students are assigned before deleting.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={performDelete} className={buttonVariants({ variant: 'destructive' })} disabled={isDeleting || !!(classToDelete && (studentCountByClass[classToDelete.id] || 0) > 0)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
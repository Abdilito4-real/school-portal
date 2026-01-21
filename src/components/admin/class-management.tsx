'use client';
import { useState, useMemo } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Trash2, Edit, Loader2, PlusCircle, Users, ChevronRight, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const classSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  description: z.string().optional(),
  subjects: z.array(z.object({
    value: z.string().min(1, 'Subject name cannot be empty.'),
  })).min(1, "Please add at least one subject."),
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
      subjects: currentClass?.subjects?.map(s => ({ value: s })).length ? currentClass.subjects.map(s => ({ value: s })) : [{ value: '' }],
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
      if (currentClass) {
        const classRef = doc(firestore, 'classes', currentClass.id);
        await updateDoc(classRef, classData);
        toast({ title: 'Class Updated!' });
      } else {
        const classColl = collection(firestore, 'classes');
        await addDoc(classColl, classData);
        toast({ title: 'Class Created!' });
      }
      setOpen(false);
    } catch (error: any) {
      console.error('Failed to save class:', error);
      const operation = currentClass ? 'update' : 'create';
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `classes/${currentClass?.id || ''}`,
            operation: operation,
            requestResourceData: values,
        }));
      toast({
        title: 'Save Failed',
        description: 'Could not save class details. Check permissions and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DialogContent className="sm:max-w-md">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{currentClass ? 'Edit Class' : 'Create New Class'}</DialogTitle>
            <DialogDescription>
              {currentClass ? 'Update the details for this class.' : 'Create a new class for students.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., JSS1" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Junior Secondary School 1" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Subjects</FormLabel>
              <div className="space-y-2 mt-2">
                {fields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`subjects.${index}.value`}
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Input {...field} placeholder="e.g., Mathematics" />
                        </FormControl>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                          <X className="h-4 w-4" />
                        </Button>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <FormMessage>{form.formState.errors.subjects?.root?.message}</FormMessage>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ value: "" })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Subject
              </Button>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Class
            </Button>
          </DialogFooter>
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
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);


  const classesQuery = useMemoFirebase(() => collection(firestore, 'classes'), [firestore]);
  const { data: classes, isLoading: isLoadingClasses } = useCollection<Class>(classesQuery);
  
  const studentsQuery = useMemoFirebase(() => collection(firestore, 'students'), [firestore]);
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);

  const studentCountByClass = useMemo(() => {
    if (!students) return {};
    return students.reduce((acc, student) => {
      if (student.classId) {
        acc[student.classId] = (acc[student.classId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [students]);

  const isLoading = isLoadingClasses || isLoadingStudents;

  const sortedClasses = useMemo(() => {
    if (!classes) return [];
    return [...classes].sort((a, b) => {
      const getSortParts = (name: string) => {
        const prefixMatch = name.match(/^[A-Za-z]+/);
        const prefix = prefixMatch ? prefixMatch[0] : '';
        const numMatch = name.match(/\d+$/);
        const num = numMatch ? parseInt(numMatch[0], 10) : Infinity;

        let prefixOrder;
        if (prefix.toUpperCase().startsWith('JSS')) {
          prefixOrder = 1;
        } else if (prefix.toUpperCase().startsWith('SS')) {
          prefixOrder = 2;
        } else {
          prefixOrder = 3;
        }

        return { prefixOrder, num, name };
      };

      const partsA = getSortParts(a.name);
      const partsB = getSortParts(b.name);

      if (partsA.prefixOrder !== partsB.prefixOrder) {
        return partsA.prefixOrder - partsB.prefixOrder;
      }

      if (partsA.num !== partsB.num) {
        return partsA.num - partsB.num;
      }
      
      return partsA.name.localeCompare(partsB.name);
    });
  }, [classes]);

  const handleCreate = () => {
    setSelectedClass(null);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if ((studentCountByClass[id] || 0) > 0) {
      toast({ title: 'Cannot Delete Class', description: 'This class has students assigned to it. Please reassign students before deleting.', variant: 'destructive' });
      return;
    }
    if (confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      setDeletingClassId(id);
      try {
        const classRef = doc(firestore, 'classes', id);
        await deleteDoc(classRef);
        toast({ title: 'Class Deleted', variant: 'destructive' });
      } catch (e: any) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `classes/${id}`,
            operation: 'delete',
        }));
        toast({ title: 'Delete failed', description: 'Could not delete class. Check permissions.', variant: 'destructive' });
      } finally {
        setDeletingClassId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Class
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>School Classes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex h-24 w-full items-center justify-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sortedClasses && sortedClasses.length > 0 ? (
            <div className="space-y-2">
                {sortedClasses.map(cls => (
                    <Card key={cls.id} className="transition-all duration-200 ease-in-out hover:shadow-md hover:bg-muted/50">
                        <Link href={`/admin/classes/${cls.id}`} className="block">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-lg">{cls.name}</p>
                                    <p className="text-sm text-muted-foreground flex items-center">
                                        <Users className="h-4 w-4 mr-2" />
                                        {studentCountByClass[cls.id] || 0} Students
                                    </p>
                                </div>
                                <div className='flex items-center gap-2'>
                                    <Button variant="ghost" size="icon" disabled={!!deletingClassId} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedClass(cls); setFormOpen(true); }}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" disabled={!!deletingClassId} onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(cls.id);}}>
                                        {deletingClassId === cls.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                                    </Button>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Link>
                    </Card>
                ))}
            </div>
          ) : (
            <div className="h-24 text-center content-center">
                <p>No classes found. Create one to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
        <ClassForm setOpen={setFormOpen} currentClass={selectedClass || undefined} />
      </Dialog>
    </div>
  );
}

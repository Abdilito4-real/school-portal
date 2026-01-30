'use client';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, serverTimestamp, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useToast } from '@/hooks/use-toast';
import type { Announcement, Class } from '@/lib/types';
import { format } from 'date-fns';
import { Trash2, Edit, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const announcementSchema = z.object({
  title: z.string().min(3, 'Title is too short'),
  content: z.string().min(10, 'Content is too short'),
  targetClass: z.string().min(1, 'Please select a target audience'),
});


const AnnouncementForm = ({
  classes,
  currentAnnouncement,
  onFinished,
}: {
  classes: Class[];
  currentAnnouncement?: Announcement;
  onFinished: () => void;
}) => {
  const { toast } = useToast();
  const firestore = useFirestore();
  const allClassIds = useMemo(() => classes.map(c => c.id), [classes]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof announcementSchema>>({
    resolver: zodResolver(announcementSchema),
    defaultValues: currentAnnouncement
      ? {
          title: currentAnnouncement.title,
          content: currentAnnouncement.content,
          targetClass: currentAnnouncement.classIds.length === allClassIds.length ? 'all' : currentAnnouncement.classIds[0] || '',
        }
      : { title: '', content: '', targetClass: '' },
  });

  async function onSubmit(values: z.infer<typeof announcementSchema>) {
    setIsSubmitting(true);
    try {
        const classIds = values.targetClass === 'all' ? allClassIds : [values.targetClass];
        const data = {
            title: values.title,
            content: values.content,
            classIds: classIds,
            createdAt: serverTimestamp(),
        };

        if (firestore) {
            if (currentAnnouncement) {
                await updateDoc(doc(firestore, 'announcements', currentAnnouncement.id), data);
                toast({ title: 'Announcement Updated!' });
            } else {
                await addDoc(collection(firestore, 'announcements'), data);
                toast({ title: 'Announcement Posted!' });
            }
        }
        form.reset();
        onFinished();
    } catch (e: any) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `announcements/${currentAnnouncement?.id || ''}`, operation: 'write' }));
        toast({ title: 'Error', variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{currentAnnouncement ? 'Edit' : 'New'} Announcement</CardTitle>
        <CardDescription>This will be visible to the selected group of students.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="content" render={({ field }) => (
                <FormItem><FormLabel>Content</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="targetClass" render={({ field }) => (
                <FormItem>
                  <FormLabel>Audience</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select Audience"/></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="all">All Students</SelectItem>
                      {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
            )} />
            <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>{currentAnnouncement ? 'Update' : 'Post'}</Button>
                {currentAnnouncement && <Button variant="ghost" onClick={onFinished}>Cancel</Button>}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default function AnnouncementManagement() {
  const firestore = useFirestore();
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: announcements, isLoading: isLoadingAnnouncements } = useCollection<Announcement>(useMemoFirebase(() => (user && firestore) ? collection(firestore, 'announcements') : null, [firestore, user]));
  const { data: classes, isLoading: isLoadingClasses } = useCollection<Class>(useMemoFirebase(() => (user && firestore) ? collection(firestore, 'classes') : null, [firestore, user]));

  const sortedAnnouncements = useMemo(() => [...(announcements || [])].sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)), [announcements]);

  const performDelete = async () => {
      if (!announcementToDelete || !firestore) return;
      setIsDeleting(true);
      try {
          await deleteDoc(doc(firestore, 'announcements', announcementToDelete.id));
          toast({ title: 'Deleted' });
      } catch (e: any) {
          toast({ title: 'Error', variant: 'destructive' });
      } finally {
          setIsDeleting(false);
          setAnnouncementToDelete(null);
      }
  };

  if (isLoadingAnnouncements || isLoadingClasses) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <AnnouncementForm classes={classes || []} currentAnnouncement={editingAnnouncement || undefined} onFinished={() => setEditingAnnouncement(null)} />
      </div>
      <div className="lg:col-span-2">
        <Card>
            <CardHeader><CardTitle>Posted Announcements</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                {sortedAnnouncements.map(ann => (
                    <div key={ann.id} className="flex items-start justify-between border p-4 rounded-lg">
                        <div>
                            <p className="font-semibold">{ann.title}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">{ann.content}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {ann.createdAt ? format(ann.createdAt.toDate(), 'PPP') : 'Just now'}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setEditingAnnouncement(ann)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setAnnouncementToDelete(ann)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!announcementToDelete} onOpenChange={(open) => !open && setAnnouncementToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete Announcement?</AlertDialogTitle></AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={performDelete} className={buttonVariants({ variant: 'destructive' })} disabled={isDeleting}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

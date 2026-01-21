'use client';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, serverTimestamp, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

        if (currentAnnouncement) {
            const annRef = doc(firestore, 'announcements', currentAnnouncement.id);
            await updateDoc(annRef, data);
            toast({ title: 'Announcement Updated!', description: 'The announcement has been successfully updated.' });
        } else {
            const annColl = collection(firestore, 'announcements');
            await addDoc(annColl, data);
            toast({ title: 'Announcement Posted!', description: 'The announcement has been successfully created.' });
        }
        form.reset();
        onFinished();
    } catch (e: any) {
        const operation = currentAnnouncement ? 'update' : 'create';
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `announcements/${currentAnnouncement?.id || ''}`,
            operation: operation,
            requestResourceData: values,
        }));
        toast({ title: 'Error', description: `Failed to ${operation} announcement. Check permissions.`, variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{currentAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}</CardTitle>
        <CardDescription>This will be visible to the selected group of students.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetClass"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Audience</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an audience" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">All Students</SelectItem>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the class that will see this announcement.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {currentAnnouncement ? 'Update' : 'Post'} Announcement
                </Button>
                {currentAnnouncement && <Button variant="ghost" onClick={onFinished} disabled={isSubmitting}>Cancel</Button>}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

const AnnouncementList = ({
  announcements,
  classes,
  onEdit,
}: {
  announcements: Announcement[];
  classes: Class[];
  onEdit: (announcement: Announcement) => void;
}) => {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      setDeletingId(id);
      try {
        const annRef = doc(firestore, 'announcements', id);
        await deleteDoc(annRef);
        toast({ title: 'Announcement Deleted', variant: 'destructive' });
      } catch (e: any) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `announcements/${id}`,
            operation: 'delete',
        }));
        toast({ title: 'Error', description: 'Failed to delete announcement.', variant: 'destructive' });
      } finally {
        setDeletingId(null);
      }
    }
  };

  const getTargetAudience = (classIds: string[]) => {
    if (classIds.length === classes.length) {
        return 'All Students';
    }
    return classIds.map(id => classes.find(c => c.id === id)?.name).join(', ');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Posted Announcements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {announcements.map(ann => (
          <div key={ann.id} className="flex items-start justify-between rounded-lg border p-4">
            <div>
              <p className="font-semibold">{ann.title}</p>
              <p className="text-sm text-muted-foreground line-clamp-2">{ann.content}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {ann.createdAt ? format(ann.createdAt.toDate(), 'PPP') : 'Just now'} &bull; Target:{' '}
                {getTargetAudience(ann.classIds)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => onEdit(ann)} disabled={!!deletingId}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(ann.id)} disabled={!!deletingId}>
                {deletingId === ann.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default function AnnouncementManagement() {
  const firestore = useFirestore();
  const { user } = useAuth();
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const announcementsQuery = useMemoFirebase(() => user ? collection(firestore, 'announcements') : null, [firestore, user]);
  const { data: announcements, isLoading: isLoadingAnnouncements } = useCollection<Announcement>(announcementsQuery);

  const classesQuery = useMemoFirebase(() => user ? collection(firestore, 'classes') : null, [firestore, user]);
  const { data: classes, isLoading: isLoadingClasses } = useCollection<Class>(classesQuery);

  const isLoading = isLoadingAnnouncements || isLoadingClasses;

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
  };
  
  const handleFinishedEditing = () => {
    setEditingAnnouncement(null);
  }

  if (isLoading) {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  if (!announcements || !classes) {
    return <p>No data available. Please ensure you are logged in.</p>
  }
  
  // Sort announcements by creation date, descending
  const sortedAnnouncements = [...announcements].sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis())

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <AnnouncementForm classes={classes} currentAnnouncement={editingAnnouncement || undefined} onFinished={handleFinishedEditing} />
      </div>
      <div className="lg:col-span-2">
        <AnnouncementList announcements={sortedAnnouncements} classes={classes} onEdit={handleEdit} />
      </div>
    </div>
  );
}

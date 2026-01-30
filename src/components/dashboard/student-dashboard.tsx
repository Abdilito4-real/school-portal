'use client';
import AnnouncementCard from './announcement-card';
import type { Announcement, Class } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

export default function StudentDashboard() {
  const { user } = useAuth();
  const firestore = useFirestore();

  const announcementsQuery = useMemoFirebase(
    () =>
      firestore && user?.role === 'student' && user?.classId
        ? query(
            collection(firestore, 'announcements'),
            where('classIds', 'array-contains', user.classId)
          )
        : null,
    [firestore, user?.role, user?.classId]
  );
  const { data: announcements, isLoading: isLoadingAnnouncements } =
    useCollection<Announcement>(announcementsQuery);

  const classesQuery = useMemoFirebase(
    () => (firestore && user?.role === 'student' ? collection(firestore, 'classes') : null),
    [firestore, user?.role]
  );
  const { data: classes, isLoading: isLoadingClasses } =
    useCollection<Class>(classesQuery);

  const isLoading = isLoadingAnnouncements || isLoadingClasses;

  const sortedAnnouncements = announcements
    ? [...announcements].sort(
        (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()
      )
    : [];

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight font-headline">
        Announcements
      </h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedAnnouncements.length > 0 && classes ? (
          sortedAnnouncements.map(ann => (
            <AnnouncementCard
              key={ann.id}
              announcement={ann}
              classes={classes}
            />
          ))
        ) : (
          <p className="col-span-full text-muted-foreground">
            No announcements for your class at this time.
          </p>
        )}
      </div>
    </div>
  );
}

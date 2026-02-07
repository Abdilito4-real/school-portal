'use client';
import AnnouncementCard from './announcement-card';
import type { Announcement, Class, AcademicResult } from '@/lib/types';
import { Loader2, GraduationCap, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

export default function StudentDashboard() {
  const { user } = useAuth();
  const firestore = useFirestore();

  const resultsQuery = useMemoFirebase(
    () =>
      firestore && user?.uid
        ? query(
            collection(firestore, 'users', user.uid, 'academicResults'),
            orderBy('createdAt', 'desc'),
            limit(3)
          )
        : null,
    [firestore, user?.uid]
  );
  const { data: recentResults, isLoading: isLoadingResults } =
    useCollection<AcademicResult>(resultsQuery);

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

  const isLoading = isLoadingAnnouncements || isLoadingClasses || isLoadingResults;

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
    <div className="space-y-10">
      <section className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          Recent Results
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {recentResults && recentResults.length > 0 ? (
            recentResults.map((result) => (
              <Card key={result.id} className="overflow-hidden border-l-4 border-l-primary">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      {result.term} Term, {result.year}
                    </CardTitle>
                    <GraduationCap className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold">{result.className}</p>
                      <div className="flex items-center mt-1 text-xs text-muted-foreground">
                        <Calendar className="mr-1 h-3 w-3" />
                        {result.createdAt ? formatDistanceToNow(result.createdAt.toDate(), { addSuffix: true }) : 'Recently'}
                      </div>
                    </div>
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xl font-black">
                      {result.grade}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="col-span-full text-muted-foreground italic">
              No recent results found.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-4">
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
      </section>
    </div>
  );
}

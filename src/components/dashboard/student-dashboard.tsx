'use client';
import AnnouncementCard from './announcement-card';
import type { Announcement, Class, AcademicResult } from '@/lib/types';
import { Loader2, GraduationCap, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function StudentDashboard() {
  const { user } = useAuth();
  const firestore = useFirestore();

  const resultsQuery = useMemoFirebase(
    () =>
      firestore && user?.uid
        ? query(
            collection(firestore, 'users', user.uid, 'academicResults'),
            orderBy('createdAt', 'desc'),
            limit(1)
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
          Latest Report Card
        </h2>
        <div>
          {recentResults && recentResults.length > 0 ? (
            recentResults.map((result) => (
              <Card key={result.id} className="overflow-hidden border-l-4 border-l-primary max-w-2xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold">
                      {result.term} Term Report, {result.year}
                    </CardTitle>
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="mr-1 h-3 w-3" />
                    Updated {result.createdAt ? formatDistanceToNow(result.createdAt.toDate(), { addSuffix: true }) : 'Recently'}
                  </div>
                </CardHeader>
                <CardContent>
                   <div className="mt-4 space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        {(result.subjects || []).slice(0, 6).map((s, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                            <span className="text-sm font-medium">{s.subject}</span>
                            <Badge variant="secondary">{s.grade}</Badge>
                          </div>
                        ))}
                      </div>
                      {(result.subjects?.length || 0) > 6 && (
                        <p className="text-xs text-center text-muted-foreground">
                          And {(result.subjects?.length || 0) - 6} more subjects...
                        </p>
                      )}
                      <div className="mt-6 pt-4 border-t flex justify-between items-center">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Position</p>
                          <p className="font-bold">{result.position || 'N/A'}</p>
                        </div>
                        <Button asChild variant="outline" size="sm">
                          <Link href="/results">View Full Report</Link>
                        </Button>
                      </div>
                   </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground italic">
              No academic results have been uploaded for you yet.
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

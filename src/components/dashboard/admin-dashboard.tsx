
'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Bell, ArrowRight, Loader2, CheckCircle, Clock, Edit } from 'lucide-react';
import Link from 'next/link';
import type { Student, FeeRecord, Announcement, SiteContent } from '@/lib/types';
import { useMemo } from 'react';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { formatRelative } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, color, isLoading }: { title: string; value: string; icon: React.ElementType; color?: string; isLoading: boolean }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 text-muted-foreground ${color}`} />
    </CardHeader>
    <CardContent>
      {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <div className="text-2xl font-bold">{value}</div>}
    </CardContent>
  </Card>
);

export default function AdminDashboard() {
  const firestore = useFirestore();

  const studentsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'students')) : null, [firestore]);
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);
  
  const allFeesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'fees')) : null, [firestore]);
  const { data: allFees, isLoading: isLoadingFees } = useCollection<FeeRecord>(allFeesQuery);
  
  const recentActivitiesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'fees'), orderBy('createdAt', 'desc'), limit(3)) : null, [firestore]);
  const { data: recentFees, isLoading: isLoadingRecent } = useCollection<FeeRecord>(recentActivitiesQuery);

  const contentDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_content', 'homepage') : null, [firestore]);
  const { data: siteContent, isLoading: isLoadingContent } = useDoc<SiteContent>(contentDocRef);


  const isLoading = isLoadingStudents || isLoadingFees || isLoadingRecent || isLoadingContent;

  const feeStats = useMemo(() => {
    if (!allFees) return { paid: 0, pending: 0, partial: 0 };
    return allFees.reduce((acc, fee) => {
        if (fee.status === 'Paid') acc.paid++;
        if (fee.status === 'Pending') acc.pending++;
        if (fee.status === 'Partial') acc.partial++;
        return acc;
    }, { paid: 0, pending: 0, partial: 0 });
  }, [allFees]);

  const totalStudents = students?.length ?? 0;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight font-headline">Admin Dashboard</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Students" value={String(totalStudents)} icon={Users} isLoading={isLoading} />
        <StatCard title="Fees Paid" value={String(feeStats.paid)} icon={CheckCircle} color="text-green-500" isLoading={isLoading} />
        <StatCard title="Fees Pending" value={String(feeStats.pending)} icon={Clock} color="text-red-500" isLoading={isLoading} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col space-y-2">
            <Button asChild className="justify-start" variant="ghost">
              <Link href="/admin/classes">
                Manage Students & Classes <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
            <Button asChild className="justify-start" variant="ghost">
              <Link href="/admin/announcements">
                Post Announcement <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
            <Button asChild className="justify-start" variant="ghost">
              <Link href="/admin/activity">
                View All Activity <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col gap-4">
             { isLoading ? <div className='flex justify-center items-center h-full'><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : !recentFees || recentFees.length === 0 ? (<p className="text-sm text-muted-foreground m-auto">No recent activity to display.</p>) :
              recentFees.map(fee => (
                <div className="flex items-center" key={fee.id}>
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div className="ml-4">
                    <p className="text-sm">Fee status for a student was updated to {fee.status}.</p>
                    <p className="text-xs text-muted-foreground">{formatRelative(fee.createdAt.toDate(), new Date())}</p>
                  </div>
                </div>
              ))
             }
          </CardContent>
           <div className="p-4 pt-0 text-right">
                <Button asChild size="sm" variant="ghost" className="text-sm">
                    <Link href="/admin/activity">See all <ArrowRight className="ml-2 h-3 w-3" /></Link>
                </Button>
            </div>
        </Card>

         <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Public Homepage Content</CardTitle>
            <Button asChild variant="outline" size="sm">
                <Link href="/admin/content"><Edit className="mr-2 h-4 w-4" /> Edit Content</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingContent ? (
                <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : siteContent ? (
                <div className="space-y-4 text-sm">
                    <div className="flex">
                        <strong className="w-32 shrink-0">School Name</strong>
                        <span className="text-muted-foreground">{siteContent.schoolName || 'Not Set'}</span>
                    </div>
                     <div className="flex">
                        <strong className="w-32 shrink-0">Hero Title</strong>
                        <span className="text-muted-foreground">{siteContent.heroTitle || 'Not Set'}</span>
                    </div>
                     <div className="flex">
                        <strong className="w-32 shrink-0">Hero Subtitle</strong>
                        <span className="text-muted-foreground line-clamp-2">{siteContent.heroSubtitle || 'Not Set'}</span>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">No homepage content has been set up yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

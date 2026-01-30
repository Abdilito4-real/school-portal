
'use client';

import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Announcement, FeeRecord, Student, Class, AcademicResult } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Users, Bell, BookCopy } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


export default function ActivityLogPage() {
  const firestore = useFirestore();

  const feesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'fees'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data: allFees, isLoading: isLoadingFees } = useCollection<FeeRecord>(feesQuery);

  const announcementsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'announcements'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data: allAnnouncements, isLoading: isLoadingAnnouncements } = useCollection<Announcement>(announcementsQuery);

  const resultsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'academicResults'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data: allResults, isLoading: isLoadingResults } = useCollection<AcademicResult>(resultsQuery);

  const studentsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'students') : null, [firestore]);
  const { data: allStudents, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);

  const classesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'classes') : null, [firestore]);
  const { data: allClassData, isLoading: isLoadingClasses } = useCollection<Class>(classesQuery);


  const isLoading = isLoadingFees || isLoadingAnnouncements || isLoadingStudents || isLoadingClasses || isLoadingResults;

  const { studentsById, classesById } = useMemo(() => {
    const studentsById = new Map(allStudents?.map(s => [s.id, s]));
    const classesById = new Map(allClassData?.map(c => [c.id, c]));
    return { studentsById, classesById };
  }, [allStudents, allClassData]);


  const combinedActivities = useMemo(() => {
    if (!allFees || !allAnnouncements || !allResults) return [];

    const feeActivities = allFees.map(fee => {
        const student = studentsById.get(fee.studentId);
        const studentClass = student ? classesById.get(student.classId) : undefined;
        return {
            id: fee.id,
            type: 'fee' as const,
            description: `Fee status for a student was updated to`,
            status: fee.status,
            timestamp: fee.createdAt,
            studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
            className: studentClass ? studentClass.name : 'Unknown Class',
            grade: null,
        }
    });

    const announcementActivities = allAnnouncements.map(ann => ({
        id: ann.id,
        type: 'announcement' as const,
        description: `New announcement posted: "${ann.title}"`,
        status: null,
        timestamp: ann.createdAt,
        studentName: null,
        className: null,
        grade: null,
    }));

    const resultActivities = allResults.map(result => {
        const student = studentsById.get(result.studentId);
        const studentClass = student ? classesById.get(student.classId) : undefined;
        return {
            id: result.id,
            type: 'result' as const,
            description: `Result for '${result.className}' was posted for a student with grade`,
            status: null,
            timestamp: result.createdAt,
            studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
            className: studentClass ? studentClass.name : 'Unknown Class',
            grade: result.grade,
        }
    });

    // Filter out items without a valid timestamp before sorting
    const validActivities = [...feeActivities, ...announcementActivities, ...resultActivities].filter(activity => activity.timestamp && typeof activity.timestamp.toMillis === 'function');


    return validActivities.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

  }, [allFees, allAnnouncements, allResults, studentsById, classesById]);


  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-3xl font-bold tracking-tight font-headline">Activity Log</h2>
                <p className="text-muted-foreground">
                    A chronological log of all administrative and system activities.
                </p>
            </div>
            <Button asChild variant="outline">
                <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
            </Button>
        </div>
      
        <Card>
            <CardHeader>
                <CardTitle>All Activities</CardTitle>
                <CardDescription>Sorted from newest to oldest.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex h-48 w-full items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : combinedActivities.length === 0 ? (
                    <p className="text-muted-foreground text-center py-10">No activities found.</p>
                ) : (
                    <TooltipProvider>
                        <div className="space-y-4">
                            {combinedActivities.map(activity => {
                                if (activity.type === 'fee') {
                                    return (
                                        <Tooltip key={activity.id}>
                                            <TooltipTrigger asChild>
                                                <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/20 cursor-default">
                                                    <Users className="h-5 w-5 text-muted-foreground" />
                                                    <div className="flex-grow text-sm">
                                                        <span>{activity.description}</span>
                                                        {activity.status && <Badge variant={activity.status === 'Paid' ? 'success' : activity.status === 'Pending' ? 'destructive' : 'warning'} className="ml-2">{activity.status}</Badge>}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                                                        {format(activity.timestamp.toDate(), 'PPP p')}
                                                    </p>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="font-semibold">{activity.studentName}</p>
                                                <p className="text-sm text-muted-foreground">{activity.className}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )
                                }
                                if (activity.type === 'result') {
                                    return (
                                        <Tooltip key={activity.id}>
                                            <TooltipTrigger asChild>
                                                <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/20 cursor-default">
                                                    <BookCopy className="h-5 w-5 text-muted-foreground" />
                                                    <div className="flex-grow text-sm">
                                                        <span>{activity.description}</span>
                                                        {activity.grade && <Badge variant={'secondary'} className="ml-2">{activity.grade}</Badge>}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                                                        {format(activity.timestamp.toDate(), 'PPP p')}
                                                    </p>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="font-semibold">{activity.studentName}</p>
                                                <p className="text-sm text-muted-foreground">{activity.className}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )
                                }
                                return (
                                    <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg border bg-muted/20">
                                        <Bell className="h-5 w-5 text-muted-foreground" />
                                        <div className="flex-grow text-sm">
                                            <span>{activity.description}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                                            {format(activity.timestamp.toDate(), 'PPP p')}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                    </TooltipProvider>
                )}
            </CardContent>
        </Card>
    </div>
  );
}

'use client';
<<<<<<< HEAD
import { useState } from 'react';
=======
import { useState, useEffect } from 'react';
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
import { useAuth } from '@/hooks/use-auth';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { AcademicResult, Class, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Calendar, Eye } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { format, formatDistanceToNow } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const getSessionFromTermAndYear = (term: '1st' | '2nd' | '3rd', year: number): string => {
  if (term === '1st') {
    // 1st term of a year (e.g., 2022) belongs to the session that starts that year.
    return `${year}/${year + 1}`;
  } else {
    // 2nd or 3rd term of a year (e.g., 2023) belongs to the session that started the previous year.
    return `${year - 1}/${year}`;
  }
};

const groupResultsBySession = (results: AcademicResult[]) => {
  return results.reduce((acc, result) => {
    // Skip results that are missing critical data
    if (!result.term || !result.year || !result.createdAt) {
        return acc;
    }
    const sessionKey = getSessionFromTermAndYear(result.term, result.year);
    if (!acc[sessionKey]) {
      acc[sessionKey] = {
        session: sessionKey,
        createdAt: result.createdAt, // We need a timestamp for sorting the sessions
        results: []
      };
    }
    acc[sessionKey].results.push(result);
    // Use the latest result's timestamp for sorting the session cards
    if (result.createdAt?.toMillis() > acc[sessionKey].createdAt?.toMillis()) {
        acc[sessionKey].createdAt = result.createdAt;
    }
    return acc;
  }, {} as Record<string, { session: string; createdAt: any; results: AcademicResult[] }>);
};

const GradeInfo = () => (
    <div className="bg-white/70 dark:bg-black/20 p-4 rounded-lg text-sm">
        <h4 className="font-bold mb-2 text-foreground">Grade Info</h4>
        <ul className="space-y-1 text-muted-foreground">
            <li><span className="font-semibold">A</span> = 90 - 100</li>
            <li><span className="font-semibold">B</span> = 80 - 89</li>
            <li><span className="font-semibold">C</span> = 60 - 79</li>
            <li><span className="font-semibold">D</span> = 0 - 59</li>
        </ul>
    </div>
);

const InfoField = ({ label, value }: { label: string; value: string | number }) => (
    <div className="flex-1 min-w-[120px]">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold text-sm">{value}</p>
    </div>
);

<<<<<<< HEAD
=======
// Client-only component to prevent hydration mismatch on relative times
const ClientRelativeTime = ({ date }: { date: Date }) => {
    const [relativeTime, setRelativeTime] = useState('');

    useEffect(() => {
        setRelativeTime(formatDistanceToNow(date, { addSuffix: true }));
    }, [date]);

    // Render a placeholder on the server and initial client render
    if (!relativeTime) {
        return <span>...</span>;
    }

    return <span>{relativeTime}</span>;
};


>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
const ReportCard = ({ session, sessionResults, user, className, defaultTerm }: { session: string, sessionResults: AcademicResult[], user: User, className: string, defaultTerm: '1st' | '2nd' | '3rd' }) => {
    
    const resultsByTerm = sessionResults.reduce((acc, result) => {
        if (!acc[result.term]) {
            acc[result.term] = [];
        }
        acc[result.term].push(result);
        return acc;
    }, {} as Record<'1st' | '2nd' | '3rd', AcademicResult[]>);

    const ALL_TERMS = ['1st', '2nd', '3rd'] as const;
    
    const userInitials = user?.displayName
    ?.split(' ')
    .map((n) => n[0])
    .join('');

    return (
        <div className="max-w-2xl mx-auto font-sans shadow-2xl rounded-2xl overflow-hidden">
            <div className="report-card-gradient relative text-center pt-8 pb-20 px-6">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] aspect-square rounded-full bg-background/30 -mt-[40%]"></div>
                <div className="relative z-10">
                    <h1 className="text-5xl font-bold tracking-tight text-foreground">REPORT CARD</h1>
                    <p className="text-foreground/80 font-medium">Brocelle Junior High School</p>
                </div>
                 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-gradient-to-br from-primary to-accent p-1.5 rounded-full shadow-md">
                    <Avatar className="h-24 w-24 border-4 border-background">
                        <AvatarFallback className="text-4xl">{userInitials}</AvatarFallback>
                    </Avatar>
                </div>
            </div>

            <div className="bg-background pt-16 pb-6 px-6">
                <div className="flex gap-x-8 gap-y-4 mb-6 flex-wrap">
                    <InfoField label="Name" value={user.displayName || 'Student'} />
                    <InfoField label="Class" value={className} />
                    <InfoField label="Session" value={session} />
                </div>
            </div>

            <Tabs defaultValue={defaultTerm} className="w-full bg-muted/50">
                <TabsList className="grid w-full grid-cols-3 rounded-none bg-muted/40">
                    {ALL_TERMS.map(term => (
                        <TabsTrigger key={term} value={term}>{term} Term</TabsTrigger>
                    ))}
                </TabsList>
                {ALL_TERMS.map(term => {
                    const termResults = resultsByTerm[term];
                    
                    return (
                        <TabsContent key={term} value={term}>
                            {termResults && termResults.length > 0 ? (
                                <>
                                    <div className="p-6">
                                        <div className="grid grid-cols-2 gap-6 items-start">
                                            <div>
                                                <h3 className="font-bold text-lg mb-2">Subjects</h3>
                                                <div className="bg-background rounded-lg p-4 space-y-3 shadow-inner">
                                                    {termResults.map(r => (
                                                        <p key={r.id} className="text-sm text-muted-foreground border-b border-border pb-2">{r.className}</p>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg mb-2">Grade</h3>
                                                <div className="bg-background rounded-lg p-4 space-y-3 shadow-inner">
                                                    {termResults.map(r => (
                                                        <p key={r.id} className="text-sm font-bold text-center border-b border-border pb-2">{r.grade}</p>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 border-t border-border">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <h3 className="font-bold text-lg mb-2">Overall Position</h3>
                                                <div className="bg-background rounded-lg p-4 h-28 shadow-inner flex items-center justify-center">
                                                    <p className="text-3xl font-bold">{termResults[0]?.position || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg mb-2">Comments</h3>
                                                <div className="bg-background rounded-lg p-4 h-28 shadow-inner overflow-y-auto">
                                                    <p className="text-sm text-muted-foreground italic">{termResults[0]?.comments || 'Good progress this term. Keep up the hard work.'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-6 py-12">
                                    <p className="text-muted-foreground">No results have been uploaded for this term yet.</p>
                                </div>
                            )}
                        </TabsContent>
                    )
                })}
            </Tabs>

            <div className="bg-muted/50 p-6 border-t border-border">
                <GradeInfo />
            </div>
             <div className="report-card-gradient h-4"></div>
        </div>
    );
};


export default function ResultsView() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [selectedSessionKey, setSelectedSessionKey] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<'1st' | '2nd' | '3rd'>('1st');

  const resultsQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, 'users', user.uid, 'academicResults')) : null),
    [firestore, user]
  );
  const { data: studentResults, isLoading: isLoadingResults } = useCollection<AcademicResult>(resultsQuery);

  const classesQuery = useMemoFirebase(() => user ? collection(firestore, 'classes') : null, [firestore, user]);
  const { data: classes, isLoading: isLoadingClasses } = useCollection<Class>(classesQuery);

  const isLoading = isLoadingResults || isLoadingClasses;
  
  const handleViewReport = (sessionKey: string, term: '1st' | '2nd' | '3rd') => {
    setSelectedSessionKey(sessionKey);
    setSelectedTerm(term);
  };

  if (isLoading || !user) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!studentResults || studentResults.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Academic Results</CardTitle>
        </CardHeader>
        <CardContent>
          <p>There are no academic results available for you at this time.</p>
        </CardContent>
      </Card>
    );
  }

  const groupedResults = groupResultsBySession(studentResults);
  const sessionOrder = Object.keys(groupedResults).sort((a, b) => {
    const sessionA = groupedResults[a];
    const sessionB = groupedResults[b];
    const timeA = sessionA.createdAt?.toMillis() || 0;
    const timeB = sessionB.createdAt?.toMillis() || 0;
    return timeB - timeA;
  });
  
  const studentClassName = classes?.find(c => c.id === user?.classId)?.name || 'Unknown';

  if (selectedSessionKey && groupedResults[selectedSessionKey]) {
    const { session, results } = groupedResults[selectedSessionKey];
    return (
        <div className="space-y-6">
            <Button variant="outline" onClick={() => setSelectedSessionKey(null)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Sessions
            </Button>
            <ReportCard
                session={session}
                sessionResults={results}
                user={user}
                className={studentClassName}
                defaultTerm={selectedTerm}
            />
        </div>
    );
  }

  const ALL_TERMS: ('1st' | '2nd' | '3rd')[] = ['1st', '2nd', '3rd'];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sessionOrder.map((sessionKey) => {
            const { session, createdAt, results } = groupedResults[sessionKey];
            const availableTerms = new Set(results.map(r => r.term));
            return (
                <Card key={sessionKey} className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Session {session}</CardTitle>
                        <CardContent className="p-0 pt-2 flex items-center text-xs text-muted-foreground">
                            <Calendar className="mr-2 h-4 w-4" />
<<<<<<< HEAD
                            <span>Last updated {createdAt ? formatDistanceToNow(createdAt.toDate(), { addSuffix: true }) : 'recently'}</span>
=======
                            {createdAt ? <ClientRelativeTime date={createdAt.toDate()} /> : <span>Last updated recently</span>}
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
                        </CardContent>
                    </CardHeader>
                    <CardFooter className="mt-auto flex flex-col items-stretch gap-2">
                        {ALL_TERMS.map(term => (
                             <Button key={term} className="w-full" onClick={() => handleViewReport(sessionKey, term)} disabled={!availableTerms.has(term)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View {term} Term Report
                            </Button>
                        ))}
                    </CardFooter>
                </Card>
            );
        })}
    </div>
  );
}

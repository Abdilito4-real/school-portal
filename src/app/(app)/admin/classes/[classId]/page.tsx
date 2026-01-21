'use client';
import React from 'react';
import StudentManagement from '@/components/admin/student-management';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import type { Class } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function ClassDetailsPage({ params }: { params: Promise<{ classId: string }> }) {
    const { classId } = React.use(params);
    const firestore = useFirestore();
    const { user, loading: authLoading, isRole } = useAuth();

    // Only create the document reference if the user is an admin
    const classDocRef = useMemoFirebase(() => {
        if (!firestore || !isRole('admin')) return null;
        return doc(firestore, 'classes', classId);
    }, [firestore, classId, isRole]);
    
    // Pass the potentially null ref to useDoc
    const { data: classData, isLoading: isClassLoading } = useDoc<Class>(classDocRef);
    
    // The overall loading state depends on auth check AND class data fetching
    const isLoading = authLoading || isClassLoading;

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    // If not an admin after loading, show an access denied message
    if (!isRole('admin')) {
        return (
             <div className="flex h-full w-full items-center justify-center">
                <p className="text-muted-foreground">Access Denied. You must be an administrator to view this page.</p>
            </div>
        )
    }
    
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight font-headline">
                    {classData ? `Students in ${classData.name}` : 'Class Not Found'}
                </h2>
                <p className="text-muted-foreground">
                    Manage students, upload results, and update fees for this class.
                </p>
            </div>
            <StudentManagement classId={classId} />
        </div>
    );
}

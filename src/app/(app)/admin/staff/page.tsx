'use client';

import StaffManagement from '@/components/admin/staff-management';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function StaffPage() {
    const { isRole, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isRole('admin')) {
        return (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                Access Denied. You must be an administrator to view this page.
            </div>
        );
    }

    return <StaffManagement />;
}

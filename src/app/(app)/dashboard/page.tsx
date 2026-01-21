'use client';

import { useAuth } from '@/hooks/use-auth';
import AdminDashboard from '@/components/dashboard/admin-dashboard';
import StudentDashboard from '@/components/dashboard/student-dashboard';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return user.role === 'admin' ? <AdminDashboard /> : <StudentDashboard />;
}

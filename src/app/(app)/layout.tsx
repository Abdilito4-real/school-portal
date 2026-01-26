'use client';

import { AppSidebar } from '@/components/layout/sidebar';
import { AppHeader } from '@/components/layout/header';
import { AuthProvider } from '@/context/auth-provider';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <AppSidebar />
        <div className="flex flex-col">
          <AppHeader />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            {children}
          </main>
        </div>
      </div>
      <FirebaseErrorListener />
    </AuthProvider>
  );
}

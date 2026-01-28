'use client';

import { AppSidebar } from '@/components/layout/sidebar';
import { AppHeader } from '@/components/layout/header';
import { AuthProvider } from '@/context/auth-provider';
<<<<<<< HEAD
import { FirebaseClientProvider } from '@/firebase';
import { SiteContentProvider } from '@/context/site-content-provider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <SiteContentProvider>
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
        </AuthProvider>
      </SiteContentProvider>
    </FirebaseClientProvider>
=======

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <AppSidebar />
        <div className="flex flex-col">
          <AppHeader />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
              {children}
          </main>
        </div>
      </div>
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
  );
}

<<<<<<< HEAD
'use client';

import { GraduationCap } from "lucide-react";
import { FirebaseClientProvider } from "@/firebase";
import { AuthProvider } from "@/context/auth-provider";
=======
import { GraduationCap } from "lucide-react";
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
<<<<<<< HEAD
    <FirebaseClientProvider>
      <AuthProvider>
        <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
          <div className="w-full max-w-md">
            <div className="mb-8 flex flex-col items-center">
              <div className="mb-4 rounded-full bg-primary p-3 text-primary-foreground">
                <GraduationCap className="h-8 w-8" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 font-headline">
                Campus Hub
              </h1>
              <p className="text-muted-foreground">Welcome to your campus portal</p>
            </div>
            {children}
          </div>
        </main>
      </AuthProvider>
    </FirebaseClientProvider>
=======
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 rounded-full bg-primary p-3 text-primary-foreground">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 font-headline">
            Campus Hub
          </h1>
          <p className="text-muted-foreground">Welcome to your campus portal</p>
        </div>
        {children}
      </div>
    </main>
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
  );
}

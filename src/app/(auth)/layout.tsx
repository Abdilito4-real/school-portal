'use client';

import { GraduationCap } from "lucide-react";
import { useSiteContent } from "@/context/site-content-provider";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { content } = useSiteContent();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 rounded-full bg-primary p-3 text-primary-foreground">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 font-headline">
            {content.schoolName || 'Campus Hub'}
          </h1>
          <p className="text-muted-foreground">Welcome to your campus portal</p>
        </div>
        {children}
      </div>
    </main>
  );
}

import type { Metadata } from 'next';
import { PT_Sans } from 'next/font/google';
import './globals.css';
<<<<<<< HEAD
import { Toaster } from "@/components/ui/toaster"
=======
import { AuthProvider } from '@/context/auth-provider';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { SiteContentProvider } from '@/context/site-content-provider';
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
import { cn } from '@/lib/utils';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

export const metadata: Metadata = {
  title: 'Campus Hub',
  description: 'A modern campus management system.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head />
      <body className={cn("font-body antialiased h-full bg-background", ptSans.variable)}>
<<<<<<< HEAD
        {children}
=======
        <FirebaseClientProvider>
          <SiteContentProvider>
            <AuthProvider>
              {children}
              <FirebaseErrorListener />
            </AuthProvider>
          </SiteContentProvider>
        </FirebaseClientProvider>
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
        <Toaster />
      </body>
    </html>
  );
}

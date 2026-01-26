import type { Metadata } from 'next';
import { PT_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';
import { SiteContentProvider } from '@/context/site-content-provider';

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
        <FirebaseClientProvider>
          <SiteContentProvider>
            {children}
            <Toaster />
          </SiteContentProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}

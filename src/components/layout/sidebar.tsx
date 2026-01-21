'use client';

import { useAuth } from '@/hooks/use-auth';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Megaphone,
  GraduationCap,
  Landmark,
  BookCopy,
  School,
  FileText,
} from 'lucide-react';
import { Button } from '../ui/button';
import { useSiteContent } from '@/context/site-content-provider';
import Image from 'next/image';


const adminNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/classes', icon: School, label: 'Classes' },
  { href: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
  { href: '/admin/content', icon: FileText, label: 'Site Content' },
];

const studentNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/results', icon: BookCopy, label: 'Results' },
  { href: '/fees', icon: Landmark, label: 'Fees' },
];

export function AppSidebar({ isMobile = false }: { isMobile?: boolean }) {
  const { isRole } = useAuth();
  const pathname = usePathname();
  const { content } = useSiteContent();
  const navItems = isRole('admin') ? adminNavItems : studentNavItems;

  const desktopClasses = "hidden border-r bg-muted/40 md:block";

  return (
    <div className={cn(!isMobile && desktopClasses)}>
        <div className={cn("flex h-full max-h-screen flex-col gap-2", !isMobile && "h-full max-h-screen")}>
            {!isMobile && (
              <div className="flex h-16 items-center border-b px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    {content.logoUrl ? (
                      <div className="relative h-8 w-8">
                        <Image src={content.logoUrl} alt={`${content.schoolName} Logo`} fill className="object-contain" />
                      </div>
                    ) : (
                      <GraduationCap className="h-8 w-8" />
                    )}
                    <span className="font-headline">{content.schoolName || 'Campus Hub'}</span>
                </Link>
              </div>
            )}
            <div className="flex-1">
              <nav className="grid items-start px-4 text-sm font-medium">
                  {navItems.map((item) => (
                      <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                          pathname === item.href && 'bg-muted text-primary'
                          )}
                      >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                      </Link>
                  ))}
              </nav>
            </div>
      </div>
    </div>
  );
}

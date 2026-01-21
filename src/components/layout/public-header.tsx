import Link from 'next/link';
import { GraduationCap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SiteContent } from '@/lib/types';
import Image from 'next/image';

export function PublicHeader({ content }: { content: SiteContent }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center gap-3 font-semibold mr-auto">
          {content.logoUrl ? (
            <div className="relative h-10 w-10">
              <Image src={content.logoUrl} alt={`${content.schoolName} Logo`} fill className="object-contain" />
            </div>
          ) : (
            <GraduationCap className="h-8 w-8 text-primary" />
          )}
          <span className="font-headline text-lg">{content.schoolName}</span>
        </Link>
        <nav>
          <Button asChild>
            <Link href="/login">
              Portal Login <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

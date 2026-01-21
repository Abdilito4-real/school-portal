import { SiteContent } from "@/lib/types";
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, GraduationCap } from 'lucide-react';

export function PublicFooter({ content }: { content: SiteContent }) {
  return (
    <footer className="bg-muted/40 border-t">
      <div className="container py-12 px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <GraduationCap className="h-7 w-7 text-primary" />
              <span className="font-bold text-lg font-headline">{content.schoolName}</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Fostering innovation and excellence for the next generation of leaders.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">Quick Links</h4>
            <ul className="space-y-1">
              <li><Link href="#about" className="text-sm text-muted-foreground hover:text-primary">About Us</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Admissions</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Academics</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Contact Us</Link></li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">Resources</h4>
            <ul className="space-y-1">
              <li><Link href="/login" className="text-sm text-muted-foreground hover:text-primary">Student Portal</Link></li>
              <li><span className="text-sm text-muted-foreground cursor-not-allowed">Faculty Directory</span></li>
              <li><span className="text-sm text-muted-foreground cursor-not-allowed">Library</span></li>
              <li><span className="text-sm text-muted-foreground cursor-not-allowed">Events Calendar</span></li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">Connect With Us</h4>
            <div className="flex space-x-4">
              {content.facebookUrl && content.facebookUrl !== '#' && <Link href={content.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><Facebook className="h-5 w-5" /></Link>}
              {content.twitterUrl && content.twitterUrl !== '#' && <Link href={content.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><Twitter className="h-5 w-5" /></Link>}
              {content.instagramUrl && content.instagramUrl !== '#' && <Link href={content.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><Instagram className="h-5 w-5" /></Link>}
              {content.linkedinUrl && content.linkedinUrl !== '#' && <Link href={content.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><Linkedin className="h-5 w-5" /></Link>}
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center">
           <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {content.schoolName}. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

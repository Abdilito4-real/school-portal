import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { admin } from '@/lib/firebase-admin';
import type { SiteContent } from '@/lib/types';
import { cache } from 'react';
import { defaultSiteContent as defaultContent } from '@/lib/default-content';

// Helper to find image by ID
const findImage = (id: string) => {
    const img = PlaceHolderImages.find(p => p.id === id);
    if (!img) {
        return {
            imageUrl: 'https://picsum.photos/seed/default/1200/800',
            imageHint: 'placeholder image'
        }
    }
    return {
        imageUrl: img.imageUrl,
        imageHint: img.imageHint
    };
};

// Use React's cache function to fetch data and cache it for the duration of a request
const getHomepageContent = cache(async (): Promise<SiteContent> => {
    try {
        const contentDoc = await admin.firestore().collection('site_content').doc('homepage').get();
        if (contentDoc.exists) {
            // Merge with defaults to prevent missing fields from breaking the page
            return { ...defaultContent, ...contentDoc.data() as Partial<SiteContent> };
        }
        return defaultContent;
    } catch (error) {
        console.error("Error fetching homepage content:", error);
        return defaultContent;
    }
});

export default async function HomePage() {
  const content = await getHomepageContent();
  const heroImageHint = findImage('hero-campus').imageHint;
  const missionImageHint = findImage('mission-students').imageHint;
  const academicsImageHint = findImage('academics-library').imageHint;
  const campusLifeImageHint = findImage('campus-life-group').imageHint;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader content={content} />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full h-[60vh] md:h-[80vh] flex items-center justify-center text-center text-white">
          <Image
            src={content.heroImageUrl || defaultContent.heroImageUrl}
            alt="University campus"
            fill
            className="object-cover"
            priority
            data-ai-hint={heroImageHint}
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 space-y-4 px-4">
            <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tighter">
              {content.heroTitle}
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-primary-foreground/90">
              {content.heroSubtitle}
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/login">Access Student Portal</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="#about">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-12 md:py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-10 md:grid-cols-2 md:gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">
                  {content.missionTitle}
                </h2>
                <p className="mt-4 text-muted-foreground max-w-xl">
                  {content.missionText1}
                </p>
                <p className="mt-4 text-muted-foreground max-w-xl">
                  {content.missionText2}
                </p>
              </div>
              <div className="relative aspect-video rounded-xl overflow-hidden shadow-lg">
                 <Image
                    src={content.missionImageUrl || defaultContent.missionImageUrl}
                    alt="Students collaborating"
                    fill
                    className="object-cover"
                    data-ai-hint={missionImageHint}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">
              {content.whyChooseTitle}
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center">
                <h3 className="text-xl font-bold">{content.feature1Title}</h3>
                <p className="mt-2 text-muted-foreground">
                  {content.feature1Text}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <h3 className="text-xl font-bold">{content.feature2Title}</h3>
                <p className="mt-2 text-muted-foreground">
                  {content.feature2Text}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <h3 className="text-xl font-bold">{content.feature3Title}</h3>
                <p className="mt-2 text-muted-foreground">
                  {content.feature3Text}
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Gallery-like sections */}
         <section className="py-12 md:py-24 lg:py-32 bg-background">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid gap-10 md:grid-cols-2 md:gap-16 items-center">
                    <div className="relative aspect-video rounded-xl overflow-hidden shadow-lg">
                        <Image
                            src={content.academicsImageUrl || defaultContent.academicsImageUrl}
                            alt="Library with students"
                            fill
                            className="object-cover"
                            data-ai-hint={academicsImageHint}
                        />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">
                          {content.academicsTitle}
                        </h2>
                        <p className="mt-4 text-muted-foreground max-w-xl">
                          {content.academicsText}
                        </p>
                    </div>
                </div>
            </div>
        </section>

         <section className="py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-10 md:grid-cols-2 md:gap-16 items-center">
               <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">
                  {content.communityTitle}
                </h2>
                <p className="mt-4 text-muted-foreground max-w-xl">
                  {content.communityText}
                </p>
              </div>
              <div className="relative aspect-video rounded-xl overflow-hidden shadow-lg">
                 <Image
                    src={content.communityImageUrl || defaultContent.communityImageUrl}
                    alt="Group of students laughing"
                    fill
                    className="object-cover"
                    data-ai-hint={campusLifeImageHint}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter content={content} />
    </div>
  );
}

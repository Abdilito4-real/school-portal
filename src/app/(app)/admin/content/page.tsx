
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { SiteContent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
<<<<<<< HEAD
import { Loader2 } from 'lucide-react';
=======
import { Loader2, Wand2 } from 'lucide-react';
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Image from 'next/image';
import { defaultSiteContent } from '@/lib/default-content';
<<<<<<< HEAD
=======
import { generateSiteContent } from '@/ai/flows/generate-site-titles-flow';
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84


const contentSchema = z.object({
  schoolName: z.string().optional(),
  logoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  heroTitle: z.string().optional(),
  heroSubtitle: z.string().optional(),
  heroImageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  missionTitle: z.string().optional(),
  missionText1: z.string().optional(),
  missionText2: z.string().optional(),
  missionImageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  whyChooseTitle: z.string().optional(),
  feature1Title: z.string().optional(),
  feature1Text: z.string().optional(),
  feature2Title: z.string().optional(),
  feature2Text: z.string().optional(),
  feature3Title: z.string().optional(),
  feature3Text: z.string().optional(),
  academicsTitle: z.string().optional(),
  academicsText: z.string().optional(),
  academicsImageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  communityTitle: z.string().optional(),
  communityText: z.string().optional(),
  communityImageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  facebookUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  twitterUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  instagramUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  linkedinUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});


const SectionCard = ({ title, children, description }: { title: string; children: React.ReactNode; description?: string }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-xl">{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    <CardContent className="space-y-6">
      {children}
    </CardContent>
  </Card>
);

// A separate component to manage the image loading state internally
const ImagePreview = ({ url, label }: { url: string | undefined | null; label: string }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
<<<<<<< HEAD
    setHasError(false);
  }, [url]);

  // If the URL isn't a valid string or has an error, render the placeholder.
  if (!url || !url.startsWith('http') || hasError) {
    return <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted" />;
  }

  // If we reach here, 'url' is a valid string, so we can safely pass it to the Image component.
=======
    setHasError(false); // Reset error state if URL changes
  }, [url]);

  const isValidUrl = url && typeof url === 'string' && url.startsWith('http');

  if (hasError || !isValidUrl) {
    return <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted" />;
  }

  // At this point, TypeScript knows `url` is a valid string because of the `isValidUrl` check.
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
  return (
    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
      <Image
        src={url}
        alt={`${label} preview`}
        fill
        sizes="80px"
        className="object-cover"
        onError={() => {
          console.warn(`Failed to load image preview for ${label}: ${url}`);
          setHasError(true);
        }}
      />
    </div>
  );
};


// Helper component for URL-based image inputs with previews
const ImageUrlInput = ({ name, label }: { name: any; label: string }) => {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div className="flex items-center gap-4">
            <ImagePreview url={field.value} label={label} />
            <div className="flex-grow">
              <FormControl>
                <Input
                  {...field}
                  placeholder="https://example.com/image.png"
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </div>
          </div>
        </FormItem>
      )}
    />
  );
};


export default function SiteContentPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
<<<<<<< HEAD
=======
  const [isGenerating, setIsGenerating] = useState(false);
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84

  const contentDocRef = useMemoFirebase(() => doc(firestore, 'site_content', 'homepage'), [firestore]);
  const { data: contentData, isLoading } = useDoc<SiteContent>(contentDocRef);
  
  const form = useForm<z.infer<typeof contentSchema>>({
    resolver: zodResolver(contentSchema),
    defaultValues: defaultSiteContent
  });

  useEffect(() => {
    if (contentData) {
      form.reset({ ...defaultSiteContent, ...contentData });
    }
  }, [contentData, form]);

<<<<<<< HEAD
=======
  async function handleGenerateContent() {
    const schoolName = form.getValues('schoolName');
    const missionStatement = form.getValues('missionText1');

    if (!schoolName || !missionStatement) {
        toast({
            title: 'Missing Information',
            description: 'Please provide a School Name and Mission Statement to generate content.',
            variant: 'destructive',
        });
        return;
    }

    setIsGenerating(true);
    try {
        const result = await generateSiteContent({
            schoolName,
            missionStatement,
        });
        
        // Update form fields with the generated titles and text
        form.setValue('heroTitle', result.heroTitle, { shouldDirty: true });
        form.setValue('heroSubtitle', result.heroSubtitle, { shouldDirty: true });
        form.setValue('missionTitle', result.missionTitle, { shouldDirty: true });
        form.setValue('missionText1', result.missionText1, { shouldDirty: true });
        form.setValue('missionText2', result.missionText2, { shouldDirty: true });
        form.setValue('whyChooseTitle', result.whyChooseTitle, { shouldDirty: true });
        form.setValue('feature1Title', result.feature1Title, { shouldDirty: true });
        form.setValue('feature1Text', result.feature1Text, { shouldDirty: true });
        form.setValue('feature2Title', result.feature2Title, { shouldDirty: true });
        form.setValue('feature2Text', result.feature2Text, { shouldDirty: true });
        form.setValue('feature3Title', result.feature3Title, { shouldDirty: true });
        form.setValue('feature3Text', result.feature3Text, { shouldDirty: true });
        form.setValue('academicsTitle', result.academicsTitle, { shouldDirty: true });
        form.setValue('academicsText', result.academicsText, { shouldDirty: true });
        form.setValue('communityTitle', result.communityTitle, { shouldDirty: true });
        form.setValue('communityText', result.communityText, { shouldDirty: true });

        toast({
            title: 'Content Generated!',
            description: 'The suggested content has been filled into the form. Review and save.',
        });

    } catch (error) {
        console.error("Failed to generate content:", error);
        toast({
            title: 'Generation Failed',
            description: 'Could not generate content. Please try again later.',
            variant: 'destructive',
        });
    } finally {
        setIsGenerating(false);
    }
  }


>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
  async function onSubmit(values: z.infer<typeof contentSchema>) {
    setIsSubmitting(true);
    try {
        const dirtyFields = form.formState.dirtyFields;
        if (Object.keys(dirtyFields).length === 0) {
            toast({
                title: 'No Changes',
                description: 'You haven\'t made any changes to save.',
            });
            setIsSubmitting(false);
            return;
        }

<<<<<<< HEAD
        type ValuesType = z.infer<typeof contentSchema>;
        const dataToSave = Object.keys(dirtyFields).reduce((acc, key) => {
            const k = key as keyof ValuesType;
            if (k in values) {
              (acc as any)[k] = values[k];
            }
            return acc;
        }, {} as Partial<ValuesType>);


        await setDoc(contentDocRef, { ...dataToSave, updatedAt: serverTimestamp() }, { merge: true });
=======
        const dataToSave = Object.keys(dirtyFields).reduce((acc, key) => {
            acc[key] = values[key];
            return acc;
        }, {} as any);

        dataToSave.updatedAt = serverTimestamp();

        await setDoc(contentDocRef, dataToSave, { merge: true });
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
        toast({
            title: 'Content Saved',
            description: 'Your homepage content has been updated successfully.',
        });
        form.reset(values, { keepDirty: false }); // Reset dirty state after successful save
    } catch (e: any) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: contentDocRef.path,
            operation: 'write',
            requestResourceData: values,
        }));
      toast({
        title: 'Save Failed',
        description: 'Could not save content. Please check permissions.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Manage Homepage Content</h2>
            <p className="text-muted-foreground">
              Edit the text and images displayed on the public landing page.
            </p>
        </div>
<<<<<<< HEAD
=======
        <Button onClick={handleGenerateContent} variant="outline" disabled={isGenerating || isSubmitting}>
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Generate Content with AI
        </Button>
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          <SectionCard title="Site Identity">
            <FormField control={form.control} name="schoolName" render={({ field }) => (
              <FormItem><FormLabel>School Name</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
            )} />
            <ImageUrlInput name="logoUrl" label="School Logo" />
          </SectionCard>
          
          <SectionCard title="Hero Section">
            <FormField control={form.control} name="heroTitle" render={({ field }) => (
              <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="heroSubtitle" render={({ field }) => (
              <FormItem><FormLabel>Subtitle</FormLabel><FormControl><Textarea {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
            )} />
          </SectionCard>
          
          <SectionCard title="Homepage Images" description="Enter the full URL for each image.">
            <ImageUrlInput name="heroImageUrl" label="Hero Section Image" />
            <ImageUrlInput name="missionImageUrl" label="Mission Section Image" />
            <ImageUrlInput name="academicsImageUrl" label="Academics Section Image" />
            <ImageUrlInput name="communityImageUrl" label="Community Section Image" />
          </SectionCard>

          <SectionCard title="Mission Section">
             <FormField control={form.control} name="missionTitle" render={({ field }) => (
              <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="missionText1" render={({ field }) => (
              <FormItem><FormLabel>Paragraph 1</FormLabel><FormControl><Textarea {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="missionText2" render={({ field }) => (
              <FormItem><FormLabel>Paragraph 2 (Optional)</FormLabel><FormControl><Textarea {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
            )} />
          </SectionCard>

          <SectionCard title="Features ('Why Choose Us') Section">
             <FormField control={form.control} name="whyChooseTitle" render={({ field }) => (
              <FormItem><FormLabel>Section Title</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <FormField control={form.control} name="feature1Title" render={({ field }) => (
                  <FormItem><FormLabel>Feature 1 Title</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="feature1Text" render={({ field }) => (
                  <FormItem className="mt-2"><FormLabel>Feature 1 Text</FormLabel><FormControl><Textarea {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div>
                <FormField control={form.control} name="feature2Title" render={({ field }) => (
                  <FormItem><FormLabel>Feature 2 Title</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="feature2Text" render={({ field }) => (
<<<<<<< HEAD
                  <FormItem className="mt-2"><FormLabel>Feature 2 Text</FormLabel><FormControl><Textarea {...field} value={field.value || ''} /></FormControl><FormMessage /></FormMessage>
=======
                  <FormItem className="mt-2"><FormLabel>Feature 2 Text</FormLabel><FormControl><Textarea {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
                )} />
              </div>
              <div>
                <FormField control={form.control} name="feature3Title" render={({ field }) => (
                  <FormItem><FormLabel>Feature 3 Title</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="feature3Text" render={({ field }) => (
                  <FormItem className="mt-2"><FormLabel>Feature 3 Text</FormLabel><FormControl><Textarea {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Academics Section">
             <FormField control={form.control} name="academicsTitle" render={({ field }) => (
              <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="academicsText" render={({ field }) => (
<<<<<<< HEAD
              <FormItem><FormLabel>Text</FormLabel><FormControl><Textarea {...field} value={field.value || ''} /></FormControl><FormMessage /></FormMessage>
=======
              <FormItem><FormLabel>Text</FormLabel><FormControl><Textarea {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
            )} />
          </SectionCard>
          
          <SectionCard title="Community Section">
             <FormField control={form.control} name="communityTitle" render={({ field }) => (
              <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="communityText" render={({ field }) => (
<<<<<<< HEAD
              <FormItem><FormLabel>Text</FormLabel><FormControl><Textarea {...field} value={field.value || ''} /></FormControl><FormMessage /></FormMessage>
=======
              <FormItem><FormLabel>Text</FormLabel><FormControl><Textarea {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
            )} />
          </SectionCard>

          <SectionCard title="Social Media Links">
            <FormField control={form.control} name="facebookUrl" render={({ field }) => (
                <FormItem><FormLabel>Facebook URL</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="https://facebook.com/yourschool" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="twitterUrl" render={({ field }) => (
                <FormItem><FormLabel>Twitter (X) URL</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="https://twitter.com/yourschool" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="instagramUrl" render={({ field }) => (
                <FormItem><FormLabel>Instagram URL</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="https://instagram.com/yourschool" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="linkedinUrl" render={({ field }) => (
                <FormItem><FormLabel>LinkedIn URL</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="https://linkedin.com/school/yourschool" /></FormControl><FormMessage /></FormItem>
            )} />
          </SectionCard>

          <div className="flex justify-end sticky bottom-6">
             <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Content
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

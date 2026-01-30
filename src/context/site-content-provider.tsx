'use client';
import { createContext, useContext, ReactNode } from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import type { SiteContent } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { defaultSiteContent } from '@/lib/default-content';

interface SiteContentContextType {
    content: SiteContent;
    isLoading: boolean;
}

const SiteContentContext = createContext<SiteContentContextType>({
    content: defaultSiteContent,
    isLoading: true,
});

export function SiteContentProvider({ children }: { children: ReactNode }) {
    const firestore = useFirestore();
    const contentDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_content', 'homepage') : null, [firestore]);
    const { data, isLoading } = useDoc<SiteContent>(contentDocRef);
    
    // Merge fetched data with defaults to ensure all fields are present
    const content = data ? { ...defaultSiteContent, ...data } : defaultSiteContent;
    
    return (
        <SiteContentContext.Provider value={{ content, isLoading }}>
            {children}
        </SiteContentContext.Provider>
    );
}

export const useSiteContent = () => useContext(SiteContentContext);

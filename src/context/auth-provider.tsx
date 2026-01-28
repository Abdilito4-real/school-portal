
'use client';

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  signOut,
  sendPasswordResetEmail,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { useUser } from '@/firebase/provider';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isRole: (role: 'admin' | 'student') => boolean;
  sendPasswordReset: (email: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROTECTED_ROUTES = {
  admin: ['/admin'],
  student: ['/results', '/fees'],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { auth, firestore } = useFirebase();
  const { user: firebaseUser, isUserLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkUserRoleAndData = async (fbUser: import('firebase/auth').User) => {
      if (!firestore) {
        setLoading(false);
        return;
      }
      
      try {
        const adminRoleRef = doc(firestore, `roles_admin/${fbUser.uid}`);
        const adminSnap = await getDoc(adminRoleRef);

        if (adminSnap.exists()) {
          // User is an ADMIN
          const adminUser: User = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: 'Admin',
            role: 'admin',
          };
          setUser(adminUser);
        } else {
          // User is a STUDENT, fetch their profile
          const studentRef = doc(firestore, `students/${fbUser.uid}`);
          const studentSnap = await getDoc(studentRef);

          if (studentSnap.exists()) {
            const studentData = studentSnap.data();
            const studentUser: User = {
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: `${studentData.firstName} ${studentData.lastName}`,
              role: 'student',
              classId: studentData.classId,
            };
            setUser(studentUser);
          } else {
             // Fallback if student document doesn't exist
            console.warn(`No student document found for UID: ${fbUser.uid}`);
            const fallbackUser: User = {
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.email, // Fallback display name
              role: 'student',
            };
            setUser(fallbackUser);
          }
        }
      } catch (e) {
        console.error("Error fetching user role or data:", e);
        // Fallback to a basic user object on error
        const errorUser: User = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.email,
          role: 'student',
        };
        setUser(errorUser);
      } finally {
        setLoading(false);
      }
    };

    if (!isUserLoading) {
      if (firebaseUser) {
        checkUserRoleAndData(firebaseUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    }
  }, [firebaseUser, isUserLoading, firestore]);
  
  const handleRouteChange = useCallback((currentUser: User | null) => {
    if (loading) return;

    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/forgot-password');

    if (!currentUser && !isAuthRoute && pathname !== '/') {
        router.replace('/login');
        return;
    }

    if (currentUser && isAuthRoute) {
        router.replace('/dashboard');
        return;
    }
  
    if (currentUser) {
      const isAccessingAdminRoute = PROTECTED_ROUTES.admin.some(route => pathname.startsWith(route));
      if (currentUser.role !== 'admin' && isAccessingAdminRoute) {
        router.replace('/dashboard');
        return;
      }

      const isAccessingStudentRoute = PROTECTED_ROUTES.student.some(route => pathname.startsWith(route));
      if (currentUser.role !== 'student' && isAccessingStudentRoute) {
        router.replace('/dashboard');
      }
    }
  },[pathname, router, loading]);

  useEffect(() => {
    handleRouteChange(user);
  }, [user, handleRouteChange]);


  const login = async (email: string, password: string) => {
    if (!auth) throw new Error("Auth service not available");
<<<<<<< HEAD
    
    // Add a more specific check for configuration issues.
    // This provides a better error message if .env variables are missing.
    if (!auth.app.options.apiKey) {
      throw new Error("Firebase configuration is missing. Please ensure your environment variables are set correctly.");
    }

=======
>>>>>>> f3fc7ab7796ee56f68192834a35aa6e318beed84
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    if (!auth) return;
    setLoading(true);
    await signOut(auth);
    setUser(null);
    setLoading(false);
    router.push('/');
  };

  const sendPasswordReset = async (email: string) => {
    if (!auth) return;
    await sendPasswordResetEmail(auth, email);
  }

  const isRole = (role: 'admin' | 'student') => {
    if (loading || !user) return false;
    return user.role === role;
  }

  const value = { user, loading: loading || isUserLoading, login, logout, isRole, sendPasswordReset };

  if (loading || isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

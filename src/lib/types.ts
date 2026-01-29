import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  role: 'admin' | 'student';
  classId?: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  classId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface AcademicResult {
  id: string;
  studentId: string;
  term: '1st' | '2nd' | '3rd';
  year: number;
  className: string;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  comments?: string;
  position?: string;
  createdAt: Timestamp;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  term: '1st' | '2nd' | '3rd';
  session: string;
  amount: number;
  amountPaid?: number;
  balanceRemaining?: number;
  status: 'Paid' | 'Pending' | 'Partial';
  dueDate: string;
  paidDate?: string;
  createdAt: Timestamp;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: Timestamp;
  classIds: string[]; 
}

export interface Class {
  id: string;
  name: string;
  description: string;
  subjects?: string[];
}

export interface SiteContent {
  schoolName: string;
  logoUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  missionTitle: string;
  missionText1: string;
  missionText2: string;
  missionImageUrl: string;
  whyChooseTitle: string;
  feature1Title: string;
  feature1Text: string;
  feature2Title: string;
  feature2Text: string;
  feature3Title: string;
  feature3Text: string;
  academicsTitle: string;
  academicsText: string;
  academicsImageUrl: string;
  communityTitle: string;
  communityText: string;
  communityImageUrl: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
}
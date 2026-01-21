import { SiteContent } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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

export const defaultSiteContent: SiteContent = {
  schoolName: 'Campus Hub',
  logoUrl: '',
  heroTitle: 'Welcome to Campus Hub',
  heroSubtitle: 'A modern institution dedicated to fostering innovation, creativity, and academic excellence.',
  heroImageUrl: findImage('hero-campus').imageUrl,
  missionTitle: 'Our Mission',
  missionText1: 'To provide a transformative education that empowers students to become leaders, innovators, and engaged citizens. We are committed to creating a diverse and inclusive community where all members can thrive.',
  missionText2: 'Through rigorous academic programs, hands-on learning opportunities, and a supportive campus environment, we prepare our students for success in a rapidly changing world.',
  missionImageUrl: findImage('mission-students').imageUrl,
  whyChooseTitle: 'Why Choose Campus Hub?',
  feature1Title: 'World-Class Academics',
  feature1Text: 'Explore a wide range of programs taught by leading experts in their fields.',
  feature2Title: 'Vibrant Campus Life',
  feature2Text: 'Join a diverse community with hundreds of clubs, organizations, and events.',
  feature3Title: 'Career Development',
  feature3Text: 'Benefit from our strong industry connections, internships, and career services.',
  academicsTitle: 'Excellence in Academics',
  academicsText: 'Our curriculum is designed to challenge and inspire. With a focus on critical thinking and real-world application, we provide an educational experience that prepares you for what\'s next.',
  academicsImageUrl: findImage('academics-library').imageUrl,
  communityTitle: 'A Thriving Campus Community',
  communityText: 'Life at Campus Hub extends beyond the classroom. Engage in sports, arts, and culture to build lifelong friendships and develop your passions.',
  communityImageUrl: findImage('campus-life-group').imageUrl,
  facebookUrl: '#',
  twitterUrl: '#',
  instagramUrl: '#',
  linkedinUrl: '#',
};

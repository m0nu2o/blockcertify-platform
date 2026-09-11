
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return ['','/about','/features','/services','/pricing','/documentation','/verify','/login','/register','/contact','/faqs','/privacy-policy','/terms'].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
  }));
}

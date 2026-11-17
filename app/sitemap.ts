import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL || 'https://example.vercel.app';
  return ['/', '/privacy-policy', '/terms', '/refund-policy'].map((path) => ({ url: `${base}${path}`, changeFrequency: 'weekly', priority: path === '/' ? 1 : 0.5 }));
}

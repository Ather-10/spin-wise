import type { MetadataRoute } from 'next';
import { locales, abs, alternates } from '@/lib/i18n';
import { presets } from '@/lib/presets';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['', '/all-wheels', '/contact-us', '/privacy-policy', ...presets.map((p) => `/a-s/${p.slug}`)];
  return paths.flatMap((p) =>
    locales.map((l) => ({
      url: abs(l, p),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: p === '' ? 1 : p.startsWith('/a-s') ? 0.8 : 0.5,
      alternates: { languages: alternates(l, p).languages },
    }))
  );
}

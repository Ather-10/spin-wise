import type { MetadataRoute } from 'next';
import { BASE } from '@/lib/i18n';
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${BASE}/sitemap.xml` };
}

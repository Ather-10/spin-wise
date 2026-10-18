import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, alternates } from '@/lib/i18n';

type P = { params: Promise<{ lang: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: 'Contact | Spinwise', alternates: alternates(lang, '/contact-us') };
}
export default async function Page({ params }: P) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (<><h1>Contact</h1><p>Questions or feedback? Email us at hello@your-domain.com.</p></>);
}

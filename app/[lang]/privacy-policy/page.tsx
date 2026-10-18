import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, alternates } from '@/lib/i18n';

type P = { params: Promise<{ lang: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: 'Privacy | Spinwise', alternates: alternates(lang, '/privacy-policy') };
}
export default async function Page({ params }: P) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (<><h1>Privacy</h1><p>Write your privacy policy here: what data you collect (analytics, saved wheels, accounts), cookies, and how users can contact you.</p></>);
}

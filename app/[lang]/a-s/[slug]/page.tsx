import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { locales, isLocale, alternates, abs, href } from '@/lib/i18n';
import { getDict } from '@/lib/dict';
import { presets, getPreset } from '@/lib/presets';
import Wheel from '@/components/Wheel';
import AdSlot from '@/components/AdSlot';

type P = { params: Promise<{ lang: string; slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return locales.flatMap((lang) => presets.map((p) => ({ lang, slug: p.slug })));
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, slug } = await params;
  const p = getPreset(slug);
  if (!isLocale(lang) || !p) return {};
  const path = `/a-s/${slug}`;
  return {
    title: `${p.title} | Spinwise`, description: p.desc, alternates: alternates(lang, path),
    openGraph: { title: p.title, description: p.desc, url: abs(lang, path), type: 'website', siteName: 'Spinwise' },
    twitter: { card: 'summary_large_image', title: p.title, description: p.desc },
  };
}

export default async function PresetPage({ params }: P) {
  const { lang, slug } = await params;
  const p = getPreset(slug);
  if (!isLocale(lang) || !p) notFound();
  const d = getDict(lang);
  const ld = { '@context': 'https://schema.org', '@type': 'WebApplication', name: p.title, url: abs(lang, `/a-s/${slug}`), applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any' };
  return (
    <>
      <Wheel
        initial={p.entries}
        lead={<><h1>{p.title}</h1><p className="muted">{p.desc}</p><AdSlot id="preset-left" size="rect" /></>}
      />
      <AdSlot id="preset-bottom" size="leader" />
      <h2>{d.presets}</h2>
      <ul className="grid">
        {presets.filter((x) => x.slug !== slug).map((x) => <li key={x.slug}><Link href={href(lang, `/a-s/${x.slug}`)}>{x.name}</Link></li>)}
      </ul>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </>
  );
}

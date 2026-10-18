import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, alternates, abs, href } from '@/lib/i18n';
import { getDict } from '@/lib/dict';
import { presets } from '@/lib/presets';
import Wheel from '@/components/Wheel';

type P = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const d = getDict(lang);
  return {
    title: d.metaTitle, description: d.metaDesc, alternates: alternates(lang),
    openGraph: { title: d.metaTitle, description: d.metaDesc, url: abs(lang), type: 'website', siteName: 'Spinwise' },
    twitter: { card: 'summary_large_image', title: d.metaTitle, description: d.metaDesc },
  };
}

export default async function Home({ params }: P) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const d = getDict(lang);
  const ld = [
    { '@context': 'https://schema.org', '@type': 'WebApplication', name: d.h1, url: abs(lang), applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: d.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ];
  return (
    <>
      <h1>{d.h1}</h1>
      <p className="muted">{d.intro}</p>
      <Wheel initial={['Pizza', 'Burger', 'Sushi', 'Tacos', 'Salad', 'Pasta']} />
      <h2>{d.how}</h2>
      <ol>{d.steps.map((s) => <li key={s}>{s}</li>)}</ol>
      <h2>{d.presets}</h2>
      <ul className="grid">
        {presets.map((p) => <li key={p.slug}><Link href={href(lang, `/a-s/${p.slug}`)}>{p.name}</Link></li>)}
      </ul>
      <h2>{d.faqTitle}</h2>
      {d.faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </>
  );
}

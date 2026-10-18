import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, alternates, href } from '@/lib/i18n';
import { getDict } from '@/lib/dict';
import { presets } from '@/lib/presets';

type P = { params: Promise<{ lang: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: `${getDict(lang).all} | Spinwise`, description: 'Browse every ready-made wheel: animals, countries, food, movies and more.', alternates: alternates(lang, '/all-wheels') };
}
export default async function AllWheels({ params }: P) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <>
      <h1>{getDict(lang).all}</h1>
      <ul className="grid">
        {presets.map((p) => <li key={p.slug}><Link href={href(lang, `/a-s/${p.slug}`)}>{p.name}<br /><small className="muted">{p.desc}</small></Link></li>)}
      </ul>
    </>
  );
}

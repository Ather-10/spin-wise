import Link from 'next/link';
import { Locale, locales, langNames, href } from '@/lib/i18n';
import { getUI } from '@/lib/ui';
import { presets } from '@/lib/presets';

export default function Footer({ lang }: { lang: Locale }) {
  const t = getUI(lang);
  return (
    <footer className="foot">
      <div className="fcols">
        <div>
          <p className="logo">🎡 Spinwise</p>
          <p className="muted">{t.aboutText}</p>
        </div>
        <nav aria-label={t.popular}>
          <h3>{t.popular}</h3>
          <ul>{presets.slice(0, 6).map((p) => <li key={p.slug}><Link href={href(lang, `/a-s/${p.slug}`)}>{p.name}</Link></li>)}</ul>
        </nav>
        <nav aria-label={t.company}>
          <h3>{t.company}</h3>
          <ul>
            <li><Link href={href(lang, '/all-wheels')}>{t.all}</Link></li>
            <li><Link href={href(lang, '/contact-us')}>{t.contact}</Link></li>
            <li><Link href={href(lang, '/privacy-policy')}>{t.privacy}</Link></li>
          </ul>
        </nav>
        <nav aria-label={t.languages} className="fl">
          <h3>{t.languages}</h3>
          <ul className="inl">{locales.map((l) => <li key={l}><Link href={href(l)} hrefLang={l}>{langNames[l]}</Link></li>)}</ul>
        </nav>
      </div>
      <p className="copy">© {new Date().getFullYear()} Spinwise. {t.rights}</p>
    </footer>
  );
}

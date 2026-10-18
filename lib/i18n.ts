export const locales = ['en','cs','da','de','el','nl','hu','id','it','ja','es','pl','pt','ro','ru','sk','sv','th','tr','uk','vi','ar','zh-Hant'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
export const isLocale = (s: string): s is Locale => (locales as readonly string[]).includes(s);
export const dir = (l: Locale) => (l === 'ar' ? 'rtl' : 'ltr');
export const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

// Local keyword for each language: use these in the H1/title of that language's home page.
export const langNames: Record<Locale, string> = {
  en: 'English', cs: 'Čeština', da: 'Dansk', de: 'Deutsch', el: 'Ελληνικά', nl: 'Nederlands', hu: 'Magyar',
  id: 'Indonesia', it: 'Italiano', ja: '日本語', es: 'Español', pl: 'Polski', pt: 'Português', ro: 'Română',
  ru: 'Русский', sk: 'Slovenčina', sv: 'Svenska', th: 'ไทย', tr: 'Türkçe', uk: 'Українська', vi: 'Tiếng Việt',
  ar: 'العربية', 'zh-Hant': '繁體中文',
};

// Relative link (English has no prefix)
export const href = (l: Locale, path = '') => (l === 'en' ? path || '/' : `/${l}${path}`);
// Absolute URL (canonical / sitemap)
export const abs = (l: Locale, path = '') => `${BASE}${l === 'en' ? path : `/${l}${path}`}`;

export function alternates(l: Locale, path = '') {
  const languages: Record<string, string> = Object.fromEntries(locales.map((x) => [x, abs(x, path)]));
  languages['x-default'] = abs('en', path);
  return { canonical: abs(l, path), languages };
}

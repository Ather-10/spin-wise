import type { Locale } from './i18n';

export type Dict = {
  metaTitle: string; metaDesc: string; h1: string; intro: string;
  spin: string; hint: string; winner: string; close: string; remove: string;
  presets: string; all: string; contact: string; privacy: string; faqTitle: string;
  how: string; steps: string[]; faq: { q: string; a: string }[];
};

const en: Dict = {
  metaTitle: 'Spin the Wheel – Free Random Wheel Spinner',
  metaDesc: 'Add your own choices and spin the wheel to pick a random winner. Free online wheel spinner for giveaways, classrooms, games and decisions.',
  h1: 'Spin the Wheel',
  intro: 'A free random wheel spinner. Type your choices, spin, and get a fair result in seconds.',
  spin: 'Spin', hint: 'One entry per line (2 to 200).', winner: 'The wheel picked', close: 'Close',
  remove: 'Remove winner after closing',
  presets: 'Popular wheels', all: 'All wheels', contact: 'Contact us', privacy: 'Privacy policy',
  faqTitle: 'Frequently asked questions', how: 'How to use the wheel',
  steps: ['Type your entries in the box, one per line.', 'Click the wheel or the Spin button.', 'The wheel stops on one random result.', 'Close the popup or remove the winner and spin again.'],
  faq: [
    { q: 'Are the results random?', a: 'Yes. Each spin is independent and has no fixed pattern.' },
    { q: 'How many entries can I add?', a: 'Up to 200 entries on one wheel.' },
    { q: 'Is it free?', a: 'Yes, the wheel is free to use.' },
  ],
};

const es: Dict = {
  ...en,
  metaTitle: 'Ruleta Aleatoria – Gira la ruleta online gratis',
  metaDesc: 'Escribe tus opciones y gira la ruleta para elegir un ganador al azar. Ruleta online gratis para sorteos, clases y decisiones.',
  h1: 'Ruleta Aleatoria',
  intro: 'Una ruleta aleatoria gratis. Escribe tus opciones, gira y obtén un resultado justo.',
  spin: 'Girar', hint: 'Una opción por línea (de 2 a 200).', winner: 'La ruleta eligió', close: 'Cerrar',
  presets: 'Ruletas populares', all: 'Todas las ruletas', contact: 'Contacto', privacy: 'Política de privacidad',
  faqTitle: 'Preguntas frecuentes', how: 'Cómo usar la ruleta',
};

// Add more languages here. Missing ones fall back to English.
const dicts: Partial<Record<Locale, Dict>> = { en, es };
export const getDict = (l: Locale): Dict => dicts[l] ?? en;

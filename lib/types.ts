export type Entry = { t: string; w: number; c: string; img?: string; hide?: boolean };
export type Settings = {
  time: number; idle: number; sound: boolean; vol: number; winSound: boolean; conf: boolean; pop: boolean; popMsg: string;
  rem: boolean; out: boolean; title: string; desc: string; showTitle: boolean;
  bg: string; center: string; centerSize: 'sm' | 'md' | 'lg';
};
export type SavedWheel = { id: string; name: string; entries: Entry[]; settings: Settings; updatedAt: number };
export type User = { id: number; email: string; name: string };
export const PAL = ['#ff5a36', '#ffc83d', '#1fb5a6', '#3a7bff', '#b5179e', '#7cc41f', '#ef476f', '#7b5cff'];
export const defaultSettings: Settings = {
  time: 6, idle: 2, sound: true, vol: 0.5, winSound: true, conf: true, pop: true, popMsg: '', rem: false, out: true,
  title: '', desc: '', showTitle: true, bg: '', center: '', centerSize: 'md',
};

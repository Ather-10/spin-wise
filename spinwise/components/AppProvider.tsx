'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Locale, href, isLocale } from '@/lib/i18n';
import { getUI, UI } from '@/lib/ui';
import { loadGuest, saveGuest } from '@/lib/guest';
import type { SavedWheel, User } from '@/lib/types';
import AuthModal from './AuthModal';

type Ctx = {
  lang: Locale; t: UI; user: User | null; wheels: SavedWheel[]; active: SavedWheel | null;
  authOpen: boolean; setAuthOpen: (v: boolean) => void;
  theme: 'light' | 'dark'; toggleTheme: () => void;
  openWheel: (w: SavedWheel) => void; saveWheel: (w: SavedWheel) => Promise<void>; deleteWheel: (id: string) => Promise<void>;
  auth: (mode: 'login' | 'signup', f: { email: string; password: string; name?: string }) => Promise<string | null>;
  logout: () => Promise<void>;
};
const C = createContext<Ctx | null>(null);
export const useApp = () => { const c = useContext(C); if (!c) throw new Error('AppProvider missing'); return c; };

const upsert = (list: SavedWheel[], w: SavedWheel) => [w, ...list.filter((x) => x.id !== w.id)];

export function AppProvider({ lang, children }: { lang: Locale; children: React.ReactNode }) {
  const t = getUI(lang);
  const router = useRouter();
  const path = usePathname() || '/';
  const [user, setUser] = useState<User | null>(null);
  const [wheels, setWheels] = useState<SavedWheel[]>([]);
  const [active, setActive] = useState<SavedWheel | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => { setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'); }, []);
  const toggleTheme = () => {
    const n = theme === 'dark' ? 'light' : 'dark';
    setTheme(n); document.documentElement.dataset.theme = n;
    try { localStorage.setItem('sw.theme', n); } catch {}
  };

  const refresh = useCallback(async () => {
    try {
      const me = await (await fetch('/api/auth/me')).json();
      if (me.user) {
        setUser(me.user);
        const w = await (await fetch('/api/wheels')).json();
        setWheels(w.wheels ?? []);
        return;
      }
    } catch {}
    setUser(null); setWheels(loadGuest());
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const openWheel = (w: SavedWheel) => {
    const fresh = { ...w, updatedAt: Date.now() }; // opening a guest wheel renews its 7 days
    if (!user) { const l = upsert(wheels, fresh); setWheels(l); saveGuest(l); }
    setActive(fresh);
    const seg = path.split('/')[1];
    const rest = isLocale(seg) ? path.slice(seg.length + 1) : path;
    if (rest && rest !== '/') router.push(href(lang));
  };

  const saveWheel = async (w: SavedWheel) => {
    if (user) {
      const r = await fetch('/api/wheels', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wheel: w }) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Could not save');
      setWheels((l) => upsert(l, w));
    } else {
      const l = upsert(wheels, w);
      if (!saveGuest(l)) throw new Error(t.storageFull);
      setWheels(l);
    }
  };

  const deleteWheel = async (id: string) => {
    if (user) await fetch('/api/wheels/' + id, { method: 'DELETE' });
    const l = wheels.filter((w) => w.id !== id);
    setWheels(l);
    if (!user) saveGuest(l);
  };

  const auth: Ctx['auth'] = async (mode, f) => {
    try {
      const r = await fetch('/api/auth/' + mode, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      const j = await r.json();
      if (!r.ok) return j.error || 'Something went wrong.';
      const g = loadGuest(); // move guest wheels into the account
      if (g.length) { await fetch('/api/wheels', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wheels: g }) }); saveGuest([]); }
      await refresh(); setAuthOpen(false);
      return null;
    } catch { return 'Network error. Try again.'; }
  };

  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); setUser(null); setActive(null); setWheels(loadGuest()); };

  return (
    <C.Provider value={{ lang, t, user, wheels, active, authOpen, setAuthOpen, theme, toggleTheme, openWheel, saveWheel, deleteWheel, auth, logout }}>
      {children}
      {authOpen && <AuthModal />}
    </C.Provider>
  );
}

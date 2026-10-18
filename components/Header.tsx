'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { locales, langNames, href, isLocale } from '@/lib/i18n';
import { presets } from '@/lib/presets';
import { useApp } from './AppProvider';

export default function Header() {
  const { lang, t, user, wheels, openWheel, deleteWheel, logout, setAuthOpen, theme, toggleTheme } = useApp();
  const path = usePathname() || '/';
  const [menu, setMenu] = useState<null | 'wheels' | 'popular' | 'lang' | 'user'>(null);
  const [drawer, setDrawer] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setDrawer(false); setMenu(null); }, [path]);
  useEffect(() => {
    const off = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setMenu(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMenu(null); setDrawer(false); } };
    document.addEventListener('mousedown', off); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc); };
  }, []);
  useEffect(() => { document.body.style.overflow = drawer ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [drawer]);

  const seg = path.split('/')[1];
  const rest = (isLocale(seg) ? path.slice(seg.length + 1) : path).replace(/^\/$/, '');
  const toggle = (m: 'wheels' | 'popular' | 'lang' | 'user') => setMenu(menu === m ? null : m);
  const themeBtn = theme === 'dark' ? '☀️' : '🌙';
  const themeLabel = theme === 'dark' ? t.light : t.dark;

  const WheelList = ({ done }: { done: () => void }) => (
    <>
      {wheels.length === 0 && <p className="muted pad">{t.noWheels}</p>}
      {wheels.map((w) => (
        <div className="mrow" key={w.id}>
          <button className="mname" onClick={() => { openWheel(w); done(); }} title={t.open}>{w.name}</button>
          <button className="x" aria-label={`${t.del} ${w.name}`} onClick={() => deleteWheel(w.id)}>×</button>
        </div>
      ))}
      {!user && <p className="muted pad small">{t.guestNote}</p>}
    </>
  );
  const LangList = ({ done }: { done: () => void }) => (
    <>{locales.map((l) => <Link key={l} href={href(l, rest)} hrefLang={l} onClick={done} className={l === lang ? 'on' : ''}>{langNames[l]}</Link>)}</>
  );

  const link = { display: 'block', textDecoration: 'none' } as const;
  const PopularList = ({ done }: { done: () => void }) => (
    <>
      {presets.map((p) => (
        <Link key={p.slug} href={href(lang, `/a-s/${p.slug}`)} className="mname" style={link} onClick={done}>{p.name}</Link>
      ))}
      <Link href={href(lang, '/all-wheels')} className="mname" style={{ ...link, fontWeight: 800 }} onClick={done}>{t.all} →</Link>
    </>
  );

  return (
    <header className="top">
      <Link href={href(lang)} className="logo">🎡 Spinwise</Link>

      {/* Desktop / tablet */}
      <div className="right" ref={ref}>
        <div className="dd">
          <button className="ddbtn" aria-expanded={menu === 'wheels'} onClick={() => toggle('wheels')}>{t.myWheels} ({wheels.length}) ▾</button>
          {menu === 'wheels' && <div className="menu wide"><WheelList done={() => setMenu(null)} /></div>}
        </div>
        <div className="dd">
          <button className="ddbtn" aria-expanded={menu === 'popular'} onClick={() => toggle('popular')}>{t.popular} ▾</button>
          {menu === 'popular' && <div className="menu wide"><PopularList done={() => setMenu(null)} /></div>}
        </div>
        <div className="dd">
          <button className="ddbtn" aria-expanded={menu === 'lang'} aria-label={t.language} onClick={() => toggle('lang')}>🌐 {langNames[lang]} ▾</button>
          {menu === 'lang' && <div className="menu langs2"><LangList done={() => setMenu(null)} /></div>}
        </div>
        <button className="ddbtn icon" onClick={toggleTheme} aria-label={themeLabel} title={themeLabel}>{themeBtn}</button>
        {user ? (
          <div className="dd">
            <button className="ddbtn solid" aria-expanded={menu === 'user'} onClick={() => toggle('user')}>{user.name} ▾</button>
            {menu === 'user' && <div className="menu"><p className="muted pad small">{user.email}</p><button className="mname" onClick={() => { logout(); setMenu(null); }}>{t.logout}</button></div>}
          </div>
        ) : (
          <button className="ddbtn solid" onClick={() => setAuthOpen(true)}>{t.login} / {t.signup}</button>
        )}
      </div>

      {/* Mobile: hamburger + 85% slide-in drawer */}
      <button className="burger" aria-label={t.menu} aria-expanded={drawer} aria-controls="drawer" onClick={() => setDrawer(true)}>
        <span /><span /><span />
      </button>
      <div className={'scrim' + (drawer ? ' on' : '')} onClick={() => setDrawer(false)} aria-hidden="true" />
      <aside id="drawer" className={'drawer' + (drawer ? ' on' : '')} aria-label={t.menu} inert={!drawer}>
        <div className="dhead">
          <span className="logo">🎡 Spinwise</span>
          <button className="x" aria-label={t.closeMenu} onClick={() => setDrawer(false)}>×</button>
        </div>
        <div className="dbody">
          <section>
            {user ? (
              <>
                <p className="dname">{user.name}</p><p className="muted small nm">{user.email}</p>
                <button className="btn ghost full" onClick={() => { logout(); setDrawer(false); }}>{t.logout}</button>
              </>
            ) : (
              <button className="btn full" onClick={() => { setDrawer(false); setAuthOpen(true); }}>{t.login} / {t.signup}</button>
            )}
          </section>
          <section>
            <button className="trow" onClick={toggleTheme}><span>{t.theme}</span><b>{themeBtn} {themeLabel}</b></button>
          </section>
          <section>
            <h3>{t.myWheels} ({wheels.length})</h3>
            <WheelList done={() => setDrawer(false)} />
          </section>
          <section>
            <h3>{t.popular}</h3>
            <PopularList done={() => setDrawer(false)} />
          </section>
          <section>
            <h3>{t.language}</h3>
            <div className="dlangs"><LangList done={() => setDrawer(false)} /></div>
          </section>
        </div>
      </aside>
    </header>
  );
}

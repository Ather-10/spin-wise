'use client';
import { useEffect, useRef, useState } from 'react';
import { useApp } from './AppProvider';
import { Entry, PAL, Settings, defaultSettings } from '@/lib/types';
import { readImage } from '@/lib/img';

const TAU = Math.PI * 2;
const HUB = { sm: 0.09, md: 0.15, lg: 0.23 };
type Res = { t: string; img?: string };
const toEntries = (lines: string[]): Entry[] => lines.map((t, i) => ({ t, w: 1, c: PAL[i % PAL.length] }));
// Keep weight/color by line position; keep image / hidden flag only while the text is unchanged.
const parse = (raw: string, old: Entry[]): Entry[] =>
  raw.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 200).map((t, i) => {
    const o = old[i]; const same = o && o.t === t;
    return { t, w: o?.w ?? 1, c: o?.c ?? PAL[i % PAL.length], ...(same && o.img ? { img: o.img } : {}), ...(same && o.hide ? { hide: true } : {}) };
  });

const Crown = () => (
  <svg viewBox="0 0 120 72" width="120" height="72" aria-hidden="true">
    <defs><linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe27a" /><stop offset="1" stopColor="#d9941e" /></linearGradient></defs>
    <path d="M8 56 L3 16 L33 37 L60 6 L87 37 L117 16 L112 56 Z" fill="url(#gold)" stroke="#a8680f" strokeWidth="3" strokeLinejoin="round" />
    <rect x="8" y="56" width="104" height="10" rx="3" fill="#d9941e" stroke="#a8680f" strokeWidth="3" />
    <circle cx="60" cy="7" r="5" fill="#ffd35c" stroke="#a8680f" strokeWidth="2" />
    <circle cx="3" cy="16" r="5" fill="#ffd35c" stroke="#a8680f" strokeWidth="2" />
    <circle cx="117" cy="16" r="5" fill="#ffd35c" stroke="#a8680f" strokeWidth="2" />
  </svg>
);

export default function Wheel({ initial }: { initial: string[] }) {
  const { t, active, saveWheel } = useApp();
  const [entries, setEntries] = useState<Entry[]>(() => toEntries(initial));
  const [raw, setRaw] = useState(initial.join('\n'));
  const [S, setS] = useState<Settings>(defaultSettings);
  const [tab, setTab] = useState<'e' | 'r' | 'a' | 's'>('e');
  const [st, setSt] = useState<'t' | 'd' | 'a' | 'p'>('t');
  const [wid, setWid] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [winner, setWinner] = useState<number | null>(null); // index into entries
  const [results, setResults] = useState<Res[]>([]);
  const [hideList, setHideList] = useState(false);
  const [busy, setBusy] = useState(false);
  const [imgMenu, setImgMenu] = useState(false);
  const cv = useRef<HTMLCanvasElement>(null);
  const fx = useRef<HTMLCanvasElement>(null);
  const rot = useRef(0);
  const audio = useRef<AudioContext | null>(null);
  const imgs = useRef(new Map<string, HTMLImageElement>());
  const menuRef = useRef<HTMLDivElement>(null);
  const entryIn = useRef<HTMLInputElement>(null);
  const bgIn = useRef<HTMLInputElement>(null);
  const centerIn = useRef<HTMLInputElement>(null);
  const rowIn = useRef<HTMLInputElement>(null);
  const rowFor = useRef(0);
  const drawRef = useRef<() => void>(() => {});
  const again = useRef(false);
  const pauseUntil = useRef(0);

  const setList = (l: Entry[]) => { setEntries(l); setRaw(l.map((e) => e.t).join('\n')); };
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((s) => ({ ...s, [k]: v }));

  useEffect(() => { // a wheel was opened from the "My Wheels" menu
    if (!active) return;
    setList(active.entries); setS({ ...defaultSettings, ...active.settings }); setWid(active.id); setMsg(''); setResults([]);
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const off = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setImgMenu(false); };
    document.addEventListener('mousedown', off);
    return () => document.removeEventListener('mousedown', off);
  }, []);

  // Only visible (not hidden) slices are drawn and can win
  const visIdx = entries.map((_, i) => i).filter((i) => !entries[i].hide);
  const vis = visIdx.map((i) => entries[i]);
  const total = vis.reduce((a, e) => a + e.w, 0);
  const hiddenCount = entries.length - vis.length;

  const getImg = (src: string) => {
    let im = imgs.current.get(src);
    if (!im) { im = new Image(); im.onload = () => drawRef.current(); im.src = src; imgs.current.set(src, im); }
    return im.complete && im.naturalWidth ? im : null;
  };
  const cover = (x: CanvasRenderingContext2D, im: HTMLImageElement, cx: number, cy: number, d: number) => {
    const k = d / Math.min(im.naturalWidth, im.naturalHeight);
    const w = im.naturalWidth * k, h = im.naturalHeight * k;
    x.drawImage(im, cx - w / 2, cy - h / 2, w, h);
  };

  const draw = () => {
    const c = cv.current; const x = c?.getContext('2d');
    if (!c || !x) return;
    const W = c.width, R = W / 2;
    x.clearRect(0, 0, W, W);
    if (!vis.length) return;
    const bgI = S.bg ? getImg(S.bg) : null;
    if (bgI) { x.save(); x.beginPath(); x.arc(R, R, R - 8, 0, TAU); x.clip(); cover(x, bgI, R, R, W); x.restore(); }
    let a = rot.current;
    vis.forEach((e) => {
      const sw = (e.w / total) * TAU;
      x.beginPath(); x.moveTo(R, R); x.arc(R, R, R - 8, a, a + sw); x.closePath();
      x.globalAlpha = bgI ? 0.6 : 1; x.fillStyle = e.c; x.fill(); x.globalAlpha = 1;
      if (S.out) { x.lineWidth = 3; x.strokeStyle = 'rgba(255,255,255,.85)'; x.stroke(); }
      x.save(); x.translate(R, R); x.rotate(a + sw / 2);
      const im = e.img ? getImg(e.img) : null;
      if (e.img) {
        if (im) {
          const rad = R * 0.66, maxW = 2 * rad * Math.sin(Math.min(sw, Math.PI) / 2) * 0.8;
          const size = Math.max(24, Math.min(R * 0.32, maxW));
          const k = Math.min(size / im.naturalWidth, size / im.naturalHeight);
          const dw = im.naturalWidth * k, dh = im.naturalHeight * k;
          x.translate(rad, 0); x.rotate(Math.PI / 2); x.drawImage(im, -dw / 2, -dh / 2, dw, dh);
        }
      } else {
        x.font = `700 ${Math.max(16, Math.min(46, sw * R * 0.4))}px sans-serif`;
        x.textAlign = 'right'; x.textBaseline = 'middle';
        const n = parseInt(e.c.slice(1), 16);
        const lum = (n >> 16) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11;
        x.fillStyle = lum > 150 ? '#1d1a33' : '#fff';
        let s = e.t;
        while (s.length > 1 && x.measureText(s).width > R * 0.66) s = s.slice(0, -1);
        x.fillText(s === e.t ? s : s + '…', R - 30, 0);
      }
      x.restore(); a += sw;
    });
    const hr = R * HUB[S.centerSize];
    const cI = S.center ? getImg(S.center) : null;
    x.save(); x.beginPath(); x.arc(R, R, hr, 0, TAU); x.fillStyle = '#fff'; x.fill();
    if (cI) { x.clip(); cover(x, cI, R, R, hr * 2); }
    x.restore();
    x.beginPath(); x.arc(R, R, hr, 0, TAU); x.lineWidth = 6; x.strokeStyle = '#1d1a33'; x.stroke();
    x.beginPath(); x.arc(R, R, R - 6, 0, TAU); x.lineWidth = 12; x.stroke();
  };
  drawRef.current = draw;
  // Idle rotation: the wheel keeps turning slowly by itself (speed 1 = 6 deg/s, 2 = 12 deg/s ...).
  // It pauses while spinning, while the winner popup is open and for a few seconds after a result.
  useEffect(() => {
    if (busy || winner !== null || S.idle <= 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0, last = performance.now();
    const f = (now: number) => {
      const dt = now - last;
      if (now < pauseUntil.current) last = now;
      else if (dt >= 33) { rot.current += ((S.idle * 6 * Math.PI) / 180) * (dt / 1000); last = now; drawRef.current(); }
      raf = requestAnimationFrame(f);
    };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, [busy, winner, S.idle]);
  useEffect(() => { draw(); }, [entries, S.out, S.bg, S.center, S.centerSize]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- sound ----------
  const ac = () => {
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      audio.current = audio.current ?? new AC();
      if (audio.current.state === 'suspended') audio.current.resume();
      return audio.current;
    } catch { return null; }
  };
  const tick = () => {
    if (!S.sound || S.vol <= 0) return;
    const a = ac(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'square'; o.frequency.value = 620; g.gain.value = 0.08 * S.vol;
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.05);
    o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 0.06);
  };
  // 4 seconds of synthesized applause: many random short noise bursts, loud in the middle, fading out
  const applause = () => {
    if (!S.winSound || S.vol <= 0) return;
    const a = ac(); if (!a) return;
    const dur = 4, sr = a.sampleRate, buf = a.createBuffer(1, Math.floor(sr * dur), sr), d = buf.getChannelData(0);
    for (let n = 0; n < 340; n++) {
      const st = Math.random() * (dur - 0.1);
      const env = Math.min(1, st / 0.35) * Math.min(1, (dur - st) / 1.3);
      const len = Math.floor(sr * (0.008 + Math.random() * 0.03)), amp = (0.3 + Math.random() * 0.7) * env, s0 = Math.floor(st * sr);
      for (let k = 0; k < len && s0 + k < d.length; k++) d[s0 + k] += (Math.random() * 2 - 1) * amp * Math.exp(-k / (len * 0.3));
    }
    let m = 0; for (let i = 0; i < d.length; i++) m = Math.max(m, Math.abs(d[i]));
    if (m > 0) for (let i = 0; i < d.length; i++) d[i] /= m;
    const src = a.createBufferSource(); src.buffer = buf;
    const hp = a.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 600;
    const pk = a.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 2200; pk.gain.value = 6;
    const g = a.createGain(); g.gain.value = Math.min(1, S.vol * 1.4);
    src.connect(hp); hp.connect(pk); pk.connect(g); g.connect(a.destination); src.start();
  };

  const confetti = () => {
    const c = fx.current, x = c?.getContext('2d');
    if (!c || !x) return;
    c.width = innerWidth; c.height = innerHeight;
    const ps = Array.from({ length: 140 }, (_, i) => ({ x: innerWidth / 2, y: innerHeight * 0.45, vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 16 - 4, s: 5 + Math.random() * 7, c: PAL[i % PAL.length], r: Math.random() * 6 }));
    let n = 0;
    const f = () => {
      x.clearRect(0, 0, c.width, c.height);
      ps.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += 0.35; p.r += 0.2; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); x.restore(); });
      if (++n < 130) requestAnimationFrame(f); else x.clearRect(0, 0, c.width, c.height);
    };
    f();
  };

  const idxAt = (r: number) => {
    const p = (((-Math.PI / 2 - r) % TAU) + TAU) % TAU; let acc = 0;
    for (let i = 0; i < vis.length; i++) { acc += (vis[i].w / total) * TAU; if (p < acc) return i; }
    return vis.length - 1;
  };
  const removeAt = (i: number) => setList(entries.filter((_, k) => k !== i));

  const spin = () => {
    if (busy) return;
    if (vis.length < 2) { setMsg(t.minTwo); return; }
    setMsg(''); setBusy(true); ac(); // unlock audio inside the click
    let pick = Math.random() * total, win = 0, before = 0;
    for (let i = 0; i < vis.length; i++) { if (pick < vis[i].w) { win = i; break; } pick -= vis[i].w; }
    for (let i = 0; i < win; i++) before += vis[i].w;
    const theta = ((before + vis[win].w * (0.12 + Math.random() * 0.76)) / total) * TAU;
    const need = (((-Math.PI / 2 - theta - rot.current) % TAU) + TAU) % TAU;
    const start = rot.current, end = start + TAU * (5 + Math.floor(S.time / 2)) + need, dur = S.time * 1000, t0 = performance.now();
    const orig = visIdx[win], won = vis[win];
    let last = idxAt(start);
    const frame = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      rot.current = start + (end - start) * (1 - Math.pow(1 - p, 4));
      draw();
      const k = idxAt(rot.current); if (k !== last) { last = k; tick(); }
      if (p < 1) requestAnimationFrame(frame);
      else {
        setBusy(false); pauseUntil.current = performance.now() + 4500; applause();
        if (S.conf) confetti();
        setResults((r) => [{ t: won.t, img: won.img }, ...r]);
        if (S.pop) setWinner(orig); else if (S.rem) setTimeout(() => removeAt(orig), 2500);
      }
    };
    requestAnimationFrame(frame);
  };

  // ---------- winner popup actions ----------
  const finish = (action: 'close' | 'hide' | 'remove' | 'again') => {
    if (winner === null) return;
    if (action === 'hide') setEntries(entries.map((e, i) => (i === winner ? { ...e, hide: true } : e)));
    else if (action === 'remove' || S.rem) removeAt(winner);
    if (action === 'again') again.current = true;
    setWinner(null);
  };
  useEffect(() => { // "Play Again": spin once the popup has closed and state is updated
    if (again.current && winner === null) { again.current = false; spin(); }
  }, [winner, entries]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (winner === null) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && finish('close');
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const download = () => {
    if (winner === null) return;
    const e = entries[winner];
    const c = document.createElement('canvas'); c.width = 900; c.height = 560;
    const x = c.getContext('2d'); if (!x) return;
    x.fillStyle = '#fff'; x.fillRect(0, 0, 900, 560);
    x.fillStyle = '#faf0e3'; x.fillRect(0, 0, 900, 90);
    x.fillStyle = '#1d1a33'; x.font = '900 50px sans-serif'; x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    x.fillText((S.popMsg || t.winnerTitle).toUpperCase(), 32, 64);
    x.textAlign = 'center'; x.font = '90px serif'; x.fillText('👑', 450, 200);
    x.strokeStyle = '#e6dcc9'; x.lineWidth = 3; x.strokeRect(40, 230, 820, 290);
    const im = e.img ? getImg(e.img) : null;
    let ty = 400;
    if (im) { const k = Math.min(150 / im.naturalWidth, 150 / im.naturalHeight); x.drawImage(im, 450 - (im.naturalWidth * k) / 2, 245, im.naturalWidth * k, im.naturalHeight * k); ty = 470; }
    x.fillStyle = '#1d1a33'; x.font = '800 64px sans-serif';
    let s = e.t; while (s.length > 1 && x.measureText(s).width > 760) s = s.slice(0, -1);
    x.fillText(s === e.t ? s : s + '…', 450, ty);
    c.toBlob((b) => {
      if (!b) return;
      const u = URL.createObjectURL(b), a = document.createElement('a');
      a.href = u; a.download = 'winner.png'; a.click(); setTimeout(() => URL.revokeObjectURL(u), 1000);
    });
  };

  const save = async () => {
    const id = wid ?? (crypto.randomUUID?.() ?? 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
    const w = { id, name: S.title.trim() || 'My wheel', entries, settings: S, updatedAt: Date.now() };
    if (JSON.stringify(w).length > 3_000_000) { setMsg(t.tooBig); return; }
    try { await saveWheel(w); setWid(id); setMsg(t.saved); setTimeout(() => setMsg(''), 2500); }
    catch (e: any) { setMsg(e.message); }
  };

  const shuffle = () => { const l = [...entries]; for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } setList(l); };
  const sortAZ = () => setList([...entries].sort((a, b) => a.t.localeCompare(b.t, undefined, { numeric: true })));
  const upd = (i: number, p: Partial<Entry>) => setEntries((l) => l.map((e, k) => (k === i ? { ...e, ...p } : e)));

  const pick = async (files: FileList | null, kind: 'entry' | 'bg' | 'center' | 'row') => {
    if (!files?.length) return;
    setMsg('');
    try {
      if (kind === 'entry') {
        const add: Entry[] = [];
        for (const f of Array.from(files).slice(0, 50)) {
          add.push({ t: f.name.replace(/\.[^.]+$/, '').slice(0, 60) || t.newEntry, w: 1, c: PAL[(entries.length + add.length) % PAL.length], img: await readImage(f, 160, 'alpha') });
        }
        setList([...entries, ...add].slice(0, 200));
      } else if (kind === 'bg') set('bg', await readImage(files[0], 1040, 'photo'));
      else if (kind === 'center') set('center', await readImage(files[0], 256, 'alpha'));
      else upd(rowFor.current, { img: await readImage(files[0], 160, 'alpha') });
    } catch { setMsg(t.imgFail); }
  };
  const fileProps = (kind: 'entry' | 'bg' | 'center' | 'row') => ({
    type: 'file' as const, accept: 'image/*', hidden: true, multiple: kind === 'entry',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => { pick(e.target.files, kind); e.target.value = ''; },
  });
  const tog = (k: 'sound' | 'winSound' | 'conf' | 'pop' | 'rem' | 'out' | 'showTitle') => (
    <input type="checkbox" checked={S[k]} onChange={(e) => set(k, e.target.checked)} />
  );
  const hideBox = (
    <label className="hidechk"><input type="checkbox" checked={hideList} onChange={(e) => setHideList(e.target.checked)} /> {t.hide}</label>
  );

  return (
    <div className="tool">
      <div className="box stage">
        {S.showTitle && S.title && (
          <div className="wtitle"><h2>{S.title}</h2>{S.desc && <p className="muted">{S.desc}</p>}</div>
        )}
        <div className="wheelbox">
          <div className="pointer" />
          <canvas ref={cv} width={1040} height={1040} onClick={spin} role="img" aria-label="Wheel" />
        </div>
        <button className="btn big" onClick={spin} disabled={busy}>{t.spin}</button>
        {msg && <p className="msg" role="status">{msg}</p>}
      </div>

      <div className="box">
        <div className="tabs" role="tablist">
          {([['e', `${t.entries} (${entries.length})`], ['r', `${t.results} (${results.length})`], ['a', t.advanced], ['s', t.settings]] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {tab === 'e' && (<>
          <div className="toolbar">
            <button className="btn ghost sm" onClick={shuffle}>{t.shuffle}</button>
            <button className="btn ghost sm" onClick={sortAZ}>{t.sort}</button>
            <div className="dd" ref={menuRef}>
              <button className="btn ghost sm" aria-expanded={imgMenu} onClick={() => setImgMenu(!imgMenu)}>🖼 {t.addImage} ▾</button>
              {imgMenu && (
                <div className="menu left">
                  <button className="mname" onClick={() => { setImgMenu(false); bgIn.current?.click(); }}>{t.addBg}</button>
                  <button className="mname" onClick={() => { setImgMenu(false); centerIn.current?.click(); }}>{t.addCenter}</button>
                  <button className="mname" onClick={() => { setImgMenu(false); entryIn.current?.click(); }}>{t.addImgEntry}</button>
                </div>
              )}
            </div>
            {hideBox}
          </div>
          {hiddenCount > 0 && (
            <p className="hiddenbar">{t.hiddenCount} {hiddenCount}
              <button className="btn ghost sm" onClick={() => setEntries(entries.map((e) => ({ ...e, hide: false })))}>{t.showAll}</button></p>
          )}
          <textarea className={hideList ? 'hid' : ''} value={raw} aria-label={t.entries} spellCheck={false} onChange={(e) => { setRaw(e.target.value); setEntries(parse(e.target.value, entries)); }} />
          <p className="muted small">{t.hint}</p>
        </>)}

        {tab === 'r' && (<>
          <div className="toolbar">
            <button className="btn ghost sm" onClick={() => setResults([...results].sort((a, b) => a.t.localeCompare(b.t, undefined, { numeric: true })))}>{t.sort}</button>
            <button className="btn ghost sm" onClick={() => setResults([])} disabled={!results.length}>✕ {t.clearResults}</button>
            {hideBox}
          </div>
          {results.length === 0
            ? <p className="reslist empty">{t.noResults}</p>
            : <ol className={'reslist' + (hideList ? ' hid' : '')}>
                {results.map((r, i) => <li key={i}><span className="n">{results.length - i}.</span>{r.img && <img src={r.img} alt="" />}<span>{r.t}</span></li>)}
              </ol>}
        </>)}

        {tab === 'a' && (<>
          {entries.map((e, i) => (
            <div className={'erow' + (e.hide ? ' off' : '')} key={i}>
              <input type="color" aria-label="Color" value={e.c} onChange={(ev) => upd(i, { c: ev.target.value })} />
              <input type="text" aria-label={t.entries} value={e.t} onChange={(ev) => setList(entries.map((x, k) => (k === i ? { ...x, t: ev.target.value } : x)))} />
              {e.img
                ? <button className="thumb" title={t.removeImg} aria-label={t.removeImg} onClick={() => upd(i, { img: undefined })}><img src={e.img} alt="" /></button>
                : <button className="thumb add" title={t.setImg} aria-label={t.setImg} onClick={() => { rowFor.current = i; rowIn.current?.click(); }}>🖼</button>}
              <button className="thumb" title={e.hide ? t.showSlice : t.hideSlice} aria-label={e.hide ? t.showSlice : t.hideSlice} aria-pressed={!!e.hide} onClick={() => upd(i, { hide: !e.hide })}>{e.hide ? '🚫' : '👁'}</button>
              <div className="wt">
                <button aria-label="-" onClick={() => e.w > 1 && upd(i, { w: e.w - 1 })}>−</button><span>{e.w}</span>
                <button aria-label="+" onClick={() => e.w < 20 && upd(i, { w: e.w + 1 })}>+</button>
              </div>
              <button className="x" aria-label={t.del} onClick={() => removeAt(i)}>×</button>
            </div>
          ))}
          <button className="btn ghost sm" onClick={() => entries.length < 200 && setList([...entries, { t: t.newEntry, w: 1, c: PAL[entries.length % PAL.length] }])}>{t.add}</button>
          <p className="muted small">{t.advHint}</p>
        </>)}

        {tab === 's' && (<>
          <div className="subtabs">
            {([['t', t.tabTitle], ['d', t.tabDuring], ['a', t.tabAfter], ['p', t.tabAppearance]] as const).map(([k, l]) => (
              <button key={k} aria-pressed={st === k} onClick={() => setSt(k)}>{l}</button>
            ))}
          </div>
          <div className="set">
            {st === 't' && (<>
              <label className="col">{t.wheelTitle}<input type="text" maxLength={120} value={S.title} onChange={(e) => set('title', e.target.value)} /></label>
              <label className="col">{t.wheelDesc}<textarea className="short" maxLength={300} value={S.desc} onChange={(e) => set('desc', e.target.value)} /></label>
              <label>{t.showTitle}{tog('showTitle')}</label>
            </>)}
            {st === 'd' && (<>
              <label>{t.sound}{tog('sound')}</label>
              <label>{t.volume}<span><input type="range" min={0} max={1} step={0.05} value={S.vol} onChange={(e) => set('vol', +e.target.value)} /></span></label>
              <label>{t.spinTime}<span><input type="range" min={1} max={60} value={S.time} onChange={(e) => set('time', +e.target.value)} /> <b>{S.time}s</b></span></label>
              <label>{t.idle}<span><input type="range" min={0} max={5} step={1} value={S.idle} onChange={(e) => set('idle', +e.target.value)} /> <b>{S.idle === 0 ? t.off : S.idle}</b></span></label>
            </>)}
            {st === 'a' && (<>
              <label>{t.winSound}{tog('winSound')}</label>
              <label>{t.popup}{tog('pop')}</label>
              <label className="col">{t.popMsg}<input type="text" maxLength={80} placeholder={t.popMsgPh} value={S.popMsg} onChange={(e) => set('popMsg', e.target.value)} /></label>
              <label>{t.confetti}{tog('conf')}</label>
              <label>{t.removeAfter}{tog('rem')}</label>
            </>)}
            {st === 'p' && (<>
              <div className="pvrow">
                <div className="pv">{S.bg ? <img src={S.bg} alt="" /> : <span className="swatch" />}</div>
                <div className="pvtxt">
                  <b>{t.bgTitle}</b>
                  <div className="row2">
                    <button className="btn ghost sm" onClick={() => bgIn.current?.click()}>{S.bg ? t.replace : t.upload}</button>
                    {S.bg && <button className="btn ghost sm" onClick={() => set('bg', '')}>{t.remove}</button>}
                  </div>
                </div>
              </div>
              <label>{t.outlines}{tog('out')}</label>
              <div className="pvrow">
                <div className="pv">{S.center ? <img src={S.center} alt="" /> : <span className="dot" />}</div>
                <div className="pvtxt">
                  <b>{t.centerTitle}</b>
                  <div className="row2">
                    <button className="btn ghost sm" onClick={() => centerIn.current?.click()}>{S.center ? t.replace : t.upload}</button>
                    {S.center && <button className="btn ghost sm" onClick={() => set('center', '')}>{t.remove}</button>}
                  </div>
                </div>
              </div>
              <label>{t.centerSize}
                <select value={S.centerSize} onChange={(e) => set('centerSize', e.target.value as Settings['centerSize'])}>
                  <option value="sm">{t.small}</option><option value="md">{t.medium}</option><option value="lg">{t.large}</option>
                </select>
              </label>
            </>)}
          </div>
        </>)}

        <div className="saverow">
          <input type="text" placeholder={t.wheelTitle} value={S.title} maxLength={120} onChange={(e) => set('title', e.target.value)} aria-label={t.wheelTitle} />
          <button className="btn" onClick={save}>{t.save}</button>
        </div>
      </div>

      <input ref={entryIn} {...fileProps('entry')} />
      <input ref={bgIn} {...fileProps('bg')} />
      <input ref={centerIn} {...fileProps('center')} />
      <input ref={rowIn} {...fileProps('row')} />

      {winner !== null && entries[winner] && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="wtitle" onClick={(e) => e.target === e.currentTarget && finish('close')}>
          <div className="wcard">
            <div className="whead">
              <h2 id="wtitle">{S.popMsg || t.winnerTitle}</h2>
              <button className="wclose" aria-label={t.close} onClick={() => finish('close')}>✕</button>
            </div>
            <div className="wbody">
              <Crown />
              <div className="wbox">
                {entries[winner].img && <img src={entries[winner].img} alt="" />}
                <span>{entries[winner].t}</span>
              </div>
            </div>
            <div className="wfoot">
              <button className="dl" onClick={download}>⬇ {t.download}</button>
              <div className="wbtns">
                <button className="wb" onClick={() => finish('hide')}>{t.hideSlice}</button>
                <button className="wb" onClick={() => finish('remove')}>{t.removeSlice}</button>
                <button className="wb main" onClick={() => finish('again')} autoFocus>{t.playAgain}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <canvas ref={fx} className="fx" />
    </div>
  );
}

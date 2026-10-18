'use client';
import { useState } from 'react';
import { useApp } from './AppProvider';

export default function AuthModal() {
  const { t, auth, setAuthOpen } = useApp();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [f, setF] = useState({ email: '', password: '', name: '' });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    setErr(await auth(mode, f)); setBusy(false);
  };
  return (
    <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && setAuthOpen(false)}>
      <form className="card auth" onSubmit={submit}>
        <h2>{mode === 'login' ? t.login : t.signup}</h2>
        {mode === 'signup' && <input placeholder={t.name} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" />}
        <input type="email" required placeholder={t.email} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" />
        <input type="password" required minLength={8} placeholder={t.password} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn" disabled={busy}>{mode === 'login' ? t.login : t.signup}</button>
        <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErr(null); }}>{mode === 'login' ? t.noAcc : t.haveAcc}</button>
        <button type="button" className="link" onClick={() => setAuthOpen(false)}>{t.close}</button>
      </form>
    </div>
  );
}

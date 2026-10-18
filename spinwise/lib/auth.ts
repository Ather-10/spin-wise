import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from './db';
import type { User } from './types';

const COOKIE = 'sw_session';
const DAYS = 30;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET is not set');
  return 'dev-only-secret-change-me';
}
const sign = (v: string) => crypto.createHmac('sha256', secret()).update(v).digest('base64url');

export async function hashPassword(p: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const h = await new Promise<string>((res, rej) => crypto.scrypt(p, salt, 64, (e, k) => (e ? rej(e) : res(k.toString('hex')))));
  return `${salt}:${h}`;
}
export async function verifyPassword(p: string, stored: string) {
  const [salt, h] = stored.split(':');
  const k = await new Promise<Buffer>((res, rej) => crypto.scrypt(p, salt, 64, (e, d) => (e ? rej(e) : res(d))));
  const a = Buffer.from(h, 'hex');
  return a.length === k.length && crypto.timingSafeEqual(a, k);
}

export async function startSession(uid: number) {
  const exp = Date.now() + DAYS * 864e5;
  const v = `${uid}.${exp}`;
  (await cookies()).set(COOKIE, `${v}.${sign(v)}`, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: DAYS * 86400 });
}
export async function endSession() { (await cookies()).delete(COOKIE); }

export async function sessionUser(): Promise<User | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [uid, exp, sig] = raw.split('.');
  const good = sign(`${uid}.${exp}`);
  if (!sig || sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  if (Number(exp) < Date.now()) return null;
  const u = await (await db()).userById(Number(uid));
  return u ? { id: u.id, email: u.email, name: u.name } : null;
}

// Simple in-memory limiter: max 10 tries per 10 minutes per key
const tries = new Map<string, { n: number; t: number }>();
export function tooMany(key: string) {
  const now = Date.now(); const e = tries.get(key);
  if (!e || now - e.t > 6e5) { tries.set(key, { n: 1, t: now }); return false; }
  e.n++; return e.n > 10;
}

const IMG = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/;
const okImg = (v: unknown, max: number) => (typeof v === 'string' && v.length <= max && IMG.test(v) ? v : '');

export function cleanWheel(w: any) {
  if (!w || typeof w.id !== 'string' || !/^[\w-]{8,40}$/.test(w.id) || !Array.isArray(w.entries)) return null;
  const entries = w.entries.slice(0, 200).map((e: any) => {
    const img = okImg(e?.img, 90000);
    return {
      t: String(e?.t ?? '').slice(0, 200),
      w: Math.min(20, Math.max(1, Math.round(Number(e?.w) || 1))),
      c: /^#[0-9a-f]{6}$/i.test(e?.c) ? e.c : '#ff5a36',
      ...(img ? { img } : {}),
      ...(e?.hide === true ? { hide: true } : {}),
    };
  });
  const s = w.settings ?? {};
  const settings = {
    time: Math.min(60, Math.max(1, Number(s.time) || 6)),
    idle: Math.min(5, Math.max(0, Math.round(Number(s.idle ?? 2)) || 0)),
    sound: s.sound !== false, vol: Math.min(1, Math.max(0, Number(s.vol ?? 0.5))), winSound: s.winSound !== false,
    conf: s.conf !== false, pop: s.pop !== false, popMsg: String(s.popMsg ?? '').slice(0, 80),
    rem: s.rem === true, out: s.out !== false,
    title: String(s.title ?? '').slice(0, 120), desc: String(s.desc ?? '').slice(0, 300), showTitle: s.showTitle !== false,
    bg: okImg(s.bg, 700000), center: okImg(s.center, 250000),
    centerSize: ['sm', 'md', 'lg'].includes(s.centerSize) ? s.centerSize : 'md',
  };
  const name = String(w.name ?? 'My wheel').slice(0, 120) || 'My wheel';
  if (JSON.stringify({ entries, settings }).length > 6_000_000) return null;
  return { id: w.id as string, name, entries, settings, updatedAt: Number(w.updatedAt) || Date.now() };
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, startSession, tooMany } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const email = String(b.email ?? '').trim().toLowerCase();
  const name = String(b.name ?? '').trim().slice(0, 80) || email.split('@')[0];
  const password = String(b.password ?? '');
  if (tooMany('s:' + (req.headers.get('x-forwarded-for') ?? 'ip'))) return NextResponse.json({ error: 'Too many tries. Wait a few minutes.' }, { status: 429 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 190) return NextResponse.json({ error: 'Enter a valid email.' }, { status: 400 });
  if (password.length < 8 || password.length > 200) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  const d = await db();
  if (await d.userByEmail(email)) return NextResponse.json({ error: 'This email is already registered. Log in instead.' }, { status: 409 });
  const u = await d.createUser(email, name, await hashPassword(password));
  await startSession(u.id);
  return NextResponse.json({ user: { id: u.id, email: u.email, name: u.name } });
}

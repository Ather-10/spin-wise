import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, startSession, tooMany } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const email = String(b.email ?? '').trim().toLowerCase();
  const password = String(b.password ?? '');
  if (tooMany('l:' + (req.headers.get('x-forwarded-for') ?? 'ip') + email)) return NextResponse.json({ error: 'Too many tries. Wait a few minutes.' }, { status: 429 });
  const u = await (await db()).userByEmail(email);
  if (!u || !(await verifyPassword(password, u.pass))) return NextResponse.json({ error: 'Wrong email or password.' }, { status: 401 });
  await startSession(u.id);
  return NextResponse.json({ user: { id: u.id, email: u.email, name: u.name } });
}

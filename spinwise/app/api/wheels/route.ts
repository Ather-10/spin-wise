import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessionUser, cleanWheel } from '@/lib/auth';
export const dynamic = 'force-dynamic';

export async function GET() {
  const u = await sessionUser();
  if (!u) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  const rows = await (await db()).listWheels(u.id);
  return NextResponse.json({ wheels: rows.map((r) => ({ ...JSON.parse(r.data), id: r.id, name: r.name, updatedAt: r.updatedAt })) });
}

// Body: { wheel } or { wheels: [...] } (used when a guest logs in and imports local wheels)
export async function POST(req: NextRequest) {
  const u = await sessionUser();
  if (!u) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const list = (Array.isArray(b.wheels) ? b.wheels : [b.wheel]).slice(0, 50).map(cleanWheel).filter(Boolean) as NonNullable<ReturnType<typeof cleanWheel>>[];
  const d = await db();
  if ((await d.listWheels(u.id)).length + list.length > 150) return NextResponse.json({ error: 'Wheel limit reached (150).' }, { status: 400 });
  for (const w of list) await d.upsertWheel({ id: w.id, userId: u.id, name: w.name, data: JSON.stringify({ entries: w.entries, settings: w.settings }), updatedAt: w.updatedAt });
  return NextResponse.json({ ok: true, count: list.length });
}

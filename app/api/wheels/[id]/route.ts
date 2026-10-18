import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessionUser } from '@/lib/auth';

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await sessionUser();
  if (!u) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  const { id } = await params;
  await (await db()).deleteWheel(u.id, id);
  return NextResponse.json({ ok: true });
}

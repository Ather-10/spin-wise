import type { SavedWheel } from './types';
// Guest wheels live only in the visitor's browser and expire after 7 days without use.
const KEY = 'sw.guest.wheels.v1';
export const GUEST_TTL = 7 * 24 * 60 * 60 * 1000;

export function loadGuest(): SavedWheel[] {
  try {
    const all: SavedWheel[] = JSON.parse(localStorage.getItem(KEY) || '[]');
    const keep = all.filter((w) => Date.now() - w.updatedAt < GUEST_TTL);
    if (keep.length !== all.length) localStorage.setItem(KEY, JSON.stringify(keep));
    return keep;
  } catch { return []; }
}
export function saveGuest(list: SavedWheel[]): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch { return false; }
}

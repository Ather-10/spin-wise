import { NextRequest, NextResponse } from 'next/server';
import { locales } from './lib/i18n';

// English lives at "/" (no prefix). Internally it is served from "/en".
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const seg = pathname.split('/')[1];
  const url = req.nextUrl.clone();
  if (seg === 'en') {
    url.pathname = pathname.replace(/^\/en/, '') || '/';
    return NextResponse.redirect(url, 308);
  }
  if ((locales as readonly string[]).includes(seg)) return NextResponse.next();
  url.pathname = '/en' + (pathname === '/' ? '' : pathname);
  return NextResponse.rewrite(url);
}
export const config = { matcher: ['/((?!_next|api|.*\\..*).*)'] };

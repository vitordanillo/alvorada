
import { NextResponse, type NextRequest } from 'next/server';

async function validSession(token?: string): Promise<boolean> {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!token || !secret || secret.length < 32) return false;
  try {
    const [payload, signature, extra] = token.split('.');
    if (!payload || !signature || extra) return false;
    const bytes = (value: string) => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, bytes(signature), new TextEncoder().encode(payload)))) return false;
    const data = JSON.parse(new TextDecoder().decode(bytes(payload)));
    return typeof data.uid === 'string' && typeof data.exp === 'number' && data.exp > Date.now();
  } catch { return false; }
}

export async function middleware(request: NextRequest) {
  const authenticated = await validSession(request.cookies.get('alvorada-session')?.value);
  const { pathname } = request.nextUrl;

  if ((pathname === '/' && authenticated) || (pathname !== '/' && !authenticated)) {
    const url = request.nextUrl.clone();
    url.pathname = authenticated ? '/dashboard' : '/';
    url.search = '';
    const response = NextResponse.redirect(url);
    if (!authenticated) response.cookies.delete('alvorada-session');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/pos/:path*'],
};

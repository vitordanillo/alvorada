
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('firebase-auth-token');
  const { pathname } = request.nextUrl;

  // Se o usuário está logado (verificação básica de cookie) e tenta acessar a página de login
  if (authToken && pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // A proteção de rotas como /dashboard e /pos será tratada no lado do cliente
  // dentro do DashboardLayout para evitar problemas de cookie em iframes.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

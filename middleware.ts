import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  if (pathname.startsWith('/dashboard')) {
    const token = req.cookies.get('token')?.value;
    
    // 🔒 Authentication check only (Prisma cannot run in Edge Runtime)
    // Admin authorization will be checked in dashboard layout
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};

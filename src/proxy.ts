/**
 * Next.js proxy (middleware).
 * Auth is handled client-side via AuthProvider since we use
 * implicit OAuth flow (no server-side cookies).
 */
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

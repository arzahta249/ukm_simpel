import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

/**
 * Proxy / Middleware Proteksi Rute:
 *  - /adminS/*    → wajib login sebagai Admin (jika belum login atau masih sesi peserta,
 *                   arahkan ke /login?next=/adminS agar bisa masuk dengan akun Admin)
 *  - /dashboard/* → wajib login
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (pathname.startsWith("/adminS")) {
    if (!session || session.role !== "admin") {
      const loginUrl = new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/adminS/:path*", "/dashboard/:path*"],
};

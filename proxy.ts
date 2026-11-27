import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

/**
 * Proxy / Middleware Proteksi Rute (3 Role: admin, juri/reviewer, peserta/penulis):
 *  - /adminS/*    → wajib login sebagai Admin
 *  - /reviewer/*  → wajib login sebagai Juri/Reviewer (atau Admin)
 *  - /dashboard/* → wajib login (jika role === 'juri', arahkan ke /reviewer)
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (pathname === "/adminS/reviewer" || pathname.startsWith("/adminS/reviewer/")) {
    if (!session || session.role !== "juri") {
      const loginUrl = new URL(`/login?next=${encodeURIComponent("/reviewer")}`, request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.redirect(new URL("/reviewer", request.url));
  }

  if (pathname.startsWith("/adminS")) {
    if (!session || session.role !== "admin") {
      const loginUrl = new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/reviewer")) {
    if (!session || session.role !== "juri") {
      const loginUrl = new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/dashboard")) {
    if (session.role === "juri") {
      return NextResponse.redirect(new URL("/reviewer", request.url));
    }
    if (session.role !== "peserta") {
      const loginUrl = new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/adminS/:path*", "/reviewer/:path*", "/dashboard/:path*"],
};

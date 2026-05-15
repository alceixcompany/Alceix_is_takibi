import { NextResponse, type NextRequest } from "next/server";

import { DEMO_AUTH_COOKIE, FIREBASE_SESSION_COOKIE } from "@/lib/constants";
import { demoModeEnabled, firebaseConfigured } from "@/lib/env";

function isBypassedPath(pathname: string) {
  return pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".");
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (isBypassedPath(pathname)) return NextResponse.next();

  // Login sayfasını her zaman aç. Böylece bozuk/eskimiş cookie varsa
  // /login -> /dashboard -> /login sonsuz yönlendirme döngüsü oluşmaz.
  if (pathname === "/login") return NextResponse.next();

  const sessionCookieName = demoModeEnabled ? DEMO_AUTH_COOKIE : FIREBASE_SESSION_COOKIE;
  const hasSession = Boolean(request.cookies.get(sessionCookieName)?.value);

  if (!demoModeEnabled && !firebaseConfigured) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

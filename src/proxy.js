import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/sessionCookie";

// Next.js 16 renamed middleware.js -> proxy.js (same API, new name). This
// just guarantees every visitor has a stable, anonymous session id so
// self-service "add a company" sources can be scoped to their browser
// without a login system.
export function proxy(request) {
  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.cookies.set(SESSION_COOKIE, crypto.randomUUID(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robinscouts.png|robinscoutshorizontal.png).*)",
  ],
};

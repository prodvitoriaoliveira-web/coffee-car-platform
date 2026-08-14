import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Next.js 16 renamed "Middleware" to "Proxy" (same functionality, new file/convention name).
// NextAuth's `auth()` wrapper only decorates the request with `req.auth` — it does NOT redirect
// on its own, so we explicitly send unauthenticated users to /login here.
export default auth((req) => {
  const isLoggedIn = Boolean(req.auth);
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|api/seed|login|_next/static|_next/image|favicon.ico).*)"],
};

import { NextResponse, type NextRequest } from "next/server";

const APP_PREFIXES = [
  "/browse",
  "/search",
  "/title",
  "/watch",
  "/my-list",
  "/account",
];

const SESSION_COOKIE = "nf_session";
const PROFILE_COOKIE = "nf_profile";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const hasProfile = Boolean(request.cookies.get(PROFILE_COOKIE)?.value);

  const isApp = APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isProfiles = pathname === "/profiles";

  if (isApp) {
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (!hasProfile) {
      const url = request.nextUrl.clone();
      url.pathname = "/profiles";
      return NextResponse.redirect(url);
    }
  }

  if (isProfiles && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", "/profiles");
    return NextResponse.redirect(url);
  }

  if (isAuthPage && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = hasProfile ? "/browse" : "/profiles";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

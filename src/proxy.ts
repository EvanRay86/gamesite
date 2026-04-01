import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Pages that require authentication (redirect to login)
const PROTECTED_PAGES = ["/account", "/subscribe"];

// Auth pages that logged-in users should skip
const AUTH_PAGES = ["/login", "/signup"];

// Cron endpoints authenticated by CRON_SECRET header, not user session
const CRON_ENDPOINTS = ["/api/trivia/generate", "/api/crossword/generate"];

// API routes that require a valid user session
const AUTH_REQUIRED_API = [
  "/api/credits",
  "/api/stripe/checkout",
  "/api/stripe/portal",
  "/api/koala/save",
  "/api/rift",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Cron endpoints — skip user auth (verified by CRON_SECRET in handler)
  if (CRON_ENDPOINTS.some((ep) => pathname === ep)) {
    return response;
  }

  // ── Redirect logged-in users away from login/signup
  if (user && AUTH_PAGES.some((p) => pathname === p)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // ── Protect pages that require authentication
  if (!user && PROTECTED_PAGES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // ── Protect admin API routes (fine-grained is_admin check in requireAdmin())
  if (pathname.startsWith("/api/admin")) {
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      );
    }
  }

  // ── Protect user-specific API routes
  if (
    !user &&
    AUTH_REQUIRED_API.some((prefix) => pathname.startsWith(prefix))
  ) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 },
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|json|webmanifest)$).*)",
  ],
};

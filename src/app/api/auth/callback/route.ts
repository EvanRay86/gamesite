import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

function getSafeRedirect(redirect: string | null): string {
  if (!redirect) return "/";
  // Only allow relative paths — block protocol-relative URLs and absolute URLs
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return "/";
  return redirect;
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`auth:${ip}`, { limit: 15, windowSeconds: 60 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = getSafeRedirect(searchParams.get("redirect"));

  if (code) {
    const supabase = await createSupabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(redirect, origin));
}

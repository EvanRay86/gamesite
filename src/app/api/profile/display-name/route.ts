import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { display_name } = await request.json();

    if (
      !display_name ||
      typeof display_name !== "string" ||
      display_name.trim().length < 2 ||
      display_name.trim().length > 24
    ) {
      return NextResponse.json(
        { error: "Display name must be 2–24 characters" },
        { status: 400 },
      );
    }

    // Only allow alphanumeric, spaces, underscores, hyphens
    const sanitized = display_name.trim();
    if (!/^[a-zA-Z0-9 _-]+$/.test(sanitized)) {
      return NextResponse.json(
        { error: "Display name can only contain letters, numbers, spaces, hyphens, and underscores" },
        { status: 400 },
      );
    }

    // Check cooldown
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("display_name_updated_at")
      .eq("id", user.id)
      .single();

    if (profile?.display_name_updated_at) {
      const lastUpdate = new Date(profile.display_name_updated_at).getTime();
      const now = Date.now();
      if (now - lastUpdate < TWO_WEEKS_MS) {
        const nextAllowed = new Date(lastUpdate + TWO_WEEKS_MS);
        return NextResponse.json(
          {
            error: "You can only change your display name once every 2 weeks",
            next_allowed: nextAllowed.toISOString(),
          },
          { status: 429 },
        );
      }
    }

    const { error } = await supabase
      .from("user_profiles")
      .update({
        display_name: sanitized,
        display_name_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ display_name: sanitized });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

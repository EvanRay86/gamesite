import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { STRIPE_PRICES } from "@/lib/stripe-config";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`checkout:${ip}`, { limit: 10, windowSeconds: 60 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { priceId, mode } = await request.json();

    if (!priceId || !mode) {
      return NextResponse.json({ error: "Missing priceId or mode" }, { status: 400 });
    }

    // Validate mode
    const VALID_MODES = new Set(["subscription", "payment"]);
    if (!VALID_MODES.has(mode)) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    // Validate priceId against known prices
    const ALLOWED_PRICE_IDS = new Set(Object.values(STRIPE_PRICES).filter(Boolean));
    if (!ALLOWED_PRICE_IDS.has(priceId)) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    // Get or create Stripe customer
    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const { data: profile } = await admin
      .from("user_profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      await admin
        .from("user_profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: mode as "subscription" | "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/account?success=true`,
      cancel_url: `${origin}/subscribe?canceled=true`,
      metadata: { supabase_user_id: user.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Stripe checkout error:", message);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}

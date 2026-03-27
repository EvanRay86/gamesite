import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getCreditsForPrice } from "@/lib/stripe-config";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        if (!userId) break;

        if (session.mode === "subscription") {
          const subscriptionId = session.subscription as string;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const item = subscription.items.data[0];

          await admin.from("user_subscriptions").upsert(
            {
              user_id: userId,
              stripe_subscription_id: subscriptionId,
              stripe_price_id: item.price.id,
              status: subscription.status,
              current_period_start: new Date(item.current_period_start * 1000).toISOString(),
              current_period_end: new Date(item.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "stripe_subscription_id" },
          );
        } else if (session.mode === "payment") {
          // Credit pack purchase
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
          const priceId = lineItems.data[0]?.price?.id;
          if (!priceId) break;

          const credits = getCreditsForPrice(priceId);
          if (!credits) break;

          // Add credits
          await admin.rpc("deduct_credits", {
            p_user_id: userId,
            p_amount: -credits, // negative deduction = addition
            p_reason: `purchase_${credits}`,
          });

          // Also log with session ID for the audit trail
          // (The RPC already inserts a transaction, but let's update the session ID)
          await admin
            .from("credit_transactions")
            .update({ stripe_session_id: session.id })
            .eq("user_id", userId)
            .eq("reason", `purchase_${credits}`)
            .is("stripe_session_id", null)
            .order("created_at", { ascending: false })
            .limit(1);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const subItem = subscription.items.data[0];
        await admin
          .from("user_subscriptions")
          .update({
            status: subscription.status,
            current_period_start: subItem ? new Date(subItem.current_period_start * 1000).toISOString() : null,
            current_period_end: subItem ? new Date(subItem.current_period_end * 1000).toISOString() : null,
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await admin
          .from("user_subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subDetails = invoice.parent?.subscription_details;
        const subscriptionId =
          subDetails?.subscription
            ? typeof subDetails.subscription === "string"
              ? subDetails.subscription
              : subDetails.subscription.id
            : null;
        if (subscriptionId) {
          await admin
            .from("user_subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

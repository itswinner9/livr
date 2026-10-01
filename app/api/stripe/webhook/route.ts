import { NextResponse } from "next/server";
import Stripe from "stripe";
import { hasStripe } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (!hasStripe()) {
    return NextResponse.json({ received: true, skipped: true });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ received: true });

  if (
    event.type === "checkout.session.completed" ||
    event.type === "customer.subscription.updated"
  ) {
    const obj = event.data.object as Stripe.Checkout.Session | Stripe.Subscription;
    const userId =
      "metadata" in obj
        ? (obj.metadata?.userId as string | undefined)
        : undefined;
    const clientRef =
      "client_reference_id" in obj ? obj.client_reference_id : undefined;
    const id = userId || clientRef;
    if (id) {
      await admin
        .from("profiles")
        .update({ subscription_status: "premium" })
        .eq("id", id);
      await admin.from("audit_logs").insert({
        actor_user_id: id,
        action: "subscription_updated",
        entity_type: "profile",
        entity_id: id,
        metadata: { event: event.type },
      });
    }
  }
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const userId = sub.metadata?.userId;
    if (userId) {
      await admin.from("profiles").update({ subscription_status: "free" }).eq("id", userId);
    }
  }
  return NextResponse.json({ received: true });
}

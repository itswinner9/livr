import { NextResponse } from "next/server";
import Stripe from "stripe";
import { appUrl, hasStripe } from "@/lib/env";
import { getSessionUser } from "@/lib/auth/session";

export async function POST() {
  if (!hasStripe()) {
    return NextResponse.json(
      { error: "Payments are not configured." },
      { status: 503 },
    );
  }
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const price = process.env.STRIPE_PREMIUM_RENTER_PRICE_ID;
  if (!price) {
    return NextResponse.json({ error: "Price is not configured." }, { status: 503 });
  }
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    success_url: `${appUrl()}/account?checkout=success`,
    cancel_url: `${appUrl()}/pricing`,
    client_reference_id: user.id,
    metadata: { userId: user.id },
  });
  return NextResponse.json({ url: session.url });
}

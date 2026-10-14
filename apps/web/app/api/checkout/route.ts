import { NextResponse } from "next/server";
import Stripe from "stripe";
import { products } from "@ecom/catalog";

export async function POST(request: Request) {
  try {
    const { items } = await request.json() as { items?: { productId: string; quantity: number }[] };
    if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });
    const lineItems = items.map(({ productId, quantity }) => {
      const product = products.find((entry) => entry.id === productId);
      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 25) throw new Error("One of those items isn’t available. Please refresh your bag.");
      return { quantity, price_data: { currency: "usd", unit_amount: Math.round(product.price * 100), product_data: { name: product.name, description: product.description, images: [product.image] } } };
    });
    const subtotal = items.reduce((sum, { productId, quantity }) => sum + (products.find((product) => product.id === productId)?.price ?? 0) * quantity, 0);
    if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "Payments aren’t configured yet. Add STRIPE_SECRET_KEY to apps/web/.env.local to enable checkout." }, { status: 503 });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({ mode: "payment", line_items: lineItems, success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${origin}/cancelled`, billing_address_collection: "required", shipping_address_collection: { allowed_countries: ["US", "CA", "GB", "AU"] }, shipping_options: [{ shipping_rate_data: { type: "fixed_amount", fixed_amount: { amount: subtotal >= 150 ? 0 : 895, currency: "usd" }, display_name: subtotal >= 150 ? "Complimentary shipping" : "Standard shipping", delivery_estimate: { minimum: { unit: "business_day", value: 3 }, maximum: { unit: "business_day", value: 7 } } } }], phone_number_collection: { enabled: true }, automatic_tax: { enabled: false } });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Checkout could not be started." }, { status: 400 });
  }
}

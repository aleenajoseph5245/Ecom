import { NextResponse } from "next/server";
import { products } from "@ecom/catalog";

export const runtime = "nodejs";
const FREE_SHIPPING_AT = 10_000;
const SHIPPING_FEE = 499;

type Address = { name?: string; email?: string; phone?: string; line1?: string; line2?: string; city?: string; state?: string; postalCode?: string; gstin?: string };

export async function POST(request: Request) {
  try {
    const { items, address } = await request.json() as { items?: { productId: string; quantity: number }[]; address?: Address };
    if (!Array.isArray(items) || items.length === 0 || items.length > 30) return NextResponse.json({ error: "Your bag is empty or contains too many items." }, { status: 400 });
    const required = [address?.name, address?.email, address?.phone, address?.line1, address?.city, address?.state, address?.postalCode];
    if (required.some((value) => typeof value !== "string" || !value.trim())) return NextResponse.json({ error: "Complete all required delivery address fields." }, { status: 400 });
    if (!/^[1-9][0-9]{5}$/.test(address!.postalCode!.trim())) return NextResponse.json({ error: "Enter a valid 6-digit Indian PIN code." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address!.email!.trim())) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    const phone = address!.phone!.replace(/[\s()-]/g, "");
    if (!/^(\+91)?[6-9][0-9]{9}$/.test(phone)) return NextResponse.json({ error: "Enter a valid Indian mobile number." }, { status: 400 });
    if (address?.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(address.gstin.trim().toUpperCase())) return NextResponse.json({ error: "Enter a valid GSTIN or leave the field blank." }, { status: 400 });
    const normalized = items.map(({ productId, quantity }) => {
      const product = products.find((entry) => entry.id === productId);
      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 25) throw new Error("One of those items isn’t available. Please refresh your bag.");
      return { product, quantity };
    });
    const subtotal = normalized.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
    const shipping = subtotal >= FREE_SHIPPING_AT ? 0 : SHIPPING_FEE;
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return NextResponse.json({ error: "Payments aren’t configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel to enable checkout." }, { status: 503 });
    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const notes = {
      customer_name: address!.name!.trim().slice(0, 255), customer_email: address!.email!.trim().slice(0, 255), customer_phone: phone,
      address_line1: address!.line1!.trim().slice(0, 255), address_line2: (address!.line2 ?? "").trim().slice(0, 255),
      city: address!.city!.trim().slice(0, 255), state: address!.state!.trim().slice(0, 255), postal_code: address!.postalCode!.trim(),
      gstin: (address!.gstin ?? "").trim().toUpperCase().slice(0, 255),
      items: normalized.map(({ product, quantity }) => `${product.id}:${quantity}`).join(",").slice(0, 255),
      shipping_paise: String(shipping * 100),
    };
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST", headers: { "Authorization": `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ amount: (subtotal + shipping) * 100, currency: "INR", receipt: `ff_${crypto.randomUUID().replaceAll("-", "").slice(0, 32)}`, notes }),
    });
    const order = await response.json();
    if (!response.ok) return NextResponse.json({ error: order.error?.description ?? "Payment order could not be created." }, { status: 502 });
    return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId, name: "Form & Field", description: "Your considered collection", callbackUrl: `${origin}/api/checkout/verify` });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Checkout could not be started." }, { status: 400 });
  }
}

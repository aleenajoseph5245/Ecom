import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = await request.json() as Record<string, string>;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !orderId || !paymentId || !signature) return NextResponse.json({ error: "Payment verification details are incomplete." }, { status: 400 });
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest();
  let supplied: Buffer;
  try { supplied = Buffer.from(signature, "hex"); } catch { return NextResponse.json({ error: "Payment verification failed." }, { status: 400 }); }
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  const authorization = `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${secret}`).toString("base64")}`;
  const [orderResponse, paymentResponse] = await Promise.all([
    fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, { headers: { Authorization: authorization } }),
    fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, { headers: { Authorization: authorization } }),
  ]);
  const [order, payment] = await Promise.all([orderResponse.json(), paymentResponse.json()]);
  if (!orderResponse.ok || !paymentResponse.ok || payment.order_id !== orderId || payment.status !== "captured" || order.status !== "paid" || payment.amount !== order.amount || payment.currency !== "INR") {
    return NextResponse.json({ error: "Payment is not captured yet. Please contact support before retrying." }, { status: 409 });
  }
  return NextResponse.json({ ok: true, paymentId, orderId, amount: order.amount, currency: order.currency, deliveryName: order.notes?.customer_name ?? "" });
}

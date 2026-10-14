"use client";
import Script from "next/script";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, LockKeyhole } from "lucide-react";
import { products } from "@ecom/catalog";
import type { Product } from "@ecom/types";

type Item = { productId: string; quantity: number };
type Address = { name: string; email: string; phone: string; line1: string; line2: string; city: string; state: string; postalCode: string; gstin: string };
type RazorpayResult = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, cb: (error: { description?: string }) => void) => void } } }
const states = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"];
const empty: Address = { name: "", email: "", phone: "", line1: "", line2: "", city: "", state: "", postalCode: "", gstin: "" };
const money = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function Checkout() {
  const [items, setItems] = useState<Item[]>([]);
  const [address, setAddress] = useState<Address>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [scriptReady, setScriptReady] = useState(false);
  useEffect(() => {
    try { const value = new URLSearchParams(window.location.search).get("cart"); if (value) setItems(JSON.parse(value)); } catch { setError("Your bag link is invalid. Return to the shop and try again."); }
  }, []);
  const lines = items.map((item) => ({ ...item, product: products.find((product) => product.id === item.productId) })).filter((line): line is Item & { product: Product } => Boolean(line.product));
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const shipping = subtotal >= 10_000 ? 0 : 499;
  function update(field: keyof Address, value: string) { setAddress((current) => ({ ...current, [field]: value })); }
  async function pay(event: React.FormEvent) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items, address }) });
      const order = await response.json();
      if (!response.ok) throw new Error(order.error ?? "Checkout could not be started.");
      if (!window.Razorpay || !scriptReady) throw new Error("Secure checkout is still loading. Please try again in a moment.");
      const checkout = new window.Razorpay({ key: order.keyId, amount: order.amount, currency: order.currency, name: order.name, description: order.description, order_id: order.orderId,
        prefill: { name: address.name, email: address.email, contact: address.phone },
        notes: { delivery_city: address.city, delivery_state: address.state, postal_code: address.postalCode },
        theme: { color: "#303a32" },
        handler: async (result: RazorpayResult) => {
          setLoading(true);
          try {
            const verified = await fetch("/api/checkout/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(result) });
            const data = await verified.json(); if (!verified.ok) throw new Error(data.error ?? "We could not verify this payment.");
            setSuccess(data.paymentId);
          } catch (verificationError) { setError(verificationError instanceof Error ? verificationError.message : "Payment verification failed."); }
          finally { setLoading(false); }
        },
      });
      checkout.on("payment.failed", (failure) => { setError(failure.description ?? "Payment could not be completed. Please try another method."); setLoading(false); });
      checkout.open();
    } catch (payError) { setError(payError instanceof Error ? payError.message : "Checkout could not be started."); }
    finally { setLoading(false); }
  }
  const inputStyle: React.CSSProperties = { width: "100%", padding: "13px 14px", border: "1px solid #dedfd8", background: "#fff", font: "inherit", fontSize: 13, color: "#29342c", outlineColor: "#617664" };
  const field = (label: string, key: keyof Address, props: { type?: string; required?: boolean; placeholder?: string; inputMode?: "text" | "numeric" | "email" | "tel"; maxLength?: number } = {}) => <label style={{ display: "grid", gap: 7, fontSize: 11, color: "#596057" }}>{label}<input style={inputStyle} type={props.type ?? "text"} inputMode={props.inputMode} maxLength={props.maxLength} placeholder={props.placeholder} required={props.required ?? true} value={address[key]} onChange={(event) => update(key, event.target.value)} /></label>;
  if (success) return <main style={{ minHeight: "100vh", background: "#f8f8f5", display: "grid", placeItems: "center", padding: 24 }}><section style={{ maxWidth: 510, background: "white", padding: "48px 40px", textAlign: "center" }}><div style={{ width: 48, height: 48, margin: "0 auto 20px", borderRadius: "50%", background: "#eff1eb", display: "grid", placeItems: "center", color: "#526b55" }}><Check/></div><p style={{ letterSpacing: 2, fontSize: 10, color: "#767b73" }}>ORDER PAYMENT CONFIRMED</p><h1 style={{ fontSize: 34, fontWeight: 400 }}>Thank you, {address.name.split(" ")[0]}.</h1><p style={{ color: "#6b7169", lineHeight: 1.7 }}>Your payment is verified. Keep this payment reference for your records: <strong>{success}</strong>.</p><a href="/" style={{ display: "inline-block", marginTop: 18, color: "#303a32" }}>Continue shopping →</a></section></main>;
  return <main style={{ minHeight: "100vh", background: "#f8f8f5", color: "#29342c", padding: "0 20px 60px" }}>
    <Script src="https://checkout.razorpay.com/v1/checkout.js" onReady={() => setScriptReady(true)} />
    <header style={{ maxWidth: 1020, margin: "auto", padding: "22px 0", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e8e9e2" }}><a href="/" style={{ color: "inherit", textDecoration: "none", fontSize: 21, letterSpacing: -1 }}>form<span style={{ fontStyle: "italic", color: "#617664" }}>&</span>field</a><span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: "#677066" }}><LockKeyhole size={14}/> Secure checkout</span></header>
    <div style={{ maxWidth: 1020, margin: "38px auto", display: "grid", gridTemplateColumns: "minmax(0,1.2fr) minmax(280px,.8fr)", gap: 48 }} className="india-checkout-grid">
      <section><a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11, color: "#687168", textDecoration: "none" }}><ArrowLeft size={14}/> Back to shop</a><h1 style={{ fontSize: 34, letterSpacing: -1, fontWeight: 400, margin: "22px 0 8px" }}>Delivery details</h1><p style={{ fontSize: 12, color: "#747a71", marginBottom: 25 }}>We currently deliver within India.</p>
        <form onSubmit={pay} style={{ display: "grid", gap: 15 }}>
          {field("Full name", "name", { placeholder: "Name for delivery" })}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{field("Email", "email", { type: "email", placeholder: "you@example.com" })}{field("Indian mobile number", "phone", { type: "tel", placeholder: "+91 98765 43210" })}</div>
          {field("Address", "line1", { placeholder: "House number, street, area" })}{field("Landmark or apartment details (optional)", "line2", { required: false, placeholder: "Apartment, suite, landmark" })}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{field("City", "city")}
            <label style={{ display: "grid", gap: 7, fontSize: 11, color: "#596057" }}>State / union territory<select required value={address.state} onChange={(event) => update("state", event.target.value)} style={inputStyle}><option value="">Select state</option>{states.map((state) => <option key={state}>{state}</option>)}</select></label></div>
          {field("PIN code", "postalCode", { inputMode: "numeric", maxLength: 6, placeholder: "6-digit PIN code" })}
          {field("GSTIN for business invoice (optional)", "gstin", { required: false, placeholder: "15-character GSTIN" })}
          <p style={{ fontSize: 10, lineHeight: 1.6, color: "#7b8178", margin: "0 0 2px" }}>GST details are collected for your records. Applicable GST and tax invoices must be configured by the store before production sales.</p>
          {error && <p role="alert" style={{ color: "#9c3e2f", background: "#faefeb", padding: 12, fontSize: 12, lineHeight: 1.5 }}>{error}</p>}
          <button disabled={loading || items.length === 0 || !lines.length} style={{ border: 0, background: "#303a32", color: "white", padding: 16, fontSize: 12, cursor: "pointer", opacity: loading ? .7 : 1 }}>{loading ? "Preparing secure payment…" : `Pay ${money(subtotal + shipping)} securely`}</button>
          <p style={{ fontSize: 10, textAlign: "center", color: "#7b8178" }}>UPI · Cards · Netbanking · Wallets, subject to your Razorpay account configuration</p>
        </form>
      </section>
      <aside style={{ background: "#fff", border: "1px solid #ecece7", padding: 24, alignSelf: "start" }}><p style={{ fontSize: 10, letterSpacing: 1.5, color: "#737a71" }}>YOUR ORDER</p>{lines.map(({ product, quantity }) => <div key={product.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderBottom: "1px solid #edeee8", padding: "14px 0", fontSize: 12 }}><span>{product.name} <small style={{ color: "#868b83" }}>× {quantity}</small></span><span>{money(product.price * quantity)}</span></div>)}<div style={{ display: "flex", justifyContent: "space-between", paddingTop: 18, fontSize: 12 }}><span>Subtotal</span><span>{money(subtotal)}</span></div><div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, fontSize: 12 }}><span>Delivery</span><span>{shipping ? money(shipping) : "Free"}</span></div><div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #dedfd8", marginTop: 18, paddingTop: 18, fontSize: 14, fontWeight: 600 }}><span>Total</span><span>{money(subtotal + shipping)}</span></div><p style={{ fontSize: 10, color: "#858a82", lineHeight: 1.6, marginTop: 15 }}>Free delivery on orders of ₹10,000 or more.</p></aside>
    </div>
    <style jsx>{`@media(max-width:700px){.india-checkout-grid{grid-template-columns:1fr!important;gap:28px!important;margin-top:24px!important}.india-checkout-grid>aside{grid-row:1}}`}</style>
  </main>;
}

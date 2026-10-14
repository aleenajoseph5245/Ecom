import Link from "next/link";
import { Check } from "lucide-react";
export default function SuccessPage() { return <main className="success-page"><div className="success-card"><span className="success-check"><Check size={23}/></span><p className="eyebrow">PAYMENT COMPLETE</p><h1>Thank you for<br/><em>making room.</em></h1><p>Your payment was completed securely. We’re glad these pieces found a home.</p><Link className="button button-dark" href="/">Back to the collection <span>→</span></Link></div></main>; }

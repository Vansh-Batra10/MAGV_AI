import Link from "next/link";
import { formatINR, tiers } from "@invites/config";
import { Shell } from "@/components/marketing/Shell";

export const metadata = { title: "Pricing" };
export default function Pricing() {
  return (
    <Shell><main className="mk-wrap" style={{ paddingBottom: 40 }}>
      <h1 style={{ fontSize: 40 }}>Pricing</h1>
      <p style={{ color: "var(--mk-soft)" }}>Preview everything free. Pay once per wedding. Prices include GST; full refund before your first guest link is sent.</p>
      <div className="mk-cols">{(["preview", "classic", "signature", "couture"] as const).map((k) => { const p = tiers[k]; const e = p.entitlements; return (
        <div key={k} className="mk-card"><b>{p.name}</b><div className="mk-price">{p.inr ? formatINR(p.inr) : "Free"}</div><p>{p.usd ? `$${p.usd} outside India` : "All 3 templates, full preview"}</p>
          <ul style={{ paddingLeft: 18, lineHeight: 1.6 }}>{!e.canSend && <li>Watermarked preview, cannot send</li>}{e.canSend && <li>{e.maxGuestLinks ? `Up to ${e.maxGuestLinks}` : "Unlimited"} personal guest links</li>}{e.rsvp && <li>RSVP, dashboard, static cards, QR</li>}{e.shagun && <li>Shagun wishlist, Ashirwad Book, song requests, live updates, {e.videoVariants} video variants</li>}{e.personalAiAssets && <li>Personal AI art, no brand footer, priority support</li>}</ul></div>); })}</div>
      <p style={{ marginTop: 24 }}><Link className="mk-cta" href="/studio/new">Start free</Link></p>
    </main></Shell>
  );
}

/**
 * Legal drafts (English for all locales until lawyer-reviewed translations exist — see DECISIONS.md).
 * MUST be reviewed by a lawyer before launch (docs/SETUP.md).
 */
import { BRAND } from "@/config/brand";
import { FREE_TIER } from "@/config/pricing";

type Market = "IN" | "GLOBAL";
const UPDATED = "20 November 2026";

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 font-display text-[30px] leading-tight text-hi">{children}</h2>;
}

export function Privacy({ market }: { market: Market }) {
  return (
    <>
      <p className="text-sm text-lo">Last updated: {UPDATED} · Draft pending legal review</p>
      <p>{BRAND.name} (operated by {BRAND.legalName}, {BRAND.address}) lets you create interactive digital gifts. This notice explains what personal data we process, why, for how long, and your rights.{market === "IN" ? " We process personal data in line with India's Digital Personal Data Protection Act, 2023 and the DPDP Rules, 2025." : ""}</p>
      <H>What we collect</H>
      <ul>
        <li><b>Gift content</b> you add: names, messages, photos (re-encoded to strip EXIF/GPS location data), voice notes, song links.</li>
        <li><b>Contact details</b>: your email and (optionally) phone number, and a recipient's phone/email only if you ask us to deliver for you.</li>
        <li><b>Contributors</b> to group gifts: name, message, optional photo/voice note, optional email for a reveal notification.</li>
        <li><b>Recipients</b>: replies and, only if they choose to record one, a reaction clip shared with the sender.</li>
        <li><b>Usage</b>: first-party events (e.g. "gift opened" with a coarse device type). We do not store recipients' IP addresses beyond short-lived rate-limiting.</li>
        <li><b>Payments</b> are handled by our payment processor; we never see or store full card or UPI credentials.</li>
      </ul>
      <H>Why we use it</H>
      <ul>
        <li>To create, host, deliver and let you manage your gift (the purpose you consent to at checkout).</li>
        <li>To send service messages: receipts, delivery, "they opened it", replies (utility messages).</li>
        <li>Reminders and offers only if you opt in; reminders go by email unless you opt in to WhatsApp.</li>
        <li>Analytics and advertising cookies only after you accept them in the cookie banner.</li>
      </ul>
      <H>Who processes it (by category)</H>
      <p>Cloud hosting and database, file storage, payment gateway{market === "GLOBAL" ? " (and, where enabled, a merchant-of-record reseller)" : ""}, email/WhatsApp/SMS delivery providers, and an AI writing provider used only to draft gift text from the answers you give. Processors act on our instructions under contract.</p>
      <H>How long we keep it</H>
      <ul>
        <li>Paid gifts: until you delete them.</li>
        <li>Free {FREE_TIER.hours}-hour gifts: purged 7 days after they expire.</li>
        <li>Unfinished drafts: purged after 30 days of inactivity.</li>
        <li>Reaction clips: deleted when the gift is deleted.</li>
        <li>Order and tax records: as long as tax law requires.</li>
      </ul>
      <H>Your rights</H>
      <p>You can access, correct and delete your data and withdraw consent at any time — most of this is self-serve in your dashboard. Anyone who appears in a gift can ask us to remove it using the link at the bottom of every gift page; we hide it immediately while we review.</p>
      {market === "IN" && (
        <>
          <H>Grievance officer (India)</H>
          <p>{BRAND.grievanceOfficer.name} — {BRAND.grievanceOfficer.email}. We acknowledge grievances promptly and resolve them within the timelines required by law. You may also approach the Data Protection Board of India.</p>
        </>
      )}
      {market === "GLOBAL" && (
        <>
          <H>EU / UK visitors (GDPR / UK GDPR)</H>
          <p>Our lawful bases are contract (to provide your gift), consent (marketing, analytics, reaction clips) and legitimate interests (security, fraud prevention). Marketing pixels load only after opt-in. You may lodge a complaint with your local supervisory authority. International transfers rely on appropriate safeguards such as standard contractual clauses.</p>
          <H>US state privacy rights</H>
          <p>Residents of states with consumer privacy laws may request access, deletion and correction, and may opt out of the "sale" or "sharing" of personal information. We do not sell personal information. If advertising cookies are enabled, choosing "Essential only" in the cookie banner acts as your <b>Do Not Sell or Share</b> choice.</p>
        </>
      )}
      <H>Children</H>
      <p>{BRAND.name} is intended for people aged 18 and over.</p>
      <H>Security & breaches</H>
      <p>Gift links are long and unguessable, gift pages are never indexed, passwords are hashed, and access is limited. If a breach affects you, we will notify you and the relevant authority as the law requires.</p>
      <H>Contact</H>
      <p>{BRAND.supportEmail}</p>
    </>
  );
}

export function Terms({ market }: { market: Market }) {
  return (
    <>
      <p className="text-sm text-lo">Last updated: {UPDATED} · Draft pending legal review</p>
      <p>These terms govern your use of {BRAND.name}, operated by {BRAND.legalName}. By creating or sending a gift you agree to them.</p>
      <H>Your content</H>
      <p>You keep ownership of what you upload. You give us a limited licence to host and display it to the people you share it with. You confirm you have the right to use every photo, voice note and audio file you add, and that people shown in photos are okay with it. Song links play through the platform's official embedded player; we do not host or distribute music.</p>
      <H>Acceptable use</H>
      <p>No harassment, threats, hate, sexual content involving minors, impersonation, or content that violates someone's privacy. We may remove gifts that break these rules and cooperate with lawful requests.</p>
      <H>Free gifts</H>
      <p>Free gifts stay live for {FREE_TIER.hours} hours, carry a small {BRAND.name} badge and are limited to a few per person per month. Either the sender or the recipient can upgrade them to "Forever".</p>
      <H>Payments</H>
      <p>Prices are shown before you pay{market === "IN" ? " and include GST" : ""}. Paid "Forever" gifts stay live until you delete them. See our Refund policy.</p>
      <H>Service</H>
      <p>We work hard to keep gifts available, but the service is provided as is. Our liability is limited to the amount you paid for the gift in question, to the extent the law allows.</p>
      <H>Governing law</H>
      <p>{market === "IN" ? "These terms are governed by the laws of India; courts at the registered office location have jurisdiction." : "These terms are governed by the laws applicable at our registered office, without prejudice to mandatory consumer protections where you live."}</p>
    </>
  );
}

export function Refunds(_p: { market?: Market }) {
  return (
    <>
      <p className="text-sm text-lo">Last updated: {UPDATED} · Draft pending legal review</p>
      <H>Simple and fair</H>
      <ul>
        <li><b>Full refund</b> if your gift fails to deliver or work because of us.</li>
        <li><b>Full refund within 24 hours of purchase</b> if the gift link was never opened.</li>
        <li>Otherwise, because digital gifts are delivered instantly, purchases are non-refundable — but write to us and a human will look at it.</li>
      </ul>
      <p>Refunds go back to the original payment method, usually within 5–7 working days. Contact {BRAND.supportEmail}.</p>
    </>
  );
}

export function Delivery(_p: { market?: Market }) {
  return (
    <>
      <p className="text-sm text-lo">Last updated: {UPDATED}</p>
      <H>Digital delivery only</H>
      <p>{BRAND.name} sells digital gifts. Nothing is shipped. Your gift link is ready immediately after payment and shown on screen and sent to your email.</p>
      <H>Scheduled delivery</H>
      <p>If you schedule a gift, we send the link to the recipient at the chosen time in their timezone by WhatsApp, SMS or email (whichever details you provide). Delivery normally happens within 5 minutes of the scheduled time.</p>
      <H>Printable QR cards</H>
      <p>Optional PDFs you can print yourself and tuck into a physical gift.</p>
    </>
  );
}

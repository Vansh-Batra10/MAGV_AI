import { notFound } from "next/navigation";
import { brand } from "@invites/config";
import { Shell } from "@/components/marketing/Shell";

/** Plain-language drafts. TODO_VERIFY(all legal pages with a lawyer before launch: DPDP Act notice, terms, refunds). */
const DOCS: Record<string, { title: string; body: string[] }> = {
  privacy: { title: "Privacy notice", body: [
    `${brand.name} helps couples send wedding invitations. We collect the couple's phone number (to log in and to protect shagun payments) and the guest details the couple adds (names, phone numbers, replies).`,
    "We use guest data only to deliver that couple's invitations. We never contact guests for marketing and never sell data.",
    "Guest personal data is anonymised 90 days after the last function unless the couple extends it. Photos uploaded for personal AI art are deleted 30 days after the last function unless the couple keeps them, and are never used to train models or for other couples.",
    "You can ask us for a copy of your data, to correct it or to delete it. Write to the grievance officer below.",
    "Guests: the couple can see whether you opened your invitation and what you replied. Payments you make by UPI go directly to the couple; we never see or hold the money.",
  ] },
  terms: { title: "Terms of use", body: ["Use the service only for genuine invitations to your own event.", "Do not upload content you don't have the right to use. Music on guest pages comes only from our licensed library.", "We may remove invitations reported as abusive or fraudulent."] },
  refunds: { title: "Refunds", body: ["Full refund for any plan before the first guest link is sent. After that, refunds are at our discretion for service problems."] },
  grievance: { title: "Grievance officer", body: [`Email ${brand.supportEmail}. We acknowledge within 24 hours and resolve within 30 days.`, "TODO_VERIFY: named grievance officer and postal address as required by law."] },
};
export function generateStaticParams() { return Object.keys(DOCS).map((doc) => ({ doc })); }
export default async function Legal({ params }: { params: Promise<{ doc: string }> }) {
  const d = DOCS[(await params).doc];
  if (!d) notFound();
  return <Shell><main className="mk-wrap mk-prose" style={{ paddingBottom: 40 }}><h1>{d.title}</h1>{d.body.map((p, i) => <p key={i}>{p}</p>)}<p style={{ color: "var(--mk-soft)" }}>Draft, pending legal review.</p></main></Shell>;
}

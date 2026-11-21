import { Shell } from "@/components/marketing/Shell";
export const metadata = { title: "FAQ" };
const QA = [
  ["Do guests need an app or a login?", "No. They open a link from WhatsApp in any browser."],
  ["Will it work on my Nani's phone?", "Yes. The guest's name appears within about a second and a half even on a budget Android over 4G. Slow phones get a lighter version automatically, and there is a Large text button."],
  ["Do you hold the shagun money?", "Never. Guests pay your own UPI ID directly from their UPI app. You confirm each one in your ledger."],
  ["Can the couple see if I opened the invite?", "Yes, and the invite says so in its footer. We don't track anything else about guests."],
  ["Which languages?", "English, Hindi and Hinglish today. Marathi, Gujarati, Punjabi, Bengali, Tamil, Telugu, Kannada, Malayalam and Urdu are next."],
];
export default function Faq() {
  return <Shell><main className="mk-wrap mk-prose" style={{ paddingBottom: 40 }}><h1>FAQ</h1>{QA.map(([q, a]) => <details key={q} style={{ borderBottom: "1px solid var(--mk-line)", padding: "12px 0" }}><summary style={{ fontWeight: 700, cursor: "pointer" }}>{q}</summary><p>{a}</p></details>)}</main></Shell>;
}

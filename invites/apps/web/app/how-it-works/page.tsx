import { Shell } from "@/components/marketing/Shell";
import { copy } from "@/lib/content/marketing";
export const metadata = { title: "How it works" };
export default function How() {
  return <Shell><main className="mk-wrap mk-prose" style={{ paddingBottom: 40 }}><h1>How it works</h1><ol>{copy.en.how.map((s) => <li key={s}>{s}</li>)}</ol>
    <p>Guests never install anything and never log in. Each personal link shows that guest’s name, only their functions, RSVP per function, directions, travel and stay details, and an optional shagun wishlist paid straight to you by UPI.</p></main></Shell>;
}

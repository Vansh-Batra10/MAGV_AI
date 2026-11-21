import Link from "next/link";
import { brand } from "@invites/config";

export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontWeight: 600 }}>{brand.name}</h1>
      <p>{brand.tagline}</p>
      <p><Link href="/dev/playground">Template playground</Link></p>
    </main>
  );
}

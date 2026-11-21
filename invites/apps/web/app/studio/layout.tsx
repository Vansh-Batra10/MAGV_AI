import Link from "next/link";
import { brand } from "@invites/config";
import "./studio.css";

export const metadata = { title: "Studio", robots: { index: false } };

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="st">
      <header className="st-top"><Link href="/studio" style={{ textDecoration: "none" }}><b>{brand.name}</b></Link><span className="muted">Studio</span></header>
      {children}
    </div>
  );
}

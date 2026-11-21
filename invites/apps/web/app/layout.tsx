import type { Metadata, Viewport } from "next";
import { brand } from "@invites/config";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${brand.name} · Cinematic wedding invitations`, template: `%s · ${brand.name}` },
  description: "Cinematic, animated Indian wedding invitations. The card is the website.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#1C1A22" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

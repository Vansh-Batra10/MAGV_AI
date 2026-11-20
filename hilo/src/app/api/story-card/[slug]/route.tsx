import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { getGiftBySlug, giftUrl } from "@/lib/server/gifts";
import { getTemplate } from "@/templates/registry";
import { displayName } from "@/templates/types";
import { StoryCard, ogFonts } from "@/lib/server/cards";

const COPY = {
  en: ["I made something", "for my person 💌"],
  "hi-Latn": ["Maine kuch banaya", "apne insaan ke liye 💌"],
  hi: ["I made something", "for my person 💌"],
} as const;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const g = await getGiftBySlug((await params).slug);
  if (!g?.slug) return new Response("not found", { status: 404 });
  const tpl = getTemplate(g.template_slug)!;
  const qr = await QRCode.toDataURL(giftUrl(g.slug), { margin: 1, width: 420, color: { dark: "#2A1E1A", light: "#FFF8EF" } });
  const [a, b] = COPY[g.gift_language] ?? COPY.en;
  return new ImageResponse(<StoryCard headline={a} accent={b} glow={tpl.meta.glow} qr={qr} templateName={displayName(tpl.meta, "en", g.market)} />, {
    width: 1080, height: 1920, fonts: await ogFonts(),
    headers: { "Content-Disposition": `attachment; filename="story-${g.slug}.png"`, "Cache-Control": "private, max-age=600" },
  });
}

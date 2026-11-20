import { ImageResponse } from "next/og";
import { getGiftBySlug } from "@/lib/server/gifts";
import { getTemplate } from "@/templates/registry";
import { OgCard, ogFonts } from "@/lib/server/cards";
import { firstName } from "@/lib/paths";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const g = await getGiftBySlug((await params).slug);
  const tpl = g ? getTemplate(g.template_slug) : null;
  const name = firstName(g?.recipient_name) || "you";
  return new ImageResponse(<OgCard title={`A surprise for ${name}`} sub="Tap to open 💌" glow={tpl?.meta.glow} />, { width: 1200, height: 630, fonts: await ogFonts(), headers: { "Cache-Control": "public, max-age=3600" } });
}

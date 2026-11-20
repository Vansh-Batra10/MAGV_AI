import { ImageResponse } from "next/og";
import { OgCard, ogFonts } from "@/lib/server/cards";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const title = (sp.get("title") ?? "For the people you love.").slice(0, 80);
  return new ImageResponse(<OgCard title={title} glow={sp.get("glow") ?? "rose"} />, { width: 1200, height: 630, fonts: await ogFonts(), headers: { "Cache-Control": "public, max-age=86400" } });
}

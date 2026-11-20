import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import { getGiftBySlug, giftUrl } from "@/lib/server/gifts";
import { firstName } from "@/lib/paths";
import { BRAND } from "@/config/brand";

const mm = (v: number) => (v * 72) / 25.4;
const INK = rgb(0x0b / 255, 0x07 / 255, 0x14 / 255), ROSE = rgb(1, 0x4d / 255, 0x7e / 255), CREAM = rgb(1, 0xf8 / 255, 0xef / 255), TEXT = rgb(0x2a / 255, 0x1e / 255, 0x1a / 255), AMBER = rgb(1, 0xc8 / 255, 0x70 / 255);

/** Free printable QR cards: night (A6), paper (A6), wallet (85×55mm ×8 on A4), sticker sheet (A4). */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const g = await getGiftBySlug((await params).slug);
  if (!g?.slug) return new Response("not found", { status: 404 });
  const design = new URL(req.url).searchParams.get("design") ?? "night";
  const url = giftUrl(g.slug);
  const name = firstName(g.recipient_name) || "you";
  const line = g.gift_language === "hi-Latn" ? "Scan karo. Kuch tumhare liye hai." : "Scan me. Something's waiting for you.";
  const doc = await PDFDocument.create();
  const serif = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const qrDark = await doc.embedPng(await QRCode.toBuffer(url, { margin: 1, width: 600, color: { dark: "#2A1E1A", light: "#FFF8EF" } }));

  const card = (page: ReturnType<typeof doc.addPage>, x: number, y: number, w: number, h: number, night: boolean) => {
    page.drawRectangle({ x, y, width: w, height: h, color: night ? INK : CREAM, borderColor: ROSE, borderWidth: 0.6 });
    page.drawLine({ start: { x: x + w * 0.06, y: y + h * 0.14 }, end: { x: x + w * 0.94, y: y + h * 0.86 }, thickness: 0.8, color: ROSE, opacity: 0.35 });
    const q = Math.min(w, h) * 0.5;
    page.drawRectangle({ x: x + (w - q) / 2 - 4, y: y + h * 0.22 - 4, width: q + 8, height: q + 8, color: CREAM });
    page.drawImage(qrDark, { x: x + (w - q) / 2, y: y + h * 0.22, width: q, height: q });
    const title = `For ${name}`;
    const ts = Math.min(w, h) * 0.11;
    page.drawText(title, { x: x + (w - serif.widthOfTextAtSize(title, ts)) / 2, y: y + h * 0.82, size: ts, font: serif, color: night ? CREAM : TEXT });
    const ls = Math.min(w, h) * 0.045;
    page.drawText(line, { x: x + (w - sans.widthOfTextAtSize(line, ls)) / 2, y: y + h * 0.12, size: ls, font: sans, color: night ? AMBER : ROSE });
    const bs = ls * 0.8;
    page.drawText(BRAND.name, { x: x + (w - serif.widthOfTextAtSize(BRAND.name, bs)) / 2, y: y + h * 0.05, size: bs, font: serif, color: night ? CREAM : TEXT, opacity: 0.6 });
  };

  if (design === "night" || design === "paper") {
    const page = doc.addPage([mm(105), mm(148)]);
    card(page, 0, 0, mm(105), mm(148), design === "night");
  } else if (design === "wallet") {
    const page = doc.addPage([mm(210), mm(297)]);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) card(page, mm(15 + c * 95), mm(25 + r * 63), mm(85), mm(55), (r + c) % 2 === 0);
  } else {
    const page = doc.addPage([mm(210), mm(297)]);
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) {
      const cx = mm(38 + c * 67), cy = mm(35 + r * 56), rad = mm(25);
      page.drawCircle({ x: cx, y: cy, size: rad, color: (r + c) % 2 ? CREAM : INK, borderColor: ROSE, borderWidth: 0.6 });
      page.drawImage(qrDark, { x: cx - rad * 0.55, y: cy - rad * 0.55, width: rad * 1.1, height: rad * 1.1 });
    }
  }
  const bytes = await doc.save();
  return new Response(new Uint8Array(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${BRAND.name.toLowerCase()}-qr-${design}.pdf"` } });
}

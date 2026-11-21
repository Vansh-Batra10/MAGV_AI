import qrcode from "qrcode-generator";

/** QR as an SVG string (dark on light only, with a quiet zone of 4 modules). */
export function qrSvg(text: string, opts: { dark?: string; light?: string; margin?: number; label?: string } = {}): string {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const m = opts.margin ?? 4;
  const size = n + m * 2;
  let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + m},${r + m}h1v1h-1z`;
  return `<svg viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="${opts.label ?? "QR code"}"><rect width="${size}" height="${size}" fill="${opts.light ?? "#fff"}"/><path d="${d}" fill="${opts.dark ?? "#000"}"/></svg>`;
}

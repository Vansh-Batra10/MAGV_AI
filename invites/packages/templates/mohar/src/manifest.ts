import { fontsourceFiles, type TemplateManifest } from "@invites/renderer";

const slot = (id: string, kind: "image" | "texture" | "vector" | "audio", kb: number, alpha: boolean, aspect?: string) => ({
  id, kind, aspect, maxBytes: kb * 1024, alphaRequired: alpha, promptTemplateId: `mohar/{pack}/${id}`, fallback: "procedural" as const,
});

export const manifest: TemplateManifest = {
  id: "mohar",
  name: "Mohar",
  tagline: "Press the wax seal; the box opens; the invitation suite unfolds card by card.",
  supportedFunctions: ["haldi", "mehendi", "sangeet", "cocktail", "wedding", "reception", "custom"],
  defaultPack: "plum-olive",
  packs: ["plum-olive", "powder-blue-baroque", "opal-night"],
  layers: [
    { name: "bg", parallax: 0.05, tiers: ["A", "B", "C"] },
    { name: "back", parallax: 0.2, tiers: ["A", "B", "C"] },
    { name: "mid", parallax: 0.5, tiers: ["A", "B", "C"] },
    { name: "front", parallax: 0.8, tiers: ["A", "B", "C"] },
    { name: "particles", parallax: 1, tiers: ["A", "B"] },
    { name: "ui", parallax: 0, tiers: ["A", "B", "C"] },
  ],
  slots: [
    slot("velvet", "texture", 60, false), slot("box-top", "image", 120, true), slot("box-base", "image", 80, true),
    slot("ribbon", "texture", 30, true), slot("seal-shards", "vector", 8, true), slot("tissue", "texture", 40, true),
    slot("card-texture", "texture", 40, false), slot("crest-frames", "vector", 20, true), slot("stained-glass", "image", 120, true),
    slot("venue-line", "image", 90, true), slot("venue-paint", "image", 180, false), slot("foil", "texture", 20, true),
    slot("audio-paper", "audio", 30, false), slot("audio-seal-crack", "audio", 20, false), slot("audio-ambient", "audio", 200, false),
  ],
  fonts: [
    { family: "Bodoni Moda", files: [...fontsourceFiles("bodoni-moda", [400, 600], { latinExt: true }), ...fontsourceFiles("bodoni-moda", [400], { italic: true, latinExt: true })] },
    { family: "EB Garamond", files: fontsourceFiles("eb-garamond", [400, 600], { latinExt: true }) },
    { family: "Tiro Devanagari Hindi", files: fontsourceFiles("tiro-devanagari-hindi", [400], { devanagari: true }) },
  ],
  keyframes: [0.5, 1.2, 2.2, 3.4, 5.5],
};

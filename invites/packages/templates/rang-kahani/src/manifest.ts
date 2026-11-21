import { fontsourceFiles, type TemplateManifest } from "@invites/renderer";

const slot = (id: string, kind: "image" | "prop" | "sprite" | "texture" | "audio" | "vector", kb: number, alpha: boolean, aspect?: string) => ({
  id, kind, aspect, maxBytes: kb * 1024, alphaRequired: alpha, promptTemplateId: `rang-kahani/{pack}/${id}`, fallback: "procedural" as const,
});

export const manifest: TemplateManifest = {
  id: "rang-kahani",
  name: "Rang Kahani",
  tagline: "Paper spreads stand up off the page, and the two of you, as paper puppets, act out every function.",
  supportedFunctions: ["haldi", "mehendi", "sangeet", "cocktail", "wedding", "reception", "custom"],
  defaultPack: "bombay-monsoon",
  packs: ["bombay-monsoon", "dilli-sardi", "goa-sunset"],
  layers: [
    { name: "bg", parallax: 0.1, tiers: ["A", "B", "C"] },
    { name: "back", parallax: 0.3, tiers: ["A", "B", "C"] },
    { name: "mid", parallax: 0.6, tiers: ["A", "B", "C"] },
    { name: "front", parallax: 0.9, tiers: ["A", "B", "C"] },
    { name: "particles", parallax: 1, tiers: ["A", "B"] },
    { name: "ui", parallax: 0, tiers: ["A", "B", "C"] },
  ],
  slots: [
    ...["haldi", "mehendi", "sangeet", "wedding", "reception"].flatMap((f) => [slot(`puppet-bride-${f}`, "sprite", 90, true), slot(`puppet-groom-${f}`, "sprite", 90, true)]),
    slot("puppet-rig", "vector", 4, false),
    slot("pet-parts", "sprite", 40, true),
    slot("city-skyline", "image", 120, true, "1080x600"),
    ...["haldi", "mehendi", "sangeet", "wedding", "reception"].map((f) => slot(`spread-${f}`, "image", 140, false, "1080x1300")),
    slot("sticker-props", "sprite", 60, true),
    slot("paper-texture", "texture", 30, false),
    slot("confetti-atlas", "sprite", 30, true),
    slot("audio-dhol", "audio", 80, false), slot("audio-tumbi", "audio", 60, false), slot("audio-flute", "audio", 80, false), slot("audio-page-turn", "audio", 20, false),
  ],
  fonts: [
    { family: "Yatra One", files: fontsourceFiles("yatra-one", [400], { devanagari: true, latinExt: true }) },
    { family: "Baloo 2", files: fontsourceFiles("baloo-2", [500, 700], { devanagari: true, latinExt: true }) },
  ],
  keyframes: [0.5, 1.5, 3, 5, 8],
};

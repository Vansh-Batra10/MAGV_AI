import { fontsourceFiles, type TemplateManifest } from "@invites/renderer";

const plate = (id: string, maxKB: number, alpha: boolean, aspect = "1080x2400") => ({
  id, kind: "image" as const, aspect, maxBytes: maxKB * 1024, alphaRequired: alpha, promptTemplateId: `sheesh-mahal/{pack}/${id}`, fallback: "procedural" as const,
});

export const manifest: TemplateManifest = {
  id: "sheesh-mahal",
  name: "Sheesh Mahal",
  tagline: "The doors open into light, and your names assemble out of a thousand mirror reflections.",
  supportedFunctions: ["haldi", "mehendi", "sangeet", "cocktail", "wedding", "reception", "custom"],
  defaultPack: "jaipur-dusk",
  packs: ["jaipur-dusk", "udaipur-lake-dawn", "mysore-palace-lights"],
  layers: [
    { name: "bg", parallax: 0.1, tiers: ["A", "B", "C"] },
    { name: "back", parallax: 0.25, tiers: ["A", "B", "C"] },
    { name: "mid", parallax: 0.5, tiers: ["A", "B", "C"] },
    { name: "front", parallax: 0.9, tiers: ["A", "B", "C"] },
    { name: "particles", parallax: 1, tiers: ["A", "B"] },
    { name: "ui", parallax: 0, tiers: ["A", "B", "C"] },
  ],
  slots: [
    plate("sky", 160, false),
    plate("palace-silhouette", 140, true),
    plate("door-left", 120, true, "540x1600"),
    plate("door-right", 120, true, "540x1600"),
    plate("toran", 80, true, "1080x400"),
    plate("diya", 30, true, "256x256"),
    ...["haldi", "mehendi", "sangeet", "cocktail", "wedding", "reception"].map((k) => plate(`chamber-${k}`, 180, false, "1080x1300")),
    { id: "petal-atlas", kind: "sprite", maxBytes: 40 * 1024, alphaRequired: true, fallback: "procedural" },
    { id: "mirror-tile", kind: "texture", maxBytes: 20 * 1024, alphaRequired: false, fallback: "procedural" },
    { id: "audio-shehnai-sting", kind: "audio", maxBytes: 120 * 1024, alphaRequired: false, fallback: "procedural" },
    { id: "audio-santoor-ambient", kind: "audio", maxBytes: 200 * 1024, alphaRequired: false, fallback: "procedural" },
    { id: "audio-dholak-loop", kind: "audio", maxBytes: 80 * 1024, alphaRequired: false, fallback: "procedural" },
    { id: "names", kind: "text", maxBytes: 0, alphaRequired: false, fallback: "procedural" },
  ],
  fonts: [
    { family: "Rozha One", files: fontsourceFiles("rozha-one", [400], { devanagari: true, latinExt: true }) },
    { family: "Martel", files: fontsourceFiles("martel", [400, 600, 800], { devanagari: true, latinExt: true }) },
  ],
  keyframes: [0.5, 2, 4, 6, 9],
};

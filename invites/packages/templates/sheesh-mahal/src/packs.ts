import type { ThemePack } from "@invites/renderer";

/**
 * Palette tokens. CSS custom properties on the root: --sky, --sky2, --horizon, --stone, --stone-dark, --mirror,
 * --marigold, --accent, --ivory, --ink, --wood, --brass, --window, --backdrop.
 * Choreography is identical across packs.
 */
export const packs: Record<string, ThemePack> = {
  "jaipur-dusk": {
    id: "jaipur-dusk",
    name: "Jaipur Dusk",
    description: "Dusk indigo sky, warm sandstone and marigold. The classic.",
    tokens: {
      sky: "#141A45", sky2: "#222A5E", horizon: "#B5677A", glow: "#F3A23A",
      stone: "#E2B07E", "stone-dark": "#B9825A", "stone-shadow": "#7C4F3A",
      mirror: "#DCE2EC", marigold: "#F3A23A", "marigold-deep": "#E07A12", leaf: "#3F7A3A",
      accent: "#D2336E", ivory: "#FBF5EA", ink: "#1E234F", wood: "#5A2A1E", "wood-dark": "#3A1A12",
      brass: "#C99A3F", window: "#FFC76B", backdrop: "#0E1233", card: "#FBF5EA", "card-ink": "#1E234F", focus: "#FFD27A",
      "gold-1": "#FFF1C2", "gold-2": "#E8B64C", "gold-3": "#A8741F",
    },
    slots: {},
  },
  "udaipur-lake-dawn": {
    id: "udaipur-lake-dawn",
    name: "Udaipur Lake Dawn",
    description: "Pink-gold sunrise over the lake, a soft ripple of reflections.",
    tokens: {
      sky: "#3B3F7A", sky2: "#8C6FA8", horizon: "#F4A9A0", glow: "#FFD39A",
      stone: "#F1D9C4", "stone-dark": "#D2AE93", "stone-shadow": "#9A7468",
      mirror: "#F3E6EE", marigold: "#F6A04D", "marigold-deep": "#E2762A", leaf: "#4E8A55",
      accent: "#C8326B", ivory: "#FFF8F0", ink: "#3A2547", wood: "#6B3A33", "wood-dark": "#432420",
      brass: "#D2A65A", window: "#FFE2A8", backdrop: "#2B2C5E", card: "#FFF8F0", "card-ink": "#3A2547", focus: "#FFE2A8",
      "gold-1": "#FFF4D6", "gold-2": "#EDC06A", "gold-3": "#B07C2C",
      lake: "1",
    },
    slots: {},
  },
  "mysore-palace-lights": {
    id: "mysore-palace-lights",
    name: "Mysore Palace Lights",
    description: "Night palace outlined in a hundred thousand bulbs, festoons overhead.",
    tokens: {
      sky: "#070A1F", sky2: "#141A3D", horizon: "#2C2350", glow: "#FFD27A",
      stone: "#D8A877", "stone-dark": "#A57650", "stone-shadow": "#5E3D2C",
      mirror: "#E2E6F0", marigold: "#F5B13D", "marigold-deep": "#E08A1A", leaf: "#356B37",
      accent: "#D2336E", ivory: "#FBF5EA", ink: "#141A3D", wood: "#4E2219", "wood-dark": "#2E140E",
      brass: "#D6A94A", window: "#FFD98A", backdrop: "#05071A", card: "#FBF5EA", "card-ink": "#141A3D", focus: "#FFD98A",
      "gold-1": "#FFF3C9", "gold-2": "#F0C25A", "gold-3": "#B07E22",
      bulbs: "1",
    },
    slots: {},
  },
};

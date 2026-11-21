/**
 * The brand is not final. Every surface reads it from here; never hardcode it.
 * TODO_VERIFY(brand name trademark + domain availability) — see docs/VERIFY.md
 */
export const brand = {
  name: "Nimantran",
  domain: "nimantran.example",
  supportEmail: "help@nimantran.example",
  tagline: "The card is the website.",
  /** Platform UI colours (calm, so the templates are the star). Templates use their own tokens. */
  ui: {
    ink: "#1C1A22",
    inkSoft: "#4A4654",
    paper: "#FAF8F4",
    line: "#E6E1D8",
    accent: "#7A2E4F",
    accentInk: "#FFFFFF",
    ok: "#1F6B4A",
    warn: "#9A5B00",
  },
} as const;

export type Brand = typeof brand;

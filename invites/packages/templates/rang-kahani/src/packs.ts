import type { ThemePack } from "@invites/renderer";

export const packs: Record<string, ThemePack> = {
  "bombay-monsoon": {
    id: "bombay-monsoon", name: "Bombay Monsoon", description: "Rani pink and indigo, rain streaks, a kaali-peeli taxi.",
    tokens: { rani: "#E0218A", indigo: "#2E2A7A", turmeric: "#F4B400", bottle: "#0E5E4B", paper: "#FFF1D6", ink: "#231942", cloth: "#2E2A7A", "cloth-print": "#E0218A", sky: "#7A83C9", "sky-ink": "#2E2A7A", backdrop: "#1D1A4F", focus: "#F4B400", rain: "1" },
    slots: {},
  },
  "dilli-sardi": {
    id: "dilli-sardi", name: "Dilli Sardi", description: "Rust, cream and bottle green, winter fog, chai steam.",
    tokens: { rani: "#B4442C", indigo: "#2D3A2E", turmeric: "#E5A33B", bottle: "#0E5E4B", paper: "#FBF0DC", ink: "#2B1D14", cloth: "#7A2E1C", "cloth-print": "#E5A33B", sky: "#CDBFAE", "sky-ink": "#5A3B2C", backdrop: "#3A1D14", focus: "#E5A33B", fog: "1" },
    slots: {},
  },
  "goa-sunset": {
    id: "goa-sunset", name: "Goa Sunset", description: "Coral, teal and turmeric, palms and beach shacks.",
    tokens: { rani: "#F2675A", indigo: "#0F6E78", turmeric: "#F4B400", bottle: "#0F6E78", paper: "#FFF3E2", ink: "#23303B", cloth: "#0F6E78", "cloth-print": "#F2675A", sky: "#F8B48A", "sky-ink": "#7A3B4A", backdrop: "#0D4A52", focus: "#F4B400" },
    slots: {},
  },
};

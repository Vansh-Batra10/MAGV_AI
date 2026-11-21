import type { ThemePack } from "@invites/renderer";

export const packs: Record<string, ThemePack> = {
  "plum-olive": {
    id: "plum-olive", name: "Plum & Olive", description: "Plum velvet, olive silk, ivory card and antique gold foil.",
    tokens: { velvet: "#4F1D3D", "velvet-hi": "#6E2C55", "velvet-lo": "#2E0F23", silk: "#6E7442", "silk-hi": "#9AA067", ivory: "#F8F3E9", "ivory-lo": "#E9E0CF", gold: "#B38E55", "gold-hi": "#E3C48A", ink: "#2B1B26", seal: "#5A1A3E", "seal-hi": "#8A3462", opal1: "#EDE7F3", opal2: "#DDF0EA", opal3: "#F6E7DA", backdrop: "#2E0F23", focus: "#E3C48A", accent: "#6E2C55" },
    slots: {},
  },
  "powder-blue-baroque": {
    id: "powder-blue-baroque", name: "Powder Blue Baroque", description: "Ivory and powder blue with silver Baroque scrollwork on pale-blue velvet.",
    tokens: { velvet: "#9FB6CC", "velvet-hi": "#C9D8E6", "velvet-lo": "#6F8AA6", silk: "#C9D8E6", "silk-hi": "#EEF4FA", ivory: "#FBF8F2", "ivory-lo": "#ECE6DA", gold: "#9EA7B3", "gold-hi": "#E4E9EF", ink: "#26303D", seal: "#3E5A7A", "seal-hi": "#6F8EB2", opal1: "#EEF3FA", opal2: "#E6F2F0", opal3: "#F7EFE6", backdrop: "#5C7590", focus: "#26303D", accent: "#3E5A7A" },
    slots: {},
  },
  "opal-night": {
    id: "opal-night", name: "Opal Night", description: "Deep navy velvet, opal shimmer and silver foil.",
    tokens: { velvet: "#141B3A", "velvet-hi": "#243060", "velvet-lo": "#0A0E22", silk: "#B8BCCF", "silk-hi": "#E6E8F2", ivory: "#F6F3EE", "ivory-lo": "#E4DED3", gold: "#A9AFC2", "gold-hi": "#E8EBF5", ink: "#1A1F33", seal: "#1F2A55", "seal-hi": "#3C4C8A", opal1: "#E8E3F5", opal2: "#D8F0EC", opal3: "#F5E5DC", backdrop: "#0A0E22", focus: "#E8EBF5", accent: "#3C4C8A" },
    slots: {},
  },
};

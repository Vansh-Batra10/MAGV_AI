import type { FontSpec } from "./types";
import { ensureStyles } from "./dom";

/** Injects @font-face rules for a template's fonts, served from `${base}/fonts/`. */
export function injectFonts(id: string, specs: FontSpec[], base: string): void {
  const css = specs.flatMap((s) => s.files.map((f) => `@font-face{font-family:"${s.family}";font-style:${f.style ?? "normal"};font-weight:${f.weight};font-display:swap;src:url("${base}/fonts/${f.file}") format("woff2");${f.unicodeRange ? `unicode-range:${f.unicodeRange};` : ""}}`)).join("\n");
  ensureStyles(`fonts-${id}`, css);
}

export async function fontsReady(families: string[], timeoutMs = 2500): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  const loads = families.flatMap((f) => [document.fonts.load(`400 32px "${f}"`, "Aa अ"), document.fonts.load(`700 32px "${f}"`, "Aa अ")]);
  await Promise.race([Promise.allSettled(loads), new Promise((r) => setTimeout(r, timeoutMs))]);
}

export const UNICODE = {
  latin: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
  latinExt: "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
  devanagari: "U+0900-097F,U+1CD0-1CF9,U+200C-200D,U+20A8,U+20B9,U+20F0,U+25CC,U+A830-A839,U+A8E0-A8FF,U+11B00-11B09",
} as const;

/** Helper for template manifests: latin + devanagari files for a fontsource family. */
export function fontsourceFiles(slug: string, weights: number[], opts: { devanagari?: boolean; latinExt?: boolean; italic?: boolean } = {}): FontSpec["files"] {
  const style = opts.italic ? "italic" : "normal";
  return weights.flatMap((w) => [
    { weight: w, style, subset: "latin", file: `${slug}-latin-${w}-${style}.woff2`, unicodeRange: UNICODE.latin },
    ...(opts.latinExt ? [{ weight: w, style, subset: "latin-ext", file: `${slug}-latin-ext-${w}-${style}.woff2`, unicodeRange: UNICODE.latinExt }] : []),
    ...(opts.devanagari ? [{ weight: w, style, subset: "devanagari", file: `${slug}-devanagari-${w}-${style}.woff2`, unicodeRange: UNICODE.devanagari }] : []),
  ]) as FontSpec["files"];
}

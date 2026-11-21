/**
 * Text utilities that are safe for Indic scripts.
 * Never split Devanagari (or any Indic script) into code points: matras and conjuncts break.
 */

const INDIC_RE = /[ऀ-෿਀-੿]/; // Devanagari … Malayalam, Gurmukhi
const COMBINING_RE = /^[ऀ-ःऺ-ॏ॑-ॗॢॣਁ-ਃ਼-ੑੰੱੵ̀-ͯ]/;

export function hasIndic(text: string): boolean {
  return INDIC_RE.test(text);
}

/** Extended grapheme clusters via Intl.Segmenter, with a conservative fallback that never orphans a mark. */
export function segmentGraphemes(text: string, locale = "hi"): string[] {
  const Seg = (Intl as unknown as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
  let parts: string[];
  if (Seg) parts = Array.from(new Seg(locale, { granularity: "grapheme" }).segment(text), (s) => s.segment);
  else parts = Array.from(text);
  // Merge any cluster that still starts with a combining mark or follows a virama (older ICU: no GB9c).
  const out: string[] = [];
  for (const p of parts) {
    const prev = out[out.length - 1];
    if (prev !== undefined && (COMBINING_RE.test(p) || /[्੍]$/.test(prev) || p === "‍" || p === "‌")) out[out.length - 1] = prev + p;
    else out.push(p);
  }
  return out;
}

export function segmentWords(text: string, locale = "hi"): string[] {
  const Seg = (Intl as unknown as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
  if (Seg) return Array.from(new Seg(locale, { granularity: "word" }).segment(text), (s) => s.segment);
  return text.split(/(\s+)/).filter((s) => s.length > 0);
}

/**
 * Units for per-letter style animation. Latin animates per grapheme; Indic scripts animate per word
 * (shaping like reph and half-forms can span grapheme clusters inside a word).
 */
export function animationUnits(text: string, locale = "en"): string[] {
  return hasIndic(text) ? segmentWords(text, locale) : segmentGraphemes(text, locale);
}

/** Wrap animation units in spans. Spaces stay as text nodes so wrapping still happens at word boundaries. */
export function splitIntoSpans(el: HTMLElement, text: string, locale = "en", cls = "u"): HTMLSpanElement[] {
  el.textContent = "";
  el.setAttribute("aria-label", text);
  const spans: HTMLSpanElement[] = [];
  for (const unit of animationUnits(text, locale)) {
    if (/^\s+$/.test(unit)) { el.appendChild(document.createTextNode(unit)); continue; }
    const s = document.createElement("span");
    s.className = cls;
    s.setAttribute("aria-hidden", "true");
    s.style.display = "inline-block";
    s.textContent = unit;
    el.appendChild(s);
    spans.push(s);
  }
  return spans;
}

/** Binary search the largest size in [min, max] for which `fits(size)` holds. Returns min if nothing fits. */
export function fitFontSize(fits: (size: number) => boolean, min: number, max: number, precision = 0.5): number {
  if (fits(max)) return max;
  if (!fits(min)) return min;
  let lo = min, hi = max;
  while (hi - lo > precision) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) lo = mid; else hi = mid;
  }
  return Math.floor(lo * 2) / 2;
}

/**
 * Fit text into its element's box: shrinks until it fits without overflow, wrapping only at word
 * boundaries. Names are never truncated: if even `min` overflows, `min` is used and the box may grow.
 */
export function fitTextInBox(el: HTMLElement, opts: { min: number; max: number; maxLines?: number }): number {
  el.style.overflowWrap = "normal";
  el.style.wordBreak = "keep-all";
  el.style.hyphens = "none";
  const box = el.getBoundingClientRect();
  const width = box.width || el.clientWidth;
  const maxHeight = el.dataset.fitHeight ? Number(el.dataset.fitHeight) : Infinity;
  const fits = (size: number) => {
    el.style.fontSize = `${size}px`;
    if (el.scrollWidth > Math.ceil(width) + 1) return false;
    const lh = parseFloat(getComputedStyle(el).lineHeight) || size * 1.2;
    if (opts.maxLines && el.scrollHeight > lh * opts.maxLines + 2) return false;
    return el.scrollHeight <= maxHeight + 1;
  };
  const size = fitFontSize(fits, opts.min, opts.max);
  el.style.fontSize = `${size}px`;
  return size;
}

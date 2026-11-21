import { describe, expect, it } from "vitest";
import { animationUnits, fitFontSize, hasIndic, segmentGraphemes } from "../src/text";

const COMBINING = /^[ऺ-ॏऀ-ःॢॣ]/;
const names = ["अनन्या", "रोहन", "जसप्रीत कौर संधू", "वेंकटनरसिम्हा राघवेन्द्रन", "क्षितिज", "श्रद्धा", "कृष्णा", "त्र्यंबक", "ज़ोया", "प्रियंका"];

describe("grapheme segmentation with real Hindi names", () => {
  for (const n of names) {
    it(`never orphans a matra or virama: ${n}`, () => {
      const parts = segmentGraphemes(n);
      expect(parts.join("")).toBe(n);
      for (const p of parts) expect(COMBINING.test(p), `segment "${p}" starts with a combining mark`).toBe(false);
      for (let i = 0; i < parts.length - 1; i++) expect(parts[i]!.endsWith("्"), `segment "${parts[i]}" ends with a virama`).toBe(false);
    });
  }
  it("keeps conjuncts together", () => {
    expect(segmentGraphemes("अनन्या")).toEqual(["अ", "न", "न्या"]);
    expect(segmentGraphemes("क्षितिज")).toEqual(["क्षि", "ति", "ज"]);
  });
  it("Latin is per grapheme, including emoji", () => {
    expect(segmentGraphemes("Riya 🙏🏽")).toEqual(["R", "i", "y", "a", " ", "🙏🏽"]);
  });
  it("Indic text animates per word", () => {
    expect(hasIndic("Ananya")).toBe(false);
    expect(animationUnits("जसप्रीत कौर", "hi")).toEqual(["जसप्रीत", " ", "कौर"]);
    expect(animationUnits("Ro", "en")).toEqual(["R", "o"]);
  });
});

describe("text fitting", () => {
  it("finds the largest size that fits", () => {
    // pretend text width = 0.6 * size * 20 chars, box = 300
    const size = fitFontSize((s) => s * 0.6 * 20 <= 300, 10, 64);
    expect(size).toBeGreaterThanOrEqual(24.5);
    expect(size).toBeLessThanOrEqual(25);
  });
  it("returns max when everything fits and min when nothing does", () => {
    expect(fitFontSize(() => true, 10, 64)).toBe(64);
    expect(fitFontSize(() => false, 10, 64)).toBe(10);
  });
});

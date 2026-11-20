import { describe, it, expect } from "vitest";
import { TEMPLATES } from "@/templates/registry";
import { getPath } from "@/lib/paths";

describe("template contracts", () => {
  for (const t of TEMPLATES) {
    describe(t.meta.slug, () => {
      for (const lang of ["en", "hi-Latn", "hi"] as const) {
        it(`defaults validate (${lang})`, () => {
          const r = t.schema.safeParse(t.defaults(lang));
          if (!r.success) console.error(r.error.issues);
          expect(r.success).toBe(true);
        });
        it(`canned autofill merges into a valid gift (${lang})`, () => {
          const base = t.defaults(lang);
          const merged = { ...base, ...t.cannedFill(base as never, lang) };
          expect(t.schema.safeParse(merged).success).toBe(true);
        });
      }
      it("every question points at a real field", () => {
        const d = t.defaults("en");
        for (const q of t.questions) expect(getPath(d, q.field), `${q.id} → ${q.field}`).not.toBeUndefined();
      });
      it("has 3–7 questions and localised copy", () => {
        expect(t.questions.length).toBeGreaterThanOrEqual(3);
        expect(t.questions.length).toBeLessThanOrEqual(7);
        for (const q of t.questions) for (const l of ["en", "hi-Latn", "hi"] as const) expect(q.prompt[l]).toBeTruthy();
      });
    });
  }
});

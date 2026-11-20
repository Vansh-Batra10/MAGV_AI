/** Server- and client-safe template registry (no renderers here — see renderers.tsx). */
import quickSurprise from "./quick-surprise/def";
import laalDhaaga from "./laal-dhaaga/def";
import midnightBirthday from "./midnight-birthday/def";
import sorryMeter from "./sorry-wala-meter/def";
import snowGlobe from "./snow-globe/def";
import ourYear from "./our-year-rewound/def";
import sabKi from "./sab-ki-taraf-se/def";
import type { TemplateDef } from "./types";
import { RELEASE } from "@/config/occasions";

export const TEMPLATES: TemplateDef[] = [sabKi, laalDhaaga, midnightBirthday, snowGlobe, ourYear, sorryMeter, quickSurprise];

export const TEMPLATE_SLUGS = TEMPLATES.map((t) => t.meta.slug);

export function getTemplate(slug: string): TemplateDef | undefined {
  return TEMPLATES.find((t) => t.meta.slug === slug);
}

export function liveTemplates(): TemplateDef[] {
  return TEMPLATES.filter((t) => t.meta.release <= RELEASE);
}

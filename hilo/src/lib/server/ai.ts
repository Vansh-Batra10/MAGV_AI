import "server-only";
import { complete, extractJson } from "./adapters/llm";
import { getTemplate } from "@/templates/registry";
import type { GiftLanguage, Market } from "@/config/markets";
import { moderate } from "./moderation";

/** Voice guide (BUILD_SPEC §19.3) + 3 examples per language, sent with every prompt. */
const VOICE: Record<GiftLanguage, string> = {
  "hi-Latn": `Write in Hinglish (Roman-script Hindi mixed with English, the way young Indians actually text). Playful, Bollywood-warm, never cringe. Never quote film lyrics or dialogue.
Examples: "Kuch baatein text mein nahi aati." / "Thoda aur manao." / "Pehle cake, speeches baad mein."`,
  hi: `Write in simple, warm, conversational Hindi (Devanagari). Avoid heavy Sanskritised words.
Examples: "कुछ बातें टेक्स्ट में नहीं आतीं।" / "पहले केक, बातें बाद में।" / "जल्दी एक ही घड़ी होगी।"`,
  en: `Write in warm, witty, slightly poetic natural English. No Hinglish, no Indian-only idioms, no "kindly".
Examples: "Some things don't fit in a text." / "Cake first, speeches later." / "Soon it'll be the same clock."`,
};

export async function autofill(templateSlug: string, answers: Record<string, unknown>, lang: GiftLanguage, market: Market) {
  const tpl = getTemplate(templateSlug);
  if (!tpl) throw new Error("unknown_template");
  const canned = tpl.cannedFill(answers as never, lang);
  const fields = Object.entries(tpl.aiFields).map(([k, d]) => `- ${k}: ${d}`).join("\n");
  const system = `You write the text inside a personal digital gift ("${tpl.meta.name.en}"). ${VOICE[lang]}
Market: ${market === "IN" ? "India" : "global"}. Only use facts the sender gave; never invent names, places or events. Keep it kind and safe; no explicit content.
Respond with ONLY a JSON object with these keys:\n${fields}`;
  const user = `Sender's answers (JSON):\n${JSON.stringify(answers).slice(0, 4000)}`;
  const out = extractJson<Record<string, unknown>>(await complete({ system, user, maxTokens: 1400 }));
  if (!out) return { fields: canned, source: "canned" as const };
  // Only accept known keys, validated against the template schema when merged.
  const merged: Record<string, unknown> = { ...canned };
  for (const k of Object.keys(tpl.aiFields)) if (k in out) merged[k] = out[k];
  if (!moderate(JSON.stringify(merged)).ok) return { fields: canned, source: "canned" as const };
  const check = tpl.schema.safeParse({ ...tpl.defaults(lang), ...answers, ...merged });
  return check.success ? { fields: merged, source: "llm" as const } : { fields: canned, source: "canned" as const };
}

const TONES = { sweet: "sweet and tender", filmy: "dramatic and filmy (without quoting any real film)", poetic: "poetic and lyrical", funny: "funny and teasing but loving" } as const;

export async function writeLetter(input: { feelings: string; tone: keyof typeof TONES; lang: GiftLanguage; to: string; from: string }) {
  if (!moderate(input.feelings).ok) return { letter: null, error: "content_not_allowed" };
  const system = `You draft a love letter the sender will edit. Tone: ${TONES[input.tone]}. ${VOICE[input.lang]} 120–200 words. Plain text, no markdown. Never invent facts beyond the sender's notes.`;
  const text = await complete({ system, user: `To: ${input.to}\nFrom: ${input.from}\nSender's notes:\n${input.feelings.slice(0, 2000)}`, maxTokens: 700 });
  if (text) return { letter: text, source: "llm" };
  const canned: Record<GiftLanguage, string> = {
    en: `${input.to},\nI've tried to write this a few times. Here's the honest version: ${input.feelings.trim()}\nYou make ordinary days feel like something worth remembering. Thank you for being exactly you.\nAlways,\n${input.from}`,
    "hi-Latn": `${input.to},\nYe likhne ki kai baar koshish ki. Seedhi baat ye hai: ${input.feelings.trim()}\nTumhare saath normal din bhi yaad rakhne layak ban jaate hain. Bas tum aise hi rehna.\nHamesha,\n${input.from}`,
    hi: `${input.to},\nये लिखने की कई बार कोशिश की। सीधी बात ये है: ${input.feelings.trim()}\nतुम्हारे साथ आम दिन भी याद रखने लायक बन जाते हैं।\nहमेशा,\n${input.from}`,
  };
  return { letter: canned[input.lang], source: "canned" };
}

import { z } from "zod";
import type { TemplateDef } from "../types";
import { by, DEMO, L, name, Q, url } from "../common";
import { FREE_TIER } from "@/config/pricing";

export const schema = z.object({
  recipientName: name(),
  senderName: name(),
  photo: url.optional().default(""),
  message: z.string().max(FREE_TIER.messageMax).default(""),
});
export type Content = z.infer<typeof schema>;

const def: TemplateDef<Content> = {
  meta: {
    slug: "quick-surprise",
    name: L("Quick Surprise", "Quick Surprise", "झटपट सरप्राइज़"),
    tagline: L("One photo, one message, one heart. Free for 24 hours.", "Ek photo, ek message, ek dil. 24 ghante free.", "एक तस्वीर, एक संदेश। 24 घंटे मुफ़्त।"),
    occasion: ["birthday", "miss-you", "sorry", "love-letter", "christmas", "new-year", "thanksgiving"],
    moods: ["cute", "emotional"],
    relations: ["partner", "maa", "papa", "sibling", "friend"],
    mode: "individual", tier: "free", photosMax: 1, supportsVoice: false, supportsMusic: false,
    glow: "rose", theme: "night", estMinutes: 1, isNew: false, release: 1,
    inside: [L("Tap-to-open envelope", "Tap karke khulne wala envelope", "टैप से खुलने वाला लिफ़ाफ़ा"), L("One photo reveal", "Ek photo reveal", "एक तस्वीर"), L("Your message, typed out", "Tumhara message, type hota hua", "आपका संदेश"), L("Heart burst + reply", "Heart burst + reply", "दिल + जवाब")],
    demoPoster: DEMO.cafe,
  },
  schema,
  questions: [
    { id: "name", field: "recipientName", kind: "text", prompt: Q.recipient, hint: Q.recipientHint, placeholder: L("Meera", "Meera", "मीरा"), max: 40 },
    { id: "photo", field: "photo", kind: "photos", prompt: L("Pick one photo", "Ek photo chuno", "एक तस्वीर चुनें"), hint: L("Free gifts hold one photo.", "Free gift mein ek photo aati hai.", "मुफ़्त गिफ़्ट में एक तस्वीर।"), max: 1, optional: true },
    { id: "message", field: "message", kind: "textarea", prompt: L("What do you want to say?", "Kya kehna hai?", "क्या कहना है?"), hint: L("Up to 280 characters.", "280 characters tak.", "280 अक्षर तक।"), max: FREE_TIER.messageMax },
    { id: "sender", field: "senderName", kind: "text", prompt: Q.sender, max: 40 },
  ],
  defaults: (lang) => ({
    recipientName: "Meera",
    senderName: "Aarav",
    photo: DEMO.cafe,
    message: by(lang, {
      en: "Two cups, one table, and somehow you still steal my fries. Thinking of you today. ☕",
      "hi-Latn": "Do cups, ek table, aur phir bhi tum meri fries chura leti ho. Aaj bas tumhari yaad aa rahi thi. ☕",
      hi: "दो कप, एक टेबल, और फिर भी तुम मेरी फ्राइज़ चुरा लेती हो। आज बस तुम्हारी याद आ रही थी। ☕",
    }),
  }),
  aiFields: { message: "A warm, short message (max 260 chars) in the sender's voice." },
  cannedFill: (a, lang) => ({
    message: a.message || by(lang, {
      en: `Hey ${a.recipientName || "you"} — no reason, no occasion. Just wanted you to know you made my day better. ♥`,
      "hi-Latn": `${a.recipientName || "Suno"}, koi reason nahi, koi occasion nahi. Bas batana tha ki tumse din accha ho jaata hai. ♥`,
      hi: `${a.recipientName || "सुनो"}, कोई वजह नहीं, कोई मौका नहीं। बस बताना था कि तुमसे दिन अच्छा हो जाता है। ♥`,
    }),
  }),
};
export default def;

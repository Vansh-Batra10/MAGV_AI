import { z } from "zod";
import type { TemplateDef } from "../types";
import { by, DEMO, L, name, Q, url } from "../common";

export const schema = z.object({
  recipientName: name(),
  senderName: name(),
  apology: z.string().max(240).default(""),
  memoryPhoto: url.optional().default(""),
  memoryCaption: z.string().max(140).default(""),
  promise: z.string().max(200).default(""),
  bribe: z.string().max(80).default(""),
  extraScene: z.string().max(160).default(""),
});
export type Content = z.infer<typeof schema>;

const def: TemplateDef<Content> = {
  meta: {
    slug: "sorry-wala-meter",
    name: { ...L("The Sorry Meter", "Sorry Wala Meter", "सॉरी वाला मीटर"), global: "The Sorry Meter" },
    tagline: L("Watch the anger meter drop, one honest scene at a time.", "Gussa meter dheere dheere neeche aata hai, ek ek scene ke saath.", "गुस्सा मीटर धीरे-धीरे नीचे आता है।"),
    occasion: ["sorry"],
    moods: ["funny", "cute"],
    relations: ["partner", "sibling", "friend"],
    mode: "individual", tier: "mini", photosMax: 1, supportsVoice: false, supportsMusic: false,
    glow: "rose", theme: "night", estMinutes: 2, isNew: false, release: 1,
    inside: [L("A 'mood meter' starting at 100%", "100% se shuru hota Gussa Meter", "100% से गुस्सा मीटर"), L("Apology, memory, promise, bribe", "Sorry, yaad, promise, rishwat", "माफ़ी, याद, वादा, रिश्वत"), L("'Forgiven?' — with a gentle 'let's talk later'", "'Maaf kiya?' — aur 'baad mein baat karte hain' bhi", "'माफ़ किया?'"), L("Their answer comes back to you", "Unka jawab tumhe milta hai", "उनका जवाब आपको मिलेगा")],
    demoPoster: DEMO.rain,
  },
  schema,
  questions: [
    { id: "name", field: "recipientName", kind: "text", prompt: L("Who are you saying sorry to?", "Kisko manana hai?", "किसे मनाना है?"), placeholder: L("Riya", "Riya", "रिया"), max: 40 },
    { id: "apology", field: "apology", kind: "textarea", prompt: L("What are you sorry for? Say it simply.", "Kis baat ka sorry hai? Seedha bolo.", "किस बात की माफ़ी? सीधा कहें।"), hint: Q.lineHint, max: 240 },
    { id: "photo", field: "memoryPhoto", kind: "photos", prompt: L("A photo of a good day together", "Saath ka ek accha din, photo mein", "साथ के अच्छे दिन की तस्वीर"), max: 1, optional: true },
    { id: "bribe", field: "bribe", kind: "text", prompt: L("And the bribe? 😇", "Aur rishwat? 😇", "और रिश्वत? 😇"), placeholder: L("1 plate momos, owed", "1 plate momos, udhaar", "1 प्लेट मोमोज़, उधार"), optional: true, max: 80 },
    { id: "sender", field: "senderName", kind: "text", prompt: Q.sender, max: 40 },
  ],
  defaults: (lang) => ({
    recipientName: "Riya",
    senderName: "Vihaan",
    apology: by(lang, { en: "I'm sorry I made you wait and then acted like it was nothing. It wasn't nothing.", "hi-Latn": "Sorry, maine tumhe wait karwaya aur phir aise behave kiya jaise kuch hua hi nahi. Hua tha.", hi: "माफ़ करना, मैंने तुम्हें इंतज़ार करवाया और फिर ऐसे जताया जैसे कुछ हुआ ही नहीं। हुआ था।" }),
    memoryPhoto: DEMO.rain,
    memoryCaption: by(lang, { en: "Remember this rainy evening? You laughed at my umbrella for an hour.", "hi-Latn": "Ye baarish wali shaam yaad hai? Mere chhaate pe tum ek ghanta hasi thi.", hi: "ये बारिश वाली शाम याद है? मेरे छाते पर तुम घंटे भर हँसी थीं।" }),
    promise: by(lang, { en: "Next time, I'll say it before you have to ask.", "hi-Latn": "Agli baar, tumhare poochne se pehle bolunga.", hi: "अगली बार, तुम्हारे पूछने से पहले कहूँगा।" }),
    bribe: by(lang, { en: "1 plate of momos, owed with interest", "hi-Latn": "1 plate momos, byaaj ke saath", hi: "1 प्लेट मोमोज़, ब्याज समेत" }),
    extraScene: by(lang, { en: "Okay, final offer: momos AND I'll watch your comfort show without complaining. Twice.", "hi-Latn": "Theek hai, final offer: momos AUR tumhara comfort show bina complain kiye. Do baar.", hi: "ठीक है, आख़िरी ऑफ़र: मोमोज़ और तुम्हारा पसंदीदा शो बिना शिकायत। दो बार।" }),
  }),
  aiFields: {
    memoryCaption: "A short, warm caption (max 120 chars) recalling a good moment, without inventing specifics.",
    promise: "A sincere, concrete promise (max 140 chars).",
    extraScene: "A cute, funny 'final offer' line (max 140 chars) that extends the bribe.",
  },
  cannedFill: (a, lang) => ({
    memoryCaption: by(lang, { en: "Us, on a better day. I'd like more of those.", "hi-Latn": "Hum, ek acche din pe. Aise aur din chahiye.", hi: "हम, एक अच्छे दिन। ऐसे और दिन चाहिए।" }),
    promise: by(lang, { en: "I'll listen first and explain later. Promise.", "hi-Latn": "Pehle sununga, baad mein samjhaunga. Promise.", hi: "पहले सुनूँगा, बाद में समझाऊँगा। वादा।" }),
    bribe: a.bribe || by(lang, { en: "Dessert of your choice, owed", "hi-Latn": "Tumhari pasand ka dessert, udhaar", hi: "तुम्हारी पसंद की मिठाई, उधार" }),
    extraScene: by(lang, { en: `Final offer: ${a.bribe || "dessert"} AND you pick the movie. Twice.`, "hi-Latn": `Final offer: ${a.bribe || "dessert"} AUR movie tum chunogi. Do baar.`, hi: `आख़िरी ऑफ़र: ${a.bribe || "मिठाई"} और फ़िल्म तुम चुनोगी।` }),
  }),
};
export default def;

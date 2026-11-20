import { z } from "zod";
import type { Contribution, TemplateDef } from "../types";
import { by, DEMO, L, name, Q, url } from "../common";

export const schema = z.object({
  recipientName: name(),
  senderName: name(), // organiser
  variant: z.enum(["birthday", "anniversary", "farewell", "festival", "thanks"]).default("birthday"),
  headline: z.string().max(80).default(""),
  coverPhoto: url.optional().default(""),
  organiserNote: z.string().max(500).default(""),
  creditsTitle: z.string().max(40).default(""),
  sample: z.array(z.object({ id: z.string(), name: z.string(), message: z.string(), photoUrl: z.string().nullable().optional(), voiceUrl: z.string().nullable().optional() })).optional(),
});
export type Content = z.infer<typeof schema>;

export function sampleContributions(lang: "en" | "hi-Latn" | "hi"): Contribution[] {
  const msgs = by(lang, {
    en: [
      ["Kabir", "Happy birthday to the only person who replies to memes with essays. Never change.", DEMO.friends],
      ["Ananya", "You held my hand through the worst semester of my life. I owe you forever (and ₹400).", null],
      ["Rohan", "Best travel partner, worst map reader. Here's to more wrong turns together!", DEMO.mountain],
      ["Sara", "Thank you for being the friend who shows up. Every. Single. Time. 💛", null],
      ["Dev", "Remember the cake disaster of 2024? Still the best birthday. Love you, idiot.", DEMO.cake],
      ["Meher", "You make every group chat 40% louder and 100% better.", DEMO.fairy],
      ["Arjun", "Happiest birthday! Free coffee on me this month — no expiry.", null],
      ["Tanvi", "To many more 2 AM rooftop talks. 🌙", DEMO.city],
    ],
    "hi-Latn": [
      ["Kabir", "Happy birthday us insaan ko jo memes ka reply essay mein deta hai. Kabhi mat badalna.", DEMO.friends],
      ["Ananya", "Mere sabse bure semester mein tune haath pakda. Hamesha ki karzdaar hoon (aur ₹400 ki bhi).", null],
      ["Rohan", "Best travel partner, worst map reader. Aur galat raston ke naam!", DEMO.mountain],
      ["Sara", "Shukriya hamesha aane ke liye. Har. Ek. Baar. 💛", null],
      ["Dev", "2024 ka cake disaster yaad hai? Phir bhi best birthday. Love you, pagal.", DEMO.cake],
      ["Meher", "Tu har group chat ko 40% loud aur 100% better bana deti hai.", DEMO.fairy],
      ["Arjun", "Happy birthday! Is mahine coffee meri taraf se — no expiry.", null],
      ["Tanvi", "Aur bahut saari raat 2 baje wali rooftop baatein. 🌙", DEMO.city],
    ],
    hi: [
      ["कबीर", "जन्मदिन मुबारक उसे जो मीम्स का जवाब निबंध में देता है। कभी मत बदलना।", DEMO.friends],
      ["अनन्या", "मेरे सबसे बुरे सेमेस्टर में तूने हाथ थामा। हमेशा की कर्ज़दार हूँ।", null],
      ["रोहन", "बेस्ट ट्रैवल पार्टनर, वर्स्ट मैप रीडर। और ग़लत रास्तों के नाम!", DEMO.mountain],
      ["सारा", "शुक्रिया हमेशा आने के लिए। हर। एक। बार। 💛", null],
      ["देव", "2024 का केक हादसा याद है? फिर भी बेस्ट जन्मदिन।", DEMO.cake],
      ["मेहर", "तू हर ग्रुप चैट को 40% ज़ोरदार और 100% बेहतर बनाती है।", DEMO.fairy],
      ["अर्जुन", "जन्मदिन मुबारक! इस महीने कॉफ़ी मेरी तरफ़ से।", null],
      ["तन्वी", "और बहुत सारी रात 2 बजे वाली छत की बातें। 🌙", DEMO.city],
    ],
  });
  return msgs.map(([n, m, p], i) => ({ id: `s${i}`, name: n as string, message: m as string, photoUrl: p as string | null, voiceUrl: null }));
}

const def: TemplateDef<Content> = {
  meta: {
    slug: "sab-ki-taraf-se",
    name: { ...L("From All of Us", "Sab Ki Taraf Se", "सब की तरफ़ से"), global: "From All of Us" },
    tagline: L("One link. Everyone's messages, photos and voice notes. One big surprise.", "Ek link. Sabke messages, photos, voice notes. Ek bada surprise.", "एक लिंक। सबके संदेश। एक बड़ा सरप्राइज़।"),
    occasion: ["group-gifts", "birthday", "anniversary", "christmas", "new-year", "thanksgiving", "diwali", "eid", "mothers-day", "fathers-day", "friendship-day"],
    moods: ["emotional", "funny", "cute"],
    relations: ["group", "friend", "maa", "papa", "sibling", "partner"],
    mode: "group", tier: "group", photosMax: 1, supportsVoice: true, supportsMusic: false,
    glow: "rose", theme: "night", estMinutes: 2, isNew: true, release: 1,
    inside: [L("A contribution link anyone can use — no sign-up", "Contribution link — koi sign-up nahi", "कोई साइन-अप नहीं"), L("Polaroids & notes on a starry corkboard", "Taaron bhare corkboard par polaroids", "पोलरॉइड और नोट्स"), L("Voice notes with waveforms", "Waveform wale voice notes", "वॉइस नोट्स"), L("Heart mosaic of every photo", "Har photo se bana heart mosaic", "दिल वाला मोज़ेक"), L("Names roll like movie credits", "Movie credits ki tarah naam", "फ़िल्मी क्रेडिट्स")],
    demoPoster: DEMO.friends,
  },
  schema,
  questions: [
    { id: "name", field: "recipientName", kind: "text", prompt: L("Who's the surprise for?", "Surprise kiske liye hai?", "सरप्राइज़ किसके लिए है?"), placeholder: L("Riya", "Riya", "रिया"), max: 40 },
    { id: "variant", field: "variant", kind: "choice", prompt: L("What's the occasion?", "Occasion kya hai?", "मौका क्या है?"), choices: [
      { value: "birthday", label: L("Birthday", "Birthday", "जन्मदिन") },
      { value: "anniversary", label: L("Anniversary", "Anniversary", "सालगिरह") },
      { value: "farewell", label: L("Farewell", "Farewell", "विदाई") },
      { value: "festival", label: L("Festival", "Festival", "त्योहार") },
      { value: "thanks", label: L("Thank you", "Thank you", "शुक्रिया") },
    ] },
    { id: "cover", field: "coverPhoto", kind: "photos", prompt: L("A cover photo of them (optional)", "Unki ek cover photo (optional)", "उनकी एक कवर तस्वीर"), max: 1, optional: true },
    { id: "note", field: "organiserNote", kind: "textarea", prompt: L("Your own message first", "Pehle tumhara message", "पहले आपका संदेश"), hint: L("Everyone else adds theirs with the link.", "Baaki sab link se apna daalenge.", "बाकी सब लिंक से जोड़ेंगे।"), max: 500 },
    { id: "sender", field: "senderName", kind: "text", prompt: L("Your name (the organiser)", "Tumhara naam (organiser)", "आपका नाम (आयोजक)"), max: 40 },
  ],
  defaults: (lang) => ({
    recipientName: "Riya",
    senderName: "Tanvi",
    variant: "birthday",
    headline: by(lang, { en: "{n} people made this for you", "hi-Latn": "{n} logon ne ye tumhare liye banaya", hi: "{n} लोगों ने ये तुम्हारे लिए बनाया" }),
    coverPhoto: DEMO.friends,
    organiserNote: by(lang, { en: "We couldn't all be there at midnight, so we brought midnight to you. Happy birthday, Riya!", "hi-Latn": "Hum sab midnight pe saath nahi ho sakte the, toh midnight tumhare paas le aaye. Happy birthday, Riya!", hi: "हम सब आधी रात को साथ नहीं हो सकते थे, तो आधी रात तुम्हारे पास ले आए।" }),
    creditsTitle: by(lang, { en: "From all of us ♥", "hi-Latn": "Sab ki taraf se ♥", hi: "सब की तरफ़ से ♥" }),
    sample: sampleContributions(lang),
  }),
  aiFields: { headline: "Short headline with {n} placeholder for number of people.", creditsTitle: "3–5 word credits title ending with ♥." },
  cannedFill: (_a, lang) => ({
    headline: by(lang, { en: "{n} people made this for you", "hi-Latn": "{n} logon ne ye tumhare liye banaya", hi: "{n} लोगों ने ये तुम्हारे लिए बनाया" }),
    creditsTitle: by(lang, { en: "From all of us ♥", "hi-Latn": "Sab ki taraf se ♥", hi: "सब की तरफ़ से ♥" }),
    sample: sampleContributions(lang),
  }),
};
export default def;

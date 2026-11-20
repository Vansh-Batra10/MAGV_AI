import { z } from "zod";
import type { TemplateDef } from "../types";
import { by, city, DEMO, L, name, photos, Q, song, url } from "../common";

export const schema = z.object({
  recipientName: name(),
  nickname: name(30).optional().default(""),
  senderName: name(),
  yourCity: city,
  theirCity: city,
  photos: photos(8),
  captions: z.array(z.string().max(60)).max(8).default([]),
  threadLine: z.string().max(120).default(""),
  letter: z.string().max(1200).default(""),
  voiceUrl: url.optional().default(""),
  song,
  finale: z.string().max(80).default(""),
});
export type Content = z.infer<typeof schema>;

const toronto = { name: "Toronto", tz: "America/Toronto", lat: 43.65, lon: -79.38, country: "CA" };
const mumbai = { name: "Mumbai", tz: "Asia/Kolkata", lat: 19.08, lon: 72.88, country: "IN" };

const def: TemplateDef<Content> = {
  meta: {
    slug: "laal-dhaaga",
    name: { ...L("Red Thread", "Laal Dhaaga", "लाल धागा"), global: "Red Thread" },
    tagline: L("Two cities, one thread. For the ones who love across time zones.", "Do shehar, ek dhaaga. Time zones ke paar wale pyaar ke liye.", "दो शहर, एक धागा।"),
    occasion: ["long-distance", "miss-you", "anniversary", "christmas", "new-year", "valentines-week", "raksha-bandhan"],
    moods: ["emotional", "filmy"],
    relations: ["partner", "maa", "papa", "sibling", "friend"],
    mode: "individual", tier: "classic", photosMax: 8, supportsVoice: true, supportsMusic: true,
    glow: "lavender", theme: "night", estMinutes: 3, isNew: true, release: 1,
    inside: [L("Live clocks in both cities", "Dono shehron ki live ghadi", "दोनों शहरों की घड़ी"), L("A thread across the night globe", "Raat ke globe par dhaaga", "रात के ग्लोब पर धागा"), L("Photos rising as lanterns", "Lanterns ki tarah udti photos", "लालटेन जैसी तस्वीरें"), L("Your letter + voice note", "Tumhara letter + voice note", "आपका पत्र + आवाज़"), L("Same moon, two cities", "Same chaand, do shehar", "एक चाँद, दो शहर")],
    demoPoster: DEMO.moon,
  },
  schema,
  questions: [
    { id: "name", field: "recipientName", kind: "text", prompt: Q.recipient, hint: Q.recipientHint, placeholder: L("Meera", "Meera", "मीरा"), max: 40 },
    { id: "nick", field: "nickname", kind: "text", prompt: Q.nickname, hint: Q.nicknameHint, optional: true, max: 30 },
    { id: "cities", field: "yourCity", kind: "city", prompt: L("Where are you two?", "Tum dono kahan ho?", "आप दोनों कहाँ हैं?"), hint: L("Your city, then theirs. We'll show both clocks.", "Pehle tumhara shehar, phir unka. Dono ghadiyan dikhayenge.", "पहले आपका शहर, फिर उनका।") },
    { id: "photos", field: "photos", kind: "photos", prompt: Q.photos, hint: Q.photosHint, max: 8, min: 1 },
    { id: "line", field: "threadLine", kind: "textarea", prompt: Q.line, hint: Q.lineHint, max: 120 },
    { id: "song", field: "song.url", kind: "song", prompt: Q.song, hint: Q.songHint, optional: true },
    { id: "sender", field: "senderName", kind: "text", prompt: Q.sender, max: 40 },
  ],
  defaults: (lang) => ({
    recipientName: "Meera",
    nickname: by(lang, { en: "Mee", "hi-Latn": "Meeru", hi: "मीरू" }),
    senderName: "Aarav",
    yourCity: toronto,
    theirCity: mumbai,
    photos: [DEMO.sunset, DEMO.cafe, DEMO.fairy, DEMO.mountain, DEMO.rain],
    captions: by(lang, {
      en: ["Goa, the first trip", "Our café", "Diwali at yours", "That road trip", "Monsoon calls"],
      "hi-Latn": ["Goa, pehli trip", "Apna café", "Tumhare ghar ki Diwali", "Wo road trip", "Baarish wali calls"],
      hi: ["गोवा, पहली ट्रिप", "अपना कैफ़े", "तुम्हारे घर की दिवाली", "वो रोड ट्रिप", "बारिश वाली कॉल्स"],
    }),
    threadLine: by(lang, {
      en: "There's a thread between us that no distance has ever managed to cut.",
      "hi-Latn": "Hamare beech ek dhaaga hai jo koi distance kaat nahi paaya.",
      hi: "हमारे बीच एक धागा है जिसे कोई दूरी काट नहीं पाई।",
    }),
    letter: by(lang, {
      en: "Mee,\nIt's 9:30 here and 8 in the morning there, and I still check the weather in your city before mine. I miss the small things — your voice notes that start with 'okay so', the way you say goodnight twice.\nCount the days with me. Soon it'll be the same clock.",
      "hi-Latn": "Meeru,\nYahan raat ke 9:30 hain aur wahan subah ke 8, phir bhi main pehle tumhare shehar ka weather check karta hoon. Choti choti cheezein yaad aati hain — tumhare 'acha suno' wale voice notes, do baar goodnight bolna.\nDin ginte raho mere saath. Jaldi ek hi ghadi hogi.",
      hi: "मीरू,\nयहाँ रात के 9:30 हैं और वहाँ सुबह के 8, फिर भी मैं पहले तुम्हारे शहर का मौसम देखता हूँ। छोटी-छोटी बातें याद आती हैं।\nदिन गिनते रहो मेरे साथ। जल्दी एक ही घड़ी होगी।",
    }),
    voiceUrl: "",
    song: { url: "", title: "" },
    finale: by(lang, { en: "Same moon, two cities.", "hi-Latn": "Same chaand, do shehar.", hi: "एक चाँद, दो शहर।" }),
  }),
  aiFields: {
    threadLine: "One short poetic line (max 110 chars) about the thread connecting them across the distance.",
    captions: "Array of short captions (max 40 chars each), one per photo, warm and specific-sounding but not inventing facts.",
    letter: "A heartfelt letter (90–160 words) to the recipient about missing them across two cities, using their nickname if given.",
    finale: "A 3–6 word finale line, like 'Same moon, two cities.'",
  },
  cannedFill: (a, lang) => {
    const nick = a.nickname || a.recipientName || "";
    const n = a.photos?.length ?? 0;
    const caps = by(lang, {
      en: ["Us, somewhere good", "The day I knew", "Still my favourite", "Remember this?", "Home, in a photo", "This one, always", "Laughing again", "Soon, again"],
      "hi-Latn": ["Hum, kahin acche jagah", "Jis din pata chala", "Abhi bhi favourite", "Yaad hai ye?", "Ghar, ek photo mein", "Ye wali, hamesha", "Phir se hasna", "Jaldi, phir se"],
      hi: ["हम, किसी अच्छी जगह", "जिस दिन पता चला", "अब भी पसंदीदा", "याद है ये?", "घर, एक तस्वीर में", "ये वाली, हमेशा", "फिर से हँसना", "जल्दी, फिर से"],
    });
    return {
      captions: caps.slice(0, n),
      letter: by(lang, {
        en: `${nick},\n${a.threadLine ? a.threadLine + "\n" : ""}Our clocks never agree, but I've stopped minding. I've learned your morning from my night, your weather from my window. Every call is a small trip home.\nThis is me pulling the thread, gently — so you know I'm right here at the other end.`,
        "hi-Latn": `${nick},\n${a.threadLine ? a.threadLine + "\n" : ""}Hamari ghadiyan kabhi match nahi karti, par ab bura nahi lagta. Meri raat se tumhari subah samajh aati hai. Har call ek chhota sa ghar jaana hai.\nYe main dhaaga thoda sa kheench raha hoon — taaki pata rahe main doosri taraf yahin hoon.`,
        hi: `${nick},\n${a.threadLine ? a.threadLine + "\n" : ""}हमारी घड़ियाँ कभी मेल नहीं खातीं, पर अब बुरा नहीं लगता। हर कॉल एक छोटा सा घर जाना है।\nये मैं धागा थोड़ा सा खींच रहा हूँ — ताकि पता रहे कि मैं दूसरी तरफ़ यहीं हूँ।`,
      }),
      finale: by(lang, { en: "Same moon, two cities.", "hi-Latn": "Same chaand, do shehar.", hi: "एक चाँद, दो शहर।" }),
      threadLine: a.threadLine || by(lang, { en: "No distance has ever cut this thread.", "hi-Latn": "Koi distance ye dhaaga nahi kaat paaya.", hi: "कोई दूरी ये धागा नहीं काट पाई।" }),
    };
  },
};
export default def;

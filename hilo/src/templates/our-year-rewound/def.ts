import { z } from "zod";
import type { TemplateDef } from "../types";
import { by, DEMO, L, name, Q, song, url } from "../common";

export const schema = z.object({
  recipientName: name(),
  senderName: name(),
  year: z.coerce.number().int().min(2000).max(2100).default(2026),
  stats: z.array(z.object({ label: z.string().max(40), value: z.coerce.number().min(0).max(99999999), suffix: z.string().max(12).default("") })).max(5),
  memories: z.array(z.object({ photo: url, caption: z.string().max(80) })).max(5),
  mostSaidWord: z.string().max(30).default(""),
  song,
  promises: z.array(z.string().max(80)).max(5),
  closing: z.string().max(160).default(""),
});
export type Content = z.infer<typeof schema>;

const def: TemplateDef<Content> = {
  meta: {
    slug: "our-year-rewound",
    name: L("Our Year, Rewound", "Our Year, Rewound", "हमारा साल, रिवाइंड"),
    tagline: L("Your year together as a story — big numbers, top memories, next year's promises.", "Tumhara saal ek story mein — bade numbers, top memories, agle saal ke promises.", "आपका साल एक कहानी में।"),
    occasion: ["new-year", "anniversary", "long-distance"],
    moods: ["filmy", "emotional", "funny"],
    relations: ["partner", "friend", "sibling", "maa", "papa"],
    mode: "individual", tier: "premium", photosMax: 5, supportsVoice: false, supportsMusic: true,
    glow: "rose", theme: "night", estMinutes: 4, isNew: true, release: 1,
    inside: [L("Story format with tap-to-skip", "Story format, tap se aage", "स्टोरी फ़ॉर्मैट"), L("Big-number stats that count up", "Count-up hote bade numbers", "बड़े नंबर"), L("Top 5 memories with Ken Burns motion", "Top 5 yaadein, cinematic motion", "टॉप 5 यादें"), L("Song of the year", "Saal ka gaana", "साल का गाना"), L("Next year's promises + fireworks", "Agle saal ke promises + fireworks", "अगले साल के वादे")],
    demoPoster: DEMO.fairy,
  },
  schema,
  questions: [
    { id: "name", field: "recipientName", kind: "text", prompt: Q.recipient, hint: Q.recipientHint, placeholder: L("Ishaan", "Ishaan", "ईशान"), max: 40 },
    { id: "photos", field: "memories", kind: "photos", prompt: L("Your top 5 memories this year", "Is saal ki top 5 yaadein", "इस साल की टॉप 5 यादें"), hint: Q.photosHint, max: 5, min: 1, photoKey: "photo" },
    { id: "days", field: "stats.0.value", kind: "number", prompt: L("How many days have you been together?", "Kitne din se saath ho?", "कितने दिन से साथ हो?"), hint: L("Roughly is fine. We'll make it look huge.", "Andaaza bhi chalega. Hum use bada dikhayenge.", "अंदाज़ा भी चलेगा।"), min: 0, max: 99999 },
    { id: "word", field: "mostSaidWord", kind: "text", prompt: L("The word you two said most this year?", "Is saal sabse zyada bola gaya word?", "इस साल सबसे ज़्यादा बोला गया शब्द?"), placeholder: L("'Wait, what?'", "'Acha suno'", "'अच्छा सुनो'"), optional: true, max: 30 },
    { id: "song", field: "song.url", kind: "song", prompt: L("Song of the year? (optional)", "Saal ka gaana? (optional)", "साल का गाना? (वैकल्पिक)"), hint: Q.songHint, optional: true },
    { id: "line", field: "closing", kind: "textarea", prompt: Q.line, hint: Q.lineHint, max: 160 },
    { id: "sender", field: "senderName", kind: "text", prompt: Q.sender, max: 40 },
  ],
  defaults: (lang) => ({
    recipientName: "Ishaan",
    senderName: "Tara",
    year: 2026,
    stats: by(lang, {
      en: [{ label: "days together", value: 365, suffix: "" }, { label: "days apart", value: 112, suffix: "" }, { label: "video calls", value: 418, suffix: "" }, { label: "kilometres travelled to each other", value: 14200, suffix: "km" }],
      "hi-Latn": [{ label: "din saath", value: 365, suffix: "" }, { label: "din door", value: 112, suffix: "" }, { label: "video calls", value: 418, suffix: "" }, { label: "km ek doosre tak", value: 14200, suffix: "km" }],
      hi: [{ label: "दिन साथ", value: 365, suffix: "" }, { label: "दिन दूर", value: 112, suffix: "" }, { label: "वीडियो कॉल", value: 418, suffix: "" }, { label: "किलोमीटर एक-दूसरे तक", value: 14200, suffix: "km" }],
    }),
    memories: by(lang, {
      en: [{ photo: DEMO.mountain, caption: "The road trip with no plan" }, { photo: DEMO.fairy, caption: "Fairy lights, finally up" }, { photo: DEMO.city, caption: "Rooftop new year" }, { photo: DEMO.picnic, caption: "Picnic, 40% rain" }, { photo: DEMO.sunset, caption: "That sunset" }],
      "hi-Latn": [{ photo: DEMO.mountain, caption: "Bina plan wali road trip" }, { photo: DEMO.fairy, caption: "Fairy lights finally lag gayi" }, { photo: DEMO.city, caption: "Rooftop wala new year" }, { photo: DEMO.picnic, caption: "Picnic, 40% baarish" }, { photo: DEMO.sunset, caption: "Wo sunset" }],
      hi: [{ photo: DEMO.mountain, caption: "बिना प्लान की रोड ट्रिप" }, { photo: DEMO.fairy, caption: "आख़िरकार फेयरी लाइट्स" }, { photo: DEMO.city, caption: "छत वाला नया साल" }, { photo: DEMO.picnic, caption: "पिकनिक, 40% बारिश" }, { photo: DEMO.sunset, caption: "वो सूर्यास्त" }],
    }),
    mostSaidWord: by(lang, { en: "“wait, what?”", "hi-Latn": "“acha suno”", hi: "“अच्छा सुनो”" }),
    song: { url: "", title: "" },
    promises: by(lang, {
      en: ["Fewer 'I'm 5 mins away' lies", "One trip with zero planning", "Learn to make your mom's chai", "Same city by December"],
      "hi-Latn": ["Kam 'bas 5 min mein' wale jhooth", "Ek trip bina planning ke", "Tumhari mummy wali chai seekhna", "December tak ek shehar"],
      hi: ["कम 'बस 5 मिनट में' वाले झूठ", "एक ट्रिप बिना प्लानिंग", "तुम्हारी मम्मी वाली चाय सीखना", "दिसंबर तक एक शहर"],
    }),
    closing: by(lang, { en: "Best year so far. Let's make the next one better.", "hi-Latn": "Ab tak ka best saal. Agla aur accha banayenge.", hi: "अब तक का सबसे अच्छा साल। अगला और बेहतर बनाएँगे।" }),
  }),
  aiFields: {
    stats: "Array of 3–4 {label, value, suffix} — keep any value the sender gave; add playful but plausible stats (calls, km, inside jokes) with modest numbers.",
    captions: "For memories: array of short captions (max 40 chars) per photo.",
    promises: "Array of 4 cute, specific-sounding promises for next year (max 50 chars each).",
    closing: "A one-line closing (max 110 chars).",
  },
  cannedFill: (a, lang) => {
    const days = a.stats?.[0]?.value ?? 365;
    const caps = by(lang, {
      en: ["The one we still talk about", "Peak us", "Unplanned, perfect", "Proof we had fun", "Saved forever"],
      "hi-Latn": ["Jiske baare mein ab bhi baat karte hain", "Peak hum", "Bina plan, perfect", "Masti ka saboot", "Hamesha ke liye saved"],
      hi: ["जिसकी अब भी बात करते हैं", "हम बेस्ट", "बिना प्लान, परफ़ेक्ट", "मस्ती का सबूत", "हमेशा के लिए"],
    });
    return {
      stats: by(lang, {
        en: [{ label: "days together", value: days, suffix: "" }, { label: "inside jokes", value: 47, suffix: "" }, { label: "late-night calls", value: 210, suffix: "" }],
        "hi-Latn": [{ label: "din saath", value: days, suffix: "" }, { label: "inside jokes", value: 47, suffix: "" }, { label: "raat wali calls", value: 210, suffix: "" }],
        hi: [{ label: "दिन साथ", value: days, suffix: "" }, { label: "अंदर के मज़ाक", value: 47, suffix: "" }, { label: "देर रात की कॉल", value: 210, suffix: "" }],
      }),
      memories: (a.memories ?? []).map((m, i) => ({ photo: m.photo, caption: m.caption || caps[i % caps.length] })),
      promises: by(lang, {
        en: ["More trips, fewer excuses", "Answer on the first ring", "Your playlist in the car, no fights", "Same city, soon"],
        "hi-Latn": ["Zyada trips, kam bahaane", "Pehli ring pe phone uthana", "Car mein tumhari playlist, bina ladai", "Jaldi ek shehar"],
        hi: ["ज़्यादा ट्रिप, कम बहाने", "पहली घंटी पर फ़ोन उठाना", "गाड़ी में तुम्हारी प्लेलिस्ट", "जल्दी एक शहर"],
      }),
      closing: a.closing || by(lang, { en: "Best year so far. Next one's ours too.", "hi-Latn": "Ab tak ka best saal. Agla bhi apna.", hi: "अब तक का सबसे अच्छा साल।" }),
    };
  },
};
export default def;

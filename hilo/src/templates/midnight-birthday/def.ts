import { z } from "zod";
import type { TemplateDef } from "../types";
import { by, DEMO, L, name, photos, Q, song, url } from "../common";

export const schema = z.object({
  recipientName: name(),
  age: z.coerce.number().int().min(0).max(120).optional().or(z.literal("")).default(""),
  senderName: name(),
  photos: photos(10),
  captions: z.array(z.string().max(60)).max(10).default([]),
  wish: z.string().max(140).default(""),
  letter: z.string().max(1200).default(""),
  voiceUrl: url.optional().default(""),
  song,
});
export type Content = z.infer<typeof schema>;

const def: TemplateDef<Content> = {
  meta: {
    slug: "midnight-birthday",
    name: L("Midnight Birthday", "Midnight Birthday", "मिडनाइट बर्थडे"),
    tagline: L("Light the candles, make them blow, let the confetti fall.", "Candles jalao, unse phoonk marwao, confetti girao.", "मोमबत्तियाँ जलाओ, फूँक मरवाओ, कंफ़ेटी गिराओ।"),
    occasion: ["birthday"],
    moods: ["cute", "emotional"],
    relations: ["partner", "maa", "papa", "sibling", "friend"],
    mode: "individual", tier: "classic", photosMax: 10, supportsVoice: true, supportsMusic: true,
    glow: "amber", theme: "night", estMinutes: 3, isNew: false, release: 1,
    inside: [L("Tap to light the candles", "Tap karke candles jalao", "टैप से मोमबत्ती"), L("Blow into the mic to blow them out", "Mic mein phoonk maaro, candles bujhao", "माइक में फूँक मारें"), L("Swipeable polaroids", "Swipe wale polaroids", "स्वाइप पोलरॉइड"), L("Your letter + voice note", "Tumhara letter + voice note", "आपका पत्र + आवाज़"), L("A cake with their name", "Unke naam ka cake", "उनके नाम का केक")],
    demoPoster: DEMO.cake,
  },
  schema,
  questions: [
    { id: "name", field: "recipientName", kind: "text", prompt: L("Whose birthday is it?", "Kiska birthday hai?", "किसका जन्मदिन है?"), placeholder: L("Zoya", "Zoya", "ज़ोया"), max: 40 },
    { id: "age", field: "age", kind: "number", prompt: L("Turning how old? (optional)", "Kitne saal ke ho rahe hain? (optional)", "कितने साल के? (वैकल्पिक)"), optional: true, min: 1, max: 120 },
    { id: "photos", field: "photos", kind: "photos", prompt: Q.photos, hint: Q.photosHint, max: 10, min: 1 },
    { id: "wish", field: "wish", kind: "textarea", prompt: L("Your birthday wish for them, in one line", "Unke liye ek line ki wish", "उनके लिए एक लाइन की शुभकामना"), hint: Q.lineHint, max: 140 },
    { id: "voice", field: "voiceUrl", kind: "voice", prompt: Q.voice, hint: Q.voiceHint, optional: true },
    { id: "sender", field: "senderName", kind: "text", prompt: Q.sender, max: 40 },
  ],
  defaults: (lang) => ({
    recipientName: "Zoya",
    age: 24,
    senderName: "Kabir",
    photos: [DEMO.picnic, DEMO.city, DEMO.fairy, DEMO.sunset],
    captions: by(lang, {
      en: ["Picnic that got rained out", "Rooftop, 2 AM", "Fairy lights era", "Our sunset"],
      "hi-Latn": ["Wo picnic jo baarish mein dooba", "Rooftop, raat ke 2 baje", "Fairy lights wala phase", "Apna sunset"],
      hi: ["वो पिकनिक जो बारिश में डूबी", "छत, रात के 2 बजे", "फेयरी लाइट्स वाला दौर", "अपना सूर्यास्त"],
    }),
    wish: by(lang, { en: "May this year be as loud, warm and ridiculous as your laugh.", "hi-Latn": "Ye saal tumhari hasi jitna loud, warm aur pagal ho.", hi: "ये साल तुम्हारी हँसी जितना खुला और प्यारा हो।" }),
    letter: by(lang, {
      en: "Zoya,\nHappy birthday to the person who remembers everyone's coffee order and forgets her own keys. You make every room softer. I hope 24 gives back everything you keep giving away.\nCake first, speeches later.",
      "hi-Latn": "Zoya,\nHappy birthday us insaan ko jo sabka coffee order yaad rakhti hai aur apni chaabi bhool jaati hai. Tum har jagah ko thoda softer bana deti ho. 24 tumhe wo sab lauta de jo tum sabko deti rehti ho.\nPehle cake, speeches baad mein.",
      hi: "ज़ोया,\nजन्मदिन मुबारक उसे जो सबका कॉफ़ी ऑर्डर याद रखती है और अपनी चाबी भूल जाती है। 24 तुम्हें वो सब लौटाए जो तुम सबको देती रहती हो।\nपहले केक, बातें बाद में।",
    }),
    voiceUrl: "",
    song: { url: "", title: "" },
  }),
  aiFields: {
    captions: "Array of short playful captions (max 40 chars), one per photo, not inventing specific facts.",
    letter: "A warm birthday letter (80–150 words), playful then emotional, ending with a light line.",
    wish: "If empty: a one-line birthday wish (max 120 chars).",
  },
  cannedFill: (a, lang) => {
    const n = a.recipientName || "";
    const caps = by(lang, {
      en: ["Main character energy", "This face, always", "Iconic", "Peak us", "Remember?", "Still laughing", "Proof of fun", "Favourite human", "Again please", "One more"],
      "hi-Latn": ["Main character energy", "Ye chehra, hamesha", "Iconic", "Peak hum", "Yaad hai?", "Ab tak has rahe", "Masti ka saboot", "Favourite insaan", "Phir se please", "Ek aur"],
      hi: ["मेन कैरेक्टर", "ये चेहरा, हमेशा", "कमाल", "हम बेस्ट", "याद है?", "अब तक हँस रहे", "मस्ती का सबूत", "पसंदीदा इंसान", "फिर से", "एक और"],
    });
    return {
      captions: caps.slice(0, a.photos?.length ?? 0),
      wish: a.wish || by(lang, { en: "Happiest birthday — this year is yours.", "hi-Latn": "Happy birthday — ye saal tumhara hai.", hi: "जन्मदिन मुबारक — ये साल तुम्हारा है।" }),
      letter: by(lang, {
        en: `${n},\nHappy birthday! ${a.wish ? a.wish + " " : ""}Thank you for being the kind of person people feel lucky to know — I definitely do.\nNow go make a wish. A big one.`,
        "hi-Latn": `${n},\nHappy birthday! ${a.wish ? a.wish + " " : ""}Shukriya aisa insaan hone ke liye jisse milke log lucky feel karte hain — main toh karta hi hoon.\nAb wish maango. Badi wali.`,
        hi: `${n},\nजन्मदिन मुबारक! ${a.wish ? a.wish + " " : ""}शुक्रिया ऐसा इंसान होने के लिए जिससे मिलकर लोग खुशक़िस्मत महसूस करते हैं।\nअब एक बड़ी सी विश माँगो।`,
      }),
    };
  },
};
export default def;

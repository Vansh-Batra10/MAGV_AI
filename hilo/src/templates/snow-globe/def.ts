import { z } from "zod";
import type { TemplateDef } from "../types";
import { by, DEMO, L, name, Q, song, url } from "../common";

export const schema = z.object({
  recipientName: name(),
  senderName: name(),
  photo: url.default(""),
  ornaments: z.array(z.object({ label: z.string().max(24), message: z.string().max(200) })).min(1).max(5),
  finale: z.string().max(200).default(""),
  song,
});
export type Content = z.infer<typeof schema>;

const def: TemplateDef<Content> = {
  meta: {
    slug: "snow-globe",
    name: L("Snow Globe", "Snow Globe", "स्नो ग्लोब"),
    tagline: L("Your photo inside a snow globe. Shake the phone, let it snow.", "Tumhari photo ek snow globe mein. Phone hilao, barf girao.", "आपकी तस्वीर स्नो ग्लोब में। फ़ोन हिलाओ, बर्फ़ गिराओ।"),
    occasion: ["christmas", "new-year"],
    moods: ["cute", "emotional"],
    relations: ["partner", "maa", "papa", "sibling", "friend"],
    mode: "individual", tier: "classic", photosMax: 1, supportsVoice: false, supportsMusic: true,
    glow: "amber", theme: "night", estMinutes: 2, isNew: true, release: 1, uses3d: true,
    inside: [L("A 3D snow globe with your photo", "Tumhari photo wala 3D snow globe", "आपकी तस्वीर वाला 3D ग्लोब"), L("Shake your phone to make it snow", "Phone hilao, barf giregi", "फ़ोन हिलाओ, बर्फ़ गिरेगी"), L("Ornaments that open into notes", "Ornaments jo notes ban kar khulte hain", "सजावट जो नोट्स में खुलती है"), L("A starry Merry Christmas finale", "Taaron bhara Merry Christmas", "तारों भरा क्रिसमस")],
    demoPoster: DEMO.snow,
  },
  schema,
  questions: [
    { id: "name", field: "recipientName", kind: "text", prompt: Q.recipient, hint: Q.recipientHint, placeholder: L("Meera", "Meera", "मीरा"), max: 40 },
    { id: "photo", field: "photo", kind: "photos", prompt: L("The photo that goes inside the globe", "Globe ke andar wali photo", "ग्लोब के अंदर की तस्वीर"), hint: L("Faces in the middle look best.", "Beech mein chehre sabse acche lagte hain.", "बीच में चेहरे सबसे अच्छे लगते हैं।"), max: 1, min: 1 },
    { id: "line", field: "ornaments.0.message", kind: "textarea", prompt: Q.line, hint: Q.lineHint, max: 200 },
    { id: "song", field: "song.url", kind: "song", prompt: Q.song, hint: Q.songHint, optional: true },
    { id: "sender", field: "senderName", kind: "text", prompt: Q.sender, max: 40 },
  ],
  defaults: (lang) => ({
    recipientName: "Meera",
    senderName: "Aarav",
    photo: DEMO.snow,
    ornaments: by(lang, {
      en: [
        { label: "This year", message: "You were my favourite part of this year. Every single month of it." },
        { label: "A secret", message: "I still have the ticket from our first movie. In my wallet. Don't tell anyone." },
        { label: "A wish", message: "Next Christmas: same city, same blanket, terrible movies." },
      ],
      "hi-Latn": [
        { label: "Ye saal", message: "Is saal ka sabse accha hissa tum the. Har ek mahina." },
        { label: "Ek raaz", message: "Hamari pehli movie ka ticket abhi bhi mere wallet mein hai. Kisi ko mat batana." },
        { label: "Ek wish", message: "Agli Christmas: ek shehar, ek blanket, bekaar movies." },
      ],
      hi: [
        { label: "ये साल", message: "इस साल का सबसे अच्छा हिस्सा तुम थे। हर एक महीना।" },
        { label: "एक राज़", message: "हमारी पहली फ़िल्म का टिकट अब भी मेरे बटुए में है।" },
        { label: "एक ख़्वाहिश", message: "अगला क्रिसमस: एक शहर, एक कंबल, बेकार फ़िल्में।" },
      ],
    }),
    finale: by(lang, { en: "Merry Christmas. Here's to more snow, more us.", "hi-Latn": "Merry Christmas. Aur barf, aur hum.", hi: "मेरी क्रिसमस। और बर्फ़, और हम।" }),
    song: { url: "", title: "" },
  }),
  aiFields: {
    ornaments: "Array of 3 objects {label (max 14 chars), message (max 160 chars)} — e.g. 'This year', 'A secret', 'A wish'. Base one of them on the sender's line.",
    finale: "A short festive closing line (max 90 chars).",
  },
  cannedFill: (a, lang) => {
    const line = a.ornaments?.[0]?.message;
    return {
      ornaments: by(lang, {
        en: [
          { label: "This year", message: line || "You made this year warmer than any sweater." },
          { label: "A thank you", message: "For every time you picked up, showed up and stayed." },
          { label: "A wish", message: "More snow, more laughs, more us. Next year, same globe." },
        ],
        "hi-Latn": [
          { label: "Ye saal", message: line || "Tumne ye saal kisi bhi sweater se zyada garam banaya." },
          { label: "Shukriya", message: "Har baar phone uthane, aane aur rukne ke liye." },
          { label: "Ek wish", message: "Aur barf, aur hasi, aur hum. Agle saal, same globe." },
        ],
        hi: [
          { label: "ये साल", message: line || "तुमने ये साल किसी भी स्वेटर से ज़्यादा गर्म बनाया।" },
          { label: "शुक्रिया", message: "हर बार फ़ोन उठाने, आने और रुकने के लिए।" },
          { label: "एक ख़्वाहिश", message: "और बर्फ़, और हँसी, और हम।" },
        ],
      }),
      finale: by(lang, { en: "Merry Christmas — here's to us.", "hi-Latn": "Merry Christmas — hum dono ke naam.", hi: "मेरी क्रिसमस — हम दोनों के नाम।" }),
    };
  },
};
export default def;

import { z } from "zod";
import type { GiftLanguage } from "@/config/markets";
import type { L10n } from "./types";

export const url = z.string().max(600);
export const name = (max = 40) => z.string().trim().max(max);
export const photos = (max: number) => z.array(url).max(max);
export const song = z.object({ url: z.string().max(300).optional().default(""), title: z.string().max(80).optional().default("") }).optional();
export const city = z.object({ name: z.string().max(60), tz: z.string().max(60), lat: z.number(), lon: z.number(), country: z.string().max(3) });

export const L = (en: string, hiLatn: string, hi: string): L10n => ({ en, "hi-Latn": hiLatn, hi });
export const by = <T,>(lang: GiftLanguage, v: { en: T; "hi-Latn": T; hi: T }): T => v[lang] ?? v.en;

export const DEMO = {
  sunset: "/demo/sunset-beach.webp",
  city: "/demo/city-lights.webp",
  cafe: "/demo/cafe-cups.webp",
  mountain: "/demo/mountain-road.webp",
  rain: "/demo/rain-window.webp",
  fairy: "/demo/fairy-lights.webp",
  picnic: "/demo/polaroid-picnic.webp",
  moon: "/demo/night-moon.webp",
  cake: "/demo/birthday-cake.webp",
  lamps: "/demo/festival-lamps.webp",
  snow: "/demo/snowy-street.webp",
  friends: "/demo/friends-group.webp",
};

/** Shared question prompts. */
export const Q = {
  recipient: L("What's their name?", "Unka naam?", "उनका नाम?"),
  recipientHint: L("The person this is for.", "Jiske liye ye gift hai.", "जिसके लिए ये तोहफ़ा है।"),
  nickname: L("What do you call them?", "Tum unhe kya bulate ho?", "आप उन्हें क्या बुलाते हैं?"),
  nicknameHint: L("Babu, jaan, idiot… whatever's true.", "Babu, jaan, pagal… jo bhi sach ho.", "बाबू, जान, पगली… जो भी सच हो।"),
  sender: L("And your name?", "Aur tumhara naam?", "और आपका नाम?"),
  photos: L("Pick a few photos", "Kuch photos chuno", "कुछ तस्वीरें चुनें"),
  photosHint: L("Photos first, words later. We'll order them by date.", "Pehle photos, baatein baad mein. Date ke hisaab se laga denge.", "पहले तस्वीरें, बातें बाद में।"),
  line: L("One line you want to tell them", "Ek line jo tum unse kehna chahte ho", "एक बात जो आप उनसे कहना चाहते हैं"),
  lineHint: L("We'll write the rest with you. You can edit everything.", "Baaki hum saath mein likh denge. Sab edit kar sakte ho.", "बाकी हम साथ लिख देंगे। सब बदल सकते हैं।"),
  song: L("Your song? (optional)", "Tumhara gaana? (optional)", "आपका गाना? (वैकल्पिक)"),
  songHint: L("Paste a YouTube or Spotify link. It plays from their official player.", "YouTube ya Spotify link paste karo. Official player se bajega.", "YouTube या Spotify लिंक डालें।"),
  voice: L("Add a voice note? (optional)", "Voice note bhi? (optional)", "वॉइस नोट? (वैकल्पिक)"),
  voiceHint: L("Up to 60 seconds. Nothing hits like your actual voice.", "60 second tak. Tumhari awaaz se zyada kuch nahi lagta.", "60 सेकंड तक।"),
  letter: L("Your letter", "Tumhara letter", "आपका पत्र"),
};

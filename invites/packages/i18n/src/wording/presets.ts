import type { CeremonyStyle, Locale, Tone } from "@invites/content-schema/client";

/**
 * Wording presets per ceremony style × tone × language (§22). Editable by the couple.
 * Placeholders: {bride} {groom} {brideParents} {groomParents}. Formal presets are family-led.
 */
export interface Wording { invocation?: string; body: string; closing: string }

type Key = `${"default" | CeremonyStyle}:${Tone}:${Locale}`;

const P: Partial<Record<Key, Wording>> = {
  "default:formal:en": { body: "With the blessings of our families, we invite you to celebrate the wedding of {bride} and {groom}.", closing: "Your presence will be our blessing." },
  "default:warm:en": { body: "Together with our families, we would love for you to celebrate the wedding of {bride} and {groom}.", closing: "It won't be the same without you." },
  "default:playful:en": { body: "{bride} and {groom} are finally doing it. Come eat, dance and bless.", closing: "Dance shoes mandatory." },
  "default:formal:hi": { invocation: "सादर आमंत्रण", body: "हमारे परिवारों के आशीर्वाद से, आपको {groom} और {bride} के शुभ विवाह में सादर आमंत्रित करते हैं।", closing: "आपकी उपस्थिति हमारा सौभाग्य होगी।" },
  "default:warm:hi": { body: "परिवार के आशीर्वाद के साथ, {bride} और {groom} के विवाह में आपका इंतज़ार रहेगा।", closing: "आपके बिना यह उत्सव अधूरा है।" },
  "default:playful:hi": { body: "{bride} और {groom} की शादी है, आना ही पड़ेगा!", closing: "नाचने की तैयारी रखिए।" },
  "default:formal:hinglish": { body: "Parivaron ke aashirwad se, aapko {bride} aur {groom} ke shubh vivah mein saadar aamantrit karte hain.", closing: "Aapki upasthiti humara saubhagya hogi." },
  "default:warm:hinglish": { body: "Parivaar ke aashirwad ke saath, {bride} aur {groom} ki shaadi mein aapka intezaar rahega.", closing: "Aapke bina shaadi adhoori hai." },
  "default:playful:hinglish": { body: "Arre! {bride} aur {groom} ki shaadi hai. Aapko aana hi padega 🙏", closing: "Dance floor pe milte hain!" },
  "nikah:formal:en": { invocation: "Bismillah-ir-Rahman-ir-Rahim", body: "With the blessings of the Almighty and our families, we request the honour of your presence at the Nikah of {bride} and {groom}.", closing: "Your duas mean the world to us." },
  "nikah:formal:hinglish": { invocation: "Bismillah-ir-Rahman-ir-Rahim", body: "Allah ke fazl aur parivaron ki duaon ke saath, {bride} aur {groom} ke Nikah mein aapki shirkat ki guzarish hai.", closing: "Aapki duaayein humari khushi hain." },
  "anand-karaj:formal:en": { invocation: "Ik Onkar", body: "With the grace of Waheguru and the blessings of our families, we invite you to the Anand Karaj of {bride} and {groom}.", closing: "Your presence will be our blessing." },
  "anand-karaj:formal:hinglish": { invocation: "Ik Onkar", body: "Waheguru di kirpa naal, {bride} te {groom} de Anand Karaj vich tuhanu saadar sadda hai.", closing: "Tuhadi haazri saadi khushi hai." },
  "church:formal:en": { body: "Together with their families, {bride} and {groom} request the pleasure of your company at the celebration of their Holy Matrimony.", closing: "Reception to follow." },
  "hindu-north:formal:hi": { invocation: "॥ श्री गणेशाय नमः ॥", body: "हमारे परिवारों के आशीर्वाद से, आपको {groom} और {bride} के शुभ विवाह में सादर आमंत्रित करते हैं।", closing: "आपकी उपस्थिति हमारा सौभाग्य होगी।" },
};

export function wordingFor(style: CeremonyStyle, tone: Tone, locale: Locale): Wording {
  return P[`${style}:${tone}:${locale}`] ?? P[`${style}:formal:${locale}`] ?? P[`default:${tone}:${locale}`] ?? P[`default:formal:en`]!;
}

export function fillWording(w: Wording, vars: Record<string, string>): Wording {
  const f = (s: string) => s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
  return { invocation: w.invocation && f(w.invocation), body: f(w.body), closing: f(w.closing) };
}

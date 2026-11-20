import "server-only";
import { send, pickChannel, type MsgCategory } from "./adapters/messaging";
import { q } from "./db";
import { BRAND, SITE_URL } from "@/config/brand";
import type { GiftRow } from "./gifts";
import { giftUrl } from "./gifts";
import { firstName } from "@/lib/paths";

/** Copy for system messages, per gift language. Kept here (not in UI catalogs) because they leave the app. */
const T = {
  paid: {
    en: (n: string, url: string) => ({ subject: `Your gift for ${n} is ready 💌`, text: `Your gift for ${n} is live: ${url}\nSend it whenever you're ready — or schedule it for midnight.` }),
    "hi-Latn": (n: string, url: string) => ({ subject: `${n} ka gift ready hai 💌`, text: `${n} ka gift live hai: ${url}\nJab chaho bhejo — ya midnight ke liye schedule karo.` }),
    hi: (n: string, url: string) => ({ subject: `${n} का गिफ़्ट तैयार है 💌`, text: `${n} का गिफ़्ट तैयार है: ${url}` }),
  },
  delivered: {
    en: (from: string, url: string) => ({ subject: `${from} made something for you 💌`, text: `${from} made something for you. Open it here: ${url}` }),
    "hi-Latn": (from: string, url: string) => ({ subject: `${from} ne tumhare liye kuch banaya hai 💌`, text: `${from} ne tumhare liye kuch banaya hai. Yahan kholo: ${url}` }),
    hi: (from: string, url: string) => ({ subject: `${from} ने आपके लिए कुछ बनाया है 💌`, text: `${from} ने आपके लिए कुछ बनाया है: ${url}` }),
  },
  opened: {
    en: (n: string) => ({ subject: `${n} just opened your gift 👀`, text: `${n} just opened your gift 👀` }),
    "hi-Latn": (n: string) => ({ subject: `${n} ne tumhara gift khol liya 👀`, text: `Unhone tumhara gift khol liya 👀 (${n})` }),
    hi: (n: string) => ({ subject: `${n} ने आपका गिफ़्ट खोल लिया 👀`, text: `${n} ने आपका गिफ़्ट खोल लिया 👀` }),
  },
  replied: {
    en: (n: string, what: string) => ({ subject: `${n} replied to your gift ♥`, text: `${n} sent you ${what}. See it in your dashboard: ${SITE_URL}/dashboard` }),
    "hi-Latn": (n: string, what: string) => ({ subject: `${n} ne reply kiya ♥`, text: `${n} ne ${what} bheja. Dashboard mein dekho: ${SITE_URL}/dashboard` }),
    hi: (n: string, what: string) => ({ subject: `${n} ने जवाब दिया ♥`, text: `${n} ने ${what} भेजा: ${SITE_URL}/dashboard` }),
  },
  upgraded: {
    en: (n: string) => ({ subject: `${n} saved your gift forever 🥹`, text: `${n} saved your gift forever 🥹` }),
    "hi-Latn": (n: string) => ({ subject: `${n} ne tumhara gift hamesha ke liye save kar liya 🥹`, text: `Unhone tumhara gift hamesha ke liye save kar liya 🥹 (${n})` }),
    hi: (n: string) => ({ subject: `${n} ने आपका गिफ़्ट हमेशा के लिए सहेज लिया 🥹`, text: `${n} ने आपका गिफ़्ट हमेशा के लिए सहेज लिया 🥹` }),
  },
  expiring: {
    en: (n: string, url: string) => ({ subject: `Your gift for ${n} fades tomorrow`, text: `Your free gift for ${n} disappears in a few hours. Keep it forever: ${url}` }),
    "hi-Latn": (n: string, url: string) => ({ subject: `${n} ka gift kal expire hoga`, text: `${n} ka gift kal expire hoga — forever banao? ${url}` }),
    hi: (n: string, url: string) => ({ subject: `${n} का गिफ़्ट कल समाप्त होगा`, text: `${n} का गिफ़्ट कल समाप्त होगा — हमेशा के लिए रखें: ${url}` }),
  },
  bringBack: {
    en: (n: string, url: string) => ({ subject: `${n} wants your gift back ✨`, text: `${n} tried to open your gift after it faded. Bring it back forever: ${url}` }),
    "hi-Latn": (n: string, url: string) => ({ subject: `${n} tumhara gift wapas chahte hain ✨`, text: `${n} ne gift kholne ki koshish ki, par wo expire ho gaya tha. Hamesha ke liye wapas lao: ${url}` }),
    hi: (n: string, url: string) => ({ subject: `${n} आपका गिफ़्ट वापस चाहते हैं ✨`, text: `हमेशा के लिए वापस लाएँ: ${url}` }),
  },
  takedown: {
    en: (n: string) => ({ subject: `Your gift for ${n} was taken down`, text: `The recipient asked us to remove your gift for ${n}. It's hidden while we review. Reply to this email if you think it's a mistake.` }),
    "hi-Latn": (n: string) => ({ subject: `${n} wala gift hata diya gaya`, text: `Recipient ne gift hatane ko kaha. Review tak ye chhupa hai. Galti lage toh reply karo.` }),
    hi: (n: string) => ({ subject: `${n} वाला गिफ़्ट हटा दिया गया`, text: `प्राप्तकर्ता ने गिफ़्ट हटाने को कहा। समीक्षा तक ये छिपा है।` }),
  },
};

function lang(g: GiftRow) {
  return (g.gift_language ?? "en") as "en" | "hi-Latn" | "hi";
}

async function toSender(g: GiftRow, template: string, category: MsgCategory, msg: { subject: string; text: string }, fallbackEmail?: string | null) {
  const owner = g.owner_id ? await q<{ email: string; phone: string | null }>(`select email, phone from profiles where id=$1`, [g.owner_id]) : [];
  const order = await q<{ buyer_email: string | null; buyer_phone: string | null }>(`select buyer_email, buyer_phone from orders where gift_id=$1 and payer='sender' and status='paid' order by created_at desc limit 1`, [g.id]);
  const contact = { email: fallbackEmail ?? owner[0]?.email ?? order[0]?.buyer_email ?? g.sender_contact?.email, phone: owner[0]?.phone ?? order[0]?.buyer_phone ?? g.sender_contact?.phone };
  const ch = pickChannel(contact, g.market, category);
  if (!ch) return;
  await send({ ...ch, template, category, ...msg, payload: { lang: g.gift_language, giftId: g.id } });
}

export async function notifyPaid(g: GiftRow, email: string | null, url: string) {
  const n = g.recipient_name ?? "them";
  if (email) await send({ channel: "email", to: email, template: "gift_ready", category: "utility", ...T.paid[lang(g)](n, url), payload: { giftId: g.id } });
  else await toSender(g, "gift_ready", "utility", T.paid[lang(g)](n, url));
}

export async function deliverToRecipient(g: GiftRow) {
  const url = giftUrl(g.slug!);
  const from = firstName(g.sender_name) || BRAND.name;
  const contact = g.recipient_contact ?? {};
  const ch = pickChannel({ phone: contact.phone, email: contact.email }, g.market, "utility");
  if (ch) await send({ ...ch, template: "gift_delivered", category: "utility", ...T.delivered[lang(g)](from, url), payload: { lang: g.gift_language, params: [from, url], giftId: g.id } });
}

export async function notifyOpened(g: GiftRow) {
  await toSender(g, "gift_opened", "utility", T.opened[lang(g)](g.recipient_name ?? "They"));
}

export async function notifyReply(g: GiftRow, kind: string) {
  const what = { heart: "♥", text: "a message", voice: "a voice note", answer: "an answer", reaction: "a reaction video 🎥" }[kind] ?? "a reply";
  await toSender(g, "gift_reply", "utility", T.replied[lang(g)](g.recipient_name ?? "They", what));
}

export async function notifyRecipientUpgraded(g: GiftRow) {
  await toSender(g, "gift_upgraded", "utility", T.upgraded[lang(g)](g.recipient_name ?? "They"));
}

export async function notifyExpiring(g: GiftRow) {
  await toSender(g, "gift_expiring", "marketing", T.expiring[lang(g)](g.recipient_name ?? "them", `${SITE_URL}/checkout/${g.id}?upgrade=1`));
}

export async function notifyBringBack(g: GiftRow) {
  await toSender(g, "gift_bring_back", "utility", T.bringBack[lang(g)](g.recipient_name ?? "They", `${SITE_URL}/checkout/${g.id}?upgrade=1`));
}

export async function notifyTakedown(g: GiftRow) {
  await toSender(g, "gift_takedown", "utility", T.takedown[lang(g)](g.recipient_name ?? "them"));
}

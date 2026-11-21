import { brand, tiers } from "@invites/config";

export type Lang = "en" | "hi";
export const copy = {
  en: {
    nav: { templates: "Templates", pricing: "Pricing", how: "How it works", blog: "Blog", login: "Log in" },
    h1: "Wedding invitations that open like a gift.",
    sub: "Three cinematic templates. Every guest gets their own link: their name on a beautiful card, only their functions, RSVP, directions and shagun by UPI. No app, no login for guests.",
    cta: "Create your invite free", ctaAlt: "See it as a guest",
    tap: "Tap to open",
    whyTitle: "Made for Indian families",
    why: [
      ["Their name first", "Nani sees “Mehta Parivar” on the doors before anything loads, even on a ₹10k phone over 4G."],
      ["Only their functions", "Papa’s office sees the wedding and reception. Your gang sees the sangeet too. One list, many invitations."],
      ["Stop the “kab hai, kahan hai” calls", "Date, time, venue and directions are one tap away, in Hindi, English or Hinglish."],
      ["Headcounts for the caterer", "RSVPs per function with adults, kids and veg / Jain / non-veg counts. Export in one click."],
      ["Shagun, straight to you", "An optional wishlist paid by UPI to your own UPI ID. We never touch the money."],
      ["Send on WhatsApp", "A send queue opens WhatsApp with each guest’s personal link and message. Watch opens and replies arrive."],
    ],
    tplTitle: "Three templates, nine looks",
    howTitle: "How it works",
    how: ["Pick a template and fill in names and functions (about 3 minutes).", "Preview as any guest, choose a plan, add guests.", "Send personal links on WhatsApp and watch RSVPs arrive."],
    priceTitle: "Simple pricing", priceNote: "Prices include GST. Full refund before your first guest link is sent.",
  },
  hi: {
    nav: { templates: "टेम्पलेट", pricing: "कीमत", how: "कैसे काम करता है", blog: "ब्लॉग", login: "लॉग इन" },
    h1: "ऐसा निमंत्रण, जो तोहफ़े की तरह खुले।",
    sub: "तीन सिनेमाई टेम्पलेट। हर मेहमान का अपना लिंक: सुंदर कार्ड पर उनका नाम, सिर्फ़ उनके कार्यक्रम, उत्तर, रास्ता और UPI से शगुन। मेहमानों को न ऐप चाहिए, न लॉग इन।",
    cta: "मुफ़्त में निमंत्रण बनाइए", ctaAlt: "मेहमान की तरह देखिए",
    tap: "खोलने के लिए दबाइए",
    whyTitle: "भारतीय परिवारों के लिए",
    why: [
      ["पहले उनका नाम", "नानी को दरवाज़े पर “मेहता परिवार” दिखता है, सस्ते फ़ोन और 4G पर भी।"],
      ["सिर्फ़ उनके कार्यक्रम", "पापा के ऑफ़िस वालों को विवाह और स्वागत समारोह, दोस्तों को संगीत भी।"],
      ["“कब है, कहाँ है” के फ़ोन बंद", "तारीख़, समय, स्थान और रास्ता एक टैप पर, हिंदी, अंग्रेज़ी या हिंग्लिश में।"],
      ["कैटरर के लिए गिनती", "हर कार्यक्रम के लिए बड़े, बच्चे और शाकाहारी / जैन / मांसाहारी की गिनती।"],
      ["शगुन सीधे आपको", "UPI से सीधे आपकी UPI ID पर। पैसा हम कभी नहीं छूते।"],
      ["WhatsApp पर भेजिए", "हर मेहमान का अपना लिंक और संदेश, एक-एक करके।"],
    ],
    tplTitle: "तीन टेम्पलेट, नौ रूप", howTitle: "कैसे काम करता है",
    how: ["टेम्पलेट चुनिए, नाम और कार्यक्रम भरिए (लगभग 3 मिनट)।", "किसी भी मेहमान की तरह देखिए, प्लान चुनिए, मेहमान जोड़िए।", "WhatsApp पर निजी लिंक भेजिए और उत्तर आते देखिए।"],
    priceTitle: "सीधी कीमत", priceNote: "कीमतों में GST शामिल। पहला लिंक भेजने से पहले पूरा पैसा वापस।",
  },
} as const;

export const TEMPLATES = [
  { id: "sheesh-mahal", name: "Sheesh Mahal", tag: "The Enchanted Palace", demo: "/demo/riyaFRND2", line: "The doors open into light, and your names assemble out of a thousand mirror reflections. The elders’ favourite.", packs: ["Jaipur Dusk", "Udaipur Lake Dawn", "Mysore Palace Lights"] },
  { id: "rang-kahani", name: "Rang Kahani", tag: "The Pop-up Storybook", demo: "/demo-rk/riyaFRND2rk", line: "Paper spreads stand up off the page and the two of you, as paper puppets, act out every function.", packs: ["Bombay Monsoon", "Dilli Sardi", "Goa Sunset"] },
  { id: "mohar", name: "Mohar", tag: "The Keepsake Box", demo: "/demo-mh/kapoorOF3mh", line: "Press the wax seal; the box opens and the invitation suite unfolds card by card. Quiet, old-money elegance.", packs: ["Plum & Olive", "Powder Blue Baroque", "Opal Night"] },
] as const;

export { brand, tiers };

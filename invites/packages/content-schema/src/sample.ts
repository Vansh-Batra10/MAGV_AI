import type { GuestVars, WeddingContent, WeddingEvent } from "./schema";

/** Demo content used by the playground, tests and the mock database. Names are fictional. */
const ev = (id: string, kind: WeddingEvent["kind"], titleEn: string, titleHi: string, startsAt: string, venueName: string, venueArea: string, dress: [string, string][] = []): WeddingEvent => ({
  id, kind, titleEn, titleHi, startsAt, tz: "Asia/Kolkata", venueName, venueArea,
  venueAddress: `${venueName}, ${venueArea}, Jaipur, Rajasthan`, lat: 26.9124, lng: 75.7873,
  dressCode: dress.map(([name, hex]) => ({ name, hex })), isPublic: kind === "wedding" || kind === "reception",
});

export const sampleWedding: WeddingContent = {
  inviteId: "demo-ananya-rohan",
  bride: { name: "Ananya", nameHi: "अनन्या", shortName: "Anu" },
  groom: { name: "Rohan", nameHi: "रोहन", shortName: "Ro" },
  order: "bride-first",
  families: {
    brideParents: "Smt. Kavita & Shri Rajesh Mehta",
    groomParents: "Smt. Sunita & Shri Anil Sharma",
    blessingLine: "With the blessings of Dadi and Nana ji",
  },
  city: "Jaipur",
  ceremonyStyle: "hindu-north",
  motifs: ["ganesh"],
  defaultLocale: "hinglish",
  defaultTone: "warm",
  devanagariNumerals: false,
  events: [
    ev("haldi", "haldi", "Haldi", "हल्दी", "2027-02-12T10:00:00+05:30", "Samode Haveli", "Gangapole", [["Peela", "#F4C430"], ["Safed", "#F7F3EA"]]),
    ev("mehendi", "mehendi", "Mehendi", "मेहंदी", "2027-02-12T16:00:00+05:30", "Samode Haveli", "Gangapole", [["Hara", "#2E8B57"], ["Gulabi", "#E75480"]]),
    ev("sangeet", "sangeet", "Sangeet", "संगीत", "2027-02-12T19:30:00+05:30", "Rambagh Lawns", "Bhawani Singh Road", [["Neela", "#2A3D8F"], ["Chandi", "#C0C0C8"]]),
    ev("wedding", "wedding", "Wedding", "विवाह", "2027-02-13T19:00:00+05:30", "Jai Mahal Palace", "Civil Lines", [["Laal", "#B22234"], ["Sona", "#D4A017"]]),
    ev("reception", "reception", "Reception", "स्वागत समारोह", "2027-02-14T20:00:00+05:30", "Rooftop, Hotel Clarks", "JLN Marg", [["Kaala", "#1B1B1B"], ["Chandi", "#C0C0C8"]]),
  ],
  story: [
    { caption: "Pehli mulaqat: a delayed Shatabdi, one shared window seat." },
    { caption: "Three years of chai debates. She still says adrak, he still says elaichi." },
    { caption: "He proposed at Nahargarh at sunset. She said haan before he finished." },
  ],
  shagun: {
    enabled: true,
    vpa: "ananya.rohan@okdemo",
    payeeName: "Ananya Mehta",
    showProgress: false,
    funds: [
      {
        id: "honeymoon", title: "Bali honeymoon", story: "Humara pehla safar, saath mein",
        blocks: [
          { id: "b1", title: "Ek sunset dinner", amount: 2100, emoji: "🌅", story: "Ek sunset dinner Bali mein" },
          { id: "b2", title: "Scooter for a day", amount: 1100, emoji: "🛵" },
          { id: "b3", title: "Snorkelling trip", amount: 5100, emoji: "🐠" },
        ],
      },
      {
        id: "ghar", title: "Pehla ghar", story: "Chhota sa ghar, bada sa dil",
        blocks: [
          { id: "b4", title: "Kitchen setup", amount: 11000, emoji: "🍳" },
          { id: "b5", title: "Plants for the balcony", amount: 501, emoji: "🪴" },
          { id: "b6", title: "Any amount", amount: null, emoji: "🪔" },
        ],
      },
    ],
    gifts: [{ id: "g1", title: "Hand-painted dinner set", url: "https://example.com/dinner-set", claimed: false }],
  },
  faq: [
    { q: "Parking?", a: "Valet parking is available at every venue." },
    { q: "Kids?", a: "Bachche toh shaadi ki jaan hain. Bring them along." },
    { q: "Gifts?", a: "Aapka aana hi sabse bada tohfa hai." },
    { q: "Weather?", a: "February evenings in Jaipur get cool (around 12°C). Carry a shawl." },
  ],
  stay: { hotel: "Hotel Clarks Amer", address: "JLN Marg, Jaipur", note: "Rooms are blocked for outstation family from 11 to 15 Feb." },
  rsvpDeadline: "2027-01-31T23:59:00+05:30",
  updates: [],
  hideBrandFooter: false,
  watermark: false,
};

export const sampleGuests: Record<string, GuestVars> = {
  elder: {
    guestCode: "mehtaPAR1", salutation: "Mehta Parivar", shortName: "Mehta ji", invitedEventIds: ["haldi", "mehendi", "sangeet", "wedding", "reception"],
    locale: "hi", tone: "formal", householdMax: 4, shagunVisible: false, side: "bride", outstation: true, room: "Clarks Amer · 204", replied: false,
  },
  friend: {
    guestCode: "riyaFRND2", salutation: "Riya", shortName: "Riya", invitedEventIds: ["mehendi", "sangeet", "wedding", "reception"],
    locale: "hinglish", tone: "playful", householdMax: 2, shagunVisible: true, side: "bride", outstation: false,
    note: "Sangeet pe tera solo pakka hai, practice shuru kar!", replied: false,
  },
  office: {
    guestCode: "kapoorOF3", salutation: "Mr. & Mrs. Kapoor", shortName: "Kapoor ji", invitedEventIds: ["wedding", "reception"],
    locale: "en", tone: "formal", householdMax: 2, shagunVisible: false, side: "groom", outstation: false, replied: false,
  },
};

// ---- Stress presets for the playground (§5.5) ----
export const stressPresets: Record<string, { content: WeddingContent; guest: GuestVars }> = {
  "very long names": {
    content: {
      ...sampleWedding,
      bride: { name: "Jaspreet Kaur Sandhu", nameHi: "जसप्रीत कौर संधू" },
      groom: { name: "Venkatanarasimha Raghavendran", nameHi: "वेंकटनरसिम्हा राघवेन्द्रन" },
    },
    guest: { ...sampleGuests.elder!, salutation: "Shrimati Rukmini Venkataraman & Parivar" },
  },
  "8 functions": {
    content: {
      ...sampleWedding,
      events: [
        ...sampleWedding.events,
        { ...sampleWedding.events[0]!, id: "tilak", kind: "custom", titleEn: "Tilak", titleHi: "तिलक", startsAt: "2027-02-11T11:00:00+05:30" },
        { ...sampleWedding.events[2]!, id: "cocktail", kind: "cocktail", titleEn: "Cocktail", titleHi: "कॉकटेल", startsAt: "2027-02-11T20:00:00+05:30" },
        { ...sampleWedding.events[0]!, id: "chooda", kind: "custom", titleEn: "Chooda", titleHi: "चूड़ा", startsAt: "2027-02-13T09:00:00+05:30" },
      ],
    },
    guest: { ...sampleGuests.elder!, invitedEventIds: ["tilak", "cocktail", "haldi", "mehendi", "sangeet", "chooda", "wedding", "reception"] },
  },
  "Hindi-only": {
    content: { ...sampleWedding, defaultLocale: "hi", devanagariNumerals: true },
    guest: { ...sampleGuests.elder!, salutation: "शर्मा परिवार", locale: "hi", tone: "formal" },
  },
  Nikah: {
    content: {
      ...sampleWedding,
      bride: { name: "Zoya", nameHi: "ज़ोया" }, groom: { name: "Arsalan", nameHi: "अर्सलान" },
      ceremonyStyle: "nikah", motifs: ["bismillah"],
      events: sampleWedding.events.filter((e) => e.kind !== "haldi").map((e) => e.kind === "wedding" ? { ...e, titleEn: "Nikah", titleHi: "निकाह" } : e.kind === "reception" ? { ...e, titleEn: "Walima", titleHi: "वलीमा" } : e),
    },
    guest: { ...sampleGuests.friend!, invitedEventIds: ["mehendi", "sangeet", "wedding", "reception"] },
  },
  "Anand Karaj": {
    content: {
      ...sampleWedding,
      bride: { name: "Simran", nameHi: "सिमरन" }, groom: { name: "Gurpreet", nameHi: "गुरप्रीत" },
      ceremonyStyle: "anand-karaj", motifs: ["ik-onkar"],
      events: sampleWedding.events.map((e) => e.kind === "wedding" ? { ...e, titleEn: "Anand Karaj", titleHi: "आनंद कारज", startsAt: "2027-02-13T10:00:00+05:30", venueName: "Gurudwara Sahib", venueArea: "Raja Park" } : e),
    },
    guest: sampleGuests.friend!,
  },
  Church: {
    content: {
      ...sampleWedding,
      bride: { name: "Maria", nameHi: "मारिया" }, groom: { name: "Joel", nameHi: "जोएल" },
      ceremonyStyle: "church", motifs: ["cross"],
      events: sampleWedding.events.filter((e) => e.kind === "wedding" || e.kind === "reception").map((e) => e.kind === "wedding" ? { ...e, titleEn: "Holy Matrimony", titleHi: "पवित्र विवाह", venueName: "St. Andrew's Church" } : e),
    },
    guest: { ...sampleGuests.office!, invitedEventIds: ["wedding", "reception"] },
  },
  "no photos": {
    content: { ...sampleWedding, story: [] },
    guest: sampleGuests.office!,
  },
};

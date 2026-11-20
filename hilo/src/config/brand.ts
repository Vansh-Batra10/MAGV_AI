/** Every brand-level value lives here. Never hardcode the name elsewhere. */
export const BRAND = {
  name: "Hilo",
  tagline: "For the people you love.",
  domain: "hilo.example", // placeholder
  supportEmail: "hello@hilo.example",
  supportWhatsApp: "+91XXXXXXXXXX", // placeholder, must be an Indian +91 number
  legalName: "OWNER_LEGAL_NAME", // placeholder
  gstin: "GSTIN_PLACEHOLDER",
  address: "ADDRESS_PLACEHOLDER",
  grievanceOfficer: { name: "OWNER_NAME", email: "grievance@hilo.example" },
  instagram: "https://instagram.com/hilo", // placeholder
  instagramHandle: "@hilo", // placeholder
} as const;

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

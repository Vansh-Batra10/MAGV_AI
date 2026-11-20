import { SITE_URL, BRAND } from "@/config/brand";

export function JsonLd({ data }: { data: unknown }) {
  // JSON-LD only (no user content) — safe to inline.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export const breadcrumb = (items: [string, string][]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${SITE_URL}${path}` })),
});

export const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: BRAND.name,
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512.png`,
  sameAs: [BRAND.instagram],
  contactPoint: { "@type": "ContactPoint", email: BRAND.supportEmail, contactType: "customer support" },
};

export const faqPage = (items: { q: string; a: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
});

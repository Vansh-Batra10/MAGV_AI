import { getTranslations } from "next-intl/server";
import { MessageCircle, Mail, ShieldCheck, MapPin } from "lucide-react";
import { resolveSite } from "@/lib/server/site";
import { PageHero } from "@/components/marketing/PageHero";
import { BRAND } from "@/config/brand";
import { siteMetadata } from "@/lib/seo";
import type { SiteKey } from "@/config/markets";

export async function generateMetadata({ params }: { params: Promise<{ site: string }> }) {
  return siteMetadata((await params).site as SiteKey, "/contact", { title: "Contact" });
}

export default async function Contact({ params }: { params: Promise<{ site: string }> }) {
  const { market } = await resolveSite(params);
  const t = await getTranslations("contact");
  const cards: [React.ReactNode, string, string, string?][] = [
    ...(market === "IN" ? [[<MessageCircle key="w" />, t("whatsapp"), BRAND.supportWhatsApp, `https://wa.me/${BRAND.supportWhatsApp.replace(/\D/g, "")}`] as [React.ReactNode, string, string, string]] : []),
    [<Mail key="m" />, t("email"), BRAND.supportEmail, `mailto:${BRAND.supportEmail}`],
    [<ShieldCheck key="g" />, t("grievance"), `${BRAND.grievanceOfficer.name} · ${BRAND.grievanceOfficer.email}`, `mailto:${BRAND.grievanceOfficer.email}`],
    [<MapPin key="a" />, t("address"), `${BRAND.legalName}, ${BRAND.address} · GSTIN ${BRAND.gstin}`],
  ];
  return (
    <main>
      <PageHero title={t("title")} sub={t("sub")} />
      <div className="container-x grid gap-4 md:grid-cols-2">
        {cards.map(([icon, label, value, href]) => (
          <a key={label} href={href} className="glass flex items-start gap-4 p-6 hover:bg-white/[0.06]">
            <span className="text-rose-400">{icon}</span>
            <span><span className="block text-sm font-semibold uppercase tracking-[0.12em] text-lo">{label}</span><span className="mt-1 block text-lg text-hi">{value}</span></span>
          </a>
        ))}
      </div>
    </main>
  );
}

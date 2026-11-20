import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BRAND } from "@/config/brand";
import { SITES, type SiteKey } from "@/config/markets";
import { Logo } from "@/components/ui/Logo";
import { ThreadDivider } from "@/components/ui/Thread";
import { RegionSwitcher } from "./RegionSwitcher";
import { CookieSettingsLink } from "./Consent";

export async function Footer({ site, path }: { site: SiteKey; path: string }) {
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");
  const h = (p: string) => (SITES[site].prefix + (p === "/" ? "" : p)) || "/";
  const india = SITES[site].market === "IN";
  const col = (title: string, links: [string, string][]) => (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-lo">{title}</p>
      <ul className="flex flex-col gap-2">{links.map(([href, label]) => <li key={href}><Link href={href} className="text-[15px] text-mid hover:text-hi">{label}</Link></li>)}</ul>
    </div>
  );
  return (
    <footer className="relative mt-24 pb-[max(32px,env(safe-area-inset-bottom))]">
      <ThreadDivider />
      <div className="container-x mt-10 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo animate={false} />
          <p className="mt-3 max-w-xs text-mid">{t("tagline")}</p>
          <p className="mt-4 text-sm text-lo">{india ? `WhatsApp: ${BRAND.supportWhatsApp}` : null}</p>
          <p className="text-sm text-lo">{BRAND.supportEmail}</p>
          <a href={BRAND.instagram} className="text-sm text-lo hover:text-hi" rel="noopener">Instagram {BRAND.instagramHandle}</a>
        </div>
        {col(t("product"), [[h("/gifts"), nav("gifts")], [h("/group"), nav("group")], [h("/long-distance"), nav("longDistance")], [h("/pricing"), nav("pricing")], [h("/reviews"), nav("reviews")]])}
        {col(t("company"), [[h("/about"), t("about")], [h("/contact"), t("contact")], [h("/partners"), t("partners")], [h("/guides"), t("guides")]])}
        {col(t("legal"), [[h("/privacy"), t("privacy")], [h("/terms"), t("terms")], [h("/refunds"), t("refunds")], [h("/delivery"), t("delivery")]])}
      </div>
      <div className="container-x mt-10 flex flex-col gap-6 border-t border-white/6 pt-6 md:flex-row md:items-start md:justify-between">
        <RegionSwitcher path={path} />
        <div className="text-xs leading-relaxed text-lo md:text-right">
          <p>{BRAND.legalName} · GSTIN {BRAND.gstin}</p>
          <p>{BRAND.address}</p>
          <p>{t("grievance")}: {BRAND.grievanceOfficer.name} · {BRAND.grievanceOfficer.email}</p>
          <p className="mt-2">{india ? t("payments") : t("paymentsGlobal")} · <CookieSettingsLink label={t("cookies")} /></p>
          <p className="mt-2">{t("rights", { year: new Date().getFullYear(), name: BRAND.name })}</p>
        </div>
      </div>
    </footer>
  );
}

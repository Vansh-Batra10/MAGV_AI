import { getTranslations } from "next-intl/server";
import { Check } from "lucide-react";
import { resolveSite } from "@/lib/server/site";
import { siteCurrency } from "@/lib/server/market";
import { PRICES, ADDONS, formatMoney } from "@/config/pricing";
import { PageHero } from "@/components/marketing/PageHero";
import { siteMetadata } from "@/lib/seo";
import type { SiteKey } from "@/config/markets";

export async function generateMetadata({ params }: { params: Promise<{ site: string }> }) {
  return siteMetadata((await params).site as SiteKey, "/pricing", { title: "Pricing — honest prices, free preview" });
}

export default async function Pricing({ params }: { params: Promise<{ site: string }> }) {
  const { site, market } = await resolveSite(params);
  const t = await getTranslations("pricingPage");
  const cur = await siteCurrency(site);
  const P = PRICES[cur];
  const m = (v?: number) => (v === undefined ? "—" : formatMoney(v, cur));
  const rows: [string, string, string, string, boolean?][] = [
    [t("freeName"), t("freeDesc"), t("freeName"), "—"],
    [t("miniName"), t("miniDesc"), m(P.mini.h24), m(P.mini.forever)],
    [t("classicName"), t("classicDesc"), m(P.classic.h24), m(P.classic.forever), true],
    [t("premiumName"), t("premiumDesc"), "—", m(P.premium.forever)],
    [t("groupName"), t("groupDesc"), "—", m(P.group.forever)],
    [t("groupPlusName"), t("groupPlusDesc"), "—", m(P.group_plus.forever)],
  ];
  return (
    <main>
      <PageHero title={t("title")} sub={t("sub")} />
      <div className="container-x">
        <div className="glass overflow-hidden">
          <div className="grid grid-cols-[1.6fr_1fr_1fr] gap-4 border-b border-white/8 px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-lo md:px-8">
            <span />
            <span className="text-right">{t("h24")}</span>
            <span className="text-right">{t("forever")}</span>
          </div>
          {rows.map(([name, desc, a, b, hi]) => (
            <div key={name} className={`grid grid-cols-[1.6fr_1fr_1fr] items-center gap-4 border-b border-white/6 px-5 py-6 last:border-0 md:px-8 ${hi ? "bg-rose-500/[0.06]" : ""}`}>
              <div><p className="font-display text-[26px] leading-none text-hi">{name}</p><p className="mt-2 text-sm text-mid">{desc}</p></div>
              <p className="text-right font-display text-[26px] text-hi">{a}</p>
              <p className="text-right font-display text-[26px] text-hi">{b}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="glass p-6">
            <h2 className="font-display text-[28px] text-hi">{t("addonsTitle")}</h2>
            <ul className="mt-3 flex flex-col gap-2 text-mid">
              <li className="flex gap-2"><Check size={18} className="text-rose-400" /> {t("addonPassword")}</li>
              <li className="flex gap-2"><Check size={18} className="text-rose-400" /> {t("addonPhotos", { price: formatMoney(ADDONS.extraPhotos[cur], cur) })}</li>
            </ul>
          </div>
          <div className="glass p-6 text-mid">
            <p>{t("upgrade")}</p>
            {market === "IN" && <p className="mt-3 text-sm text-lo">{t("gst")}</p>}
          </div>
        </div>
      </div>
    </main>
  );
}

import { getTranslations } from "next-intl/server";
import { AppChrome } from "@/components/layout/AppChrome";
import { BRAND } from "@/config/brand";

export const metadata = { title: "Redeem a gift code", robots: { index: false } };

/** Partner prepaid codes ship with the partner program (Release 2). Honest coming-soon state. */
export default async function Redeem() {
  const t = await getTranslations("comingSoon");
  return (
    <AppChrome>
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="eyebrow">{t("title")}</p>
        <h1 className="mt-3 font-display text-[44px] text-hi">Redeem a gift code</h1>
        <p className="mt-3 text-mid">{t("partners", { email: BRAND.supportEmail })}</p>
      </div>
    </AppChrome>
  );
}

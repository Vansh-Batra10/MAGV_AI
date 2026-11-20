import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Starfield } from "@/components/ui/Starfield";
import { LogoMark } from "@/components/ui/Logo";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="absolute inset-0 [background:var(--grad-aurora)]" />
      <Starfield />
      <div className="relative flex flex-col items-center gap-5">
        <LogoMark size={80} />
        <p className="font-display text-[120px] leading-none text-kiss">404</p>
        <h1 className="font-display text-[40px] leading-tight text-hi">{t("title")}</h1>
        <p className="text-mid">{t("sub")}</p>
        <Link href="/" className="mt-3 flex h-14 items-center rounded-full px-8 font-semibold text-white [background:var(--grad-kiss)]">{t("home")}</Link>
      </div>
    </main>
  );
}

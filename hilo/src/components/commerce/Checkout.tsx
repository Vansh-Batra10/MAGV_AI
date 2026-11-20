"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Lock, ShieldCheck, Loader2, Check } from "lucide-react";
import { formatMoney, type Duration, type Tier } from "@/config/pricing";
import type { Currency } from "@/config/markets";
import { BRAND } from "@/config/brand";
import { cn } from "@/lib/cn";
import type { Quote } from "@/lib/server/commerce";

type Props = {
  giftId: string; tier: Tier; durations: Duration[]; currency: Currency; market: "IN" | "GLOBAL";
  purpose: "purchase" | "upgrade"; payer: "sender" | "recipient"; recipientName: string; templateName: string; poster: string;
  defaultEmail?: string; walletMinor: number; mock: boolean; slug?: string | null; photosMax: number;
};

declare global {
  interface Window { Razorpay?: new (o: Record<string, unknown>) => { open: () => void; on: (e: string, cb: () => void) => void } }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((res) => {
    if (window.Razorpay) return res(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => res(true);
    s.onerror = () => res(false);
    document.body.appendChild(s);
  });
}

export function Checkout(p: Props) {
  const t = useTranslations("checkout");
  const router = useRouter();
  const [duration, setDuration] = useState<Duration>(p.durations.includes("forever") ? "forever" : p.durations[0]);
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [extraPhotos, setExtraPhotos] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [useWallet, setUseWallet] = useState(false);
  const [email, setEmail] = useState(p.defaultEmail ?? "");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockOrder, setMockOrder] = useState<string | null>(null);
  const isFree = p.tier === "free" && p.purpose === "purchase";
  const addons = useMemo(() => [...(extraPhotos ? ["extraPhotos"] : []), ...(usePassword ? ["password"] : [])], [extraPhotos, usePassword]);

  useEffect(() => {
    if (isFree) return;
    const id = setTimeout(async () => {
      const r = await fetch("/api/checkout/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ giftId: p.giftId, duration, addons, coupon: appliedCoupon, useWallet, email: email || "quote@example.com", currency: p.currency, purpose: p.purpose, payer: p.payer, quoteOnly: true }) });
      if (r.ok) {
        const j = await r.json();
        setQuote(j.quote);
        if (j.quote.couponError && appliedCoupon) setError(t("couponInvalid"));
      }
    }, 150);
    return () => clearTimeout(id);
  }, [duration, addons, appliedCoupon, useWallet, p.giftId, p.currency, p.purpose, p.payer, isFree, email, t]);

  const done = () => router.push(p.payer === "recipient" && p.slug ? `/g/${p.slug}` : `/success/${p.giftId}`);

  const savePassword = async () => {
    if (usePassword && password && p.payer === "sender") {
      await fetch(`/api/gifts/${p.giftId}/settings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    }
  };

  const pay = async () => {
    setBusy(true);
    setError(null);
    try {
      await savePassword();
      if (isFree) {
        const r = await fetch(`/api/gifts/${p.giftId}/free`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, consent: true }) });
        if (r.status === 429) return setError(t("freeQuota"));
        if (!r.ok) return setError(t("failed"));
        return done();
      }
      const r = await fetch("/api/checkout/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ giftId: p.giftId, duration, addons, coupon: appliedCoupon, useWallet, email, phone: phone || null, currency: p.currency, purpose: p.purpose, payer: p.payer, consent }) });
      if (!r.ok) return setError(t("failed"));
      const o = await r.json();
      if (!o.checkout) return done(); // fully covered by coupon / wallet
      if (o.provider === "mock") return setMockOrder(o.orderId);
      if (!(await loadRazorpay()) || !window.Razorpay) return setError(t("failed"));
      const rzp = new window.Razorpay({
        ...o.checkout,
        name: BRAND.name,
        description: p.templateName,
        prefill: { email, contact: phone },
        theme: { color: "#FF4D7E" },
        config: p.market === "IN" ? { display: { preferences: { show_default_blocks: true }, sequence: ["block.upi"], blocks: { upi: { name: "UPI", instruments: [{ method: "upi" }] } } } } : undefined,
        handler: async (resp: Record<string, string>) => {
          const v = await fetch("/api/checkout/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: o.orderId, ...resp }) });
          if (v.ok) done();
          else setError(t("failed"));
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on("payment.failed", () => setError(t("failed")));
      rzp.open();
    } finally {
      setBusy(false);
    }
  };

  const mockOutcome = async (outcome: "success" | "failure") => {
    const r = await fetch("/api/checkout/mock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: mockOrder, outcome }) });
    setMockOrder(null);
    if (outcome === "success" && r.ok) done();
    else setError(t("failed"));
  };

  const emailOk = /^\S+@\S+\.\S+$/.test(email);
  const canPay = emailOk && (isFree || consent) && (!usePassword || password.length >= 3) && !busy;
  const money = (m: number) => formatMoney(m, p.currency);

  return (
    <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[1fr_360px] md:gap-10">
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="font-display text-[44px] leading-none text-hi md:text-[56px]">{p.purpose === "upgrade" ? t("upgradeTitle") : t("title")}</h1>
          {p.purpose === "upgrade" && <p className="mt-2 text-mid">{p.payer === "recipient" ? t("recipientUpgradeSub", { name: p.recipientName }) : t("upgradeSub")}</p>}
          {isFree && <p className="mt-2 text-mid">{t("freeNote", { brand: BRAND.name })}</p>}
        </div>

        {p.purpose === "purchase" && !isFree && p.durations.length > 1 && (
          <section className="glass p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-lo">{t("duration")}</h2>
            <div className="grid grid-cols-2 gap-3">
              {p.durations.map((d) => (
                <button key={d} type="button" onClick={() => setDuration(d)} aria-pressed={duration === d} className={cn("rounded-2xl border p-4 text-left transition", duration === d ? "border-rose-500 bg-rose-500/10 shadow-[0_0_30px_-10px_rgba(255,77,126,0.8)]" : "border-white/10 bg-white/[0.03]")}>
                  <p className="font-display text-[26px] leading-none text-hi">{t(d)}</p>
                  <p className="mt-2 text-xs leading-snug text-mid">{d === "h24" ? t("h24Note") : t("foreverNote")}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {p.payer === "sender" && p.purpose === "purchase" && (
          <section className="glass p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-lo">{t("addons")}</h2>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl p-2 hover:bg-white/[0.03]">
              <input type="checkbox" checked={usePassword} onChange={(e) => setUsePassword(e.target.checked)} className="mt-1 h-5 w-5 accent-rose-500" />
              <span className="flex-1"><span className="flex items-center gap-2 font-semibold text-hi"><Lock size={14} /> {t("addonPassword")} <span className="text-xs font-normal text-emerald-300">{t("free")}</span></span><span className="text-sm text-mid">{t("addonPasswordNote")}</span></span>
            </label>
            {usePassword && <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("passwordPlaceholder")} maxLength={64} className="ml-10 mt-1 h-12 w-[calc(100%-2.5rem)] rounded-2xl border border-white/10 bg-black/25 px-4 text-hi focus:outline-none" />}
            {!isFree && p.photosMax > 1 && (
              <label className="mt-2 flex cursor-pointer items-start gap-3 rounded-2xl p-2 hover:bg-white/[0.03]">
                <input type="checkbox" checked={extraPhotos} onChange={(e) => setExtraPhotos(e.target.checked)} className="mt-1 h-5 w-5 accent-rose-500" />
                <span className="flex-1 font-semibold text-hi">{t("addonExtraPhotos")}</span>
              </label>
            )}
          </section>
        )}

        <section className="glass flex flex-col gap-4 p-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-hi">{t("email")}</span>
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-hi focus:border-rose-500/60 focus:outline-none" />
            <span className="mt-1 block text-xs text-lo">{t("emailNote")}</span>
          </label>
          {!isFree && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-hi">{p.market === "IN" ? t("phone") : t("phoneGlobal")}</span>
              <input type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={p.market === "IN" ? "+91" : "+1"} className="h-12 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-hi focus:outline-none" />
              <span className="mt-1 block text-xs text-lo">{t("phoneNote")}</span>
            </label>
          )}
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-white/[0.03] p-3 text-[13px] leading-relaxed text-mid">
            <input type="checkbox" checked={consent || isFree && consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-rose-500" />
            <span>{t.rich("consent", { brand: BRAND.name, link: (c) => <a href="/privacy" target="_blank" className="underline">{c}</a> })}</span>
          </label>
        </section>
      </div>

      <aside className="md:sticky md:top-8 md:self-start">
        <div className="glass-strong overflow-hidden">
          <div className="relative h-36 overflow-hidden">
            <img src={p.poster} alt="" className="h-full w-full object-cover opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#140c22] to-transparent" />
            <p className="absolute bottom-3 left-5 font-display text-[28px] italic text-hi">{p.templateName}</p>
          </div>
          <div className="flex flex-col gap-2 p-5 text-[15px]">
            {isFree ? (
              <Row label={t("total")} value={t("free")} strong />
            ) : quote ? (
              <>
                <Row label={p.purpose === "upgrade" ? t("forever") : `${p.templateName} · ${t(quote.duration)}`} value={money(quote.base)} />
                {quote.addons.map((a) => <Row key={a.key} label={t("addonExtraPhotos")} value={money(a.amount)} />)}
                {quote.couponOff > 0 && <Row label={t("discount")} value={"−" + money(quote.couponOff)} />}
                {quote.walletUsed > 0 && <Row label={t("wallet")} value={"−" + money(quote.walletUsed)} />}
                <div className="my-1 h-px bg-white/10" />
                <Row label={t("total")} value={money(quote.total)} strong />
                {p.currency === "INR" && <p className="text-right text-xs text-lo">{t("gstIncl")}</p>}
              </>
            ) : (
              <div className="h-20 animate-pulse rounded-xl bg-white/5" />
            )}
            {!isFree && (
              <div className="mt-2 flex gap-2">
                <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder={t("coupon")} aria-label={t("coupon")} className="h-11 min-w-0 flex-1 rounded-full border border-white/10 bg-black/25 px-4 text-sm text-hi focus:outline-none" />
                <button type="button" onClick={() => { setError(null); setAppliedCoupon(coupon || null); }} className="h-11 rounded-full bg-white/8 px-4 text-sm font-semibold text-hi">{t("apply")}</button>
              </div>
            )}
            {!isFree && p.walletMinor > 0 && (
              <label className="mt-1 flex items-center gap-2 text-sm text-mid"><input type="checkbox" checked={useWallet} onChange={(e) => setUseWallet(e.target.checked)} className="h-4 w-4 accent-rose-500" /> {t("useWallet", { amount: money(p.walletMinor) })}</label>
            )}
            {error && <p role="alert" className="mt-2 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
            <button type="button" onClick={pay} disabled={!canPay} className="mt-3 flex h-14 items-center justify-center gap-2 rounded-full text-[16px] font-semibold text-white [background:var(--grad-kiss)] shadow-[0_10px_30px_-8px_rgba(255,77,126,0.7)] disabled:opacity-40">
              {busy ? <Loader2 className="animate-spin" size={18} /> : null}
              {isFree ? t("sendFree") : quote ? t("pay", { amount: money(quote.total) }) : "…"}
            </button>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-lo"><ShieldCheck size={13} /> {p.market === "IN" ? t("secure") : t("secureGlobal")}</p>
            <p className="text-center text-xs text-lo">{t("honest")}</p>
          </div>
        </div>
      </aside>

      {mockOrder && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
          <div className="glass-strong w-full max-w-sm p-6" data-testid="mock-checkout">
            <p className="eyebrow">{BRAND.name} · MOCK</p>
            <h2 className="mt-2 font-display text-[32px] text-hi">{t("mock.title")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-mid">{t("mock.body")}</p>
            <p className="mt-4 font-display text-[40px] text-hi">{quote ? money(quote.total) : ""}</p>
            <div className="mt-5 flex flex-col gap-2">
              <button type="button" onClick={() => mockOutcome("success")} className="flex h-14 items-center justify-center gap-2 rounded-full font-semibold text-white [background:var(--grad-kiss)]"><Check size={18} /> {t("mock.success")}</button>
              <button type="button" onClick={() => mockOutcome("failure")} className="h-12 rounded-full bg-white/8 font-semibold text-mid">{t("mock.failure")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3", strong ? "text-[18px] font-semibold text-hi" : "text-mid")}>
      <span className="min-w-0 truncate">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

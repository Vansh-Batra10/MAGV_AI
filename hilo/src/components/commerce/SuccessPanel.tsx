"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check, Download, MessageCircle, Send, Mail, Camera, CalendarClock, Lock, Pencil, ExternalLink, Users, Bell } from "lucide-react";
import { CityPicker, type CityValue } from "@/components/creator/CityPicker";
import { cn } from "@/lib/cn";
import { trackClient } from "@/lib/client/track";

type Props = {
  giftId: string; slug: string; url: string; qr: string; market: "IN" | "GLOBAL"; isFree: boolean; is24h: boolean; expiresLabel: string | null;
  upgradeLabel: string | null; recipientName: string; templateSlug: string; scheduledLabel: string | null; hasPassword: boolean;
  contribUrl: string | null; isGroup: boolean; signedIn: boolean; giftLang: string; referral: string | null;
};

export function SuccessPanel(p: Props) {
  const t = useTranslations("success");
  const [copied, setCopied] = useState<string | null>(null);
  const [scheduled, setScheduled] = useState(p.scheduledLabel);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("00:00");
  const [city, setCity] = useState<CityValue | undefined>();
  const [rPhone, setRPhone] = useState("");
  const [rEmail, setREmail] = useState("");
  const [pw, setPw] = useState("");
  const [hasPw, setHasPw] = useState(p.hasPassword);
  const shareText = t("shareText");
  const groupText = t("groupShareText", { name: p.recipientName });

  const copy = async (s: string, k: string) => {
    await navigator.clipboard?.writeText(s);
    setCopied(k);
    setTimeout(() => setCopied(null), 1800);
  };

  const shareTargets = (text: string, url: string) => {
    const all = {
      whatsapp: { label: "WhatsApp", icon: <MessageCircle size={18} />, href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}` },
      sms: { label: "iMessage / SMS", icon: <Send size={18} />, href: `sms:?&body=${encodeURIComponent(`${text} ${url}`)}` },
      email: { label: "Email", icon: <Mail size={18} />, href: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}` },
      instagram: { label: "Instagram", icon: <Camera size={18} />, href: `https://instagram.com/direct/inbox/` },
    };
    const order = p.market === "IN" ? (["whatsapp", "instagram", "sms", "email"] as const) : (["sms", "whatsapp", "instagram", "email"] as const);
    return order.map((k) => ({ k, ...all[k] }));
  };

  const schedule = async () => {
    if (!date || !city) return;
    // Convert the local time in the recipient's timezone to UTC.
    const [y, m, d] = date.split("-").map(Number);
    const [hh, mm] = time.split(":").map(Number);
    const guess = Date.UTC(y, m - 1, d, hh, mm);
    const tzOffset = (at: number) => {
      const parts = new Intl.DateTimeFormat("en-US", { timeZone: city.tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(at));
      const g = (ty: string) => Number(parts.find((x) => x.type === ty)?.value);
      return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute")) - at;
    };
    const utc = guess - tzOffset(guess);
    const r = await fetch(`/api/gifts/${p.giftId}/settings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deliverAtUtc: new Date(utc).toISOString(), recipientTz: city.tz, recipientContact: { phone: rPhone || undefined, email: rEmail || undefined } }) });
    if (r.ok) setScheduled(`${date} ${time}`);
  };
  const cancel = async () => {
    await fetch(`/api/gifts/${p.giftId}/settings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deliverAtUtc: null }) });
    setScheduled(null);
  };
  const setPassword = async (v: string | null) => {
    const r = await fetch(`/api/gifts/${p.giftId}/settings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: v }) });
    if (r.ok) setHasPw(!!v);
  };

  const card = "glass p-5 md:p-6";
  const h = "flex items-center gap-2 font-display text-[26px] leading-tight text-hi";
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      {/* Link + QR */}
      <section className={cn(card, "grid gap-5 md:grid-cols-[1fr_180px] md:items-center")}>
        <div className="min-w-0">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 p-2 pl-4">
            <span className="min-w-0 flex-1 truncate font-mono text-[14px] text-hi" data-testid="gift-url">{p.url}</span>
            <button type="button" onClick={() => copy(p.url, "link")} className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-white [background:var(--grad-kiss)]">
              {copied === "link" ? <Check size={16} /> : <Copy size={16} />} {copied === "link" ? t("copied") : t("copy")}
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {shareTargets(shareText, p.url).map((s) => (
              <a key={s.k} href={s.href} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white/[0.06] text-sm font-medium text-hi hover:bg-white/10">{s.icon} {s.label}</a>
            ))}
          </div>
          <a href={`/g/${p.slug}`} target="_blank" className="mt-3 inline-flex items-center gap-1.5 text-sm text-mid hover:text-hi"><ExternalLink size={14} /> {t("open")}</a>
        </div>
        <div className="flex flex-col items-center gap-2">
          <img src={p.qr} alt={t("qr")} className="h-40 w-40 rounded-2xl bg-cream-50 p-2" />
          <a href={p.qr} download={`gift-${p.slug}.png`} className="inline-flex items-center gap-1.5 text-sm text-mid hover:text-hi"><Download size={14} /> {t("downloadQr")}</a>
        </div>
      </section>

      {p.isGroup && p.contribUrl && (
        <section className={card}>
          <h2 className={h}><Users size={20} className="text-rose-400" /> {t("groupTitle")}</h2>
          <p className="mt-1 text-mid">{t("groupSub")}</p>
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 p-2 pl-4">
            <span className="min-w-0 flex-1 truncate font-mono text-[14px] text-hi" data-testid="contrib-url">{p.contribUrl}</span>
            <button type="button" onClick={() => copy(p.contribUrl!, "contrib")} className="h-11 rounded-xl bg-white/10 px-4 text-sm font-semibold text-hi">{copied === "contrib" ? t("copied") : t("copy")}</button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {shareTargets(groupText, p.contribUrl).slice(0, 2).map((s) => <a key={s.k} href={s.href} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center gap-2 rounded-2xl bg-white/[0.06] px-4 text-sm text-hi">{s.icon} {s.label}</a>)}
            <a href={`/group/${p.giftId}/manage`} className="flex h-11 items-center rounded-2xl px-4 text-sm font-semibold text-rose-300">{t("manage")} →</a>
          </div>
        </section>
      )}

      {p.is24h && p.upgradeLabel && (
        <section className={cn(card, "flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between")}>
          <p className="text-mid">{p.expiresLabel}</p>
          <a href={`/checkout/${p.giftId}?upgrade=1`} className="flex h-12 items-center rounded-full px-6 font-semibold text-white [background:var(--grad-kiss)]">{p.upgradeLabel}</a>
        </section>
      )}

      {/* Schedule */}
      <section className={card}>
        <h2 className={h}><CalendarClock size={20} className="text-lavender-300" /> {t("schedule")}</h2>
        <p className="mt-1 text-mid">{t("scheduleSub")}</p>
        {scheduled ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="text-emerald-300" data-testid="scheduled">{t("scheduled", { when: scheduled, tz: city?.name ?? "" })}</p>
            <button type="button" onClick={cancel} className="text-sm text-mid underline">{t("cancelSchedule")}</button>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-mid">{t("date")}<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-hi [color-scheme:dark]" /></label>
            <label className="text-sm text-mid">{t("time")}<input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-hi [color-scheme:dark]" /></label>
            <div className="sm:col-span-2"><CityPicker label={t("tz")} value={city} onChange={setCity} /></div>
            <label className="text-sm text-mid">{p.market === "IN" ? t("recipientPhone") : t("recipientPhoneGlobal")}<input type="tel" value={rPhone} onChange={(e) => setRPhone(e.target.value)} className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-hi" /></label>
            <label className="text-sm text-mid">{t("recipientEmail")}<input type="email" value={rEmail} onChange={(e) => setREmail(e.target.value)} className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-hi" /></label>
            <button type="button" disabled={!date || !city || (!rPhone && !rEmail)} onClick={schedule} className="h-12 rounded-full bg-white/10 font-semibold text-hi disabled:opacity-40 sm:col-span-2">{t("scheduleBtn")}</button>
          </div>
        )}
      </section>

      {/* Story card + print */}
      <section className="grid gap-5 md:grid-cols-2">
        <div className={card}>
          <h2 className={h}>{t("storyCard")}</h2>
          <p className="mt-1 text-sm text-mid">{t("storyCardSub")}</p>
          <a href={`/api/story-card/${p.slug}`} download={`story-${p.slug}.png`} onClick={() => trackClient("story_card_downloaded", { template: p.templateSlug }, p.giftId)} className="mt-4 flex h-12 items-center justify-center gap-2 rounded-full bg-white/10 font-semibold text-hi"><Download size={16} /> {t("downloadStory")}</a>
        </div>
        <div className={card}>
          <h2 className={h}>{t("print")}</h2>
          <p className="mt-1 text-sm text-mid">{t("printSub")}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {(["night", "paper", "wallet", "stickers"] as const).map((d) => (
              <a key={d} href={`/api/print/${p.slug}?design=${d}`} target="_blank" className="flex h-11 items-center justify-center rounded-2xl bg-white/[0.06] text-sm text-hi hover:bg-white/10">{t(`printDesigns.${d}`)}</a>
            ))}
          </div>
        </div>
      </section>

      {/* Password + edit */}
      <section className={cn(card, "flex flex-col gap-4 md:flex-row md:items-end md:justify-between")}>
        <div className="flex-1">
          <h2 className={h}><Lock size={18} /> {t("password")}</h2>
          {hasPw ? (
            <div className="mt-3 flex items-center gap-3"><span className="text-emerald-300">{t("passwordSet")}</span><button type="button" onClick={() => setPassword(null)} className="text-sm text-mid underline">{t("removePassword")}</button></div>
          ) : (
            <div className="mt-3 flex gap-2"><input value={pw} onChange={(e) => setPw(e.target.value)} maxLength={64} className="h-12 min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/25 px-4 text-hi" aria-label={t("setPassword")} /><button type="button" disabled={pw.length < 3} onClick={() => setPassword(pw)} className="h-12 rounded-full bg-white/10 px-5 font-semibold text-hi disabled:opacity-40">{t("setPassword")}</button></div>
          )}
        </div>
        <a href={`/create/${p.templateSlug}?gift=${p.giftId}&mode=form`} className="flex h-12 items-center justify-center gap-2 rounded-full border border-white/12 px-5 text-sm font-semibold text-hi"><Pencil size={14} /> {t("edit")}</a>
      </section>

      <section className={cn(card, "flex flex-col gap-3 md:flex-row md:items-center md:justify-between")} data-glow="amber">
        <div>
          <h2 className={h}><Bell size={18} className="text-amber-300" /> {t("reminderTitle")}</h2>
          <p className="mt-1 text-sm text-mid">{t("reminderSub")}</p>
        </div>
        <a href={`/dashboard/reminders?name=${encodeURIComponent(p.recipientName)}`} className="flex h-12 shrink-0 items-center justify-center rounded-full bg-white/10 px-5 font-semibold text-hi">{p.signedIn ? t("reminderCta") : t("signInToSave")}</a>
      </section>
      {p.referral && <p className="text-center text-sm text-lo">{p.referral}</p>}
    </div>
  );
}

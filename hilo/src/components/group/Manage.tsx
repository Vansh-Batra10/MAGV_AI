"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { EyeOff, Eye, Trash2, MessageCircle, Send, Copy, Check } from "lucide-react";
import { CityPicker, type CityValue } from "@/components/creator/CityPicker";
import { cn } from "@/lib/cn";

type C = { id: string; name: string; message: string; photo_url: string | null; voice_url: string | null; hidden: boolean; created_at: string };

function toUtc(date: string, time: string, tz: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(guess));
  const g = (ty: string) => Number(parts.find((x) => x.type === ty)?.value);
  return new Date(guess - (Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute")) - guess));
}

export function Manage({ giftId, recipient, contribUrl, items: initial, max, deadline, paid, revealLabel, market, templateSlug }: { giftId: string; recipient: string; contribUrl: string; items: C[]; max: number; deadline: string | null; paid: boolean; revealLabel: string | null; market: "IN" | "GLOBAL"; templateSlug: string }) {
  const t = useTranslations("manage");
  const ts = useTranslations("success");
  const [items, setItems] = useState(initial);
  const [copied, setCopied] = useState(false);
  const [left, setLeft] = useState<string | null>(null);
  const [dl, setDl] = useState(deadline);
  const [dlDate, setDlDate] = useState("");
  const [rDate, setRDate] = useState("");
  const [rTime, setRTime] = useState("00:00");
  const [city, setCity] = useState<CityValue | undefined>();
  const [rPhone, setRPhone] = useState("");
  const [rEmail, setREmail] = useState("");
  const [reveal, setReveal] = useState(revealLabel);
  const nudge = t("nudgeText", { name: recipient }) + " " + contribUrl;

  useEffect(() => {
    if (!dl) return setLeft(null);
    const tick = () => {
      const ms = new Date(dl).getTime() - Date.now();
      setLeft(ms <= 0 ? "0" : t("deadlineLeft", { d: Math.floor(ms / 86400000), h: Math.floor((ms % 86400000) / 3600000) }));
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [dl, t]);

  const patch = async (id: string, body: object) => {
    await fetch(`/api/contributions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  };
  const del = async (id: string) => {
    await fetch(`/api/contributions/${id}`, { method: "DELETE" });
    setItems((x) => x.filter((c) => c.id !== id));
  };
  const settings = (b: object) => fetch(`/api/gifts/${giftId}/settings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });

  const card = "glass p-5 md:p-6";
  return (
    <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-5">
        <section className={card}>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-[30px] text-hi">{t("contributions", { n: items.length })} <span className="text-lg text-lo">{t("limit", { max })}</span></h2>
            <a href={`/create/${templateSlug}?gift=${giftId}`} className="text-sm text-rose-300">{t("preview")} →</a>
          </div>
          {items.length === 0 ? (
            <p className="mt-4 text-mid">{t("empty")}</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3" data-testid="contrib-list">
              {items.map((c) => (
                <li key={c.id} className={cn("flex gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3", c.hidden && "opacity-50")}>
                  {c.photo_url && <img src={c.photo_url} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-hi">{c.name} {c.hidden && <span className="ml-1 text-xs text-lo">· {t("hidden")}</span>}</p>
                    <p className="line-clamp-2 text-sm text-mid">{c.message}</p>
                    {c.voice_url && <audio src={c.voice_url} controls className="mt-2 h-8 w-full" />}
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button type="button" aria-label={c.hidden ? t("show") : t("hide")} onClick={async () => { await patch(c.id, { hidden: !c.hidden }); setItems((x) => x.map((y) => (y.id === c.id ? { ...y, hidden: !y.hidden } : y))); }} className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-mid hover:text-hi">{c.hidden ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                    <button type="button" aria-label={t("delete")} onClick={() => del(c.id)} className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-mid hover:text-rose-400"><Trash2 size={16} /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <aside className="flex flex-col gap-5">
        <section className={card}>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-lo">{t("shareLink")}</h3>
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 p-2 pl-3">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-hi">{contribUrl}</span>
            <button type="button" onClick={async () => { await navigator.clipboard?.writeText(contribUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-hi" aria-label="copy">{copied ? <Check size={16} /> : <Copy size={16} />}</button>
          </div>
          <div className={cn("mt-3 flex gap-2", market === "GLOBAL" && "flex-row-reverse")}>
            <a href={`https://wa.me/?text=${encodeURIComponent(nudge)}`} target="_blank" rel="noopener noreferrer" className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-white/[0.06] text-sm text-hi"><MessageCircle size={16} /> {t("nudge")}</a>
            <a href={`sms:?&body=${encodeURIComponent(nudge)}`} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-white/[0.06] text-sm text-hi"><Send size={16} /> {t("nudgeSms")}</a>
          </div>
        </section>
        <section className={card}>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-lo">{t("deadline")}</h3>
          <p className="mt-2 font-display text-[26px] text-hi">{left ?? t("noDeadline")}</p>
          <div className="mt-2 flex gap-2">
            <input type="datetime-local" value={dlDate} onChange={(e) => setDlDate(e.target.value)} className="h-11 min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/25 px-3 text-sm text-hi [color-scheme:dark]" aria-label={t("deadline")} />
            <button type="button" disabled={!dlDate} onClick={async () => { const iso = new Date(dlDate).toISOString(); await settings({ contribDeadlineUtc: iso }); setDl(iso); }} className="h-11 rounded-2xl bg-white/10 px-3 text-sm font-semibold text-hi disabled:opacity-40">{t("setDeadline")}</button>
          </div>
        </section>
        <section className={card}>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-lo">{t("reveal")}</h3>
          <p className="mt-1 text-sm text-mid">{t("revealSub", { name: recipient })}</p>
          {reveal ? <p className="mt-3 text-emerald-300">{ts("scheduled", { when: reveal, tz: city?.name ?? "" })}</p> : (
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex gap-2">
                <input type="date" value={rDate} onChange={(e) => setRDate(e.target.value)} className="h-11 min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/25 px-3 text-sm text-hi [color-scheme:dark]" aria-label={ts("date")} />
                <input type="time" value={rTime} onChange={(e) => setRTime(e.target.value)} className="h-11 w-28 rounded-2xl border border-white/10 bg-black/25 px-3 text-sm text-hi [color-scheme:dark]" aria-label={ts("time")} />
              </div>
              <CityPicker label={ts("tz")} value={city} onChange={setCity} />
              <input type="tel" value={rPhone} onChange={(e) => setRPhone(e.target.value)} placeholder={market === "IN" ? ts("recipientPhone") : ts("recipientPhoneGlobal")} className="h-11 rounded-2xl border border-white/10 bg-black/25 px-3 text-sm text-hi" />
              <input type="email" value={rEmail} onChange={(e) => setREmail(e.target.value)} placeholder={ts("recipientEmail")} className="h-11 rounded-2xl border border-white/10 bg-black/25 px-3 text-sm text-hi" />
              <button type="button" disabled={!rDate || !city} onClick={async () => {
                const at = toUtc(rDate, rTime, city!.tz).toISOString();
                const r = await settings({ deliverAtUtc: at, revealAtUtc: at, recipientTz: city!.tz, recipientContact: { phone: rPhone || undefined, email: rEmail || undefined } });
                if (r.ok) setReveal(`${rDate} ${rTime}`);
              }} className="h-11 rounded-2xl bg-white/10 text-sm font-semibold text-hi disabled:opacity-40">{ts("scheduleBtn")}</button>
            </div>
          )}
        </section>
        <section className={card}>
          {paid ? <p className="text-emerald-300">{t("paid")}</p> : (
            <>
              <a href={`/checkout/${giftId}`} className="flex h-14 items-center justify-center rounded-full font-semibold text-white [background:var(--grad-kiss)]">{t("payLock")}</a>
              <p className="mt-2 text-xs text-lo">{t("payNote")}</p>
            </>
          )}
          <a href={`/create/${templateSlug}?gift=${giftId}&mode=form`} className="mt-3 block text-center text-sm text-mid underline-offset-4 hover:underline">{t("edit")}</a>
        </section>
      </aside>
    </div>
  );
}

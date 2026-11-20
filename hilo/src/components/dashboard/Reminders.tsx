"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";

type R = { id: string; person_name: string; relation: string | null; occasion: string; month: number; day: number; channel: string };

export function RemindersForm({ initial, defaultName }: { initial: R[]; defaultName: string }) {
  const t = useTranslations("reminders");
  const [rows, setRows] = useState(initial);
  const [name, setName] = useState(defaultName);
  const [relation, setRelation] = useState("");
  const [occasion, setOccasion] = useState("birthday");
  const [date, setDate] = useState("");
  const [wa, setWa] = useState(false);
  const f = "h-12 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-hi focus:outline-none [color-scheme:dark]";
  const add = async () => {
    const [, m, d] = date.split("-").map(Number);
    const body = { personName: name, relation: relation || undefined, occasion, month: m, day: d, channel: wa ? "whatsapp" : "email" };
    const r = await fetch("/api/reminders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (r.ok) {
      const { id } = await r.json();
      setRows((x) => [...x, { id, person_name: name, relation, occasion, month: m, day: d, channel: body.channel }].sort((a, b) => a.month - b.month || a.day - b.day));
      setName(""); setRelation(""); setDate("");
    }
  };
  return (
    <>
      <div className="glass mt-8 grid gap-3 p-5 sm:grid-cols-2">
        <label className="text-sm text-mid">{t("person")}<input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className={`${f} mt-1`} /></label>
        <label className="text-sm text-mid">{t("relation")}<input value={relation} onChange={(e) => setRelation(e.target.value)} maxLength={20} className={`${f} mt-1`} /></label>
        <label className="text-sm text-mid">{t("occasion")}
          <select value={occasion} onChange={(e) => setOccasion(e.target.value)} className={`${f} mt-1`}>
            {["birthday", "anniversary", "other"].map((o) => <option key={o} value={o} className="bg-ink-900">{t(`occasions.${o}`)}</option>)}
          </select>
        </label>
        <label className="text-sm text-mid">{t("date")}<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${f} mt-1`} /></label>
        <label className="flex items-center gap-2 text-sm text-mid sm:col-span-2"><input type="checkbox" checked={wa} onChange={(e) => setWa(e.target.checked)} className="h-5 w-5 accent-rose-500" /> {t("whatsappOptIn")}</label>
        <button type="button" disabled={!name || !date} onClick={add} className="h-12 rounded-full font-semibold text-white [background:var(--grad-kiss)] disabled:opacity-40 sm:col-span-2">{t("add")}</button>
      </div>
      <ul className="mt-6 flex flex-col gap-3">
        {rows.length === 0 && <li className="text-mid">{t("empty")}</li>}
        {rows.map((r) => (
          <li key={r.id} className="glass flex items-center gap-4 p-4">
            <span className="font-mono text-amber-300">{String(r.day).padStart(2, "0")}/{String(r.month).padStart(2, "0")}</span>
            <span className="flex-1 text-hi">{r.person_name} <span className="text-sm text-lo">· {r.relation || ""} {t(`occasions.${["birthday", "anniversary"].includes(r.occasion) ? r.occasion : "other"}`)} · {r.channel}</span></span>
            <button type="button" aria-label={t("remove")} onClick={async () => { await fetch(`/api/reminders?id=${r.id}`, { method: "DELETE" }); setRows((x) => x.filter((y) => y.id !== r.id)); }} className="grid h-10 w-10 place-items-center rounded-full text-lo hover:text-rose-400"><Trash2 size={16} /></button>
          </li>
        ))}
      </ul>
    </>
  );
}

"use client";
import { useTranslations } from "next-intl";
import { Music } from "lucide-react";
import { parseSong } from "@/lib/song";

export function SongInput({ value, title, onChange, onTitle }: { value: string; title: string; onChange: (v: string) => void; onTitle: (v: string) => void }) {
  const t = useTranslations("creator");
  const s = parseSong(value);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-14 items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-4">
        <Music size={18} className="text-[var(--glow)]" />
        <input value={value} onChange={(e) => onChange(e.target.value)} inputMode="url" placeholder="https://youtu.be/… or open.spotify.com/track/…" aria-label="Song link" className="h-full flex-1 bg-transparent text-[16px] text-hi placeholder:text-lo focus:outline-none" />
      </div>
      {value && <p className={s ? "text-sm text-emerald-300" : "text-sm text-rose-400"}>{s ? t("songOk", { provider: s.provider === "youtube" ? "YouTube" : "Spotify" }) : t("songInvalid")}</p>}
      {s && <input value={title} maxLength={80} onChange={(e) => onTitle(e.target.value)} placeholder={t("songTitle")} className="h-12 rounded-2xl border border-white/10 bg-black/25 px-4 text-hi placeholder:text-lo focus:outline-none" />}
    </div>
  );
}

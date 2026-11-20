"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import { searchCities, type City } from "@/data/cities";

export type CityValue = { name: string; tz: string; lat: number; lon: number; country: string };

export function CityPicker({ label, value, onChange }: { label: string; value?: CityValue; onChange: (c: CityValue) => void }) {
  const t = useTranslations("creator");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const res = searchCities(q, 6);
  const choose = (c: City) => {
    onChange({ name: c.name, tz: c.tz, lat: c.lat, lon: c.lon, country: c.country });
    setQ("");
    setOpen(false);
  };
  return (
    <div className="relative">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-lo">{label}</p>
      <div className="flex h-14 items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-4 focus-within:border-[rgba(var(--glow-rgb),0.6)]">
        <MapPin size={18} className="text-[var(--glow)]" />
        <input
          value={open ? q : value?.name ?? ""}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          placeholder={t("searchCity")}
          aria-label={label}
          className="h-full flex-1 bg-transparent text-[17px] text-hi placeholder:text-lo focus:outline-none"
        />
      </div>
      {open && res.length > 0 && (
        <ul className="glass-strong absolute z-30 mt-2 w-full overflow-hidden p-1" role="listbox">
          {res.map((c) => (
            <li key={c.name + c.country}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => choose(c)} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-hi hover:bg-white/10">
                <span>{c.name}</span>
                <span className="text-xs text-lo">{c.country} · {c.tz.split("/").pop()?.replace(/_/g, " ")}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

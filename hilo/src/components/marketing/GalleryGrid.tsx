"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Chip } from "@/components/ui/Chip";
import { TemplateCard } from "./TemplateCard";

export type GalleryItem = { slug: string; occasion: string[]; moods: string[]; relations: string[]; mode: string; priceLabel: string };

export function GalleryGrid({ items, occasions, limit, showFilters = true }: { items: GalleryItem[]; occasions: { slug: string; name: string }[]; limit?: number; showFilters?: boolean }) {
  const t = useTranslations("gallery");
  const [occ, setOcc] = useState<string | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [rel, setRel] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const list = useMemo(
    () => items.filter((i) => (!occ || i.occasion.includes(occ)) && (!mood || i.moods.includes(mood)) && (!rel || i.relations.includes(rel) || (rel === "maa" && i.relations.includes("papa"))) && (!mode || (mode === "group" ? i.mode !== "individual" : i.mode !== "group"))).slice(0, limit ?? 99),
    [items, occ, mood, rel, mode, limit],
  );
  const row = (label: string, opts: { v: string; l: string }[], val: string | null, set: (v: string | null) => void) => (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-lo">{label}</span>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        <Chip selected={!val} onClick={() => set(null)}>{t("all")}</Chip>
        {opts.map((o) => <Chip key={o.v} selected={val === o.v} onClick={() => set(val === o.v ? null : o.v)}>{o.l}</Chip>)}
      </div>
    </div>
  );
  return (
    <div>
      {showFilters && (
        <div className="mb-12 flex flex-col gap-3">
          {row(t("occasion"), occasions.map((o) => ({ v: o.slug, l: o.name })), occ, setOcc)}
          {row(t("mood"), ["cute", "emotional", "filmy", "funny"].map((m) => ({ v: m, l: t(`moods.${m}`) })), mood, setMood)}
          {row(t("forLabel"), ["partner", "maa", "sibling", "friend", "group"].map((m) => ({ v: m, l: t(`relations.${m}`) })), rel, setRel)}
          {row(t("mode"), [{ v: "individual", l: t("individual") }, { v: "group", l: t("groupMode") }], mode, setMode)}
        </div>
      )}
      {list.length ? (
        <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((i) => <TemplateCard key={i.slug} slug={i.slug} priceLabel={i.priceLabel} />)}
        </div>
      ) : (
        <p className="py-16 text-center text-mid">{t("empty")}</p>
      )}
    </div>
  );
}

"use client";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ImagePlus, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { uploadPhotos } from "@/lib/client/upload";
import { cn } from "@/lib/cn";

/** Multi-select photos → compress to WebP (EXIF stripped) → upload. Reorder with arrows, remove with ×. */
export function PhotoPicker({ value, onChange, max, big }: { value: string[]; onChange: (v: string[]) => void; max: number; big?: boolean }) {
  const t = useTranslations("media");
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState(false);
  const room = max - value.length;

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, Math.max(room, max === 1 ? 1 : 0));
    if (!list.length) return;
    setError(false);
    setBusy({ done: 0, total: list.length });
    try {
      const urls = await uploadPhotos(list, {}, (done) => setBusy({ done, total: list.length }));
      onChange(max === 1 ? urls.slice(0, 1) : [...value, ...urls].slice(0, max));
    } catch {
      setError(true);
    } finally {
      setBusy(null);
      if (input.current) input.current.value = "";
    }
  };
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const v = [...value];
    [v[i], v[j]] = [v[j], v[i]];
    onChange(v);
  };

  return (
    <div>
      <div className={cn("grid gap-3", big ? "grid-cols-3" : "grid-cols-4")}>
        {value.map((u, i) => (
          <div key={u + i} className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <img src={u} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} aria-label={t("remove")} className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur"><X size={14} /></button>
            {value.length > 1 && (
              <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
                <button type="button" onClick={() => move(i, -1)} aria-label={t("moveLeft")} className="grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white disabled:opacity-0" disabled={i === 0}><ChevronLeft size={14} /></button>
                <button type="button" onClick={() => move(i, 1)} aria-label={t("moveRight")} className="grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white disabled:opacity-0" disabled={i === value.length - 1}><ChevronRight size={14} /></button>
              </div>
            )}
          </div>
        ))}
        {(room > 0 || max === 1) && (
          <button type="button" onClick={() => input.current?.click()} disabled={!!busy}
            className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/[0.03] text-sm text-mid transition hover:border-[rgba(var(--glow-rgb),0.6)] hover:text-hi">
            {busy ? <Loader2 className="animate-spin" size={22} /> : <ImagePlus size={24} />}
            <span className="px-2 text-center text-xs">{busy ? t("photosUploading", busy) : max === 1 && value.length ? t("photosAdd") : t("photosAdd")}</span>
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-lo">{t("photosLimit", { n: max })}</p>
      {error && <p role="alert" className="mt-1 text-sm text-rose-400">{t("uploadFailed")}</p>}
      <input ref={input} type="file" accept="image/*" multiple={max > 1} className="sr-only" onChange={(e) => pick(e.target.files)} />
    </div>
  );
}

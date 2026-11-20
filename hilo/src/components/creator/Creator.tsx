"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Check, Loader2, Maximize2, Sparkles, X, Pencil } from "lucide-react";
import { getTemplate } from "@/templates/registry";
import { RENDERERS } from "@/templates/renderers";
import { pick, type Question } from "@/templates/types";
import type { GiftLanguage } from "@/config/markets";
import { GIFT_LANGUAGES } from "@/config/markets";
import { getPath, setPath } from "@/lib/paths";
import { ScaledStage, PhoneFrame } from "@/components/ui/PhoneFrame";
import { PhotoPicker } from "./PhotoPicker";
import { CityPicker } from "./CityPicker";
import { SongInput } from "./SongInput";
import { FormEditor } from "./FormEditor";
import { VoiceRecorder } from "@/components/media/VoiceRecorder";
import { uploadBlob } from "@/lib/client/upload";
import { trackClient } from "@/lib/client/track";
import { Starfield } from "@/components/ui/Starfield";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";
import { haptic } from "@/lib/client/haptics";

type GiftMsgs = Record<GiftLanguage, Record<string, unknown>>;

export function Creator({ slug, initialLang, giftMessages, initialName, startInForm, resumeId }: { slug: string; initialLang: GiftLanguage; giftMessages: GiftMsgs; initialName?: string; startInForm?: boolean; resumeId?: string }) {
  const t = useTranslations("creator");
  const router = useRouter();
  const tpl = getTemplate(slug)!;
  const R = RENDERERS[slug];
  const storeKey = `hilo_draft_${slug}`;
  const [lang, setLang] = useState<GiftLanguage>(initialLang);
  const [content, setContent] = useState<any>(() => {
    const d = tpl.defaults(initialLang);
    return initialName ? { ...d, recipientName: initialName } : d;
  });
  const [answered, setAnswered] = useState<Set<string>>(() => new Set(initialName ? ["recipientName"] : []));
  const [step, setStep] = useState(0);
  const [view, setView] = useState<"questions" | "writing" | "preview" | "form">(startInForm ? "form" : "questions");
  const [giftId, setGiftId] = useState<string | null>(resumeId ?? null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error" | "blocked">("idle");
  const t0 = useRef(Date.now());
  const previewTracked = useRef(false);
  const creating = useRef<Promise<string> | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore local draft / resume a server draft.
  useEffect(() => {
    (async () => {
      if (resumeId) {
        const r = await fetch(`/api/gifts/${resumeId}`);
        if (r.ok) {
          const g = await r.json();
          setContent(g.content);
          setLang(g.giftLanguage);
          setAnswered(new Set(tpl.questions.map((q) => q.field)));
          if (!startInForm) setView("preview");
        }
        return;
      }
      try {
        const raw = localStorage.getItem(storeKey);
        if (!raw || initialName) return;
        const d = JSON.parse(raw);
        if (d.content) setContent(d.content);
        if (d.lang) setLang(d.lang);
        if (d.giftId) setGiftId(d.giftId);
        if (Array.isArray(d.answered)) setAnswered(new Set(d.answered));
        if (typeof d.step === "number") setStep(Math.min(d.step, tpl.questions.length - 1));
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureGift = useCallback(async (c: unknown) => {
    if (giftId) return giftId;
    if (!creating.current) {
      creating.current = fetch("/api/gifts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ templateSlug: slug, content: c, giftLanguage: lang, createdVia: view === "form" ? "form" : "questions" }) })
        .then((r) => r.json())
        .then((j) => {
          setGiftId(j.id);
          return j.id as string;
        });
    }
    return creating.current;
  }, [giftId, slug, lang, view]);

  const saveNow = useCallback(async (c: unknown, l: GiftLanguage) => {
    try {
      setSaveState("saving");
      const id = await ensureGift(c);
      const r = await fetch(`/api/gifts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: c, giftLanguage: l }) });
      setSaveState(r.ok ? "saved" : r.status === 422 && (await r.json()).error === "content_not_allowed" ? "blocked" : "error");
      return r.ok ? id : null;
    } catch {
      setSaveState("error");
      return null;
    }
  }, [ensureGift]);

  // Autosave: localStorage immediately, server every 2s after changes.
  useEffect(() => {
    try {
      localStorage.setItem(storeKey, JSON.stringify({ content, lang, giftId, answered: [...answered], step }));
    } catch {}
    if (!answered.size) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void saveNow(content, lang), 2000);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [content, lang, answered, step, giftId, storeKey, saveNow]);

  const q: Question | undefined = tpl.questions[step];
  const setField = (path: string, v: unknown) => {
    setContent((c: any) => setPath(c, path, v));
    setAnswered((s) => new Set(s).add(path));
  };

  const changeLang = (l: GiftLanguage) => {
    const d = tpl.defaults(l);
    setContent((c: any) => {
      let next: any = { ...d };
      for (const f of answered) next = setPath(next, f, getPath(c, f));
      return next;
    });
    setLang(l);
  };

  const finish = async () => {
    setView("writing");
    const answers: Record<string, unknown> = {};
    for (const f of answered) answers[f.split(".")[0]] = getPath(content, f.split(".")[0]);
    let merged = content;
    try {
      const r = await fetch("/api/ai/autofill", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ templateSlug: slug, answers, lang }) });
      if (r.ok) {
        const { fields } = await r.json();
        merged = { ...content, ...fields };
        for (const f of answered) merged = setPath(merged, f, getPath(content, f));
      }
    } catch {}
    const parsed = tpl.schema.safeParse(merged);
    const final = parsed.success ? parsed.data : content;
    setContent(final);
    await saveNow(final, lang);
    await new Promise((r) => setTimeout(r, 600));
    setView("preview");
  };

  useEffect(() => {
    if (view === "preview" && !previewTracked.current) {
      previewTracked.current = true;
      trackClient("preview_shown", { template: slug, time_to_first_preview_ms: Date.now() - t0.current, via: startInForm ? "form" : "questions" }, giftId ?? undefined);
    }
  }, [view, slug, giftId, startInForm]);

  const next = () => {
    haptic(8);
    trackClient("question_step", { template: slug, step: q?.id ?? "", index: step });
    if (step < tpl.questions.length - 1) setStep(step + 1);
    else void finish();
  };

  const send = async () => {
    const id = (await saveNow(content, lang)) ?? giftId;
    if (id) router.push(tpl.meta.mode === "group" ? `/group/${id}/manage` : `/checkout/${id}`);
  };

  const canNext = useMemo(() => {
    if (!q) return true;
    const v = getPath(content, q.field);
    if (q.optional) return true;
    if (q.kind === "photos") return answered.has(q.field) ? (Array.isArray(v) ? v.length > 0 : !!v) : true;
    if (q.kind === "text" || q.kind === "textarea") return typeof v === "string" && v.trim().length > 0 && answered.has(q.field);
    return true;
  }, [q, content, answered]);

  const renderer = (mode: "thumbnail" | "preview", key?: string) => (
    <NextIntlClientProvider locale={lang} messages={giftMessages[lang]}>
      <R key={key} content={content} mode={mode} watermark={mode === "preview"} ctx={{ lang, recipientName: content.recipientName, senderFirstName: content.senderName, isFree: tpl.meta.tier === "free", contributions: undefined }} />
    </NextIntlClientProvider>
  );

  return (
    <div data-glow={tpl.meta.glow} className="relative min-h-[100dvh] overflow-hidden bg-ink-950">
      <div className="pointer-events-none absolute inset-0 [background:var(--grad-aurora)] opacity-80" />
      <Starfield density={0.5} shooting={false} />
      <header className="relative z-20 flex items-center justify-between gap-3 px-4 pt-[max(12px,env(safe-area-inset-top))] md:px-8">
        <a href="/gifts" aria-label="Back to gifts" className="shrink-0"><Logo animate={false} className="scale-90" /></a>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-lo sm:inline" aria-live="polite">{saveState === "saving" ? t("saving") : saveState === "saved" ? t("saved") : ""}</span>
          <label className="sr-only" htmlFor="giftlang">{t("giftLanguage")}</label>
          <select id="giftlang" value={lang} onChange={(e) => changeLang(e.target.value as GiftLanguage)} className="h-10 rounded-full border border-white/10 bg-white/5 px-3 text-sm text-hi">
            {GIFT_LANGUAGES.map((l) => <option key={l.code} value={l.code} className="bg-ink-900">{l.label}</option>)}
          </select>
        </div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-6xl gap-6 px-4 pb-8 md:grid-cols-[1fr_380px] md:gap-12 md:px-8 md:pt-8">
        {/* Preview: top on mobile, right on desktop */}
        <div className="order-1 md:order-2">
          <div className="relative mx-auto h-[45dvh] max-h-[460px] md:h-auto md:max-h-none">
            <div className="mx-auto h-full md:hidden" style={{ aspectRatio: "390/844" }}>
              <div className="h-full w-full overflow-hidden rounded-[28px] border border-white/10 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)]">
                <ScaledStage>{renderer("thumbnail", view)}</ScaledStage>
              </div>
            </div>
            <div className="hidden md:block md:sticky md:top-8"><PhoneFrame className="max-w-[340px]">{renderer("thumbnail", view)}</PhoneFrame></div>
          </div>
          <div className="mt-3 flex justify-center">
            <button type="button" onClick={() => setView("preview")} className="inline-flex h-10 items-center gap-2 rounded-full bg-white/5 px-4 text-sm text-mid hover:text-hi"><Maximize2 size={14} /> {t("fullPreview")}</button>
          </div>
        </div>

        <div className="order-2 md:order-1">
          {view === "form" ? (
            <div className="glass-strong p-5 md:p-8">
              <div className="mb-6 flex items-center justify-between gap-3">
                <h1 className="font-display text-[34px] leading-none text-hi">{t("formTitle")}</h1>
                <button type="button" onClick={() => setView("questions")} className="text-sm text-mid underline-offset-4 hover:underline">{t("backToQuestions")}</button>
              </div>
              <FormEditor tpl={tpl} content={content} onChange={(c) => { setContent(c); setAnswered((s) => new Set([...s, ...Object.keys(c)])); }} />
              <div className="sticky bottom-0 mt-8 flex gap-3 bg-gradient-to-t from-[#140c22] pt-4">
                <button type="button" onClick={() => setView("preview")} className="h-14 flex-1 rounded-full bg-white/8 font-semibold text-hi">{t("fullPreview")}</button>
                <button type="button" onClick={send} className="h-14 flex-1 rounded-full font-semibold text-white [background:var(--grad-kiss)]">{tpl.meta.tier === "free" ? t("sendFree") : t("sendIt")}</button>
              </div>
            </div>
          ) : (
            <div className="glass-strong relative flex min-h-[46dvh] flex-col p-5 md:min-h-[560px] md:p-10">
              {q && (
                <>
                  <div className="mb-6 flex items-center gap-3">
                    <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-[var(--glow)] shadow-[0_0_10px_var(--glow)] transition-[width] duration-500" style={{ width: `${((step + 1) / tpl.questions.length) * 100}%` }} />
                    </div>
                    <span className="text-xs tabular-nums text-lo">{t("stepOf", { n: step + 1, total: tpl.questions.length })}</span>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div key={q.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="flex-1">
                      <h1 className="font-display text-[34px] leading-[1.08] text-hi md:text-[46px]">{pick(q.prompt, lang)}</h1>
                      {q.hint && <p className="mt-2 text-[15px] text-mid">{pick(q.hint, lang)}</p>}
                      <div className="mt-6">
                        <QuestionInput q={q} content={content} lang={lang} setField={setField} onEnter={next} wasAnswered={answered.has(q.field) || [...answered].some((f) => f.startsWith(q.field + "."))} />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                  {saveState === "error" && <p className="mt-3 text-sm text-amber-300">{t("errorSave")}</p>}
                  {saveState === "blocked" && <p className="mt-3 text-sm text-rose-400">{t("contentBlocked")}</p>}
                  <div className="mt-8 flex items-center gap-3">
                    {step > 0 && <button type="button" onClick={() => setStep(step - 1)} aria-label={t("back")} className="grid h-14 w-14 place-items-center rounded-full bg-white/5 text-mid hover:text-hi"><ArrowLeft size={20} /></button>}
                    <button type="button" onClick={next} disabled={!canNext} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full text-[16px] font-semibold text-white [background:var(--grad-kiss)] shadow-[0_10px_30px_-8px_rgba(255,77,126,0.6)] disabled:opacity-40">
                      {step === tpl.questions.length - 1 ? <><Sparkles size={18} /> {t("fullPreview")}</> : <>{t("next")} <ArrowRight size={18} /></>}
                    </button>
                    {q.optional && <button type="button" onClick={next} className="h-14 px-3 text-[15px] text-mid underline-offset-4 hover:underline">{t("skip")}</button>}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {view === "writing" && (
          <motion.div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-ink-950/90 px-8 text-center backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Loader2 className="animate-spin text-[var(--glow)]" size={34} />
            <p className="font-display text-[34px] text-hi">{t("writing")}</p>
            <p className="max-w-sm text-mid">{t("writingSub")}</p>
          </motion.div>
        )}
        {view === "preview" && (
          <motion.div className="fixed inset-0 z-50 flex flex-col bg-ink-950" initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div className="relative flex-1 overflow-hidden">
              <div className="absolute inset-0 hidden sm:block"><Starfield density={0.6} /></div>
              <div className="relative mx-auto h-full w-full sm:w-auto sm:py-4" style={{ aspectRatio: undefined }}>
                <div className="relative mx-auto h-full w-full sm:aspect-[390/844] sm:w-auto sm:overflow-hidden sm:rounded-[32px] sm:border sm:border-white/10">{renderer("preview", "full")}</div>
              </div>
              <button type="button" onClick={() => setView(startInForm ? "form" : "questions")} aria-label={t("close")} className="absolute left-3 top-[max(10px,env(safe-area-inset-top))] z-50 grid h-11 w-11 place-items-center rounded-full bg-black/40 text-white backdrop-blur"><X size={18} /></button>
            </div>
            <div className="glass-strong relative z-50 !rounded-b-none border-b-0 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-4">
              <div className="mx-auto flex max-w-md flex-col gap-2">
                <p className="text-center text-[13px] text-mid"><Check size={14} className="mr-1 inline text-emerald-300" />{t("readySub")}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setView("form")} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-white/8 font-semibold text-hi"><Pencil size={16} /> {t("editDetails")}</button>
                  <button type="button" onClick={send} className="h-14 flex-[1.3] rounded-full text-[16px] font-semibold text-white [background:var(--grad-kiss)] shadow-[0_10px_30px_-8px_rgba(255,77,126,0.7)]">{tpl.meta.tier === "free" ? t("sendFree") : t("sendIt")} →</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuestionInput({ q, content, lang, setField, onEnter, wasAnswered }: { q: Question; content: any; lang: GiftLanguage; setField: (p: string, v: unknown) => void; onEnter: () => void; wasAnswered: boolean }) {
  const t = useTranslations("creator");
  const v = getPath(content, q.field);
  const big = "w-full rounded-2xl border border-white/10 bg-black/25 px-5 text-[20px] text-hi placeholder:text-lo focus:border-[rgba(var(--glow-rgb),0.7)] focus:outline-none";
  const [touched, setTouched] = useState(wasAnswered);
  switch (q.kind) {
    case "text":
      return <input autoFocus value={touched ? v ?? "" : ""} placeholder={q.placeholder ? pick(q.placeholder, lang) : t("typeHere")} maxLength={q.max} onChange={(e) => { setTouched(true); setField(q.field, e.target.value); }} onKeyDown={(e) => e.key === "Enter" && onEnter()} className={cn(big, "h-16")} aria-label={pick(q.prompt, lang)} />;
    case "number":
      return <input autoFocus type="number" inputMode="numeric" min={q.min} max={q.max} value={touched ? v ?? "" : ""} placeholder={String(v ?? "")} onChange={(e) => { setTouched(true); setField(q.field, e.target.value === "" ? "" : Number(e.target.value)); }} onKeyDown={(e) => e.key === "Enter" && onEnter()} className={cn(big, "h-16")} aria-label={pick(q.prompt, lang)} />;
    case "textarea":
      return (
        <div>
          <textarea autoFocus rows={4} value={touched ? v ?? "" : ""} maxLength={q.max} placeholder={typeof v === "string" ? v : t("typeHere")} onChange={(e) => { setTouched(true); setField(q.field, e.target.value); }} className={cn(big, "py-4 text-[18px] leading-relaxed")} aria-label={pick(q.prompt, lang)} />
          {q.max && <p className="mt-1 text-right text-xs tabular-nums text-lo">{(touched ? String(v ?? "").length : 0)}/{q.max}</p>}
        </div>
      );
    case "photos": {
      if (q.photoKey) {
        const arr = (Array.isArray(v) ? v : []) as Record<string, unknown>[];
        const urls = touched ? arr.map((o) => String(o[q.photoKey!])) : [];
        return <PhotoPicker big value={urls} max={q.max ?? 8} onChange={(u) => { setTouched(true); setField(q.field, u.map((url, i) => ({ ...(arr[i] ?? {}), [q.photoKey!]: url, caption: (arr[i]?.caption as string) ?? "" }))); }} />;
      }
      const isSingle = (q.max ?? 1) === 1 && !Array.isArray(v);
      const val = touched ? (isSingle ? (v ? [v] : []) : (v ?? [])) : [];
      return <PhotoPicker big value={val} max={q.max ?? 8} onChange={(u) => { setTouched(true); setField(q.field, isSingle ? u[0] ?? "" : u); }} />;
    }
    case "voice":
      return <VoiceRecorder value={v || null} onClear={() => setField(q.field, "")} onBlob={async (b) => setField(q.field, await uploadBlob(b, "voice"))} />;
    case "song": {
      const base = q.field.replace(/\.url$/, "");
      const s = getPath(content, base) ?? {};
      return <SongInput value={s.url ?? ""} title={s.title ?? ""} onChange={(x) => setField(`${base}.url`, x)} onTitle={(x) => setField(`${base}.title`, x)} />;
    }
    case "city":
      return (
        <div className="flex flex-col gap-4">
          <CityPicker label={t("yourCity")} value={content.yourCity} onChange={(c) => setField("yourCity", c)} />
          <CityPicker label={t("theirCity")} value={content.theirCity} onChange={(c) => setField("theirCity", c)} />
        </div>
      );
    case "choice":
      return (
        <div className="flex flex-wrap gap-2">
          {q.choices?.map((c) => (
            <button key={c.value} type="button" onClick={() => setField(q.field, c.value)} className={cn("h-12 rounded-full border px-5 text-[15px] font-medium transition", v === c.value ? "border-[rgba(var(--glow-rgb),0.8)] bg-[rgba(var(--glow-rgb),0.15)] text-hi" : "border-white/10 bg-white/5 text-mid")}>{pick(c.label, lang)}</button>
          ))}
        </div>
      );
    default:
      return null;
  }
}

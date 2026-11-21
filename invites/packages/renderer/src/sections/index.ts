import { buildIcs, buildUpiUri, directionsUrls, googleCalendarUrl, invitedEvents, type RsvpSubmission, type WeddingEvent } from "@invites/content-schema";
import { formatDate, formatDayMonth, formatTime, sameLocalDay, zonedParts } from "@invites/i18n";
import { brand } from "@invites/config";
import { ensureStyles, esc, h } from "../dom";
import { ICONS } from "../icons";
import { qrSvg } from "../qr";
import type { RenderContext } from "../types";
import { SECTIONS_CSS } from "./styles";

export interface SectionHooks {
  /** Template-styled stage above the RSVP form (e.g. lantern sky). `react` is called after a reply. */
  rsvpStage?: (host: HTMLElement) => { react(status: "yes" | "maybe" | "no"): void } | void;
  /** Template-styled header for the shagun section (e.g. potli, gullak, envelope). */
  shagunStage?: (host: HTMLElement) => void;
  /** Called when a guest taps a shagun block, before the UPI sheet opens (e.g. coin drop). */
  onShagunBlock?: (el: HTMLElement) => Promise<void> | void;
  /** Called after an RSVP is saved (e.g. Mohar's box closes). */
  onRsvpSaved?: () => void;
  /** Template content placed just before the footer (e.g. Rang Kahani's back cover). */
  beforeFooter?: (host: HTMLElement) => void;
  /** Extra fields appended to the RSVP section after the form (e.g. Mohar's Ashirwad). */
  afterRsvp?: (host: HTMLElement) => void;
}

export function eventTitle(ctx: RenderContext, e: WeddingEvent): { main: string; alt?: string } {
  if (ctx.locale === "hi") return { main: e.titleHi || e.titleEn, alt: e.titleHi ? e.titleEn : undefined };
  return { main: e.titleEn, alt: e.titleHi && e.titleHi !== e.titleEn ? e.titleHi : undefined };
}

export function icsHref(ctx: RenderContext, e: WeddingEvent): string {
  const title = `${eventTitle(ctx, e).main}: ${ctx.content.bride.name} & ${ctx.content.groom.name}`;
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(buildIcs(e, title, "invite"))}`;
}

/** Calendar + directions action buttons for one function. */
export function eventActions(ctx: RenderContext, e: WeddingEvent, cls = "inv-btn", primaryCls = "inv-btn inv-btn-primary", short = false): HTMLElement {
  const { t } = ctx;
  const dir = directionsUrls(e);
  const isApple = typeof navigator !== "undefined" && /iPhone|iPad|Macintosh/.test(navigator.userAgent);
  const title = `${eventTitle(ctx, e).main}: ${ctx.content.bride.name} & ${ctx.content.groom.name}`;
  const row = h("div", { class: "inv-row" });
  const cal = h("a", { class: cls, href: isApple ? icsHref(ctx, e) : googleCalendarUrl(e, title), download: isApple ? `${e.id}.ics` : undefined, target: isApple ? undefined : "_blank", rel: "noopener", html: `${ICONS.calendar}<span>${esc(t(short ? "calendarShort" : "addToCalendar"))}</span>` });
  const dirs = h("a", { class: primaryCls, href: isApple ? dir.apple : dir.google, target: "_blank", rel: "noopener", html: `${ICONS.pin}<span>${esc(t("directions"))}</span>` });
  row.append(cal, dirs);
  return row;
}

/** Procedural static map placeholder (no map SDK on the guest page). TODO_VERIFY(static map provider + terms). */
function staticMap(seed: number, label: string): string {
  let s = seed >>> 0;
  const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const roads = Array.from({ length: 7 }, (_, i) => { const horiz = i % 2 === 0; const p = 10 + r() * 80; return horiz ? `<path d="M0,${p} C30,${p + (r() - 0.5) * 20} 70,${p + (r() - 0.5) * 20} 160,${p}" />` : `<path d="M${p * 1.6},0 C${p * 1.6 + (r() - 0.5) * 30},30 ${p * 1.6 + (r() - 0.5) * 30},60 ${p * 1.6},90"/>`; }).join("");
  const blocks = Array.from({ length: 10 }, () => `<rect x="${(r() * 150).toFixed(0)}" y="${(r() * 80).toFixed(0)}" width="${(8 + r() * 20).toFixed(0)}" height="${(6 + r() * 14).toFixed(0)}" fill="#d9d2c3"/>`).join("");
  return `<svg viewBox="0 0 160 90" role="img" aria-label="${esc(label)}"><rect width="160" height="90" fill="#ECE6DA"/><path d="M110,60 q20,-10 50,0 V90 H100 Z" fill="#cfe0e6"/>${blocks}<g fill="none" stroke="#fff" stroke-width="3">${roads}</g><g transform="translate(80 40)"><path d="M0,0 c-6,-8 -10,-12 -10,-17 a10,10 0 0 1 20,0 c0,5 -4,9 -10,17z" fill="#C8326B"/><circle cy="-17" r="3.5" fill="#fff"/></g></svg>`;
}

export function renderSections(ctx: RenderContext, host: HTMLElement, hooks: SectionHooks = {}): { destroy(): void } {
  ensureStyles("sections", SECTIONS_CSS);
  const { t, content, guest, locale } = ctx;
  const events = invitedEvents(content, guest);
  const wrap = h("div", { class: "inv-sections" });
  const cleanups: (() => void)[] = [];
  const devNum = !!content.devanagariNumerals;

  // 1. Your functions
  const fns = h("section", { class: "inv-sec", id: "inv-functions", "aria-labelledby": "inv-fn-h" }, h("h2", { id: "inv-fn-h", text: t("yourFunctions") }));
  for (const e of events) {
    const dm = formatDayMonth(e.startsAt, locale, { tz: e.tz, devanagariNumerals: devNum });
    const title = eventTitle(ctx, e);
    const panel = h("div", { class: "inv-panel inv-fn" },
      h("div", { class: "inv-fn-date" }, h("b", { text: dm.day }), h("span", { text: dm.month })),
      h("div", {},
        h("h3", { text: title.main }),
        h("p", { text: `${dm.weekday}, ${formatTime(e.startsAt, locale, { tz: e.tz, devanagariNumerals: devNum })}` }),
        h("p", { text: [e.venueName, e.venueArea].filter(Boolean).join(", ") }),
        eventActions(ctx, e)));
    fns.append(panel);
  }
  wrap.append(fns);

  // 2. Venue & directions (unique venues)
  const venues = new Map<string, WeddingEvent>();
  for (const e of events) if (!venues.has(e.venueName)) venues.set(e.venueName, e);
  const ven = h("section", { class: "inv-sec", id: "inv-venue" }, h("h2", { text: t("venueDirections") }));
  let vi = 0;
  for (const [name, e] of venues) {
    const dir = directionsUrls(e);
    ven.append(h("div", { class: "inv-panel" },
      h("h3", { style: "margin:0;font-family:var(--sec-font-display);font-weight:var(--sec-display-weight,400);font-size:calc(20px*var(--inv-text-scale))", text: name }),
      e.venueAddress ? h("p", { style: "margin:4px 0 0", text: e.venueAddress }) : null,
      h("a", { class: "inv-map", href: dir.google, target: "_blank", rel: "noopener", "aria-label": `${t("directions")}: ${name}`, html: staticMap(vi++ * 7919 + name.length, name) }),
      h("div", { class: "inv-row" },
        h("a", { class: "inv-btn inv-btn-primary", href: dir.google, target: "_blank", rel: "noopener", html: `${ICONS.pin}<span>Google Maps</span>` }),
        h("a", { class: "inv-btn", href: dir.apple, target: "_blank", rel: "noopener", html: `${ICONS.pin}<span>Apple Maps</span>` }))));
  }
  wrap.append(ven);

  // 3. Travel & stay (outstation guests)
  if (guest.outstation && content.stay) {
    const s = content.stay;
    wrap.append(h("section", { class: "inv-sec", id: "inv-stay" }, h("h2", { text: t("travelStay") }),
      h("div", { class: "inv-panel" },
        h("p", { style: "margin:0" }, h("b", { text: `${t("hotel")}: ` }), s.hotel),
        s.address ? h("p", { style: "margin:4px 0 0", text: s.address }) : null,
        guest.room ? h("p", { style: "margin:8px 0 0" }, h("b", { text: `${t("yourRoom")}: ` }), guest.room) : null,
        s.note ? h("p", { style: "margin:8px 0 0", text: s.note }) : null,
        h("div", { class: "inv-row" }, h("a", { class: "inv-btn", href: "#inv-rsvp", text: `${t("arrival")} →` })))));
  }

  // 4. Our story
  if (content.story.length) {
    const st = h("section", { class: "inv-sec", id: "inv-story" }, h("h2", { text: t("ourStory") }));
    const list = h("div", { class: "inv-story" });
    content.story.forEach((b, i) => list.append(h("figure", { class: "inv-panel" },
      b.photoUrl ? h("img", { src: b.photoUrl, alt: "", loading: "lazy" }) : null,
      h("figcaption", {}, h("span", { class: "inv-story-n", text: String(i + 1) }), b.caption))));
    st.append(list);
    wrap.append(st);
  }

  // 5. Shagun
  const sh = content.shagun;
  if (sh?.enabled && guest.shagunVisible) {
    const sec = h("section", { class: "inv-sec", id: "inv-shagun" }, h("h2", { text: t("shagun") }));
    hooks.shagunStage?.(sec);
    sec.append(h("p", { text: t("shagunIntro") }), h("p", { class: "inv-safety", text: t("shagunSafety") }));
    for (const f of sh.funds) {
      sec.append(h("h3", { style: "margin:18px 0 0;font-family:var(--sec-font-display);font-weight:var(--sec-display-weight,400);font-size:calc(21px*var(--inv-text-scale))", text: f.title }));
      if (f.story) sec.append(h("p", { style: "margin:2px 0 0;opacity:.8", text: f.story }));
      const grid = h("div", { class: "inv-blocks" });
      for (const b of f.blocks) {
        const btn = h("button", { class: "inv-block", type: "button", "data-block": b.id },
          h("span", { class: "e", text: b.emoji ?? "🎁", "aria-hidden": "true" }),
          h("b", { text: b.title }),
          h("span", { class: "amt", text: b.amount == null ? t("anyAmount") : `₹${new Intl.NumberFormat("en-IN").format(b.amount)}` }),
          b.story ? h("small", { text: b.story }) : null);
        btn.addEventListener("click", async () => {
          await hooks.onShagunBlock?.(btn);
          openUpiSheet(ctx, { id: b.id, title: b.title, amount: b.amount });
        });
        grid.append(btn);
      }
      sec.append(grid);
    }
    if (sh.gifts.length) {
      for (const g of sh.gifts) {
        const claim = h("button", { class: "inv-btn", type: "button", disabled: g.claimed, text: g.claimed ? t("claimed") : t("claimGift") });
        claim.addEventListener("click", async () => {
          claim.disabled = true;
          const r = await ctx.services?.claimGift(g.id);
          claim.textContent = r?.ok === false ? t("claimGift") : t("claimed");
          if (r?.ok === false) claim.disabled = false;
        });
        sec.append(h("div", { class: "inv-panel", style: "margin-top:10px;display:flex;gap:10px;align-items:center;justify-content:space-between" },
          h("a", { href: g.url, target: "_blank", rel: "noopener nofollow", html: `${esc(g.title)} ${ICONS.external.replace("<svg", '<svg style="width:14px;height:14px;vertical-align:-2px"')}` }), claim));
      }
    }
    sec.append(h("p", { style: "font-size:13px;opacity:.75", text: `${t("pledgeOnlyCouple")} ${t("upiIndiaOnly")}` }));
    wrap.append(sec);
    observeOnce(sec, () => ctx.emit("shagunOpen"), cleanups);
  }

  // 6. RSVP
  const rsvpSec = h("section", { class: "inv-sec", id: "inv-rsvp" }, h("h2", { text: t("rsvpTitle") }));
  const stage = hooks.rsvpStage?.(rsvpSec) || undefined;
  rsvpSec.append(buildRsvpForm(ctx, events, (status) => { stage?.react(status); hooks.onRsvpSaved?.(); }));
  hooks.afterRsvp?.(rsvpSec);
  wrap.append(rsvpSec);
  observeOnce(rsvpSec, () => ctx.emit("rsvpOpen"), cleanups);

  // 7. FAQ
  if (content.faq.length) {
    const faq = h("section", { class: "inv-sec inv-faq", id: "inv-faq" }, h("h2", { text: t("faq") }));
    for (const f of content.faq) faq.append(h("details", {}, h("summary", { text: f.q }), h("p", { text: f.a })));
    wrap.append(faq);
  }

  // 9. Footer
  if (hooks.beforeFooter) { const b = h("div", { class: "inv-before-footer" }); hooks.beforeFooter(b); wrap.append(b); }
  wrap.append(buildFooter(ctx));
  host.append(wrap);
  return { destroy: () => { cleanups.forEach((c) => c()); wrap.remove(); } };
}

function observeOnce(el: HTMLElement, fn: () => void, cleanups: (() => void)[]) {
  if (typeof IntersectionObserver === "undefined") return;
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { fn(); io.disconnect(); } }, { threshold: 0.2 });
  io.observe(el);
  cleanups.push(() => io.disconnect());
}

export function isMobileUA(): boolean {
  return typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function openUpiSheet(ctx: RenderContext, block: { id: string; title: string; amount: number | null }): void {
  const sh = ctx.content.shagun;
  if (!sh) return;
  const { t } = ctx;
  const uri = buildUpiUri({ vpa: sh.vpa, payeeName: sh.payeeName, amount: block.amount, note: `${ctx.brandName} shagun: ${block.title}` });
  const back = h("div", { class: "inv-sheet-back", role: "dialog", "aria-modal": "true", "aria-label": block.title });
  const sheet = h("div", { class: "inv-sheet" });
  const close = () => back.remove();
  back.addEventListener("click", (e) => { if (e.target === back) close(); });
  sheet.append(h("h3", { text: block.title }));
  if (block.amount != null) sheet.append(h("p", { style: "margin:0;font-size:20px;font-weight:800", text: `₹${new Intl.NumberFormat("en-IN").format(block.amount)}` }));
  sheet.append(h("p", { class: "inv-safety", text: t("shagunSafety") }));
  sheet.append(h("p", { style: "margin:4px 0;font-size:14px", text: `UPI: ${sh.payeeName}` }));
  if (isMobileUA()) {
    sheet.append(h("a", { class: "inv-btn inv-btn-primary", style: "width:100%", href: uri, "data-upi": uri, text: t("payWithUpi") }));
  } else {
    sheet.append(h("div", { class: "inv-qr", "data-upi": uri, html: qrSvg(uri, { label: t("scanUpi") }) }), h("p", { style: "text-align:center;margin:0", text: t("scanUpi") }));
  }
  const pledged = h("button", { class: "inv-btn", type: "button", style: "width:100%;margin-top:10px", text: t("iSentIt") });
  const msg = h("p", { class: "inv-msg", style: "display:none", role: "status" });
  pledged.addEventListener("click", async () => {
    pledged.disabled = true;
    const r = await ctx.services?.pledge({ blockId: block.id, amount: block.amount });
    msg.textContent = r?.ok === false ? "…" : t("pledgeThanks");
    msg.style.display = "block";
  });
  const x = h("button", { class: "inv-btn", type: "button", style: "width:100%;margin-top:8px", text: "✕" });
  x.setAttribute("aria-label", "Close");
  x.addEventListener("click", close);
  sheet.append(pledged, msg, x);
  back.append(sheet);
  (ctx.root.querySelector(".inv-column") ?? ctx.root).append(back);
  pledged.focus();
}

function stepper(label: string, value: number, min: number, max: number, onChange: (v: number) => void): HTMLElement {
  const out = h("output", { text: String(value), "aria-live": "polite" });
  const minus = h("button", { type: "button", "aria-label": `${label} −`, text: "−" });
  const plus = h("button", { type: "button", "aria-label": `${label} +`, text: "+" });
  const set = (v: number) => { value = Math.max(min, Math.min(max, v)); out.textContent = String(value); onChange(value); };
  minus.addEventListener("click", () => set(value - 1));
  plus.addEventListener("click", () => set(value + 1));
  return h("div", { class: "inv-field" }, h("span", { class: "inv-legend", text: label }), h("div", { class: "inv-stepper" }, minus, out, plus));
}

function seg<T extends string>(name: string, options: { value: T; label: string }[], current: T | undefined, onChange: (v: T) => void): HTMLElement {
  const box = h("div", { class: "inv-seg", role: "group", "aria-label": name });
  const btns = options.map((o) => {
    const b = h("button", { type: "button", class: "inv-btn", "aria-pressed": String(o.value === current), "data-value": o.value, text: o.label });
    b.addEventListener("click", () => { btns.forEach((x) => x.setAttribute("aria-pressed", String(x === b))); onChange(o.value); });
    return b;
  });
  box.append(...btns);
  return box;
}

function buildRsvpForm(ctx: RenderContext, events: WeddingEvent[], onSaved: (s: "yes" | "maybe" | "no") => void): HTMLElement {
  const { t, guest, content } = ctx;
  const prev = ctx.services?.existingRsvp ?? null;
  const max = guest.householdMax;
  const state: RsvpSubmission = prev ? structuredClone(prev) : {
    entries: events.map((e) => ({ eventId: e.id, status: undefined as unknown as "yes", adults: Math.min(max, 1), kids: 0 })),
    pickupNeeded: false, stayNeeded: false,
  };
  for (const e of events) if (!state.entries.find((x) => x.eventId === e.id)) state.entries.push({ eventId: e.id, status: undefined as unknown as "yes", adults: 1, kids: 0 });
  const form = h("form", { class: "inv-panel inv-form", novalidate: true });
  const statusOpts = [
    { value: "yes" as const, label: t("yes") },
    { value: "maybe" as const, label: t("maybe") },
    { value: "no" as const, label: t("no") },
  ];
  const fnBox = h("div", { class: "inv-form" });
  const all = h("div", { class: "inv-row" });
  if (events.length > 1) {
    const allYes = h("button", { type: "button", class: "inv-btn", text: `${t("yes")} (${events.length})` });
    allYes.addEventListener("click", () => { state.entries.forEach((x) => (x.status = "yes")); fnBox.querySelectorAll<HTMLButtonElement>("[data-value]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.value === "yes"))); refreshCounts(); });
    all.append(allYes);
  }
  const countBoxes: HTMLElement[] = [];
  const refreshCounts = () => state.entries.forEach((en, i) => { const c = countBoxes[i]; if (c) c.style.display = en.status === "no" || !en.status ? "none" : "flex"; });
  events.forEach((e) => {
    const en = state.entries.find((x) => x.eventId === e.id)!;
    const counts = h("div", { class: "inv-counts" },
      stepper(t("adults"), en.adults, 0, max, (v) => (en.adults = v)),
      stepper(t("kids"), en.kids, 0, max, (v) => (en.kids = v)));
    countBoxes.push(counts);
    const block = h("div", { class: "inv-rsvp-fn", "data-event": e.id },
      h("h4", { text: `${eventTitle(ctx, e).main}, ${formatDate(e.startsAt, ctx.locale, { tz: e.tz })}` }),
      seg(eventTitle(ctx, e).main, statusOpts, en.status, (v) => { en.status = v; refreshCounts(); }),
      counts);
    fnBox.append(block);
  });
  form.append(all, fnBox);
  refreshCounts();
  form.append(h("p", { style: "margin:0;font-size:13px;opacity:.75", text: t("household", { n: max }) }));

  form.append(h("div", { class: "inv-field" }, h("span", { class: "inv-legend", text: t("food") }),
    seg(t("food"), (["veg", "jain", "vegan", "non-veg"] as const).map((v) => ({ value: v, label: t(v) })), state.food, (v) => (state.food = v))));
  const allergies = h("input", { id: "inv-allergies", value: state.allergies ?? "", maxlength: 200 });
  allergies.addEventListener("input", () => (state.allergies = allergies.value));
  form.append(h("div", { class: "inv-field" }, h("label", { for: "inv-allergies", text: t("allergies") }), allergies));

  if (guest.outstation) {
    const at = h("input", { id: "inv-arrival", type: "datetime-local", value: state.arrivalAt ?? "" });
    at.addEventListener("input", () => (state.arrivalAt = at.value));
    const ref = h("input", { id: "inv-ref", value: state.refNo ?? "", maxlength: 20, autocomplete: "off" });
    ref.addEventListener("input", () => (state.refNo = ref.value));
    const chk = (label: string, key: "pickupNeeded" | "stayNeeded") => {
      const c = h("input", { type: "checkbox", checked: !!state[key] });
      c.addEventListener("change", () => (state[key] = c.checked));
      return h("label", { class: "inv-check" }, c, label);
    };
    form.append(
      h("div", { class: "inv-field" }, h("label", { for: "inv-arrival", text: t("arrivalAt") }), at),
      h("div", { class: "inv-field" }, h("span", { class: "inv-legend", text: t("arrivalMode") }),
        seg(t("arrivalMode"), (["train", "flight", "road", "local"] as const).map((v) => ({ value: v, label: t(v) })), state.arrivalMode, (v) => (state.arrivalMode = v))),
      h("div", { class: "inv-field" }, h("label", { for: "inv-ref", text: t("refNo") }), ref),
      chk(t("pickupNeeded"), "pickupNeeded"), chk(t("stayNeeded"), "stayNeeded"));
  }
  const msg = h("textarea", { id: "inv-message", maxlength: 500 });
  msg.value = state.message ?? "";
  msg.addEventListener("input", () => (state.message = msg.value));
  form.append(h("div", { class: "inv-field" }, h("label", { for: "inv-message", text: t("messageToCouple") }), msg));

  const status = h("p", { class: "inv-msg", role: "status", style: "display:none" });
  const submit = h("button", { type: "submit", class: "inv-btn inv-btn-primary", style: "width:100%", text: t("submit") });
  form.append(submit, status);
  if (prev) { status.textContent = t("saved", { deadline: deadlineText(ctx) }); status.style.display = "block"; }
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const entries = state.entries.filter((x) => x.status);
    if (!entries.length) { status.textContent = t("rsvpTitle"); status.style.display = "block"; fnBox.querySelector("button")?.focus(); return; }
    submit.disabled = true;
    const payload: RsvpSubmission = { ...state, entries: entries.map((x) => (x.status === "no" ? { ...x, adults: 0, kids: 0 } : x)) };
    const r = (await ctx.services?.submitRsvp(payload)) ?? { ok: true };
    submit.disabled = false;
    if (!r.ok) { status.textContent = r.error ?? "Error"; status.style.display = "block"; return; }
    status.textContent = t("saved", { deadline: deadlineText(ctx) });
    status.style.display = "block";
    submit.textContent = t("editReply");
    const overall = entries.some((x) => x.status === "yes") ? "yes" : entries.some((x) => x.status === "maybe") ? "maybe" : "no";
    onSaved(overall);
  });
  void content;
  return form;
}

function deadlineText(ctx: RenderContext): string {
  const d = ctx.content.rsvpDeadline;
  return d ? formatDate(d, ctx.locale) : "—";
}

function buildFooter(ctx: RenderContext): HTMLElement {
  const { t, locale } = ctx;
  const f = h("footer", { class: "inv-footer" });
  const lite = h("button", { type: "button", class: "inv-btn", "aria-pressed": String(ctx.lite), text: t("lite") });
  lite.addEventListener("click", () => ctx.controls.setLite(!ctx.lite));
  const large = h("button", { type: "button", class: "inv-btn", "aria-pressed": String(ctx.largeText), text: t("largeText") });
  large.addEventListener("click", () => ctx.controls.setLargeText(!ctx.largeText));
  const lang = h("select", { "aria-label": t("language"), class: "inv-btn", style: "padding-right:28px" });
  for (const [v, l] of [["en", "English"], ["hi", "हिन्दी"], ["hinglish", "Hinglish"]] as const) {
    const o = h("option", { value: v, text: l });
    if (v === locale) o.selected = true;
    lang.append(o);
  }
  lang.addEventListener("change", () => ctx.controls.setLocale(lang.value as "en"));
  const row = h("div", { class: "inv-row" }, lite, large, lang);
  // Read aloud (hidden when no suitable voice exists)
  if (typeof speechSynthesis !== "undefined") {
    const speak = h("button", { type: "button", class: "inv-btn", text: t("readAloud"), hidden: true });
    const want = locale === "en" ? "en-IN" : "hi-IN";
    const check = () => { const v = speechSynthesis.getVoices().find((x) => x.lang === want); speak.hidden = !v; return v; };
    check();
    speechSynthesis.addEventListener?.("voiceschanged", check);
    speak.addEventListener("click", () => {
      const v = check(); if (!v) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(essentialsText(ctx));
      u.voice = v; u.lang = want; u.rate = 0.92;
      speechSynthesis.speak(u);
    });
    row.append(speak);
  }
  f.append(row, h("p", { style: "margin:0;max-width:34ch", text: t("privacy") }));
  if (!ctx.content.hideBrandFooter) f.append(h("a", { href: `https://${brand.domain}/?utm_source=invite&utm_medium=footer`, "data-brand": "1", text: t("madeWith", { brand: ctx.brandName }) }));
  const report = h("button", { type: "button", class: "inv-btn", style: "min-height:36px;font-size:13px;opacity:.8", text: t("report") });
  report.addEventListener("click", async () => {
    const reason = typeof prompt === "function" ? prompt(t("report")) : null;
    if (reason) await ctx.services?.report?.(reason);
  });
  f.append(report);
  return f;
}

export function essentialsText(ctx: RenderContext): string {
  const evs = invitedEvents(ctx.content, ctx.guest);
  const names = `${ctx.content.bride.name} ${ctx.t("and")} ${ctx.content.groom.name}`;
  return [names, ...evs.map((e) => `${eventTitle(ctx, e).main}. ${formatDate(e.startsAt, ctx.locale, { tz: e.tz })}, ${formatTime(e.startsAt, ctx.locale, { tz: e.tz })}. ${e.venueName}.`)].join(" ");
}

/** Live-update / day-of banner. Returns null when there is nothing to say. */
export function topBanner(ctx: RenderContext): HTMLElement | null {
  const { t } = ctx;
  const now = ctx.services?.now?.() ?? new Date();
  const evs = invitedEvents(ctx.content, ctx.guest);
  const today = evs.find((e) => sameLocalDay(e.startsAt, now, e.tz));
  let inner: HTMLElement | null = null;
  if (today) {
    const dir = directionsUrls(today);
    inner = h("div", {}, h("b", { text: `${t("today")}: ` }), `${eventTitle(ctx, today).main}, ${formatTime(today.startsAt, ctx.locale, { tz: today.tz })} `,
      h("a", { href: dir.google, target: "_blank", rel: "noopener", text: t("directions") }),
      today.liveStreamUrl ? h("span", {}, " · ", h("a", { href: today.liveStreamUrl, target: "_blank", rel: "noopener", text: t("liveStream") })) : null);
  } else {
    const last = ctx.guest.lastVisitAt ? Date.parse(ctx.guest.lastVisitAt) : null;
    const fresh = ctx.content.updates.filter((u) => last !== null && Date.parse(u.at) > last).sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0];
    if (fresh) inner = h("div", {}, h("b", { text: `${t("update")}: ` }), fresh.message);
  }
  if (!inner) return null;
  const close = h("button", { type: "button", "aria-label": "Close", text: "×" });
  const b = h("div", { class: "inv-banner", role: "status" }, inner, close);
  close.addEventListener("click", () => b.remove());
  void zonedParts;
  return b;
}

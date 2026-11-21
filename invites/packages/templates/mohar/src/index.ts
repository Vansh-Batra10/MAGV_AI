import { coupleOrder, invitedEvents, type WeddingEvent } from "@invites/content-schema";
import { fillWording, formatDate, formatDayMonth, formatTime, wordingFor } from "@invites/i18n";
import {
  droneBed, ensureStyles, fitTextInBox, hasIndic, splitIntoSpans, gsap, h, haptic, ICONS, motifSvg, noiseBurst, pinChapters, pluck, qrSvg, registerGsap,
  ScrollTrigger, SWARAS, arpeggio, type RenderContext, type SceneId, type TemplateInstance, type TemplateModule,
} from "@invites/renderer";
import { eventActions, eventTitle, renderSections, topBanner } from "@invites/renderer/sections";
import { boxBaseSvg, lidSvg, ribbonSvg, sealShards, stainedGlassSvg, tissueSvg, velvetSvg, venuePainting } from "./art";
import { CREST_FRAMES, crestSvg, firstGrapheme, type CrestFrame } from "./crest";
import { manifest } from "./manifest";
import { packs } from "./packs";
import { CSS } from "./styles";

const LOADER_CSS = `
.mh-loader{position:fixed;inset:0;z-index:100;background:#4F1D3D;background:var(--velvet,#4F1D3D);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#F8F3E9;font-family:"EB Garamond",Georgia,serif;transition:opacity .45s}
.mh-loader svg{width:120px;height:120px}
.mh-loader .mh-draw *{stroke-dasharray:600;stroke-dashoffset:600;animation:mh-draw 1.2s ease-out forwards}
.mh-loader p{margin:0;font-family:"Bodoni Moda",serif;font-style:italic;font-size:20px}
@keyframes mh-draw{to{stroke-dashoffset:0}}
@media (prefers-reduced-motion: reduce){.mh-loader .mh-draw *{animation:none;stroke-dashoffset:0}}
`;

const PANES = ["#C2536E", "#3F7F8C", "#D8A23A", "#6E7442", "#7A4F9A", "#B5562B", "#2F5D8A", "#9A3B5A"];

function crestFor(ctx: RenderContext): { a: string; b: string; aDeva: boolean; frame: CrestFrame } {
  const [p1, p2] = coupleOrder(ctx.content);
  const aDeva = !!p1.nameHi;
  const a = firstGrapheme(aDeva ? p1.nameHi! : p1.name);
  const b = firstGrapheme(p2.name);
  const frame = CREST_FRAMES[Math.floor(ctx.rng.fork("crest")() * CREST_FRAMES.length)]!;
  return { a, b, aDeva, frame };
}

function loader(ctx: RenderContext): () => void {
  ensureStyles("mh-loader", LOADER_CSS);
  const c = crestFor(ctx);
  const el = h("div", { class: "mh-loader", role: "status" },
    h("div", { html: crestSvg({ ...c, id: "mh-ld", draw: true }) }),
    h("p", { text: ctx.t("loaderFor", { salutation: ctx.guest.salutation }) }));
  ctx.root.append(el);
  return () => { el.style.opacity = "0"; setTimeout(() => el.remove(), 450); };
}

function create(ctx: RenderContext): TemplateInstance {
  registerGsap();
  ensureStyles("mh", CSS);
  const { root, content, guest, t, rng, clock, audio, scripted } = ctx;
  const calm = ctx.reduced || ctx.lite;
  const events = invitedEvents(content, guest);
  const [p1, p2] = coupleOrder(content);
  const hi = ctx.locale === "hi";
  const n1 = hi && p1.nameHi ? p1.nameHi : p1.name;
  const n2 = hi && p2.nameHi ? p2.nameHi : p2.name;
  const mainEvent: WeddingEvent = events.find((e) => e.kind === "wedding") ?? events[0] ?? content.events[0]!;
  const crest = crestFor(ctx);
  const disposers: (() => void)[] = [];
  const triggers: ScrollTrigger[] = [];

  audio.register("crack", (ac, out, at) => { noiseBurst(0.09, 0.35, 1200)(ac, out, at); noiseBurst(0.05, 0.25, 3000)(ac, out, at + 0.05); return 0.3; });
  audio.register("paper", noiseBurst(0.5, 0.05, 2400, "bandpass"));
  audio.register("silk", noiseBurst(0.6, 0.03, 5000));
  audio.register("chime", arpeggio([SWARAS.Sa2, SWARAS.Pa * 2, SWARAS.Sa2 * 2], 0.16, 0.05));
  audio.register("tick", pluck(SWARAS.Sa2 * 2, 0.04, 0.3));

  const col = h("div", { class: "inv-column mh-col" });
  root.append(col);
  const stage = h("section", { class: "mh-stage", "aria-label": t("youreInvited") });
  col.append(stage);
  stage.append(h("div", { class: "mh-velvet", html: velvetSvg() }));

  // ---------- box ----------
  const box = h("div", { class: "mh-box" });
  const shadow = h("div", { class: "mh-shadow" });
  const base = h("div", { html: boxBaseSvg() });
  const inside = h("div", { class: "mh-inside" });
  inside.innerHTML = `<div class="mh-card" style="position:absolute;inset:6%;display:flex;align-items:center;justify-content:center"><div style="width:52%">${crestSvg({ ...crest, id: "mh-in" })}</div></div>`;
  const tisL = h("div", { class: "mh-tis mh-tis-l", html: tissueSvg("l") });
  const tisR = h("div", { class: "mh-tis mh-tis-r", html: tissueSvg("r") });
  const lid = h("div", { class: "mh-lid", html: lidSvg() });
  const ribbon = h("div", { class: "mh-ribbon", html: ribbonSvg() });
  lid.append(ribbon);
  const seal = sealShards(rng.fork("seal"));
  const sealEl = h("div", { class: "mh-seal", role: "button", tabindex: "-1", "aria-hidden": "true", html: seal.svg });
  const ring = h("div", { class: "mh-ring", html: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg>` });
  sealEl.append(ring);
  lid.append(sealEl);
  sealEl.querySelectorAll(".mh-seal-mono text").forEach((tx) => (tx.textContent = `${crest.b}`));
  const tag = h("div", { class: "mh-tag" }, h("div", { class: "mh-tag-string" }), h("div", { class: "mh-tag-card", text: hi ? `${guest.salutation} के लिए` : `For ${guest.salutation}` }));
  lid.append(tag);
  box.append(shadow, base, inside, tisL, tisR, lid);
  stage.append(box);

  // ---------- main invitation card ----------
  const main = h("article", { class: "mh-card mh-main", "aria-label": `${n1} ${t("and")} ${n2}` });
  const motifs = content.motifs.filter((m) => m !== "none");
  if (motifs.length) main.append(h("div", { style: "display:flex;gap:10px;justify-content:center", html: motifs.map((m) => `<div class="mh-motif">${motifSvg(m, { strokeWidth: m === "ganesh" ? 2.2 : 1 })}</div>`).join("") }));
  const w = fillWording(wordingFor(content.ceremonyStyle, ctx.tone === "playful" ? "warm" : ctx.tone, ctx.locale), { bride: (hi && content.bride.nameHi) || content.bride.name, groom: (hi && content.groom.nameHi) || content.groom.name });
  main.append(h("div", { class: "mh-crest-s", html: crestSvg({ ...crest, id: "mh-main" }) }));
  if (w.invocation) main.append(h("p", { class: "mh-invoc mh-lp", text: w.invocation }));
  const body = h("p", { class: "mh-body mh-lp", text: hi ? w.body : t("blessing") });
  if (!hi && content.families.blessingLine) body.prepend(h("i", { text: content.families.blessingLine }), h("br"));
  main.append(body);
  const namesEl = h("h1", { class: "mh-names mh-lp" }, h("span", { text: n1 }), h("span", { class: "mh-amp", text: hi ? t("and") : "&" }), h("span", { text: n2 }));
  main.append(namesEl);
  const devNum = content.devanagariNumerals;
  main.append(h("p", { class: "mh-when mh-lp", text: `${formatDate(mainEvent.startsAt, ctx.locale, { tz: mainEvent.tz, devanagariNumerals: devNum })}` }));
  main.append(h("p", { class: "mh-where mh-lp", text: `${formatTime(mainEvent.startsAt, ctx.locale, { tz: mainEvent.tz, devanagariNumerals: devNum })}, ${[mainEvent.venueName, content.city].filter(Boolean).join(", ")}` }));
  const venueBox = h("div", { class: "mh-venue-box", html: venuePainting(rng.fork("venue"), "mh-v") });
  main.append(venueBox);
  stage.append(main);
  for (const s of namesEl.querySelectorAll<HTMLElement>("span:not(.mh-amp)")) fitTextInBox(s, { min: 26, max: 42, maxLines: 2 });

  // ---------- fan of suite cards ----------
  const fan = h("div", { class: "mh-fan" });
  const fanCards: HTMLElement[] = [];
  const suiteItems: { title: string; body: () => HTMLElement; pane: string }[] = [
    ...events.map((e, i) => ({ title: eventTitle(ctx, e).main, pane: PANES[i % PANES.length]!, body: () => fnCard(e, i) })),
    { title: t("rsvp"), pane: "var(--velvet)", body: () => h("div", { class: "mh-read-inner" }, h("h3", { class: "mh-h2", text: t("rsvpTitle") }), h("p", { text: content.rsvpDeadline ? formatDate(content.rsvpDeadline, ctx.locale) : "" }), h("a", { class: "inv-btn", href: "#inv-rsvp", "data-close": "1", text: t("rsvp") })) },
    { title: t("location"), pane: "var(--silk)", body: () => h("div", {}, h("h3", { class: "mh-h2", text: mainEvent.venueName }), h("p", { text: mainEvent.venueAddress ?? "" }), h("a", { class: "inv-btn", href: "#inv-venue", "data-close": "1", text: t("directions") })) },
  ];
  if (content.shagun?.enabled && guest.shagunVisible) suiteItems.push({ title: t("shagun"), pane: "var(--gold)", body: () => h("div", {}, h("h3", { class: "mh-h2", text: t("shagun") }), h("p", { text: t("shagunIntro") }), h("a", { class: "inv-btn", href: "#inv-shagun", "data-close": "1", text: t("open") })) });
  suiteItems.forEach((it, i) => {
    const c = h("button", { class: "mh-card mh-mini", type: "button", "aria-label": it.title }, h("i", { style: `background:${it.pane}` }), h("b", { text: it.title }));
    c.addEventListener("click", () => openViewer(i));
    fan.append(c);
    fanCards.push(c);
  });
  const layoutFan = (spread: number) => {
    const n = fanCards.length;
    fanCards.forEach((c, i) => {
      const u = n === 1 ? 0 : i / (n - 1) - 0.5;
      gsap.set(c, { rotate: u * 34 * spread, x: u * 150 * spread, y: Math.abs(u) * 22 * spread, zIndex: i });
    });
  };
  layoutFan(1);
  stage.append(fan);

  const dock = h("nav", { class: "mh-dock", "aria-label": t("functions") },
    h("a", { href: "#mh-fns", html: `${ICONS.list}<span>${t("functions")}</span>` }),
    h("a", { href: "#inv-venue", html: `${ICONS.pin}<span>${t("location")}</span>` }),
    h("a", { href: "#inv-rsvp", class: "mh-primary", html: `${ICONS.check}<span>${t("rsvp")}</span>` }));
  stage.append(dock);

  const hint = h("div", { class: "mh-hint" });
  const hintText = h("p", { text: guest.replied ? t("replied") : t("pressSeal") });
  const openBtn = h("button", { class: "mh-open-btn", type: "button", text: guest.replied ? t("openAgain") : t("openInvitation") });
  hint.append(hintText, openBtn);
  stage.append(hint);
  if (guest.replied) sealEl.querySelectorAll(".mh-seal-mono text").forEach((tx) => (tx.textContent = "✓"));

  const sound = h("button", { class: "mh-sound", type: "button" });
  const paintSound = () => { const on = audio.unlocked && !audio.muted; sound.innerHTML = on ? ICONS.soundOn : ICONS.soundOff; sound.setAttribute("aria-label", on ? t("sound") : t("muted")); sound.setAttribute("aria-pressed", String(on)); };
  sound.addEventListener("click", () => { if (!audio.unlocked) { audio.unlock(); audio.setMuted(false); audio.bed(droneBed(SWARAS.Pa / 2)); } else audio.setMuted(!audio.muted); paintSound(); });
  if (!scripted && !ctx.lite) { col.append(sound); paintSound(); }

  // ---------- function card factory ----------
  function fnCard(e: WeddingEvent, i: number): HTMLElement {
    const title = eventTitle(ctx, e);
    const dm = formatDayMonth(e.startsAt, ctx.locale, { tz: e.tz, devanagariNumerals: devNum });
    const c = h("div", { class: "mh-card mh-fn", id: `mh-fn-${e.id}` },
      h("i", { class: "mh-pane", style: `background:${PANES[i % PANES.length]}` }),
      h("h3", { class: "mh-lp" }, title.main, title.alt ? h("span", { class: "mh-alt", text: title.alt }) : null),
      h("p", { class: "mh-wh mh-lp", text: `${dm.weekday}, ${dm.day} ${dm.month}` }),
      h("p", { class: "mh-lp", text: formatTime(e.startsAt, ctx.locale, { tz: e.tz, devanagariNumerals: devNum }) }),
      h("p", { class: "mh-lp" }, h("b", { text: e.venueName }), e.venueArea ? `, ${e.venueArea}` : ""));
    if (e.dressCode.length) {
      const chips = h("div", { class: "mh-chips", "aria-label": t("dressCode") });
      for (const d of e.dressCode) chips.append(h("span", { class: "mh-chip" }, h("i", { style: `background:${d.hex}` }), d.name));
      c.append(chips);
    }
    const a = eventActions(ctx, e, "", "mh-p", true);
    a.className = "mh-actions";
    c.append(a);
    return c;
  }

  // ---------- viewer (tap a card to bring it forward; swipe between cards) ----------
  let viewer: HTMLElement | null = null;
  function openViewer(start: number) {
    let idx = start;
    viewer?.remove();
    const v = h("div", { class: "mh-viewer", role: "dialog", "aria-modal": "true" });
    const close = h("button", { class: "mh-close", type: "button", "aria-label": "Close", text: "×" });
    const nav = h("div", { class: "mh-nav" });
    const holder = h("div", { class: "mh-card mh-read" });
    const paint = (dir = 0) => {
      holder.innerHTML = "";
      holder.append(suiteItems[idx]!.body());
      nav.textContent = `${idx + 1} / ${suiteItems.length}`;
      holder.querySelectorAll<HTMLElement>("[data-close]").forEach((a) => a.addEventListener("click", () => v.remove()));
      if (dir && !calm) gsap.fromTo(holder, { x: dir * 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: "power2.out" });
    };
    paint();
    close.addEventListener("click", () => v.remove());
    v.addEventListener("click", (e) => { if (e.target === v) v.remove(); });
    let sx = 0;
    v.addEventListener("pointerdown", (e) => (sx = e.clientX));
    v.addEventListener("pointerup", (e) => { const dx = e.clientX - sx; if (Math.abs(dx) > 50) { idx = (idx + (dx < 0 ? 1 : -1) + suiteItems.length) % suiteItems.length; paint(dx < 0 ? 1 : -1); } });
    v.addEventListener("keydown", (e) => { if (e.key === "Escape") v.remove(); if (e.key === "ArrowRight") { idx = (idx + 1) % suiteItems.length; paint(1); } if (e.key === "ArrowLeft") { idx = (idx - 1 + suiteItems.length) % suiteItems.length; paint(-1); } });
    v.append(close, holder, nav);
    col.append(v);
    viewer = v;
    const from = fanCards[start]!.getBoundingClientRect(), to = holder.getBoundingClientRect();
    if (!calm) gsap.fromTo(holder, { x: from.left - to.left, y: from.top - to.top, scale: from.width / to.width, rotate: Number(gsap.getProperty(fanCards[start]!, "rotate")) }, { x: 0, y: 0, scale: 1, rotate: 0, duration: 0.5, ease: "power3.out" });
    close.focus();
    audio.sting("paper");
  }

  // ---------- open timeline ----------
  const open = gsap.timeline({ paused: true });
  const shardEls = Array.from(sealEl.querySelectorAll<SVGGElement>(".mh-shard"));
  const blooms = Array.from(venueBox.querySelectorAll<SVGCircleElement>(".mh-bloom"));
  const paintLayer = venueBox.querySelector<SVGGElement>(".mh-venue-paint")!;
  gsap.set(dock, { autoAlpha: 0, y: 10 });
  if (calm || ctx.tier === "C") blooms.forEach((b) => b.setAttribute("r", "400"));
  if (calm) {
    open.to(box, { opacity: 0, duration: 0.5 }, 0).to(hint, { autoAlpha: 0, duration: 0.3 }, 0)
      .set(main, { visibility: "visible" }, 0.2).to(main, { opacity: 1, duration: 0.5 }, 0.2)
      .fromTo(paintLayer, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.4)
      .set(fan, { visibility: "visible" }, 0.6).to(fan, { opacity: 1, duration: 0.4 }, 0.6)
      .to(dock, { autoAlpha: 1, y: 0, duration: 0.3 }, 0.8);
  } else {
    const whole = sealEl.querySelector<SVGGElement>(".mh-seal-whole")!;
    const shardsG = sealEl.querySelector<SVGGElement>(".mh-shards")!;
    open.to(hint, { autoAlpha: 0, duration: 0.25 }, 0)
      .set(whole, { display: "none" }, 0).set(shardsG, { display: "inline" }, 0)
      .to(ring, { opacity: 0, duration: 0.2 }, 0)
      .to(sealEl.querySelector(".mh-seal-shadow"), { opacity: 0, duration: 0.3 }, 0);
    shardEls.forEach((s, k) => {
      const a = ((k + 0.5) / 5) * Math.PI * 2;
      open.to(s, { x: Math.cos(a) * 26, y: 70 + Math.sin(a) * 18, rotate: (k % 2 ? 1 : -1) * (40 + k * 18), duration: 0.7, ease: "bounce.out", svgOrigin: "0 0" }, 0.02 * k)
        .to(s, { opacity: 0, duration: 0.25 }, 0.55);
    });
    open.to(ribbon.querySelector(".mh-ribbon-v"), { y: 420, duration: 0.6, ease: "power2.in" }, 0.6)
      .to(ribbon.querySelector(".mh-ribbon-h"), { x: 340, duration: 0.6, ease: "power2.in" }, 0.62)
      .to(tag, { y: 380, rotate: 30, opacity: 0, duration: 0.6, ease: "power2.in" }, 0.55)
      .to(lid, { rotateX: -70, y: "-34%", duration: 0.9, ease: "power2.inOut" }, 1.1)
      .to(lid, { opacity: 0, duration: 0.35 }, 1.75)
      .to(shadow, { opacity: 0.5, filter: "blur(22px)", duration: 0.9 }, 1.1)
      .to(tisL, { rotateY: -165, duration: 0.8, ease: "power2.inOut" }, 2.0)
      .to(tisR, { rotateY: 165, duration: 0.8, ease: "power2.inOut" }, 2.06)
      .set(main, { visibility: "visible" }, 2.55)
      .fromTo(main, { opacity: 0, y: 120, scale: 0.78 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" }, 2.55)
      .to(box, { y: 180, scale: 0.9, opacity: 0, duration: 0.7, ease: "power2.in" }, 2.7)
      .set(fan, { visibility: "visible" }, 3.1)
      .fromTo(fan, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 3.1)
      .to(dock, { autoAlpha: 1, y: 0, duration: 0.4 }, 3.6);
    // watercolour bloom: pigment spreads from 3 seeded points (2.5 s)
    blooms.forEach((b, i) => open.fromTo(b, { attr: { r: 0 } }, { attr: { r: 260 }, duration: 2.5, ease: "power1.inOut" }, 3.0 + i * 0.25));
  }
  open.set({}, {}, calm ? 1.2 : 5.8);

  // ---------- stained glass function list ----------
  const fnsSec = h("section", { class: "mh-fns", id: "mh-fns" });
  fnsSec.append(h("div", { class: "mh-sg", html: stainedGlassSvg(events.map((_, i) => PANES[i % PANES.length]!)) }));
  const pools = events.map((_, i) => { const p = h("i", { class: "mh-pool", style: `background:${PANES[i % PANES.length]};left:${(i % 2 ? 40 : -10) + (i * 7) % 20}%;top:${12 + i * 14}%` }); fnsSec.append(p); return p; });
  fnsSec.append(h("h2", { class: "mh-h2", text: t("yourFunctions") }));
  events.forEach((e, i) => fnsSec.append(fnCard(e, i)));

  // story with photo corners
  let storySec: HTMLElement | null = null;
  if (content.story.length) {
    storySec = h("section", { class: "mh-story", id: "mh-story" }, h("h2", { class: "mh-h2", text: t("ourStory") }));
    content.story.slice(0, 3).forEach((b, i) => storySec!.append(h("figure", { class: "mh-photo", style: `--r:${[-2, 1.5, -1][i]}deg` },
      b.photoUrl ? h("img", { src: b.photoUrl, alt: "", loading: "lazy" }) : h("div", { class: "mh-ph mh-opal", html: `<div style="width:40%">${crestSvg({ ...crest, id: `mh-st${i}` })}</div>` }),
      h("figcaption", { text: b.caption }))));
  }

  let sectionsApi: { destroy(): void } | null = null;
  const closingBox = () => `<svg viewBox="0 0 160 120" aria-hidden="true"><rect x="20" y="40" width="120" height="70" rx="4" fill="var(--ivory-lo)"/><g class="mh-cl-card"><rect x="40" y="10" width="80" height="56" rx="2" fill="#fff" stroke="var(--gold)"/><path d="M52,30 h56 M52,40 h40" stroke="var(--ink)" stroke-width="1.5" opacity=".5"/></g><g class="mh-cl-lid" style="transform-origin:80px 40px"><rect x="16" y="34" width="128" height="14" rx="3" fill="var(--ivory)" stroke="var(--gold)"/></g><g class="mh-cl-seal" opacity="0"><circle cx="80" cy="74" r="14" fill="var(--seal)"/><text x="80" y="79" text-anchor="middle" font-size="13" fill="#fff" fill-opacity=".85">✓</text></g></svg>`;
  if (!scripted) {
    col.append(fnsSec);
    if (storySec) col.append(storySec);
    const sh = h("div");
    col.append(sh);
    sectionsApi = renderSections(ctx, sh, {
      rsvpStage: (host) => {
        host.insertBefore(h("div", { class: "mh-reply-head" }, h("div", { class: "mh-crest-s", html: crestSvg({ ...crest, id: "mh-reply" }) })), host.firstChild);
        const closing = h("div", { class: "mh-closing", html: closingBox(), style: "display:none" });
        host.append(closing);
        return {
          react: () => {
            closing.style.display = "flex";
            const tl = gsap.timeline();
            tl.fromTo(closing.querySelector(".mh-cl-card"), { y: -20 }, { y: 30, duration: calm ? 0.01 : 0.7, ease: "power2.in" })
              .fromTo(closing.querySelector(".mh-cl-lid"), { rotate: -30, y: -20 }, { rotate: 0, y: 0, duration: calm ? 0.01 : 0.5 })
              .to(closing.querySelector(".mh-cl-seal"), { opacity: 1, duration: 0.4 });
            audio.sting("chime");
          },
        };
      },
      afterRsvp: (host) => host.append(ashirwad()),
      shagunStage: (host) => host.insertBefore(h("div", { class: "mh-envelope", html: envelopeSvg() }), host.children[1] ?? null),
      onShagunBlock: async (el) => { audio.sting("paper"); if (!calm) await gsap.fromTo(el, { rotateY: 0 }, { rotateY: 180, duration: 0.25, yoyo: true, repeat: 1, ease: "power1.inOut" }); },
    });
    setSectionTokens(root);
    triggers.push(...pools.map((p, i) => ScrollTrigger.create({ trigger: fnsSec, start: "top bottom", end: "bottom top", scrub: 0.8, animation: gsap.fromTo(p, { y: -60, x: 0 }, { y: 260, x: (i % 2 ? -1 : 1) * 60, ease: "none" }) })));
  }

  function ashirwad(): HTMLElement {
    const wrap = h("div", { class: "inv-panel mh-ashirwad" });
    const ta = h("textarea", { maxlength: 160, id: "mh-bless", rows: 2 });
    const canvas = h("canvas", { class: "mh-sig", "aria-label": t("signHere") });
    const status = h("p", { class: "inv-msg", style: "display:none", role: "status" });
    const clear = h("button", { type: "button", class: "inv-btn", text: t("clear") });
    const save = h("button", { type: "button", class: "inv-btn inv-btn-primary", text: t("ashirwad") });
    const strokes: [number, number][][] = [];
    let cur: [number, number][] | null = null;
    const g = canvas.getContext("2d");
    const fit = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width * 2; canvas.height = r.height * 2; g?.setTransform(2, 0, 0, 2, 0, 0); redraw(); };
    const redraw = () => { if (!g) return; const r = canvas.getBoundingClientRect(); g.clearRect(0, 0, r.width, r.height); g.strokeStyle = "#2B1B26"; g.lineWidth = 2; g.lineCap = "round"; g.lineJoin = "round"; for (const s of strokes) { g.beginPath(); s.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); } };
    const pt = (e: PointerEvent): [number, number] => { const r = canvas.getBoundingClientRect(); return [Math.round(e.clientX - r.left), Math.round(e.clientY - r.top)]; };
    canvas.addEventListener("pointerdown", (e) => { canvas.setPointerCapture(e.pointerId); cur = [pt(e)]; strokes.push(cur); });
    canvas.addEventListener("pointermove", (e) => { if (cur) { cur.push(pt(e)); redraw(); } });
    canvas.addEventListener("pointerup", () => (cur = null));
    clear.addEventListener("click", () => { strokes.length = 0; redraw(); });
    save.addEventListener("click", async () => {
      const svgPath = strokes.filter((s) => s.length > 1).map((s) => `M${s.map(([x, y]) => `${x},${y}`).join(" L")}`).join(" ");
      const r = canvas.getBoundingClientRect();
      const signatureSvg = svgPath ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.round(r.width)} ${Math.round(r.height)}"><path d="${svgPath}" fill="none" stroke="#2B1B26" stroke-width="2" stroke-linecap="round"/></svg>` : undefined;
      if (!ta.value.trim() && !signatureSvg) return;
      save.disabled = true;
      const res = await ctx.services?.sign?.({ blessing: ta.value.trim(), signatureSvg });
      status.textContent = res?.ok === false ? "…" : t("pledgeThanks").split("!")[0] + " 🙏";
      status.style.display = "block";
      save.disabled = false;
    });
    wrap.append(h("div", { class: "inv-field" }, h("label", { for: "mh-bless", text: t("ashirwad") }), ta), h("span", { class: "inv-legend", text: t("signHere") }), canvas, h("div", { class: "inv-row" }, clear, save), status);
    requestAnimationFrame(fit);
    return wrap;
  }

  // ---------- scripted storyboard (~36 s) ----------
  const master = gsap.timeline({ paused: true });
  let duration = 36;
  if (scripted) {
    hint.remove();
    // 0–3 box + tag; 3 seal crack; 3–6 lid + tissue; card + bloom; hold names/date/venue to ≥ 14
    master.fromTo(tag.querySelector(".mh-tag-card"), { opacity: 0 }, { opacity: 1, duration: 0.8 }, 0.3);
    master.fromTo(ring.querySelector("circle"), { attr: { "stroke-dashoffset": 1 } }, { attr: { "stroke-dashoffset": 0 }, duration: 0.9, ease: "none" }, 2.0);
    master.add(open.paused(false), 3);
    let at = 14;
    const montage = h("div", { class: "mh-montage" });
    stage.append(montage);
    master.to([main, fan], { opacity: 0, duration: 0.4 }, at - 0.4);
    const slot = Math.max(2.5, Math.min(3, 15 / Math.max(1, events.length)));
    events.forEach((e, i) => {
      const c = fnCard(e, i);
      montage.append(c);
      master.fromTo(c, { opacity: 0, y: 40, rotate: (i % 2 ? 4 : -4) }, { opacity: 1, y: 0, rotate: 0, duration: 0.45, ease: "power2.out" }, at).to(c, { opacity: 0, x: -60, duration: 0.3 }, at + slot - 0.3);
      at += slot;
    });
    const reply = h("div", { class: "mh-card mh-fn" }, h("div", { class: "mh-crest-s", style: "width:70px;height:70px;margin:0 auto", html: crestSvg({ ...crest, id: "mh-rv" }) }), h("h3", { text: t("rsvpTitle") }), h("p", { text: content.rsvpDeadline ? formatDate(content.rsvpDeadline, ctx.locale) : "" }));
    montage.append(reply);
    master.fromTo(reply, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.45 }, at).to(reply, { opacity: 0, duration: 0.3 }, at + 2.7);
    at += 3;
    const end = h("div", { class: "mh-endcard" });
    const url = ctx.services?.shareUrl ?? "";
    end.innerHTML = `<div class="mh-crest-s">${crestSvg({ ...crest, id: "mh-end" })}</div><div style="font-family:'Bodoni Moda',serif;font-style:italic;font-size:28px">${esc(n1)} &amp; ${esc(n2)}</div><div>${esc(formatDate(mainEvent.startsAt, ctx.locale, { tz: mainEvent.tz }))}</div>${url ? `<div style="width:140px;height:140px;background:#fff;padding:6px">${qrSvg(url)}</div><div style="font-size:14px;word-break:break-all">${esc(url.replace(/^https?:\/\//, ""))}</div>` : ""}`;
    stage.append(end);
    master.to(end, { opacity: 1, duration: 0.6 }, at);
    at += 3.5;
    duration = at;
    master.set({}, {}, duration);
  }

  // ---------- interaction: press and hold the seal 0.9 s ----------
  let opened = false;
  const ringCircle = ring.querySelector("circle")!;
  let holdTween: gsap.core.Tween | null = null;
  const holdState = { p: 0 };
  const renderRing = () => ringCircle.setAttribute("stroke-dashoffset", String(1 - holdState.p));
  const startHold = (e: Event) => {
    if (opened) return;
    e.preventDefault();
    audio.unlock();
    holdTween?.kill();
    holdTween = gsap.to(holdState, { p: 1, duration: 0.9 * (1 - holdState.p), ease: "none", onUpdate: renderRing, onComplete: () => doOpen() });
  };
  const endHold = () => {
    if (opened) return;
    holdTween?.kill();
    holdTween = gsap.to(holdState, { p: 0, duration: 0.4, ease: "power1.out", onUpdate: renderRing });
  };
  const doOpen = (instant = false) => {
    if (opened) return;
    opened = true;
    holdTween?.kill(); holdState.p = 1; renderRing();
    audio.unlock();
    if (!instant) { audio.sting("crack"); setTimeout(() => audio.sting("silk"), 600); setTimeout(() => audio.sting("paper"), 1200); haptic(15); }
    paintSound();
    ctx.emit("opened");
    const done = () => {
      document.documentElement.style.overflow = ""; document.body.style.overflow = "";
      ctx.emit("sceneView", "hero");
      if (!audio.muted && audio.unlocked) audio.bed(droneBed(SWARAS.Pa / 2));
      ScrollTrigger.refresh();
      const banner = topBanner(ctx);
      if (banner) col.append(banner);
    };
    if (instant) { open.progress(1); done(); } else open.eventCallback("onComplete", done).play(0);
  };
  const onKey = (e: KeyboardEvent) => { if (viewer?.isConnected) return; if (!opened && (e.key === "Enter" || e.key === " ") && document.activeElement === document.body) { e.preventDefault(); doOpen(); } };

  disposers.push(clock.add((tm) => {
    if (calm) return;
    // opal shimmer + slight light shift (one light source top-left)
    for (const el of root.querySelectorAll<HTMLElement>(".mh-opal")) el.style.backgroundPosition = `${((tm * 8) % 300).toFixed(1)}% 0`;
    if (!opened && !scripted) box.style.transform = `translate(-50%,-50%) rotateX(${(Math.sin(tm * 0.6) * 1.2).toFixed(2)}deg) rotateY(${(Math.sin(tm * 0.45) * 1.6).toFixed(2)}deg)`;
  }));

  return {
    storyboard: {
      duration: scripted ? duration : open.duration(),
      keyframes: scripted
        ? [{ t: 1, label: "box" }, { t: 3.3, label: "seal" }, { t: 5, label: "lid" }, { t: 7.5, label: "card" }, { t: 12, label: "hold" }, { t: 15.5, label: "functions" }, { t: duration - 1, label: "crest" }]
        : manifest.keyframes.map((k) => ({ t: k, label: `t${k}` })),
      staticAt: 11,
    },
    start() {
      if (scripted) return;
      document.documentElement.style.overflow = "hidden"; document.body.style.overflow = "hidden";
      clock.startRealtime();
      sealEl.addEventListener("pointerdown", startHold);
      for (const ev of ["pointerup", "pointerleave", "pointercancel"]) sealEl.addEventListener(ev, endHold);
      openBtn.addEventListener("click", () => doOpen());
      window.addEventListener("keydown", onKey);
      triggers.push(...pinChapters(ctx, []));
      // Tag lettering: Latin is "written" with a left-to-right reveal; Devanagari fades in per grapheme cluster.
      const tagCard = tag.querySelector<HTMLElement>(".mh-tag-card")!;
      if (!calm) {
        const txt = tagCard.textContent ?? "";
        if (hasIndic(txt)) gsap.fromTo(splitIntoSpans(tagCard, txt, "hi"), { opacity: 0 }, { opacity: 1, duration: 0.25, stagger: 0.09, delay: 0.3 });
        else gsap.fromTo(tagCard, { clipPath: "polygon(10% 0,10% 0,10% 100%,0 50%)" }, { clipPath: "polygon(10% 0,100% 0,100% 100%,10% 100%,0 50%)", duration: 1.4, ease: "power1.inOut", delay: 0.3 });
      }
      ctx.services?.track({ scene: "loader", tier: ctx.tier });
    },
    seek(time) { master.seek(time, false); clock.renderAt(time); },
    play() { if (scripted) { clock.startRealtime(); master.play(); } else doOpen(); },
    goTo(sceneId: SceneId) {
      if (!opened) doOpen(true);
      const id = sceneId === "rsvp" ? "inv-rsvp" : sceneId === "shagun" ? "inv-shagun" : sceneId.startsWith("chapter:") ? `mh-fn-${sceneId.slice(8)}` : sceneId === "story" ? "mh-story" : null;
      (id ? document.getElementById(id) : stage)?.scrollIntoView({ behavior: calm ? "auto" : "smooth" });
    },
    open: (instant?: boolean) => doOpen(instant),
    destroy() {
      disposers.forEach((d) => d()); triggers.forEach((x) => x.kill()); sectionsApi?.destroy();
      open.kill(); master.kill(); holdTween?.kill(); viewer?.remove();
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = ""; document.body.style.overflow = "";
      col.remove();
    },
  };
}

function envelopeSvg(): string {
  return `<svg viewBox="0 0 180 120" role="img" aria-label="Registry envelope"><rect x="10" y="20" width="160" height="92" rx="3" fill="var(--ivory)" stroke="var(--gold)"/><path d="M10,22 L90,76 L170,22" fill="var(--ivory-lo)" stroke="var(--gold)"/><circle cx="90" cy="74" r="12" fill="var(--seal)"/><path d="M84,74 h12 M90,68 v12" stroke="#fff" stroke-opacity=".5"/></svg>`;
}

function esc(s: string) { return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!); }

function setSectionTokens(root: HTMLElement) {
  const v: Record<string, string> = {
    "--sec-bg": "var(--ivory)", "--sec-ink": "var(--ink)", "--sec-heading": "var(--ink)", "--sec-card": "#FFFDF8", "--sec-card-ink": "var(--ink)",
    "--sec-accent": "var(--accent)", "--sec-line": "rgba(179,142,85,.6)", "--sec-font-display": '"Bodoni Moda","Tiro Devanagari Hindi",serif', "--sec-display-weight": "400",
    "--sec-font-text": '"EB Garamond","Tiro Devanagari Hindi",Georgia,serif', "--sec-radius": "2px", "--sec-btn-radius": "2px",
    "--sec-card-shadow": "0 0 0 1px rgba(179,142,85,.6),3px 5px 14px rgba(0,0,0,.12)", "--sec-note-bg": "rgba(179,142,85,.12)",
  };
  for (const [k, val] of Object.entries(v)) root.style.setProperty(k, val);
}

const template: TemplateModule = { manifest, packs, loader, create };
export default template;
export { manifest, packs };
export { crestSvg, CREST_FRAMES } from "./crest";

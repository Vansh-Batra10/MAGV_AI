import { coupleOrder, invitedEvents, type WeddingEvent } from "@invites/content-schema";
import { fillWording, formatDate, formatDayMonth, formatTime, wordingFor } from "@invites/i18n";
import {
  arpeggio, clink, drum, ensureStyles, fitTextInBox, gsap, h, haptic, ICONS, noiseBurst, pinChapters, pluck, qrSvg, reedPhrase,
  registerGsap, rhythmBed, ScrollTrigger, SWARAS, type Chapter, type RenderContext, type SceneId, type TemplateInstance, type TemplateModule,
} from "@invites/renderer";
import { eventActions, eventTitle, renderSections, topBanner } from "@invites/renderer/sections";
import { clothSvg, coverBorderSvg, DEFS, gullakSvg, PROPS, rainSvg, scooterSvg, skylineSvg } from "./art";
import { manifest } from "./manifest";
import { packs } from "./packs";
import { actionPose, applyPose, blinking, DEFAULT_LOOKS, dogSvg, dressFor, puppetSvg, type Action, type PuppetLook } from "./puppets";
import { CSS } from "./styles";

const LOADER_CSS = `
.rk-loader{position:fixed;inset:0;z-index:100;background:#FFF1D6;background:var(--paper,#FFF1D6);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#231942;font-family:"Baloo 2",system-ui,sans-serif;transition:opacity .4s}
.rk-loader svg{width:180px;height:110px}
.rk-loader text{font-family:"Yatra One",serif;font-size:72px;fill:none;stroke:#231942;stroke-width:1.6;stroke-dasharray:420;stroke-dashoffset:420;animation:rk-draw 1.1s ease-out forwards}
.rk-loader p{margin:0;font-weight:700;font-size:18px}
@keyframes rk-draw{to{stroke-dashoffset:0}}
@media (prefers-reduced-motion: reduce){.rk-loader text{animation:none;stroke-dashoffset:0}}
`;

function initials(ctx: RenderContext) {
  const [a, b] = coupleOrder(ctx.content);
  const first = (s: string) => Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s))[0]?.segment ?? s[0] ?? "";
  return `${first(a.name)}${first(b.name)}`;
}

function loader(ctx: RenderContext): () => void {
  ensureStyles("rk-loader", LOADER_CSS);
  const el = h("div", { class: "rk-loader", role: "status" },
    h("div", { html: `<svg viewBox="0 0 180 110" aria-hidden="true"><text x="90" y="80" text-anchor="middle">${initials(ctx)}</text><path d="M30,96 q60,10 120,0" stroke="#E0218A" stroke-width="3" fill="none" stroke-linecap="round"/></svg>` }),
    h("p", { text: ctx.t("loaderFor", { salutation: ctx.guest.salutation }) }));
  ctx.root.append(el);
  return () => { el.style.opacity = "0"; setTimeout(() => el.remove(), 400); };
}

const PAIRS: Record<string, [string, string]> = {
  haldi: ["var(--turmeric)", "var(--bottle)"], mehendi: ["var(--bottle)", "var(--rani)"], sangeet: ["var(--indigo)", "var(--rani)"],
  wedding: ["var(--rani)", "var(--turmeric)"], reception: ["var(--indigo)", "#C9CCE0"], cocktail: ["var(--ink)", "var(--rani)"], custom: ["var(--rani)", "var(--turmeric)"],
};

interface PuppetHandle { el: SVGGElement; action: Action; phase: number; side: 1 | -1 }

function create(ctx: RenderContext): TemplateInstance {
  registerGsap();
  ensureStyles("rk", CSS);
  const { root, content, guest, t, rng, clock, audio, scripted } = ctx;
  const calm = ctx.reduced || ctx.lite;
  const events = invitedEvents(content, guest);
  const [p1, p2] = coupleOrder(content);
  const hiNames = ctx.locale === "hi";
  const n1 = hiNames && p1.nameHi ? p1.nameHi : p1.name;
  const n2 = hiNames && p2.nameHi ? p2.nameHi : p2.name;
  const mainEvent: WeddingEvent = events.find((e) => e.kind === "wedding") ?? events[0] ?? content.events[0]!;
  const packId = ctx.pack.id;
  const disposers: (() => void)[] = [];
  const triggers: ScrollTrigger[] = [];
  const puppets: PuppetHandle[] = [];
  const brideLook: PuppetLook = DEFAULT_LOOKS[0]!;
  const groomLook: PuppetLook = DEFAULT_LOOKS[1]!;

  audio.register("page", noiseBurst(0.45, 0.08, 1800, "bandpass"));
  audio.register("dhol", (ac, out, at) => { drum(110, 0.4)(ac, out, at); drum(220, 0.2, 0.2)(ac, out, at + 0.18); drum(110, 0.35)(ac, out, at + 0.36); return 0.8; });
  audio.register("tumbi", arpeggio([SWARAS.Sa2 * 2, SWARAS.Ga2 * 2, SWARAS.Sa2 * 2, SWARAS.Pa * 4], 0.11, 0.06));
  audio.register("flute", reedPhrase([[SWARAS.Pa * 2, 0.3], [SWARAS.Sa2 * 2, 0.5]], 0.05));
  audio.register("coin", clink());
  audio.register("pop", pluck(SWARAS.Sa2 * 2, 0.07, 0.4));

  const col = h("div", { class: "inv-column rk-col" });
  root.append(col);
  col.insertAdjacentHTML("afterbegin", DEFS);

  // ---------- puppet helpers ----------
  const puppetG = (look: PuppetLook, fn: string, x: number, y: number, scale: number, action: Action, side: 1 | -1 = 1, flip = false) => {
    const phase = rng.range(0, 6);
    const html = `<g transform="translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})">${puppetSvg(dressFor(look, fn))}</g>`;
    return { html, register: (svg: SVGSVGElement) => {
      const all = svg.querySelectorAll<SVGGElement>(`.pp[data-id="${look.id}"]`);
      const el = all[all.length - 1]!;
      const hnd = { el, action, phase, side };
      puppets.push(hnd);
      applyPose(el, actionPose(action, 0, phase, side));
      return hnd;
    } };
  };
  const ambientPuppets = (tm: number) => {
    for (const p of puppets) {
      if (!p.el.isConnected) continue;
      applyPose(p.el, actionPose(calm ? "idle" : p.action, calm ? 0 : tm, p.phase, p.side));
      const eyes = p.el.querySelector<SVGGElement>(".pp-eyes");
      if (eyes) eyes.style.transform = blinking(tm, p.phase) && !calm ? "scaleY(0.1)" : "";
    }
    for (const tail of root.querySelectorAll<SVGGElement>(".pp-tail")) tail.setAttribute("transform", `rotate(${(Math.sin(tm * 9) * 18).toFixed(1)} 18 -22)`);
  };
  disposers.push(clock.add(ambientPuppets));

  // ---------- stage: table + book cover ----------
  const stage = h("section", { class: "rk-stage", "aria-label": t("youreInvited") });
  col.append(stage);
  stage.append(h("div", { class: "rk-cloth", html: clothSvg() }));
  const book = h("div", { class: "rk-book" });
  const pages = h("div", { class: "rk-pages" });
  const cover = h("div", { class: "rk-cover" });
  const front = h("div", { class: "rk-cover-front" });
  const coverBack = h("div", { class: "rk-cover-back" });
  const shade = h("div", { class: "rk-cover-shade" });
  front.insertAdjacentHTML("beforeend", coverBorderSvg());
  const titleKi = ctx.locale === "en" ? "" : t("shaadi");
  const coverTitle = h("div", { class: "rk-title" },
    ctx.locale === "en" ? h("span", { class: "rk-ki", text: t("shaadi") }) : null,
    h("div", { class: "rk-truck", text: `${n1} & ${n2}`, "data-text": `${n1} & ${n2}` }),
    titleKi ? h("span", { class: "rk-ki", text: titleKi }) : null);
  const coverArt = h("div", { class: "rk-cover-art" });
  const ca1 = puppetG(brideLook, "custom", 125, 175, 1.05, "idle");
  const ca2 = puppetG(groomLook, "custom", 195, 175, 1.05, "idle", -1);
  coverArt.innerHTML = `<svg viewBox="0 0 320 190" aria-hidden="true">${ca1.html}${ca2.html}<g transform="translate(262 176) scale(.9)">${dogSvg()}</g></svg>`;
  const plate = h("div", { class: "rk-plate", text: t("bookFor", { salutation: guest.salutation }) });
  const glint = h("div", { class: "rk-glint" });
  front.append(coverTitle, coverArt, plate, glint, shade);
  cover.append(front, coverBack);
  book.append(pages, cover);
  stage.append(book);
  ca1.register(coverArt.querySelector("svg")!);
  ca2.register(coverArt.querySelector("svg")!);
  fitTextInBox(coverTitle.querySelector(".rk-truck") as HTMLElement, { min: 20, max: 34, maxLines: 2 });
  fitTextInBox(plate, { min: 11, max: 15, maxLines: 1 });

  // ---------- spread 1 (hero) ----------
  const spread = h("div", { class: "rk-spread", "aria-label": `${n1} ${t("and")} ${n2}` });
  const scene = h("div", { class: "rk-scene" });
  const layerHtml = (inner: string) => `<svg viewBox="0 0 360 330" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${inner}</svg>`;
  const back = h("div", { class: "rk-pop", style: "position:absolute;inset:0", html: layerHtml(`<rect width="360" height="330" fill="var(--sky)"/>${skylineSvg(packId)}`) });
  const ground = h("div", { class: "rk-pop", style: "position:absolute;inset:0", html: layerHtml(`<path d="M0,300 H360 V330 H0 Z" fill="var(--ink)"/><path d="M0,302 H360" stroke="var(--turmeric)" stroke-width="3" stroke-dasharray="14 10"/>${ctx.pack.tokens.rain === "1" ? rainSvg(40) : ""}`) });
  const g1 = puppetG(groomLook, "custom", 18, -40, 0.62, "ride");
  const g2 = puppetG(brideLook, "custom", -20, -42, 0.62, "ride", -1);
  const rider = h("div", { class: "rk-pop", style: "position:absolute;inset:0", html: layerHtml(`<g class="rk-ride" transform="translate(180 300)">${g2.html}${g1.html}${scooterSvg()}<g transform="translate(62 -50) scale(.55)">${dogSvg()}</g></g>`) });
  scene.append(back, ground, rider);
  spread.append(scene);
  g1.register(rider.querySelector("svg")!); g2.register(rider.querySelector("svg")!);
  const bubbleText = t("bubble", { shortName: guest.shortName ?? guest.salutation });
  const bubble = h("div", { class: "rk-bubble", style: "left:16px;top:16px", text: bubbleText });
  scene.append(bubble);
  const heroBox = h("div", { class: "rk-hero" });
  const dm = formatDayMonth(mainEvent.startsAt, ctx.locale, { tz: mainEvent.tz, devanagariNumerals: content.devanagariNumerals });
  const namesEl = h("h1", { class: "rk-names rk-truck", text: `${n1} & ${n2}`, "data-text": `${n1} & ${n2}` });
  const dateEl = h("div", { class: "rk-date", text: `${dm.weekday}, ${dm.day} ${dm.month} ${dm.year}` });
  const kab = h("div", { class: "rk-kab" },
    h("a", { href: "#rk-fns", html: `${ICONS.calendar}<span>${t("kab")} ${formatTime(mainEvent.startsAt, ctx.locale, { tz: mainEvent.tz })}</span>` }),
    h("a", { href: "#inv-venue", html: `${ICONS.pin}<span>${t("kahan")} ${mainEvent.venueName}</span>` }));
  heroBox.append(namesEl, dateEl, kab);
  if (ctx.tone === "formal" || guest.tone === "formal") {
    const w = fillWording(wordingFor(content.ceremonyStyle, "formal", ctx.locale), { bride: (ctx.locale === "hi" && content.bride.nameHi) || content.bride.name, groom: (ctx.locale === "hi" && content.groom.nameHi) || content.groom.name });
    heroBox.append(h("p", { class: "rk-formal", text: w.body }));
  } else if (guest.note) heroBox.append(h("p", { class: "rk-note", text: `“${guest.note}”` }));
  spread.append(heroBox);
  stage.append(spread);
  fitTextInBox(namesEl, { min: 24, max: 42, maxLines: 3 });

  const dock = h("nav", { class: "rk-dock", "aria-label": t("functions") },
    h("a", { href: "#rk-fns", html: `${ICONS.list}<span>${t("functions")}</span>` }),
    h("a", { href: "#inv-venue", html: `${ICONS.pin}<span>${t("location")}</span>` }),
    h("a", { href: "#inv-rsvp", class: "rk-primary", html: `${ICONS.check}<span>${t("rsvp")}</span>` }));
  stage.append(dock);
  const gateUi = h("div", { class: "rk-gate-ui" });
  const openBtn = h("button", { class: "rk-open-btn", type: "button", text: t("openBook") });
  gateUi.append(openBtn);
  stage.append(gateUi);

  const sound = h("button", { class: "rk-sound", type: "button" });
  const paintSound = () => { const on = audio.unlocked && !audio.muted; sound.innerHTML = on ? ICONS.soundOn : ICONS.soundOff; sound.setAttribute("aria-label", on ? t("sound") : t("muted")); sound.setAttribute("aria-pressed", String(on)); };
  sound.addEventListener("click", () => { if (!audio.unlocked) { audio.unlock(); audio.setMuted(false); } else audio.setMuted(!audio.muted); paintSound(); });
  if (!scripted && !ctx.lite) { col.append(sound); paintSound(); }

  // rain + wheels + fog: pure functions of time
  const drops = Array.from(ground.querySelectorAll<SVGPathElement>(".rk-drop"));
  const dropSeed = drops.map(() => [rng.range(0, 380), rng.range(0, 300), rng.range(260, 420)] as const);
  const ride = rider.querySelector<SVGGElement>(".rk-ride")!;
  const wheels = Array.from(rider.querySelectorAll<SVGGElement>(".rk-wheel"));
  const rideState = { x: -330 };
  disposers.push(clock.add((tm) => {
    if (!calm) drops.forEach((d, i) => { const [x0, y0, sp] = dropSeed[i]!; const y = (y0 + tm * sp) % 320; d.setAttribute("transform", `translate(${(x0 - y * 0.33).toFixed(1)} ${y.toFixed(1)})`); });
    ride.setAttribute("transform", `translate(${(180 + rideState.x).toFixed(1)} ${(300 + (rideState.x < -1 ? Math.abs(Math.sin(tm * 9)) * -1.5 : 0)).toFixed(2)})`);
    const rot = (rideState.x / 12) * (180 / Math.PI);
    wheels[0]?.setAttribute("transform", `translate(-34 -12) rotate(${rot.toFixed(1)})`);
    wheels[1]?.setAttribute("transform", `translate(40 -12) rotate(${rot.toFixed(1)})`);
    if (!calm) glint.style.backgroundPosition = `${(150 - ((tm % 4) / 4) * 200).toFixed(1)}% 0`;
  }));

  // ---------- opening timeline ----------
  const open = gsap.timeline({ paused: true });
  const pops = [back, ground, rider];
  gsap.set(bubble, { scale: 0, transformOrigin: "10% 100%" });
  gsap.set([namesEl, dateEl, kab, ...heroBox.querySelectorAll(".rk-formal,.rk-note")], { opacity: 0, y: 10 });
  gsap.set(dock, { autoAlpha: 0, y: 10 });
  if (calm) {
    open.to(book, { opacity: 0, duration: 0.5 }, 0)
      .set(spread, { visibility: "visible" }, 0.3).to(spread, { opacity: 1, duration: 0.5 }, 0.3)
      .set(rideState, { x: 0 }, 0.3).set(bubble, { scale: 1 }, 0.5)
      .to([namesEl, dateEl, kab, ...heroBox.querySelectorAll(".rk-formal,.rk-note")], { opacity: 1, y: 0, duration: 0.4, stagger: 0.06 }, 0.6)
      .to(dock, { autoAlpha: 1, y: 0, duration: 0.3 }, 0.9);
  } else {
    open.to(cover, { rotateY: -178, duration: 1.1, ease: "power2.inOut" }, 0)
      .to(shade, { opacity: 1, duration: 0.55, ease: "power1.in" }, 0).to(shade, { opacity: 0, duration: 0.5 }, 0.6)
      .to(book, { scale: 1.6, opacity: 0, duration: 0.6, ease: "power2.in" }, 0.85)
      .set(spread, { visibility: "visible" }, 1.0)
      .to(spread, { opacity: 1, duration: 0.35 }, 1.0)
      .fromTo(pops, { rotateX: 85, opacity: 0 }, { rotateX: 0, opacity: 1, duration: 0.55, ease: "back.out(1.4)", stagger: 0.08 }, 1.1)
      .fromTo(rideState, { x: -330 }, { x: 0, duration: 2.4, ease: "power2.out" }, 1.5)
      .to(bubble, { scale: 1, duration: 0.35, ease: "back.out(2)" }, 3.9)
      .to([namesEl, dateEl], { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: "power2.out" }, 2.1)
      .to([kab, ...heroBox.querySelectorAll(".rk-formal,.rk-note")], { opacity: 1, y: 0, duration: 0.45, stagger: 0.1 }, 2.6)
      .to(dock, { autoAlpha: 1, y: 0, duration: 0.4 }, 3.2);
  }
  open.set({}, {}, calm ? 1.2 : 4.4);

  // ---------- story (comic panels) ----------
  const storyEl = content.story.length ? buildStory() : null;
  function buildStory(): HTMLElement {
    const sec = h("section", { class: "rk-page", id: "rk-story" }, h("h2", { text: t("ourStory") }));
    const grid = h("div", { class: "rk-panels" });
    const motifs = [
      `<path d="M10,80 H110 M20,80 V40 h30 v40 M60,80 V30 h40 v50" stroke="var(--ink)" stroke-width="3" fill="none"/><rect class="rk-fill" x="20" y="40" width="30" height="40" fill="var(--turmeric)"/><rect class="rk-fill" x="60" y="30" width="40" height="50" fill="var(--rani)"/>`,
      `<path d="M30,80 q-6,-30 10,-34 h24 q16,4 10,34 Z M70,52 q14,0 14,12 q0,12 -14,12" stroke="var(--ink)" stroke-width="3" fill="none"/><path class="rk-fill" d="M30,80 q-6,-30 10,-34 h24 q16,4 10,34 Z" fill="var(--paper)"/><path d="M42,36 q-4,-8 0,-14 M54,36 q-4,-8 0,-14" stroke="var(--ink)" stroke-width="2" fill="none"/>`,
      `<circle class="rk-fill" cx="60" cy="58" r="26" fill="var(--turmeric)"/><path d="M10,90 Q60,40 110,90" stroke="var(--ink)" stroke-width="3" fill="none"/><path d="M48,58 l8,8 l16,-18" stroke="var(--ink)" stroke-width="3" fill="none"/>`,
      `<path class="rk-fill" d="M60,84 C20,60 30,30 50,34 C56,36 60,42 60,46 C60,42 64,36 70,34 C90,30 100,60 60,84 Z" fill="var(--rani)"/><path d="M60,84 C20,60 30,30 50,34 C56,36 60,42 60,46 C60,42 64,36 70,34 C90,30 100,60 60,84 Z" stroke="var(--ink)" stroke-width="3" fill="none"/>`,
    ];
    content.story.forEach((b, i) => {
      const fig = h("figure", { class: "rk-panel", style: "margin:0" });
      fig.innerHTML = b.photoUrl ? `<img src="${b.photoUrl}" alt="" style="flex:1;min-height:0;object-fit:cover;width:100%">` : `<svg viewBox="0 0 120 100" aria-hidden="true">${motifs[i % motifs.length]}</svg>`;
      fig.append(h("figcaption", { text: b.caption }));
      grid.append(fig);
    });
    sec.append(grid);
    return sec;
  }

  // ---------- function spreads ----------
  const fnsEl = h("div", { id: "rk-fns" });
  const chapters: (Chapter & { visible: boolean })[] = [];
  const buildFn = (e: WeddingEvent, i: number) => {
    const [c1, c2] = PAIRS[e.kind] ?? PAIRS.custom!;
    const sec = h("section", { class: "rk-fn", id: `rk-fn-${e.id}`, style: `--c1:${c1};--c2:${c2}`, "aria-label": eventTitle(ctx, e).main });
    const title = eventTitle(ctx, e);
    sec.append(h("div", { class: "rk-fn-title" }, h("div", { class: "rk-truck", text: title.main, "data-text": title.main })));
    const sc = h("div", { class: "rk-scene" });
    const { backHtml, midHtml, action, brideAction, extra } = fnScene(e);
    const bp = puppetG(brideLook, e.kind, 145, 300, 0.95, brideAction ?? action, 1);
    const gp = puppetG(groomLook, e.kind, 222, 300, 0.95, action, -1);
    const backL = h("div", { class: "rk-pop", style: "position:absolute;inset:0", html: layerHtml(backHtml) });
    const midL = h("div", { class: "rk-pop", style: "position:absolute;inset:0", html: layerHtml(midHtml) });
    const frontL = h("div", { class: "rk-pop", style: "position:absolute;inset:0", html: layerHtml(`${bp.html}${gp.html}<g class="rk-fx"></g>`) });
    sc.append(backL, midL, frontL);
    sec.append(sc);
    const svgFront = frontL.querySelector("svg")!;
    const bh = bp.register(svgFront); gp.register(svgFront);
    const dmE = formatDayMonth(e.startsAt, ctx.locale, { tz: e.tz, devanagariNumerals: content.devanagariNumerals });
    const ticket = h("div", { class: "rk-ticket" },
      h("h3", {}, title.main, title.alt ? h("span", { class: "rk-alt", text: title.alt }) : null),
      h("p", { class: "rk-when", text: `${dmE.weekday}, ${dmE.day} ${dmE.month}, ${formatTime(e.startsAt, ctx.locale, { tz: e.tz, devanagariNumerals: content.devanagariNumerals })}` }),
      h("p", {}, h("b", { text: e.venueName }), e.venueArea ? `, ${e.venueArea}` : ""));
    if (e.dressCode.length) {
      const chips = h("div", { class: "rk-chips", "aria-label": t("dressCode") });
      for (const d of e.dressCode) chips.append(h("span", { class: "rk-chip" }, h("i", { style: `background:${d.hex}` }), d.name));
      ticket.append(chips);
    }
    ticket.append(h("hr"));
    const actions = eventActions(ctx, e, "", "rk-primary", true);
    actions.className = "rk-actions";
    ticket.append(actions);
    sec.append(ticket);
    const tl = gsap.timeline({ paused: true });
    tl.fromTo([backL, midL, frontL], { rotateX: 80, opacity: 0 }, { rotateX: 0, opacity: 1, duration: 0.32, stagger: 0.06, ease: "back.out(1.3)" }, 0);
    extra?.(sec, tl, svgFront, bh);
    tl.set({}, {}, 1);
    void i;
    return { sec, tl };
  };

  function fnScene(e: WeddingEvent): { backHtml: string; midHtml: string; action: Action; brideAction?: Action; extra?: (sec: HTMLElement, tl: gsap.core.Timeline, svg: SVGSVGElement, bride: PuppetHandle) => void } {
    const sky = `<rect width="360" height="330" fill="var(--c1)"/>`;
    const groundBand = `<path d="M0,300 H360 V330 H0 Z" fill="var(--ink)" opacity=".85"/>`;
    switch (e.kind) {
      case "haldi":
        return {
          backHtml: `${sky}<circle cx="180" cy="120" r="80" fill="#FFF6C9" opacity=".5"/>${Array.from({ length: 14 }, (_, i) => `<g transform="translate(${20 + i * 25} ${40 + Math.sin(i) * 8})">${PROPS.marigold(6)}</g>`).join("")}${groundBand}`,
          midHtml: `<g transform="translate(70 292)"><ellipse rx="26" ry="8" fill="#B8860B"/><ellipse cy="-3" rx="22" ry="6" fill="var(--turmeric)"/></g><g transform="translate(300 292)"><ellipse rx="26" ry="8" fill="#B8860B"/><ellipse cy="-3" rx="22" ry="6" fill="var(--turmeric)"/></g>`,
          action: "laugh",
          extra: (_s, tl, svg) => {
            const fx = svg.querySelector(".rk-fx")!;
            fx.innerHTML = Array.from({ length: 9 }, (_, i) => `<circle class="rk-splat" cx="${150 + (i % 3) * 30 + (i * 7) % 11}" cy="${170 + Math.floor(i / 3) * 24}" r="${8 + (i % 4) * 4}" fill="#F4C430" opacity="0"/>`).join("");
            tl.fromTo(fx.querySelectorAll(".rk-splat"), { scale: 0, opacity: 0, transformOrigin: "50% 50%" }, { scale: 1, opacity: 0.85, duration: 0.12, stagger: 0.02, ease: "back.out(3)" }, 0.45)
              .to(fx.querySelectorAll(".rk-splat"), { opacity: 0, duration: 0.2 }, 0.85);
          },
        };
      case "mehendi":
        return {
          backHtml: `${sky}${Array.from({ length: 18 }, (_, i) => `<path d="M${(i % 6) * 64 + 10},${Math.floor(i / 6) * 90 + 30} c10,-14 26,-6 20,8 c-6,12 -24,12 -24,2 c0,-4 2,-8 4,-10 Z" fill="var(--c2)" opacity=".35"/>`).join("")}${groundBand}`,
          midHtml: `<g transform="translate(60 300)"><path d="M-14,0 l4,-30 h20 l4,30 Z" fill="#C8693C"/><path d="M0,-30 c-20,-20 -10,-40 0,-50 c10,10 20,30 0,50" fill="var(--bottle)"/></g>`,
          action: "idle", brideAction: "showHands",
          extra: (sec, _tl, svg, bride) => {
            if (scripted) return;
            const hit = h("button", { class: "rk-hand-hit", type: "button", "aria-label": t("hiddenInitial"), title: t("tapHand") });
            sec.append(hit);
            const place = () => {
              const hand = bride.el.querySelector(".pp-foreL .pp-hand") as SVGGraphicsElement | null;
              if (!hand) return;
              const r = hand.getBoundingClientRect(), sr = sec.getBoundingClientRect();
              hit.style.left = `${r.left - sr.left + r.width / 2 - 28}px`; hit.style.top = `${r.top - sr.top + r.height / 2 - 28}px`;
            };
            requestAnimationFrame(place);
            disposers.push(clock.add(() => { if (sec.getBoundingClientRect().top < innerHeight) place(); }));
            hit.addEventListener("click", () => {
              const ini = Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(p2.name))[0]?.segment ?? "";
              const ov = h("div", { class: "rk-palm", role: "dialog", "aria-label": t("hiddenInitial") });
              ov.innerHTML = `<svg viewBox="0 0 200 240"><path d="M60,230 V120 q-30,-30 -20,-60 q6,-14 18,-2 l14,40 V30 q0,-14 12,-14 t12,14 V100 V20 q0,-14 12,-14 t12,14 v84 V34 q0,-12 12,-12 t12,12 v100 q0,50 -40,96 Z" fill="#E9B48A" stroke="#fff" stroke-width="3"/>
<g fill="none" stroke="#8E3B12" stroke-width="2.2"><circle cx="100" cy="160" r="26"/><circle cx="100" cy="160" r="34" stroke-dasharray="3 5"/>${Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return `<path d="M${(100 + Math.cos(a) * 36).toFixed(1)},${(160 + Math.sin(a) * 36).toFixed(1)} q${(Math.cos(a) * 10).toFixed(1)},${(Math.sin(a) * 10).toFixed(1)} ${(Math.cos(a + 0.3) * 4).toFixed(1)},${(Math.sin(a + 0.3) * 14).toFixed(1)}"/>`; }).join("")}<path d="M84,40 v50 M120,30 v60 M144,44 v50" stroke-dasharray="2 4"/></g>
<text x="100" y="170" text-anchor="middle" font-family="Yatra One" font-size="28" fill="#8E3B12">${ini}</text></svg>`;
              ov.addEventListener("click", () => ov.remove());
              sec.append(ov);
              audio.sting("pop"); haptic(10);
            });
          },
        };
      case "sangeet":
        return {
          backHtml: `${sky}${Array.from({ length: 24 }, (_, i) => `<circle class="rk-bulb" data-i="${i}" cx="${8 + i * 15}" cy="${30 + Math.sin(i * 0.5) * 14}" r="3.4" fill="${i % 2 ? "var(--c2)" : "var(--turmeric)"}"/>`).join("")}<circle cx="180" cy="110" r="70" fill="var(--c2)" opacity=".18"/>${groundBand}`,
          midHtml: `<g transform="translate(70 270)">${PROPS.dhol}</g><g transform="translate(300 270) scale(-1 1)">${PROPS.dhol}</g>`,
          action: "dance",
          extra: (sec) => {
            if (scripted) return;
            const box = h("div", { class: "rk-extra" });
            const counts = { ladkewale: ctx.services?.publicCounts?.teamLadkewale ?? 0, ladkiwale: ctx.services?.publicCounts?.teamLadkiwale ?? 0 };
            const bG = h("button", { class: "rk-team", type: "button", "aria-pressed": "false" });
            const bB = h("button", { class: "rk-team", type: "button", "aria-pressed": "false" });
            const paint = () => { bG.textContent = `${t("teamGroom")} ${counts.ladkewale}`; bB.textContent = `${t("teamBride")} ${counts.ladkiwale}`; };
            paint();
            const vote = async (team: "ladkewale" | "ladkiwale", btn: HTMLButtonElement) => {
              if (btn.getAttribute("aria-pressed") === "true") return;
              [bG, bB].forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
              counts[team] += 1; paint(); audio.sting("dhol"); haptic(10);
              const r = await ctx.services?.vote?.(team);
              if (r?.counts) { Object.assign(counts, r.counts); paint(); }
            };
            bG.addEventListener("click", () => vote("ladkewale", bG));
            bB.addEventListener("click", () => vote("ladkiwale", bB));
            box.append(bG, bB);
            sec.insertBefore(box, sec.querySelector(".rk-ticket"));
          },
        };
      case "wedding": {
        const style = content.ceremonyStyle;
        const variant = style === "nikah" || style === "walima"
          ? `<path d="M290,40 a24,24 0 1,0 16,40 a18,18 0 1,1 -16,-40 Z" fill="#FFF3D6"/>${[60, 120, 240].map((x, i) => `<g transform="translate(${x} ${50 + i * 14})"><line y1="-50" y2="0" stroke="var(--ink)"/><path d="M-9,0 h18 l-3,24 h-12 Z" fill="var(--turmeric)" stroke="var(--ink)"/></g>`).join("")}<path d="M110,300 V200 Q180,120 250,200 V300" fill="none" stroke="var(--paper)" stroke-width="8"/>`
          : style === "anand-karaj"
            ? `<g transform="translate(180 300)"><path d="M-50,0 V-60 M50,0 V-60" stroke="var(--turmeric)" stroke-width="5"/><path d="M-64,-60 Q0,-110 64,-60 Z" fill="var(--paper)" stroke="var(--ink)" stroke-width="2"/><rect x="-30" y="-26" width="60" height="22" fill="var(--indigo)"/></g>`
            : style === "church"
              ? `<path d="M100,300 V170 Q180,80 260,170 V300" fill="#C9D8E6" opacity=".55"/><path d="M180,110 V230 M140,160 H220" stroke="var(--paper)" stroke-width="4" opacity=".6"/>`
              : `<g transform="translate(180 300)">${PROPS.mandap}</g>`;
        return {
          backHtml: `${sky}${variant}${groundBand}`,
          midHtml: `<g class="rk-petals">${Array.from({ length: 26 }, (_, i) => `<circle class="rk-petal" data-i="${i}" r="3.2" fill="${i % 3 ? "var(--turmeric)" : "#fff"}"/>`).join("")}</g>`,
          action: "varmala",
          extra: (_s, tl, svg) => {
            const fx = svg.querySelector(".rk-fx")!;
            fx.innerHTML = `<g class="rk-mala-a"><ellipse cx="0" cy="0" rx="13" ry="18" fill="none" stroke="var(--turmeric)" stroke-width="5" stroke-dasharray="4 2"/></g><g class="rk-mala-b"><ellipse cx="0" cy="0" rx="13" ry="18" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="4 2"/></g>`;
            const a = fx.querySelector(".rk-mala-a")!, b = fx.querySelector(".rk-mala-b")!;
            tl.fromTo(a, { attr: { transform: "translate(160 175)" } }, { attr: { transform: "translate(222 196)" }, duration: 0.3, ease: "power2.inOut" }, 0.35)
              .fromTo(b, { attr: { transform: "translate(206 175)" } }, { attr: { transform: "translate(145 196)" }, duration: 0.3, ease: "power2.inOut" }, 0.5);
          },
        };
      }
      case "reception":
        return {
          backHtml: `${sky}${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 37) % 360}" cy="${(i * 53) % 200}" r="1.2" fill="#fff" opacity=".7"/>`).join("")}${Array.from({ length: 20 }, (_, i) => `<circle cx="${10 + i * 18}" cy="${40 + Math.sin((i / 19) * Math.PI) * 30}" r="2.6" fill="#FFF1C2"/>`).join("")}${groundBand}`,
          midHtml: `<g transform="translate(300 292)">${PROPS.cake}</g>`,
          action: "sway",
        };
      default:
        return { backHtml: `${sky}<g transform="translate(180 300)">${PROPS.rangoli}</g>${groundBand}`, midHtml: `<g transform="translate(60 270)">${PROPS.chai}</g>`, action: "wave" };
    }
  }

  events.forEach((e, i) => {
    const { sec, tl } = buildFn(e, i);
    fnsEl.append(sec);
    chapters.push({ id: e.id, el: sec, tl, pinVh: 110, visible: false });
  });

  // petals / bulbs ambient for wedding & sangeet
  disposers.push(clock.add((tm) => {
    if (calm) return;
    for (const p of root.querySelectorAll<SVGCircleElement>(".rk-petal")) { const i = Number(p.dataset.i); const y = ((i * 41 + tm * (40 + (i % 5) * 9)) % 320) - 10; p.setAttribute("cx", ((i * 53) % 360 + Math.sin(tm * 2 + i) * 8).toFixed(1)); p.setAttribute("cy", y.toFixed(1)); }
    for (const b of root.querySelectorAll<SVGCircleElement>(".rk-bulb")) { const i = Number(b.dataset.i); b.setAttribute("opacity", (0.4 + 0.6 * ((Math.floor(tm * 4) + i) % 3 === 0 ? 1 : 0.3)).toFixed(2)); }
  }));

  // ---------- RSVP stage, gullak, back cover ----------
  const rsvpStage = (host: HTMLElement) => {
    host.querySelector("h2")?.after(h("p", { style: "margin:-6px 0 12px", text: "" }));
    const st = h("div", { class: "rk-rsvp-stage" });
    const a = puppetG(brideLook, "custom", 140, 230, 0.95, "idle");
    const b = puppetG(groomLook, "custom", 220, 230, 0.95, "idle", -1);
    st.innerHTML = `<svg viewBox="0 0 360 250" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><rect width="360" height="250" fill="var(--sky)"/>${skylineSvg(packId).replace(/translate\(206 280\)/, "translate(206 220)")}<path d="M0,232 H360 V250 H0 Z" fill="var(--ink)"/>${a.html}${b.html}<g class="rk-conf"></g></svg>`;
    const svg = st.querySelector("svg")!;
    const ha = a.register(svg), hb = b.register(svg);
    const say = h("div", { class: "rk-bubble", style: "left:14px;top:12px;transform:scale(0)" });
    st.append(say);
    host.insertBefore(st, host.children[1] ?? null);
    return {
      react: (status: "yes" | "maybe" | "no") => {
        if (status === "yes") {
          ha.action = "jump"; hb.action = "jump"; audio.sting("tumbi"); haptic(12);
          const conf = svg.querySelector(".rk-conf")!;
          conf.innerHTML = Array.from({ length: 30 }, (_, i) => `<circle cx="${180 + ((i * 37) % 160) - 80}" cy="120" r="${3 + (i % 3)}" fill="${i % 2 ? "var(--turmeric)" : "#E07A12"}"/>`).join("");
          gsap.fromTo(conf.children, { y: 0, opacity: 1 }, { y: () => 60 + Math.floor((Number(String(Math.sin(conf.children.length)).slice(-2)) || 40)), x: (i: number) => ((i * 23) % 60) - 30, opacity: 0, duration: 1.6, ease: "power1.in", stagger: 0.01 });
          say.textContent = t("thanks"); gsap.to(say, { scale: 1, duration: 0.3, ease: "back.out(2)" });
          setTimeout(() => { ha.action = "dance"; hb.action = "dance"; }, 2200);
        } else if (status === "maybe") {
          ha.action = "shrug"; hb.action = "shrug";
          say.textContent = t("maybe"); gsap.to(say, { scale: 1, duration: 0.3 });
        } else {
          ha.action = "sad"; hb.action = "sad";
          setTimeout(() => { ha.action = "wave"; hb.action = "wave"; say.textContent = t("chaiPe"); gsap.to(say, { scale: 1, duration: 0.3 }); }, 1400);
        }
      },
    };
  };

  const backCover = (host: HTMLElement) => {
    const share = h("button", { type: "button", text: t("shareStatus") });
    share.addEventListener("click", async () => {
      const url = ctx.services?.shareUrl ?? location.href;
      try { if (navigator.share) await navigator.share({ title: `${n1} & ${n2}`, text: t("youreInvited"), url }); else await navigator.clipboard.writeText(url); } catch { /* cancelled */ }
    });
    host.append(h("div", { class: "rk-back" },
      h("div", { class: "rk-truck", text: t("storyEnd"), "data-text": t("storyEnd") }),
      h("div", { style: "font-weight:700;font-size:18px", text: formatDate(mainEvent.startsAt, ctx.locale, { tz: mainEvent.tz }) }),
      share));
  };

  let sectionsApi: { destroy(): void } | null = null;
  if (!scripted) {
    if (storyEl) col.append(storyEl);
    col.append(fnsEl);
    const sh = h("div");
    col.append(sh);
    sectionsApi = renderSections(ctx, sh, {
      rsvpStage,
      shagunStage: (host) => host.insertBefore(h("div", { class: "rk-gullak", html: gullakSvg() }), host.children[1] ?? null),
      onShagunBlock: async () => {
        const coin = root.querySelector(".rk-gullak .rk-coin");
        audio.sting("coin"); haptic(10);
        if (coin && !calm) await gsap.fromTo(coin, { opacity: 1, y: -30 }, { y: 32, duration: 0.45, ease: "power2.in", onComplete: () => { gsap.set(coin, { opacity: 0 }); } });
      },
      beforeFooter: backCover,
    });
    setSectionTokens(root);
  }

  // ---------- scripted storyboard ----------
  const master = gsap.timeline({ paused: true });
  let duration = 40;
  if (scripted) {
    gateUi.remove();
    // 0–2 cover; 2–6.4 open + ride; hold names + date to ~14
    master.add(open.paused(false), 2);
    let at = 14;
    const montage = h("div", { class: "rk-montage" });
    stage.append(montage);
    if (storyEl) {
      const s = buildStory();
      s.style.cssText = "position:absolute;inset:0;opacity:0;display:flex;flex-direction:column;justify-content:center";
      montage.append(s);
      const n = content.story.length;
      master.to(s, { opacity: 1, duration: 0.3 }, at).fromTo(s.querySelectorAll(".rk-panel"), { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, stagger: 2 * 0.8 }, at + 0.2).to(s, { opacity: 0, duration: 0.3 }, at + n * 2 - 0.2);
      at += n * 2;
    }
    const slot = Math.max(2.5, Math.min(3, 16 / Math.max(1, events.length)));
    events.forEach((e, i) => {
      const { sec, tl } = buildFn(e, i);
      montage.append(sec);
      master.to(sec, { opacity: 1, duration: 0.3 }, at).add(tl.tweenFromTo(0, 1, { duration: slot - 0.4, ease: "none" }), at + 0.1).to(sec, { opacity: 0, duration: 0.25 }, at + slot - 0.05);
      at += slot;
    });
    const end = h("div", { class: "rk-endcard" });
    const url = ctx.services?.shareUrl ?? "";
    end.innerHTML = `<div class="rk-truck" style="font-size:30px" data-text="${esc(t("storyEnd"))}">${esc(t("storyEnd"))}</div><div style="font-size:18px;font-weight:700">${esc(n1)} &amp; ${esc(n2)}</div><div>${esc(formatDate(mainEvent.startsAt, ctx.locale, { tz: mainEvent.tz }))}</div>${url ? `<div style="width:150px;height:150px;background:#fff;padding:6px;border-radius:6px">${qrSvg(url)}</div><div style="font-size:14px;word-break:break-all">${esc(url.replace(/^https?:\/\//, ""))}</div>` : ""}`;
    stage.append(end);
    master.to(end, { opacity: 1, duration: 0.5 }, at);
    at += 3.5;
    duration = at;
    master.set({}, {}, duration);
  }

  // ---------- interactive wiring ----------
  let opened = false;
  const doOpen = (instant = false) => {
    if (opened) return;
    opened = true;
    audio.unlock();
    if (!instant) { audio.sting("page"); setTimeout(() => audio.sting("flute"), 900); haptic(12); }
    paintSound();
    gsap.to(gateUi, { autoAlpha: 0, duration: 0.25 });
    ctx.emit("opened");
    const done = () => {
      document.documentElement.style.overflow = ""; document.body.style.overflow = "";
      ctx.emit("sceneView", "hero");
      ScrollTrigger.refresh();
      const banner = topBanner(ctx);
      if (banner) col.append(banner);
    };
    if (instant) { open.progress(1); done(); } else open.eventCallback("onComplete", done).play(0);
  };
  let px = 0, py = 0, down = false;
  const onDown = (e: PointerEvent) => { down = true; px = e.clientX; py = e.clientY; };
  const onUp = (e: PointerEvent) => { if (!down || opened) return; down = false; const dx = e.clientX - px, dy = e.clientY - py; if (Math.abs(dx) > 40 || (Math.abs(dx) < 10 && Math.abs(dy) < 10)) doOpen(); };
  const onKey = (e: KeyboardEvent) => { if (!opened && (e.key === "Enter" || e.key === " ") && document.activeElement === document.body) { e.preventDefault(); doOpen(); } };

  let currentBed = "";
  const updateBed = () => {
    if (!audio.unlocked || audio.muted) return;
    const want = chapters.some((c) => c.visible && c.id && events.find((e) => e.id === c.id)?.kind === "sangeet") ? "dhol" : "none";
    if (want === currentBed) return;
    currentBed = want;
    if (want === "dhol") audio.bed(rhythmBed([1, 0, 2, 0, 1, 2, 2, 0], 110)); else audio.bed(() => () => {});
  };

  return {
    storyboard: {
      duration: scripted ? duration : open.duration(),
      keyframes: scripted
        ? [{ t: 1, label: "cover" }, { t: 2.6, label: "open" }, { t: 5, label: "ride" }, { t: 11, label: "names" }, { t: 15.5, label: "spread" }, { t: duration - 1, label: "back" }]
        : manifest.keyframes.map((k) => ({ t: k, label: `t${k}` })),
      staticAt: 11,
    },
    start() {
      if (scripted) return;
      document.documentElement.style.overflow = "hidden"; document.body.style.overflow = "hidden";
      clock.startRealtime();
      stage.addEventListener("pointerdown", onDown); stage.addEventListener("pointerup", onUp);
      openBtn.addEventListener("click", (e) => { e.stopPropagation(); doOpen(); });
      openBtn.addEventListener("pointerup", (e) => e.stopPropagation());
      window.addEventListener("keydown", onKey);
      const io = new IntersectionObserver((es) => { for (const e of es) { const ch = chapters.find((c) => c.el === e.target); if (ch) ch.visible = e.isIntersecting; } updateBed(); });
      chapters.forEach((c) => io.observe(c.el));
      disposers.push(() => io.disconnect());
      triggers.push(...pinChapters(ctx, chapters));
      ctx.services?.track({ scene: "loader", tier: ctx.tier });
    },
    seek(time) { master.seek(time, false); clock.renderAt(time); },
    play() { if (scripted) { clock.startRealtime(); master.play(); } else doOpen(); },
    goTo(sceneId: SceneId) {
      if (!opened) doOpen(true);
      const id = sceneId === "rsvp" ? "inv-rsvp" : sceneId === "shagun" ? "inv-shagun" : sceneId.startsWith("chapter:") ? `rk-fn-${sceneId.slice(8)}` : sceneId === "story" ? "rk-story" : null;
      (id ? document.getElementById(id) : stage)?.scrollIntoView({ behavior: calm ? "auto" : "smooth" });
    },
    open: (instant?: boolean) => doOpen(instant),
    destroy() {
      disposers.forEach((d) => d()); triggers.forEach((x) => x.kill()); sectionsApi?.destroy();
      open.kill(); master.kill(); chapters.forEach((c) => c.tl.kill());
      stage.removeEventListener("pointerdown", onDown); stage.removeEventListener("pointerup", onUp); window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = ""; document.body.style.overflow = "";
      col.remove();
    },
  };
}

function esc(s: string) { return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!); }

function setSectionTokens(root: HTMLElement) {
  const v: Record<string, string> = {
    "--sec-bg": "var(--paper)", "--sec-ink": "var(--ink)", "--sec-heading": "var(--rani)", "--sec-card": "#fff", "--sec-card-ink": "var(--ink)",
    "--sec-accent": "var(--rani)", "--sec-line": "var(--ink)", "--sec-font-display": '"Yatra One",serif', "--sec-font-text": '"Baloo 2","Noto Sans Devanagari",system-ui,sans-serif',
    "--sec-radius": "8px", "--sec-card-shadow": "0 0 0 2px var(--ink),4px 5px 0 2px var(--ink)", "--sec-note-bg": "rgba(244,180,0,.18)", "--sec-btn-radius": "12px",
  };
  for (const [k, val] of Object.entries(v)) root.style.setProperty(k, val);
}

const template: TemplateModule = { manifest, packs, loader, create };
export default template;
export { manifest, packs };
export { RIG, applyPose, actionPose, puppetSvg, DEFAULT_LOOKS } from "./puppets";

import { coupleOrder, invitedEvents, type WeddingEvent } from "@invites/content-schema";
import { fillWording, formatDate, formatDayMonth, formatTime, wordingFor } from "@invites/i18n";
import {
  arpeggio, clink, droneBed, ensureStyles, fitTextInBox, gsap, h, haptic, ICONS, makeBurst, makeCanvas, motifSvg, noiseBurst, particleAt,
  pinChapters, pluck, qrSvg, reedPhrase, registerGsap, requestTilt, rhythmBed, ScrollTrigger, smooth, spriteCanvas, SWARAS,
  type Chapter, type RenderContext, type SceneId, type TemplateInstance, type TemplateModule,
} from "@invites/renderer";
import { eventActions, eventTitle, renderSections, topBanner } from "@invites/renderer/sections";
import { chamberArt, chamberFrameSvg } from "./art/chambers";
import { diyaSvg, doorSvg, gatewaySvg, palaceSvg, rangoliSvg, skySvg, toranSvg } from "./art/gate";
import { lanternField, LANTERN_CSS } from "./lanterns";
import { manifest } from "./manifest";
import { packs } from "./packs";
import { Mosaic, type MosaicState } from "./scenes/mosaic";
import { CSS } from "./styles";

const LOADER_CSS = `
.sm-loader{position:fixed;inset:0;z-index:100;background:#141A45;background:var(--sky,#141A45);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:#FBF5EA;font-family:Martel,Georgia,serif;transition:opacity .45s ease}
.sm-loader .d{width:64px;height:74px}
.sm-loader .sm-flame{animation:sm-sway 1.6s ease-in-out infinite alternate;transform-origin:30px 46px}
.sm-loader p{margin:0;font-size:18px;font-weight:600;letter-spacing:.01em;text-align:center;padding:0 24px}
@keyframes sm-sway{0%{transform:rotate(-4deg) scaleY(.96)}100%{transform:rotate(4deg) scaleY(1.04)}}
@media (prefers-reduced-motion: reduce){.sm-loader .sm-flame{animation:none}}
`;

function loader(ctx: RenderContext): () => void {
  ensureStyles("sm-loader", LOADER_CSS);
  const el = h("div", { class: "sm-loader", role: "status" },
    h("div", { class: "d", html: diyaSvg("ld") }),
    h("p", { text: ctx.t("loaderFor", { salutation: ctx.guest.salutation }) }));
  ctx.root.append(el);
  return () => { el.style.opacity = "0"; setTimeout(() => el.remove(), 450); };
}

const flick = (t: number, s: number) => 0.84 + 0.09 * Math.sin(t * 8.7 + s) + 0.05 * Math.sin(t * 21.3 + s * 1.9) + 0.03 * Math.sin(t * 3.1 + s * 0.4);

function create(ctx: RenderContext): TemplateInstance {
  registerGsap();
  ensureStyles("sm", CSS);
  ensureStyles("sm-lanterns", LANTERN_CSS);
  const { root, content, guest, t, rng, clock, audio, scripted } = ctx;
  const calm = ctx.reduced || ctx.lite;
  const events = invitedEvents(content, guest);
  const [p1, p2] = coupleOrder(content);
  const hiNames = ctx.locale === "hi";
  const n1 = hiNames && p1.nameHi ? p1.nameHi : p1.name;
  const n2 = hiNames && p2.nameHi ? p2.nameHi : p2.name;
  const mainEvent: WeddingEvent = events.find((e) => e.kind === "wedding") ?? events[0] ?? content.events[0]!;
  const disposers: (() => void)[] = [];
  const triggers: ScrollTrigger[] = [];

  // ---------- audio (synthesised; see DECISIONS) ----------
  audio.register("shehnai", reedPhrase([[SWARAS.Sa2, 0.35], [SWARAS.Re2, 0.25], [SWARAS.Ga2, 0.5], [SWARAS.Re2, 0.3], [SWARAS.Sa2, 0.9]], 0.16));
  audio.register("santoor", arpeggio([SWARAS.Sa, SWARAS.Ga, SWARAS.Pa, SWARAS.Sa2, SWARAS.Pa, SWARAS.Ga2], 0.12, 0.08));
  audio.register("chime", pluck(SWARAS.Pa * 2, 0.08));
  audio.register("lantern", arpeggio([SWARAS.Pa, SWARAS.Sa2, SWARAS.Ga2], 0.18, 0.07));
  audio.register("whoosh", noiseBurst(0.6, 0.05, 900, "bandpass"));
  audio.register("coin", clink());

  // ---------- DOM ----------
  const col = h("div", { class: "inv-column sm-col" });
  root.append(col);
  const stage = h("section", { class: "sm-stage", "aria-label": t("youreInvited") });
  col.append(stage);
  const scene = h("div", { class: "sm-scene" });
  const cam = h("div", { class: "sm-layer sm-cam" });
  scene.append(cam);
  const L = (name: string, html = "") => { const el = h("div", { class: `sm-layer sm-${name}`, html }); cam.append(el); return el; };
  const starCount = ctx.tier === "C" ? 30 : 70;
  const bg = L("bg", skySvg(rng.fork("sky"), starCount));
  const back = L("back", palaceSvg(rng.fork("palace"), content && ctx.pack.tokens.bulbs === "1"));
  const bloom = L("bloom", `<svg viewBox="0 0 360 740" preserveAspectRatio="none" aria-hidden="true"><defs><radialGradient id="sm-bloom-g" cx="180" cy="470" r="260" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFFBEA"/><stop offset=".3" stop-color="#FFE2A0"/><stop offset=".7" stop-color="#F7B24E"/><stop offset="1" stop-color="#C8641E"/></radialGradient></defs><path d="M80,706 V312 L180,248 L280,312 V706 Z" fill="url(#sm-bloom-g)"/></svg>`);
  bloom.style.opacity = "0";
  const doors = L("doors");
  doors.classList.add("sm-doors");
  const doorL = h("div", { class: "sm-door sm-door-l", html: doorSvg("left") });
  const doorR = h("div", { class: "sm-door sm-door-r", html: doorSvg("right") });
  doors.append(doorL, doorR);
  const mid = L("mid", gatewaySvg());
  const plate = h("div", { class: "sm-plate" }, h("div", { class: "sm-plate-text", text: guest.salutation }));
  mid.append(plate);
  const front = L("front", rangoliSvg() + toranSvg());
  const diyaL = h("div", { class: "sm-diya sm-diya-l", html: diyaSvg("l") });
  const diyaR = h("div", { class: "sm-diya sm-diya-r", html: diyaSvg("r") });
  front.append(diyaL, diyaR);
  stage.append(scene);
  void bg;

  const flash = h("div", { class: "sm-flash" });
  stage.append(flash);

  // Hall (mirror mosaic + hero)
  const hall = h("div", { class: "sm-hall" });
  stage.append(hall);
  const vignette = h("div", { class: "sm-hall-vignette" });
  const hero = h("div", { class: "sm-hero" });
  const motifs = content.motifs.filter((m) => m !== "none");
  const motifBox = h("div", { class: "sm-motifs", html: motifs.map((m) => `<div class="sm-motif">${motifSvg(m, { strokeWidth: m === "ganesh" ? 2.6 : 1.4 })}</div>`).join("") });
  const wording = fillWording(wordingFor(content.ceremonyStyle, ctx.tone === "playful" && guest.tone !== "playful" ? "warm" : ctx.tone, ctx.locale), { bride: (ctx.locale === "hi" && content.bride.nameHi) || content.bride.name, groom: (ctx.locale === "hi" && content.groom.nameHi) || content.groom.name });
  const invocation = h("p", { class: "sm-invocation", text: wording.invocation ?? (content.motifs[0] === "ganesh" ? t("invocationGanesh") : "") });
  const blessing = h("p", { class: "sm-blessing", text: t("blessing") });
  if (content.families.blessingLine && ctx.locale !== "hi" && ctx.tone !== "playful") blessing.prepend(h("span", { class: "sm-family-line", text: content.families.blessingLine }), h("br"));
  const name1El = h("div", { class: "sm-name", text: n1, "data-fit": "1" });
  const amp = h("div", { class: "sm-amp", text: t("and"), "aria-hidden": "true" });
  const name2El = h("div", { class: "sm-name", text: n2, "data-fit": "1" });
  const names = h("h1", { class: "sm-names", "aria-label": `${n1} ${t("and")} ${n2}` }, name1El, amp, name2El);
  const dm = formatDayMonth(mainEvent.startsAt, ctx.locale, { tz: mainEvent.tz, devanagariNumerals: content.devanagariNumerals });
  const date = h("div", { class: "sm-date" }, h("div", { class: "sm-date-day", text: dm.day }),
    h("div", { class: "sm-date-rest" }, h("b", { text: `${dm.month} ${dm.year}` }), h("span", { text: `${dm.weekday}, ${formatTime(mainEvent.startsAt, ctx.locale, { tz: mainEvent.tz, devanagariNumerals: content.devanagariNumerals })}` })));
  const city = h("p", { class: "sm-city", text: [mainEvent.venueName, content.city].filter(Boolean).join(", ") });
  const note = guest.note ? h("p", { class: "sm-note", text: `“${guest.note}”` }) : null;
  const tiltBtn = h("button", { class: "sm-tilt", type: "button", text: t("tiltHint") });
  hero.append(motifBox, invocation, blessing, names, date, city);
  if (note) hero.append(note);
  if (!scripted && !calm && ctx.tier !== "C" && typeof DeviceOrientationEvent !== "undefined") hero.append(tiltBtn);
  tiltBtn.style.opacity = "0";
  if (!invocation.textContent) invocation.remove();

  let mosaic: Mosaic | null = null;
  const useCanvas = !ctx.lite;
  if (!useCanvas) hall.append(h("div", { class: "sm-hall-css" }));
  hall.append(vignette, h("div", { class: "sm-hall-frame", html: hallFrameSvg() }), hero);

  // Dock
  const dock = h("nav", { class: "sm-dock", "aria-label": t("functions") },
    h("a", { href: "#sm-chapters", html: `${ICONS.list}<span>${t("functions")}</span>` }),
    h("a", { href: "#inv-venue", html: `${ICONS.pin}<span>${t("location")}</span>` }),
    h("a", { href: "#inv-rsvp", class: "sm-dock-primary", html: `${ICONS.check}<span>${t("rsvp")}</span>` }));
  stage.append(dock);

  // Gate UI
  const gateUi = h("div", { class: "sm-gate-ui" });
  const openBtn = h("button", { class: "sm-open-btn", type: "button", text: t("openDoors") });
  const hand = h("div", { class: "sm-hand", html: ICONS.hand });
  gateUi.append(hand, openBtn);
  stage.append(gateUi);

  // Sound toggle (visible at all times in interactive mode)
  const sound = h("button", { class: "sm-sound", type: "button" });
  const paintSound = () => { const on = audio.unlocked && !audio.muted; sound.innerHTML = on ? ICONS.soundOn : ICONS.soundOff; sound.setAttribute("aria-label", on ? t("sound") : t("muted")); sound.setAttribute("aria-pressed", String(on)); };
  sound.addEventListener("click", () => { if (!audio.unlocked) { audio.unlock(); audio.setMuted(false); startBed(); } else audio.setMuted(!audio.muted); paintSound(); });
  if (!scripted && !ctx.lite) { col.append(sound); paintSound(); }

  // ---------- scale the scene like `background-size: cover`, never cropping the nameplate ----------
  const fitScene = () => {
    const w = stage.clientWidth || 360, hgt = stage.clientHeight || 740;
    const s = Math.max(w / 360, hgt / 740);
    scene.style.setProperty("--s", s.toFixed(4));
    const overflow = 740 * s - hgt;
    const topCrop = Math.min(Math.max(overflow, 0), 140 * s);
    scene.style.bottom = `${-(Math.max(overflow, 0) - topCrop)}px`;
  };
  fitScene();
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => fitScene()) : null;
  ro?.observe(stage);
  disposers.push(() => ro?.disconnect());
  fitTextInBox(plate.firstElementChild as HTMLElement, { min: 11, max: 20, maxLines: 2 });

  // Hero names: fit, never truncate. Measure after the hall is laid out (it is visibility:hidden, not display:none).
  const fitNames = () => {
    for (const el of [name1El, name2El]) {
      el.style.whiteSpace = "normal";
      fitTextInBox(el, { min: 30, max: Math.min(64, (stage.clientWidth || 360) * 0.17), maxLines: 2 });
    }
  };
  fitNames();

  // ---------- particles ----------
  const PETAL_AT = 0.25;
  const petalCount = Math.round(70 * ctx.particleScale);
  let petalCanvas: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; resize: () => { w: number; h: number } } | null = null;
  let petals: ReturnType<typeof makeBurst> = [];
  let petalSprites: HTMLCanvasElement[] = [];
  const cssPetals: HTMLElement[] = [];
  let pw = 360, ph = 740;
  if (!calm && petalCount > 0) {
    petalCanvas = makeCanvas(stage, ctx.dpr, "sm-particles");
    const sz = petalCanvas.resize(); pw = sz.w; ph = sz.h;
    petals = makeBurst(rng.fork("petals"), { count: petalCount, x: pw / 2, y: ph * 0.6, speed: [260, 820], angle: [-Math.PI * 0.95, -Math.PI * 0.05], size: [6, 11], life: [1.8, 2.8], spin: [-5, 5], flutter: [6, 22], delay: [0, 0.35], originJitter: [40, 70] });
    petalSprites = ["#F3A23A", "#F7B500", "#E07A12", "#FFC845"].map((c) => spriteCanvas(40, 26, (g) => {
      const grd = g.createRadialGradient(14, 10, 1, 20, 13, 20); grd.addColorStop(0, "#FFF0B0"); grd.addColorStop(0.5, c); grd.addColorStop(1, "#B4560A");
      g.fillStyle = grd; g.beginPath(); g.ellipse(20, 13, 18, 10, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "rgba(120,50,0,.35)"; g.lineWidth = 1; g.beginPath(); g.moveTo(4, 13); g.quadraticCurveTo(20, 10, 36, 13); g.stroke();
    }));
  } else if (!calm) {
    for (let i = 0; i < 6; i++) { const p = h("i", { class: "sm-css-petal" }); stage.append(p); cssPetals.push(p); }
  }

  // ---------- mosaic ----------
  const mstate: MosaicState = { sweep: 0, reveal: 0, hold: 0, dim: 0, tilt: 0, t: 0 };
  let revealed = false;
  const ensureMosaic = () => {
    if (mosaic || !useCanvas) return;
    const count = ctx.tier === "A" ? 900 : ctx.tier === "B" ? 500 : 220;
    mosaic = new Mosaic(hall, rng.fork("mosaic"), count, Math.min(ctx.dpr, 2));
    hall.insertBefore(mosaic.canvas, hall.firstChild);
    const vis = hall.style.visibility;
    hall.style.visibility = "visible";
    mosaic.setMask([name1El, name2El]);
    hall.style.visibility = vis;
  };

  const petalCanvasEl = () => petalCanvas?.canvas ?? {};
  // ---------- opening timeline ----------
  const open = gsap.timeline({ paused: true });
  const shades = [doorL, doorR].map((d) => d.querySelector(".sm-door-shade"));
  const motifStrokes = motifBox.querySelectorAll(".inv-motif-stroke");
  const motifFills = motifBox.querySelectorAll(".inv-motif-fill");
  const heroBits = [invocation, blessing, date, city, note].filter(Boolean) as HTMLElement[];
  const hallIn = () => { hall.style.visibility = "visible"; };
  gsap.set([names, ...heroBits, motifBox], { opacity: 0 });
  gsap.set(dock, { autoAlpha: 0, y: 12 });
  if (calm) {
    open.to([doorL, doorR], { opacity: 0, duration: 0.8, ease: "power1.inOut" }, 0)
      .to(bloom, { opacity: 0.6, duration: 0.6 }, 0)
      .call(hallIn, [], 0.5)
      .fromTo(hall, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.5)
      .set(motifStrokes, { attr: { "stroke-dashoffset": 0 } }, 0.5)
      .set(motifFills, { opacity: 1 }, 0.5)
      .to([motifBox, ...heroBits.slice(0, 2), names, ...heroBits.slice(2)], { opacity: 1, duration: 0.5, stagger: 0.08 }, 0.8)
      .to(vignette, { opacity: 1, duration: 0.4 }, 0.8)
      .to(dock, { autoAlpha: 1, y: 0, duration: 0.4 }, 1.4);
    Object.assign(mstate, { sweep: 1, reveal: 1, hold: 1, dim: 0.5 });
  } else {
    const persp = "1200px";
    gsap.set([doorL, doorR], { transformPerspective: 0 });
    void persp;
    open.addLabel("open", 0)
      .to(doorL, { rotateY: -108, duration: 1.6, ease: "power3.inOut" }, 0)
      .to(doorR, { rotateY: 108, duration: 1.6, ease: "power3.inOut" }, 0)
      .to(shades, { opacity: 0.6, duration: 1.4, ease: "power1.in" }, 0.1)
      .fromTo(bloom, { opacity: 0 }, { opacity: 0.85, duration: 0.9, ease: "power2.out" }, 0.12)
      .to(bloom, { opacity: 0.35, duration: 0.6, ease: "power1.inOut" }, 1.02)
      .to(front, { scale: 1.6, duration: 1.5, ease: "power2.in", transformOrigin: "50% 63%" }, 0.35)
      .to([mid, doors], { scale: 1.42, duration: 1.5, ease: "power2.in", transformOrigin: "50% 63%" }, 0.35)
      .to(back, { scale: 1.22, duration: 1.5, ease: "power2.in", transformOrigin: "50% 63%" }, 0.35)
      .to(bg, { scale: 1.15, duration: 1.5, ease: "power2.in", transformOrigin: "50% 63%" }, 0.35)
      .to(flash, { opacity: 1, duration: 0.42, ease: "power2.in" }, 1.18)
      .to(petalCanvasEl(), { opacity: 0, duration: 0.6 }, 1.5)
      .call(hallIn, [], 1.45)
      .set(hall, { opacity: 1 }, 1.58)
      .to(flash, { opacity: 0, duration: 1.0, ease: "power2.out" }, 1.6)
      .addLabel("reveal", 1.6)
      .fromTo(mstate, { sweep: 0 }, { sweep: 1, duration: 2.6, ease: "power1.inOut" }, 1.6)
      .fromTo(mstate, { reveal: 0 }, { reveal: 1, duration: 2.6, ease: "power1.inOut" }, 1.6)
      .fromTo(mstate, { hold: 0 }, { hold: 1, duration: 1.2, ease: "power1.out" }, 1.9)
      .to(motifBox, { opacity: 1, duration: 0.2 }, 1.85)
      .fromTo(motifStrokes, { attr: { "stroke-dashoffset": 1 } }, { attr: { "stroke-dashoffset": 0 }, duration: 1.8, ease: "power1.inOut" }, 1.9)
      .to(motifFills, { opacity: 1, duration: 0.6 }, 3.4)
      .to(heroBits.slice(0, 2), { opacity: 1, y: 0, duration: 0.6, stagger: 0.15 }, 2.4)
      .to(mstate, { dim: 0.55, duration: 1.2, ease: "power1.inOut" }, 3.9)
      .to(vignette, { opacity: 1, duration: 1.2 }, 3.9)
      .fromTo(names, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.9, ease: "power2.out" }, 3.95)
      .fromTo(heroBits.slice(2), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.18, ease: "power2.out" }, 4.5)
      .to(tiltBtn, { opacity: 1, duration: 0.4 }, 5.4)
      .to(dock, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, 5.5);
    if (cssPetals.length) {
      cssPetals.forEach((p, i) => {
        const a = -Math.PI * (0.15 + 0.7 * (i / 5));
        open.fromTo(p, { left: "50%", top: "60%", opacity: 0, rotate: 0 }, { left: `${50 + Math.cos(a) * 55}%`, top: `${60 + Math.sin(a) * 35 + 30}%`, opacity: 1, rotate: 260 + i * 40, duration: 2.2, ease: "power1.out" }, PETAL_AT + i * 0.05)
          .to(p, { opacity: 0, duration: 0.5 }, PETAL_AT + 1.8 + i * 0.05);
      });
    }
  }
  open.set({}, {}, calm ? 1.9 : 6.0);

  // ---------- ambient (pure functions of time) ----------
  const stars = Array.from(bg.querySelectorAll<SVGCircleElement>(".sm-star"));
  const wins = Array.from(back.querySelectorAll<SVGPathElement>(".sm-win"));
  const toran = front.querySelector<SVGGElement>(".sm-toran");
  const ladis = Array.from(front.querySelectorAll<SVGGElement>(".sm-ladi"));
  const flames = [diyaL, diyaR].map((d) => d.querySelector<SVGGElement>(".sm-flame"));
  const glows = [diyaL, diyaR].map((d) => d.querySelector<SVGCircleElement>(".sm-glow"));
  const starBase = stars.map((s) => Number(s.getAttribute("opacity")));
  const winBase = wins.map((s) => Number(s.getAttribute("opacity")));
  for (const g of [toran, ...ladis]) if (g) { g.style.transformBox = "fill-box"; g.style.transformOrigin = "50% 0%"; }
  let gateIdle = true;
  let stageVisible = true;
  let gateStart = 0;
  const ambientGate = (tm: number) => {
    if (ctx.tier !== "C" && !ctx.lite) {
      for (let i = 0; i < stars.length; i += 1) stars[i]!.setAttribute("opacity", (starBase[i]! * (0.55 + 0.45 * Math.sin(tm * (0.8 + (i % 7) * 0.31) + i))).toFixed(2));
      for (let i = 0; i < wins.length; i += 3) wins[i]!.setAttribute("opacity", (winBase[i]! * (0.85 + 0.15 * Math.sin(tm * 2.3 + i * 1.7))).toFixed(2));
    }
    if (!calm) {
      const sway = Math.sin((tm / 4) * Math.PI * 2);
      if (toran) toran.style.transform = `rotate(${(sway * 0.5).toFixed(3)}deg)`;
      ladis.forEach((l, i) => (l.style.transform = `rotate(${(Math.sin((tm / 4) * Math.PI * 2 + i * 0.9) * 1.4).toFixed(3)}deg)`));
      if (gateIdle) {
        const u = smooth(Math.min(1, (tm - gateStart) / 8));
        cam.style.transform = `scale(${(1.02 + 0.04 * u).toFixed(4)})`;
        cam.style.transformOrigin = "50% 63%";
      }
    }
    flames.forEach((f, i) => { if (f) f.style.transform = `scale(${(0.94 + 0.06 * flick(tm, i * 3)).toFixed(3)}, ${flick(tm, i * 3 + 1).toFixed(3)}) skewX(${(Math.sin(tm * 6 + i) * 3).toFixed(2)}deg)`; });
    glows.forEach((g, i) => g?.setAttribute("opacity", (0.65 + 0.3 * flick(tm, i * 5 + 2)).toFixed(2)));
  };
  const ambientParticles = () => {
    if (!petalCanvas || !petals.length) return;
    const tau = open.time() - PETAL_AT;
    const c = petalCanvas.ctx;
    c.clearRect(0, 0, pw, ph);
    if (tau < 0 || tau > 4) return;
    for (let i = 0; i < petals.length; i++) {
      const p = petals[i]!;
      const s = particleAt(p, tau, 420, 1.4);
      if (!s.alive || s.alpha <= 0) continue;
      c.save(); c.globalAlpha = s.alpha; c.translate(s.x, s.y); c.rotate(s.rot);
      const sc = p.size / 20 * (1 + tau * 0.18);
      c.scale(sc, sc * (0.6 + 0.4 * Math.abs(Math.sin(s.rot * 1.3))));
      c.drawImage(petalSprites[i % petalSprites.length]!, -20, -13);
      c.restore();
    }
  };
  let tiltValue = 0;
  const ambientHall = (tm: number) => {
    if (!mosaic || hall.style.visibility !== "visible" || !stageVisible) return;
    mstate.t = tm;
    if (revealed && !calm) {
      // Slow auto-sweep (or tilt-steered sweep) after the reveal.
      mstate.sweep = tiltValue !== 0 ? 0.5 + tiltValue * 0.6 : ((tm * 0.11) % 1.5);
      mstate.tilt = 0;
    }
    mosaic.render(mstate);
  };
  disposers.push(clock.add((tm) => { ambientGate(tm); ambientParticles(); ambientHall(tm); }));

  // ---------- chapters ----------
  const chaptersEl = h("div", { class: "sm-chapters", id: "sm-chapters" });
  const chapters: (Chapter & { ambient?: (el: HTMLElement, t: number) => void; bed?: string; visible: boolean })[] = [];
  const buildChamber = (e: WeddingEvent, i: number) => {
    const art = chamberArt(e.kind, content.ceremonyStyle, rng.fork(`ch-${e.id}`));
    const title = eventTitle(ctx, e);
    const dmE = formatDayMonth(e.startsAt, ctx.locale, { tz: e.tz, devanagariNumerals: content.devanagariNumerals });
    const sec = h("section", { class: "sm-chamber", id: `sm-ch-${e.id}`, "aria-label": title.main });
    const artBox = h("div", { class: "sm-chamber-art", html: art.svg + chamberFrameSvg() });
    const card = h("div", { class: "sm-card" },
      h("p", { class: "sm-card-k", text: `${i + 1} / ${events.length}` }),
      h("h3", {}, title.main, title.alt ? h("span", { class: "sm-alt", text: title.alt }) : null),
      h("p", { class: "sm-when", text: `${dmE.weekday}, ${formatDate(e.startsAt, ctx.locale, { tz: e.tz, devanagariNumerals: content.devanagariNumerals }).split(", ").slice(1).join(", ")}` }),
      h("p", { text: formatTime(e.startsAt, ctx.locale, { tz: e.tz, devanagariNumerals: content.devanagariNumerals }) }),
      h("p", {}, h("b", { text: e.venueName }), e.venueArea ? `, ${e.venueArea}` : ""));
    if (e.dressCode.length) {
      const chips = h("div", { class: "sm-chips", "aria-label": t("dressCode") });
      for (const d of e.dressCode) chips.append(h("span", { class: "sm-chip" }, h("i", { style: `background:${d.hex}` }), d.name));
      card.append(chips);
    }
    const actions = eventActions(ctx, e, "", "sm-primary", true);
    actions.className = "sm-actions";
    card.append(actions);
    sec.append(artBox, card);
    const tl = gsap.timeline({ paused: true });
    return { sec, art, tl, artBox };
  };

  events.forEach((e, i) => {
    const { sec, art, tl, artBox } = buildChamber(e, i);
    chaptersEl.append(sec);
    art.anim(tl, artBox);
    tl.set({}, {}, 1);
    chapters.push({ id: e.id, el: sec, tl, pinVh: 130, ambient: art.ambient, bed: art.bed, visible: false });
  });

  // ---------- finale: lantern sky + shared sections ----------
  const confirmed = ctx.services?.publicCounts?.confirmedHouseholds ?? 0;
  const skyEl = h("div", { class: "sm-sky" });
  const field = !ctx.lite ? lanternField(skyEl, rng.fork("lanterns"), Math.max(confirmed, scripted ? 18 : 0)) : null;
  skyEl.append(h("div", { class: "sm-sky-palace", html: palaceSilhouetteSmall() }));
  const handDiya = h("div", { class: "sm-handdiya", html: diyaSvg("hand") });
  const jharokhaDiya = h("div", { class: "sm-jharokha-diya", html: diyaSvg("jh") });
  skyEl.append(handDiya, jharokhaDiya);
  const skyTitle = h("h2", { text: t("rsvpTitle") });
  const skyMsg = h("p", { text: confirmed > 0 ? `${confirmed} 🪔` : t("thanks") });
  skyEl.append(skyTitle, skyMsg);
  disposers.push(clock.add((tm) => field?.render(tm)));

  let sectionsApi: { destroy(): void } | null = null;
  if (!scripted) {
    col.append(chaptersEl);
    const sectionsHost = h("div", { class: "sm-sections" });
    col.append(sectionsHost);
    sectionsApi = renderSections(ctx, sectionsHost, {
      rsvpStage: (host) => {
        host.querySelector("h2")?.remove();
        host.classList.add("sm-rsvp");
        host.style.paddingTop = "0";
        host.style.marginLeft = "-18px"; host.style.marginRight = "-18px";
        host.prepend(skyEl);
        return {
          react: (status) => {
            if (status === "yes") {
              audio.sting("lantern"); haptic(12);
              const tl = gsap.timeline();
              tl.fromTo(handDiya, { opacity: 0, y: 30, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power2.out" })
                .to(handDiya, { y: -(skyEl.clientHeight * 0.75), scale: 0.45, duration: calm ? 0.01 : 3.2, ease: "power1.in" })
                .to(handDiya, { opacity: 0, duration: 0.4 }, "-=0.4")
                .call(() => { field?.add(); skyMsg.textContent = t("thanks"); });
            } else if (status === "no") {
              gsap.fromTo(jharokhaDiya, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8 });
              skyTitle.textContent = t("declinedThanks");
              skyMsg.textContent = "";
            } else {
              skyMsg.textContent = t("thanks");
            }
          },
        };
      },
      shagunStage: (host) => {
        host.insertBefore(h("div", { class: "sm-potli", html: potliSvg() }), host.children[1] ?? null);
      },
      onShagunBlock: () => { audio.sting("coin"); haptic(10); },
    });
    setSectionTokens(root);
  }

  // ---------- scripted storyboard (video) ----------
  const master = gsap.timeline({ paused: true });
  const titleCard = h("div", { class: "sm-title-card", text: t("youreInvited") });
  const montage = h("div", { class: "sm-montage" });
  const endcard = h("div", { class: "sm-endcard" });
  let duration = 38;
  if (scripted) {
    stage.append(titleCard, montage, endcard);
    gateUi.remove();
    master.fromTo(titleCard, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5 }, 0.2).to(titleCard, { opacity: 0, duration: 0.4 }, 1.7);
    master.add(open.paused(false), 2);
    // 9–14 s: names + date + venue held (they are already on screen from ~6 s)
    const slot = Math.max(2.5, Math.min(3, 16 / Math.max(1, events.length)));
    let at = 14;
    const montageEls: HTMLElement[] = [];
    events.forEach((e, i) => {
      const { sec, art, tl, artBox } = buildChamber(e, i);
      montage.append(sec);
      art.anim(tl, artBox);
      tl.set({}, {}, 1);
      montageEls.push(sec);
      master.to(sec, { opacity: 1, duration: 0.35 }, at)
        .add(tl.tweenFromTo(0, 1, { duration: slot - 0.4, ease: "none" }), at + 0.1)
        .to(sec, { opacity: 0, duration: 0.3 }, at + slot - 0.05);
      if (art.ambient) disposers.push(clock.add((tm) => art.ambient!(artBox, tm)));
      at += slot;
    });
    // lantern sky
    const skyWrap = h("div", { class: "sm-montage-sky", style: "position:absolute;inset:0;opacity:0;z-index:7" });
    skyEl.style.height = "100%";
    skyWrap.append(skyEl);
    stage.append(skyWrap);
    master.to(skyWrap, { opacity: 1, duration: 0.5 }, at).to(skyWrap, { opacity: 0, duration: 0.4 }, at + 4.6);
    at += 5;
    const url = ctx.services?.shareUrl ?? "";
    endcard.innerHTML = `<div style="font-family:'Rozha One',serif;font-size:34px;line-height:1.1;color:var(--gold-2)">${escapeHtml(n1)}<br><span style="font-size:20px;color:var(--ivory)">${escapeHtml(t("and"))}</span><br>${escapeHtml(n2)}</div>
<div style="font-size:16px;color:var(--ivory)">${escapeHtml(formatDate(mainEvent.startsAt, ctx.locale, { tz: mainEvent.tz }))}</div>
${url ? `<div style="width:150px;height:150px;background:#fff;padding:6px">${qrSvg(url)}</div><div style="font-size:14px;color:var(--ivory);word-break:break-all">${escapeHtml(url.replace(/^https?:\/\//, ""))}</div>` : ""}`;
    master.to(endcard, { opacity: 1, duration: 0.5 }, at);
    at += 3;
    duration = at;
    master.set({}, {}, duration);
    ensureMosaic();
  }

  // ---------- interactive wiring ----------
  const startBed = () => {
    audio.bed(droneBed(SWARAS.Sa));
  };
  let opened = false;
  const doOpen = (instant = false) => {
    if (opened) return;
    opened = true;
    gateIdle = false;
    audio.unlock();
    if (!instant) { audio.sting("shehnai"); audio.sting("whoosh"); haptic(12); }
    paintSound();
    gsap.to(gateUi, { autoAlpha: 0, duration: 0.3 });
    ensureMosaic();
    ctx.emit("opened");
    const done = () => {
      revealed = true;
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      ctx.emit("sceneView", "hero");
      if (!audio.muted) { startBed(); audio.sting("santoor"); }
      ScrollTrigger.refresh();
      const banner = topBanner(ctx);
      if (banner) col.append(banner);
    };
    if (instant) { open.progress(1); done(); }
    else open.eventCallback("onComplete", done).play(0);
  };

  const onKey = (e: KeyboardEvent) => { if (!opened && (e.key === "Enter" || e.key === " ") && document.activeElement === document.body) { e.preventDefault(); doOpen(); } };
  let px = 0, py = 0, down = false;
  const onDown = (e: PointerEvent) => { down = true; px = e.clientX; py = e.clientY; };
  const onUp = (e: PointerEvent) => {
    if (!down || opened) return;
    down = false;
    const dx = e.clientX - px, dy = e.clientY - py;
    if (Math.abs(dx) > 40 || (Math.abs(dx) < 10 && Math.abs(dy) < 10)) doOpen();
  };

  const instance: TemplateInstance = {
    storyboard: {
      duration: scripted ? duration : open.duration(),
      keyframes: scripted
        ? [{ t: 1, label: "gate" }, { t: 3, label: "doors" }, { t: 6, label: "mirror" }, { t: 11, label: "date" }, { t: 15.5, label: "functions" }, { t: duration - 6, label: "lanterns" }, { t: duration - 1, label: "endcard" }]
        : manifest.keyframes.map((k) => ({ t: k, label: `t${k}` })),
      staticAt: 11,
    },
    start() {
      if (scripted) return;
      gateStart = clock.time;
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      clock.startRealtime();
      stage.addEventListener("pointerdown", onDown);
      stage.addEventListener("pointerup", onUp);
      openBtn.addEventListener("click", (e) => { e.stopPropagation(); doOpen(); });
      openBtn.addEventListener("pointerup", (e) => e.stopPropagation());
      window.addEventListener("keydown", onKey);
      // Hand hint after 1.5 s of inactivity.
      if (!calm) gsap.fromTo(hand, { opacity: 0, x: -24 }, { opacity: 1, x: 24, duration: 1.1, ease: "power1.inOut", repeat: -1, yoyo: true, delay: 1.5 });
      else hand.remove();
      tiltBtn.addEventListener("click", async () => {
        const ok = await requestTilt();
        if (!ok) { tiltBtn.remove(); return; }
        const onOri = (ev: DeviceOrientationEvent) => { tiltValue = Math.max(-1, Math.min(1, (ev.gamma ?? 0) / 35)) || 0.0001; };
        window.addEventListener("deviceorientation", onOri);
        disposers.push(() => window.removeEventListener("deviceorientation", onOri));
        tiltBtn.remove();
      });
      const io = new IntersectionObserver((es) => { for (const e of es) { if (e.target === stage) stageVisible = e.isIntersecting; const ch = chapters.find((c) => c.el === e.target); if (ch) ch.visible = e.isIntersecting; } updateBed(); });
      io.observe(stage);
      chapters.forEach((c) => io.observe(c.el));
      disposers.push(() => io.disconnect());
      disposers.push(clock.add((tm) => { for (const c of chapters) if (c.visible && c.ambient) c.ambient(c.el, tm); }));
      triggers.push(...pinChapters(ctx, chapters));
      ctx.services?.track({ scene: "loader", tier: ctx.tier });
    },
    seek(time) {
      master.seek(time, false);
      gateIdle = time < 2;
      revealed = time >= 8;
      clock.renderAt(time);
    },
    play() { if (scripted) { clock.startRealtime(); master.play(); } else doOpen(); },
    goTo(sceneId: SceneId) {
      const id = sceneId === "rsvp" ? "inv-rsvp" : sceneId === "shagun" ? "inv-shagun" : sceneId.startsWith("chapter:") ? `sm-ch-${sceneId.slice(8)}` : sceneId === "hero" || sceneId === "opening" ? null : "sm-chapters";
      if (!opened) doOpen(true);
      const el = id ? document.getElementById(id) : stage;
      el?.scrollIntoView({ behavior: calm ? "auto" : "smooth" });
    },
    open: (instant?: boolean) => doOpen(instant),
    destroy() {
      disposers.forEach((d) => d());
      triggers.forEach((tr) => tr.kill());
      sectionsApi?.destroy();
      open.kill(); master.kill();
      chapters.forEach((c) => c.tl.kill());
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      col.remove();
    },
  };

  // Chapter beds (dholak in Sangeet when sound is on)
  let currentBed = "drone";
  function updateBed() {
    if (!audio.unlocked || audio.muted) return;
    const want = chapters.some((c) => c.visible && c.bed === "dholak") ? "dholak" : "drone";
    if (want === currentBed) return;
    currentBed = want;
    audio.bed(want === "dholak" ? rhythmBed([1, 0, 2, 2, 1, 0, 2, 0], 104) : droneBed(SWARAS.Sa));
  }
  return instance;
}

function escapeHtml(s: string) { return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!); }

function setSectionTokens(root: HTMLElement) {
  const v: Record<string, string> = {
    "--sec-bg": "var(--backdrop)", "--sec-ink": "var(--ivory)", "--sec-heading": "var(--gold-2)", "--sec-card": "var(--card)", "--sec-card-ink": "var(--card-ink)",
    "--sec-accent": "var(--accent)", "--sec-line": "rgba(201,154,63,.45)", "--sec-font-display": '"Rozha One",serif', "--sec-font-text": 'Martel,"Noto Serif Devanagari",Georgia,serif',
    "--sec-radius": "3px", "--sec-card-shadow": "0 0 0 1px var(--brass),inset 0 0 0 4px var(--card),inset 0 0 0 5px rgba(201,154,63,.5)", "--sec-note-bg": "rgba(201,154,63,.12)",
  };
  for (const [k, val] of Object.entries(v)) root.style.setProperty(k, val);
}

/** Mirror-work arch border around the hall (decorative; never behind body text). */
function hallFrameSvg(): string {
  return `<svg viewBox="0 0 360 740" preserveAspectRatio="none" aria-hidden="true" style="width:100%;height:100%">
<defs><linearGradient id="sm-hf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--stone)"/><stop offset="1" style="stop-color:var(--stone-shadow)"/></linearGradient>
<mask id="sm-hf-m"><rect width="360" height="740" fill="#fff"/><path d="M18,740 V150 Q18,70 90,44 Q150,22 180,10 Q210,22 270,44 Q342,70 342,150 V740 Z" fill="#000"/></mask></defs>
<rect width="360" height="740" fill="url(#sm-hf)" mask="url(#sm-hf-m)" opacity=".92"/>
<path d="M18,740 V150 Q18,70 90,44 Q150,22 180,10 Q210,22 270,44 Q342,70 342,150 V740" fill="none" stroke="var(--gold-3)" stroke-width="1.5" opacity=".8"/>
<path d="M10,740 V150 Q10,64 86,37 Q148,14 180,2" fill="none" stroke="var(--mirror)" stroke-width="1" stroke-dasharray="2 4" opacity=".7"/>
<path d="M350,740 V150 Q350,64 274,37 Q212,14 180,2" fill="none" stroke="var(--mirror)" stroke-width="1" stroke-dasharray="2 4" opacity=".7"/>
</svg>`;
}

function palaceSilhouetteSmall(): string {
  return `<svg viewBox="0 0 360 160" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><path d="M0,160 V96 H40 V80 Q52,58 64,80 V96 H120 V70 Q150,20 180,8 Q210,20 240,70 V96 H296 V80 Q308,58 320,80 V96 H360 V160 Z" fill="#0A0C26"/>
${Array.from({ length: 12 }, (_, i) => `<rect x="${12 + i * 29}" y="110" width="7" height="12" rx="3" fill="#FFC76B" opacity=".75"/>`).join("")}
<path d="M150,96 h60 v-20 q-30,-26 -60,0 Z" fill="#FFC76B" opacity=".25"/></svg>`;
}

function potliSvg(): string {
  const frill = Array.from({ length: 9 }, (_, i) => { const x = 34 + i * 6.5; return `<path d="M${x},40 q3.2,-12 6.5,0" fill="url(#sm-velvet)" stroke="#5A0F2C" stroke-width=".6"/>`; }).join("");
  const dots = Array.from({ length: 7 }, (_, i) => { const a = Math.PI * (0.15 + i * 0.117); return `<circle cx="${(60 - Math.cos(a) * 30).toFixed(1)}" cy="${(80 + Math.sin(a) * 18).toFixed(1)}" r="1.8"/>`; }).join("");
  return `<svg viewBox="0 0 120 120" role="img" aria-label="Shagun potli"><defs><radialGradient id="sm-velvet" cx=".38" cy=".32" r=".85"><stop offset="0" stop-color="#F06A9B"/><stop offset=".55" style="stop-color:var(--accent)"/><stop offset="1" stop-color="#4E0B26"/></radialGradient></defs>
<ellipse cx="60" cy="112" rx="30" ry="4" fill="#000" opacity=".35"/>
<path d="M46,46 C24,58 22,104 60,108 C98,104 96,58 74,46 Z" fill="url(#sm-velvet)"/>
<path d="M44,46 Q60,52 76,46 L78,40 Q60,46 42,40 Z" fill="#6E1235"/>
${frill}
<path d="M42,46 Q60,54 78,46" fill="none" stroke="var(--gold-2)" stroke-width="2.4"/>
<path d="M70,49 q8,10 2,22 M70,49 q14,6 14,18" fill="none" stroke="var(--gold-2)" stroke-width="1.8" stroke-linecap="round"/>
<circle cx="72" cy="72" r="3" fill="var(--gold-2)"/><circle cx="84" cy="68" r="3" fill="var(--gold-2)"/>
<g fill="var(--gold-1)" opacity=".9">${dots}</g>
<path d="M60,64 l4,8 l-4,8 l-4,-8 Z" fill="var(--gold-2)" opacity=".9"/></svg>`;
}

const template: TemplateModule = { manifest, packs, loader, create };
export default template;
export { manifest, packs };

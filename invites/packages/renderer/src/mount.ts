import { brand } from "@invites/config";
import { makeT } from "@invites/i18n";
import { AudioManager } from "./audio";
import { Clock } from "./clock";
import { ensureStyles, setVars } from "./dom";
import { Emitter } from "./emitter";
import { fontsReady, injectFonts } from "./fonts";
import { createPRNG } from "./prng";
import { decideTier, FpsMonitor, probeFrames, readSignals, tierConfig } from "./tier";
import type { Invite, InviteEvent, MountOptions, RenderContext, SceneId, Storyboard, TemplateInstance, Tier } from "./types";

const BASE_CSS = `
.inv-root{position:relative;width:100%;min-height:100svh;overflow-x:clip;-webkit-tap-highlight-color:transparent;--inv-text-scale:1;color:var(--ink,#111);background:var(--backdrop,#111)}
.inv-root.inv-large{--inv-text-scale:1.3}
.inv-root *{box-sizing:border-box}
.inv-root.inv-scripted{position:fixed;inset:0;min-height:0;height:100vh;overflow:hidden}
.inv-column{position:relative;width:100%;max-width:440px;margin:0 auto;min-height:100svh}
.inv-root.inv-scripted .inv-column{max-width:none;height:100%;min-height:0}
.inv-sr{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.inv-root :where(button,input,select,textarea){font:inherit;color:inherit}
.inv-root :where(:focus-visible){outline:3px solid var(--focus,#ffd27a);outline-offset:3px}
@media (prefers-reduced-motion: reduce){.inv-root *{scroll-behavior:auto!important}}
`;

export function mount(el: HTMLElement, opts: MountOptions): Invite {
  ensureStyles("base", BASE_CSS);
  const emitter = new Emitter<InviteEvent>();
  let current: { ctx: RenderContext; inst: TemplateInstance | null; fps: FpsMonitor | null; disposeLoader: (() => void) | null } | null = null;
  let o: MountOptions = { ...opts };
  let destroyed = false;
  let resolveReady!: () => void;
  const ready = new Promise<void>((r) => (resolveReady = r));

  const build = async (first: boolean) => {
    const mode = o.mode ?? "interactive";
    const scripted = mode === "autoplay" || mode === "static";
    const signals = scripted ? {} : readSignals();
    const guess = decideTier(signals);
    const tier: Tier = o.tier ?? (scripted ? "A" : guess.tier);
    const lite = o.lite ?? (mode === "lite" || (!scripted && guess.lite));
    const reduced = mode === "reduced-motion" || (!scripted && guess.reduced);
    const locale = o.locale ?? o.guest.locale ?? o.content.defaultLocale;
    const tone = o.tone ?? o.guest.tone ?? o.content.defaultTone;
    const packId = o.themePack ?? o.template.manifest.defaultPack;
    const pack = o.template.packs[packId] ?? o.template.packs[o.template.manifest.defaultPack]!;
    const assetsBase = o.assetsBase ?? "";
    const dprRaw = o.dpr ?? (typeof devicePixelRatio === "number" ? devicePixelRatio : 1);

    el.innerHTML = "";
    el.className = `inv-root inv-${o.template.manifest.id} tier-${tier}${scripted ? " inv-scripted" : ""}${lite ? " inv-lite" : ""}${reduced ? " inv-reduced" : ""}${o.largeText ? " inv-large" : ""}`;
    el.setAttribute("lang", locale === "hi" ? "hi" : locale === "hinglish" ? "hi-Latn" : "en");
    setVars(el, pack.tokens);
    injectFonts(o.template.manifest.id, o.template.manifest.fonts, assetsBase);

    const clock = new Clock();
    const audio = new AudioManager(!scripted && !lite);
    const ctx: RenderContext = {
      root: el, content: o.content, guest: o.guest, locale, tone, t: makeT(locale, tone),
      tier, mode, scripted, lite, reduced, largeText: !!o.largeText, pack,
      rng: createPRNG(o.content.inviteId), clock, audio,
      emit: (e, p) => emitter.emit(e, p), services: o.services, assetsBase, brandName: o.brandName ?? brand.name,
      particleScale: lite ? 0 : tierConfig[tier].particleScale, dpr: Math.min(dprRaw, scripted ? dprRaw : tierConfig[tier].dprCap),
      controls: {
        setLite: (on) => invite.update({ lite: on, mode: on ? "lite" : "interactive", reopen: true }),
        setLargeText: (on) => invite.update({ largeText: on, reopen: true }),
        setLocale: (l) => invite.update({ locale: l, reopen: true }),
      },
    };
    current = { ctx, inst: null, fps: null, disposeLoader: null };

    const families = o.template.manifest.fonts.map((f) => f.family);
    if (!scripted && !o.skipLoader && first) {
      current.disposeLoader = o.template.loader(ctx);
      const minMs = o.loaderMinMs ?? 900;
      const [probe] = await Promise.all([o.tier ? Promise.resolve(undefined) : probeFrames(500), fontsReady(families), new Promise((r) => setTimeout(r, minMs))]);
      if (destroyed) return;
      if (probe !== undefined && !o.tier) {
        const refined = decideTier({ ...signals, probeFrameMs: probe });
        if (refined.tier !== ctx.tier) {
          ctx.tier = refined.tier;
          ctx.particleScale = lite ? 0 : tierConfig[refined.tier].particleScale;
          ctx.dpr = Math.min(dprRaw, tierConfig[refined.tier].dprCap);
          el.classList.remove("tier-A", "tier-B", "tier-C");
          el.classList.add(`tier-${refined.tier}`);
        }
      }
      current.disposeLoader?.();
      current.disposeLoader = null;
    } else {
      await fontsReady(families, scripted ? 6000 : 1500);
    }
    if (destroyed) return;

    try {
      current.inst = o.template.create(ctx);
    } catch (err) {
      emitter.emit("error", err);
      throw err;
    }
    emitter.emit("tier", ctx.tier);
    if (scripted) {
      current.inst.seek(mode === "static" ? current.inst.storyboard.staticAt : 0);
    } else {
      current.inst.start();
      if (o.reopen) current.inst.open(true);
      if (!lite && !reduced) {
        const fps = new FpsMonitor(ctx.tier, (t) => {
          ctx.tier = t;
          ctx.particleScale = tierConfig[t].particleScale;
          el.classList.remove("tier-A", "tier-B", "tier-C");
          el.classList.add(`tier-${t}`);
          emitter.emit("tier", t);
        });
        fps.start();
        current.fps = fps;
      }
    }
    emitter.emit("ready");
    resolveReady();
  };

  const teardown = () => {
    if (!current) return;
    current.fps?.stop();
    current.disposeLoader?.();
    current.inst?.destroy();
    current.ctx.clock.stop();
    current.ctx.clock.clear();
    current.ctx.audio.destroy();
    current = null;
  };

  build(true).catch((e) => emitter.emit("error", e));

  const invite: Invite = {
    ready,
    get tier() { return current?.ctx.tier ?? "B"; },
    get storyboard(): Storyboard | null { return current?.inst?.storyboard ?? null; },
    play: () => current?.inst?.play(),
    seek: (t) => current?.inst?.seek(t),
    goTo: (s: SceneId) => current?.inst?.goTo(s),
    open: () => current?.inst?.open(),
    on: (e, h) => emitter.on(e, h),
    update: (patch) => {
      o = { ...o, ...patch, skipLoader: true };
      teardown();
      build(false).catch((e) => emitter.emit("error", e));
    },
    destroy: () => { destroyed = true; teardown(); emitter.clear(); el.innerHTML = ""; },
  };
  return invite;
}

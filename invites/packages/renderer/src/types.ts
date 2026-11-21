import type { EventKind, GuestVars, Locale, RsvpSubmission, Tone, WeddingContent } from "@invites/content-schema";
import type { AudioManager } from "./audio";
import type { Clock } from "./clock";
import type { PRNG } from "./prng";

export type Tier = "A" | "B" | "C";
export type Mode = "interactive" | "autoplay" | "static" | "lite" | "reduced-motion";
export type LayerName = "bg" | "back" | "mid" | "front" | "particles" | "ui";
export type SceneId = "loader" | "opening" | "hero" | "story" | `chapter:${string}` | "shagun" | "rsvp" | "finale" | "sections";

export interface LayerSpec { name: LayerName; parallax: number; tiers: Tier[] }

export type SlotKind = "image" | "prop" | "texture" | "sprite" | "vector" | "lottie" | "rive" | "audio" | "text";
export interface SlotSpec {
  id: string;
  kind: SlotKind;
  /** "1080x2400" style, or ratio "9:20". */
  aspect?: string;
  maxBytes: number;
  alphaRequired: boolean;
  promptTemplateId?: string;
  /** "procedural" = drawn in code when no asset is supplied. */
  fallback: "procedural" | string;
}

export interface ThemePack {
  id: string;
  name: string;
  description: string;
  /** Palette + type tokens. Choreography never changes between packs. */
  tokens: Record<string, string>;
  /** Slot fills (URLs). Missing slots fall back to procedural art. */
  slots: Partial<Record<string, string>>;
}

export interface FontFile { weight: number; style?: "normal" | "italic"; subset: string; file: string; unicodeRange?: string }
export interface FontSpec { family: string; files: FontFile[] }

export interface StoryboardKeyframe { t: number; label: string }
export interface TemplateManifest {
  id: string;
  name: string;
  tagline: string;
  supportedFunctions: EventKind[];
  layers: LayerSpec[];
  slots: SlotSpec[];
  packs: string[];
  defaultPack: string;
  fonts: FontSpec[];
  /** Interactive keyframes (seconds after the opening tap) used for screenshots. */
  keyframes: number[];
}

export interface Storyboard { duration: number; keyframes: StoryboardKeyframe[]; staticAt: number }

export interface GuestServices {
  submitRsvp(sub: RsvpSubmission): Promise<{ ok: boolean; error?: string }>;
  pledge(p: { blockId: string; amount: number | null }): Promise<{ ok: boolean }>;
  claimGift(giftId: string): Promise<{ ok: boolean }>;
  track(e: { scene: string; tier?: Tier }): void;
  report?(reason: string): Promise<void>;
  /** Rang Kahani extras (aggregate counts only are ever shown to guests). */
  vote?(team: "ladkewale" | "ladkiwale"): Promise<{ ok: boolean; counts?: { ladkewale: number; ladkiwale: number } }>;
  requestSong?(text: string): Promise<{ ok: boolean }>;
  /** Mohar Ashirwad Book entry. */
  sign?(p: { blessing: string; signatureSvg?: string }): Promise<{ ok: boolean }>;
  existingRsvp?: RsvpSubmission | null;
  /** Aggregate, privacy-safe numbers for playful UI (never names). */
  publicCounts?: { confirmedHouseholds: number; teamLadkewale?: number; teamLadkiwale?: number };
  /** Base URL for share links / QR. */
  shareUrl?: string;
  now?: () => Date;
}

export interface RenderContext {
  root: HTMLElement;
  content: WeddingContent;
  guest: GuestVars;
  locale: Locale;
  tone: Tone;
  t: (key: string, vars?: Record<string, string | number>) => string;
  tier: Tier;
  mode: Mode;
  /** autoplay/static: everything is driven by seek(); no listeners, no scroll. */
  scripted: boolean;
  lite: boolean;
  reduced: boolean;
  largeText: boolean;
  pack: ThemePack;
  rng: PRNG;
  clock: Clock;
  audio: AudioManager;
  emit: (e: InviteEvent, payload?: unknown) => void;
  services?: GuestServices;
  assetsBase: string;
  brandName: string;
  /** Particles scale for this tier (0 on C). */
  particleScale: number;
  dpr: number;
  /** Guest-page controls wired to the host (footer toggles). */
  controls: InviteControls;
}

export interface InviteControls {
  setLite(on: boolean): void;
  setLargeText(on: boolean): void;
  setLocale(l: Locale): void;
}

export interface TemplateInstance {
  storyboard: Storyboard;
  /** Interactive: show the opening gate and wait for the guest. */
  start(): void;
  /** Deterministic seek (autoplay/static). */
  seek(t: number): void;
  play(): void;
  goTo(scene: SceneId): void;
  /** Interactive: perform the opening (as if the guest tapped). `instant` jumps to the opened state. */
  open(instant?: boolean): void;
  destroy(): void;
}

export interface TemplateModule {
  manifest: TemplateManifest;
  packs: Record<string, ThemePack>;
  /** Paints instantly (before plates load). Returns a disposer. */
  loader(ctx: RenderContext): () => void;
  create(ctx: RenderContext): TemplateInstance;
}

export type InviteEvent = "opened" | "sceneView" | "rsvpOpen" | "shagunOpen" | "error" | "tier" | "ready";

export interface MountOptions {
  template: TemplateModule;
  themePack?: string;
  content: WeddingContent;
  guest: GuestVars;
  mode?: Mode;
  tier?: Tier;
  locale?: Locale;
  tone?: Tone;
  services?: GuestServices;
  assetsBase?: string;
  brandName?: string;
  largeText?: boolean;
  lite?: boolean;
  /** Skip the loader (used by tests/exports). */
  skipLoader?: boolean;
  /** Minimum time the loader stays up (ms) in interactive mode. */
  loaderMinMs?: number;
  dpr?: number;
  /** Re-mount straight into the opened state (used after footer toggles). */
  reopen?: boolean;
}

export interface Invite {
  readonly ready: Promise<void>;
  readonly tier: Tier;
  readonly storyboard: Storyboard | null;
  play(): void;
  seek(t: number): void;
  goTo(scene: SceneId): void;
  open(): void;
  on(e: InviteEvent, h: (p: unknown) => void): () => void;
  update(o: Partial<Omit<MountOptions, "template" | "content" | "guest">>): void;
  destroy(): void;
}

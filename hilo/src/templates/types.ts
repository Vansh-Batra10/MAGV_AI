import type { ComponentType } from "react";
import type { z } from "zod";
import type { Tier } from "@/config/pricing";
import type { Glow } from "@/config/occasions";
import type { GiftLanguage } from "@/config/markets";

export type L10n = { en: string; "hi-Latn": string; hi: string };
export type RenderMode = "live" | "preview" | "thumbnail" | "reel";
export type Mood = "cute" | "emotional" | "filmy" | "funny";
export type Relation = "partner" | "maa" | "papa" | "sibling" | "friend" | "group";

export type TemplateMeta = {
  slug: string;
  name: L10n & { global?: string };
  tagline: L10n;
  occasion: string[];
  moods: Mood[];
  relations: Relation[];
  mode: "individual" | "group" | "both";
  tier: Tier;
  photosMax: number;
  supportsVoice: boolean;
  supportsMusic: boolean;
  glow: Glow;
  theme: "night" | "paper";
  estMinutes: number;
  isNew: boolean;
  release: 1 | 2 | 3;
  /** Needs WebGL for its hero scene (lazy-loaded with a 2D fallback). */
  uses3d?: boolean;
  inside: L10n[];
  demoPoster: string;
  seasonalWindow?: string;
};

export type QuestionKind = "text" | "textarea" | "photos" | "voice" | "song" | "datetime" | "city" | "choice" | "number" | "list";

export type Question = {
  id: string;
  /** Dot path into content, e.g. "recipientName" or "stats.0.value". */
  field: string;
  kind: QuestionKind;
  prompt: L10n;
  hint?: L10n;
  placeholder?: L10n;
  optional?: boolean;
  max?: number;
  min?: number;
  choices?: { value: string; label: L10n }[];
  /** For photo questions writing into an array of objects (e.g. memories[].photo). */
  photoKey?: string;
};

export type ReplyKind = "heart" | "text" | "voice" | "answer";

export type GiftContext = {
  slug?: string;
  giftId?: string;
  lang: GiftLanguage;
  isFree?: boolean;
  is24h?: boolean;
  expiresAt?: string | null;
  senderFirstName?: string;
  recipientName?: string;
  /** Called by templates to send a reply/answer to the sender. */
  sendReply?: (r: { kind: ReplyKind; text?: string; voiceUrl?: string }) => Promise<void>;
  /** Group gifts: contributions loaded server-side. */
  contributions?: Contribution[];
  /** Reel mode: playback speed multiplier. */
  speed?: number;
  units?: "km" | "mi";
};

export type Contribution = { id: string; name: string; message: string; photoUrl?: string | null; voiceUrl?: string | null };

export type RendererProps<C> = {
  content: C;
  mode: RenderMode;
  watermark: boolean;
  ctx: GiftContext;
};

export type TemplateDef<C = any> = {
  meta: TemplateMeta;
  schema: z.ZodType<C>;
  questions: Question[];
  defaults: (lang: GiftLanguage) => C;
  /** Fields the AI auto-fill should write, with a description each. */
  aiFields: Record<string, string>;
  /** Canned auto-fill (MOCK mode / LLM failure): fills remaining text fields from the answers. */
  cannedFill: (answers: Partial<C>, lang: GiftLanguage) => Partial<C>;
};

export type TemplateModule<C = any> = { default: ComponentType<RendererProps<C>> };

export function pick(l: L10n, lang: GiftLanguage): string {
  return l[lang] ?? l.en;
}

export function displayName(meta: TemplateMeta, lang: GiftLanguage, market: "IN" | "GLOBAL"): string {
  if (market === "GLOBAL" && meta.name.global) return meta.name.global;
  return meta.name[lang] ?? meta.name.en;
}

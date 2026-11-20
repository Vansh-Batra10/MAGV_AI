import "server-only";

/**
 * Basic abuse filter. Deliberately small: blocks slurs/threat patterns, not affectionate swearing.
 * Real moderation happens via the report button + admin review.
 */
const BLOCK = [
  /\b(kill|murder|rape)\s+(you|u|her|him|yourself)\b/i,
  /\bkys\b/i,
  /\b(randi|chutiya\s+(hai|h)\s+tu|madarchod|behenchod)\b/i,
  /\b(n[i1]gg(er|a)s?|f[a@]gg?[o0]ts?)\b/i,
  /<\s*script/i,
];

export function moderate(text: string): { ok: boolean; reason?: string } {
  for (const r of BLOCK) if (r.test(text)) return { ok: false, reason: "blocked_term" };
  return { ok: true };
}

/** Plain-text sanitiser: we render everything as text, but strip control chars and cap length. */
export function clean(text: string, max = 2000) {
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").slice(0, max).trim();
}

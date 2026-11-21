import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "prompts");

export interface PromptSpec { text: string; size: { w: number; h: number }; alpha: boolean; personal: boolean }

/** Prompt = pack style block + slot prompt. Parses the OUTPUT line: size=WxH alpha=true|false personal=true. */
export function loadPrompt(template: string, pack: string, slot: string): PromptSpec | null {
  const slotFile = join(ROOT, template, pack, `${slot}.md`);
  if (!existsSync(slotFile)) return null;
  const style = existsSync(join(ROOT, template, pack, "_style.md")) ? readFileSync(join(ROOT, template, pack, "_style.md"), "utf8") : "";
  const body = readFileSync(slotFile, "utf8");
  const size = body.match(/size=(\d+)x(\d+)/);
  return {
    text: `${style.trim()}\n${body.trim()}`,
    size: size ? { w: Number(size[1]), h: Number(size[2]) } : { w: 1024, h: 1024 },
    alpha: /alpha=true/.test(body),
    personal: /personal=true/.test(body),
  };
}

/** Prompts must never name real people or ask for text/logos. */
export function lintPrompt(text: string): string[] {
  const issues: string[] = [];
  if (!/no text/i.test(text)) issues.push("missing 'no text' constraint");
  if (!/no logos?/i.test(text)) issues.push("missing 'no logos' constraint");
  if (/\b(shah rukh|deepika|priyanka|amitabh|virat|celebrity)\b/i.test(text.replace(/no celebrity likeness/i, ""))) issues.push("names a real person");
  return issues;
}

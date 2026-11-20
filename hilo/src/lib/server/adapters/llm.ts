import "server-only";
import { ENV, MOCK } from "../env";
import { log } from "../log";

export type LlmRequest = { system: string; user: string; maxTokens?: number; json?: boolean };

/** Returns null in MOCK mode or on failure — callers must have a canned fallback. */
export async function complete(req: LlmRequest): Promise<string | null> {
  if (MOCK.llm) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ENV.anthropicKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: ENV.anthropicModel,
        max_tokens: req.maxTokens ?? 1200,
        system: req.system,
        messages: [{ role: "user", content: req.user }],
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) throw new Error(`anthropic ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { content: { type: string; text?: string }[] };
    return data.content.filter((c) => c.type === "text").map((c) => c.text).join("").trim();
  } catch (err) {
    log.error("llm.failed", { error: String(err) });
    return null;
  }
}

export function extractJson<T>(text: string | null): T | null {
  if (!text) return null;
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as T;
  } catch {
    return null;
  }
}

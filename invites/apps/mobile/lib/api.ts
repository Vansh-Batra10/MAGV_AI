import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

/** The app talks to the same route handlers as the web studio (session cookie is kept by the native cookie store). */
export const API = (Constants.expoConfig?.extra?.apiUrl as string) ?? "http://localhost:3000";

export async function api<T = any>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    method: init.method ?? "GET", credentials: "include",
    headers: init.body ? { "content-type": "application/json" } : undefined,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  return r.json();
}

/** Offline-tolerant edits: mutations queue locally and replay in order; last-writer-wins on the server. */
const QUEUE_KEY = "inv.queue";
export async function queueMutation(path: string, method: string, body: unknown) {
  const q = JSON.parse((await SecureStore.getItemAsync(QUEUE_KEY)) ?? "[]");
  q.push({ path, method, body, at: Date.now() });
  await SecureStore.setItemAsync(QUEUE_KEY, JSON.stringify(q.slice(-200)));
}
export async function flushQueue(): Promise<number> {
  const q: { path: string; method: string; body: unknown }[] = JSON.parse((await SecureStore.getItemAsync(QUEUE_KEY)) ?? "[]");
  let done = 0;
  for (const m of q) { try { await api(m.path, { method: m.method, body: m.body }); done++; } catch { break; } }
  await SecureStore.setItemAsync(QUEUE_KEY, JSON.stringify(q.slice(done)));
  return done;
}

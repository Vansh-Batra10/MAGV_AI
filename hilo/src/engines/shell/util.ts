export function initials(name?: string | null) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}
export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

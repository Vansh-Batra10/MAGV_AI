/** MOCK mode is the default: every external service has a local mock. */
export function isMockMode(env: Record<string, string | undefined> = ((globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {})): boolean {
  const v = env.MOCK_MODE ?? env.NEXT_PUBLIC_MOCK_MODE;
  return v === undefined || v === "" || v === "true" || v === "1";
}

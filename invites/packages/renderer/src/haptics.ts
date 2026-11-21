/** Haptics are a nicety, never required. */
export function haptic(ms = 12): void {
  try { if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(Math.max(10, Math.min(15, ms))); } catch { /* ignore */ }
}

/** iOS needs an explicit permission request from a tap. Resolves true when orientation events may flow. */
export async function requestTilt(): Promise<boolean> {
  const D = (globalThis as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } }).DeviceOrientationEvent;
  if (!D) return false;
  if (typeof D.requestPermission === "function") {
    try { return (await D.requestPermission()) === "granted"; } catch { return false; }
  }
  return true;
}

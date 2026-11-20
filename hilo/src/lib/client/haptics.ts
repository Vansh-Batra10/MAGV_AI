export function haptic(pattern: number | number[] = 10) {
  try {
    if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
    // Autoplay/thumbnail scenes call this too; only vibrate after a real user gesture.
    const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
    if (ua && !ua.hasBeenActive) return;
    navigator.vibrate(pattern);
  } catch {
    /* unsupported */
  }
}

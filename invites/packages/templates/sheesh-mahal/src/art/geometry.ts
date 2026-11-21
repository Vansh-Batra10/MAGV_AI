/** Shared architectural geometry, in the 360×740 scene coordinate system. */

/**
 * A Mughal cusped (multifoil) arch opening, as a closed SVG path.
 * x0..x1 = opening width, spring = where the arch starts curving, apex = top, bottom = floor.
 */
export function cuspedArch(x0: number, x1: number, spring: number, apex: number, bottom: number, lobes = 4, depth = 0.35): string {
  const cx = (x0 + x1) / 2;
  // Base pointed-arch curve for the left half (quadratic, slightly ogee near the apex).
  const base = (u: number) => {
    const ctrlX = x0, ctrlY = apex + (spring - apex) * 0.05;
    const x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * ctrlX + u * u * cx;
    const y = (1 - u) * (1 - u) * spring + 2 * (1 - u) * u * ctrlY + u * u * apex;
    return [x, y] as const;
  };
  const pts: (readonly [number, number])[] = [];
  for (let i = 0; i <= lobes; i++) pts.push(base(i / lobes));
  let d = `M${x0},${bottom} L${x0},${spring}`;
  const arc = (a: readonly [number, number], b: readonly [number, number], mirror: boolean) => {
    const chord = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const r = chord / (2 * Math.sin(Math.PI * depth + 0.6)); // radius ≥ half chord
    return ` A${r.toFixed(2)},${r.toFixed(2)} 0 0 ${mirror ? 1 : 1} ${b[0].toFixed(2)},${b[1].toFixed(2)}`;
  };
  for (let i = 0; i < lobes; i++) d += arc(pts[i]!, pts[i + 1]!, false);
  // right half mirrored
  for (let i = lobes; i > 0; i--) {
    const a = pts[i]!, b = pts[i - 1]!;
    d += arc([2 * cx - a[0], a[1]], [2 * cx - b[0], b[1]], true);
  }
  d += ` L${x1},${bottom} Z`;
  return d;
}

/** Simple pointed arch (for windows / jharokhas). */
export function pointedArch(x: number, y: number, w: number, h: number, archH = w * 0.7): string {
  const cx = x + w / 2;
  return `M${x},${y + h} L${x},${y + archH} Q${x},${y + archH * 0.25} ${cx},${y} Q${x + w},${y + archH * 0.25} ${x + w},${y + archH} L${x + w},${y + h} Z`;
}

/** Onion dome on a drum: centre x, base y, width w, height h. */
export function onionDome(cx: number, baseY: number, w: number, h: number): string {
  const r = w / 2;
  return [
    `M${cx - r},${baseY}`,
    `C${cx - r * 1.25},${baseY - h * 0.45} ${cx - r * 0.55},${baseY - h * 0.72} ${cx - r * 0.12},${baseY - h * 0.88}`,
    `L${cx},${baseY - h}`,
    `L${cx + r * 0.12},${baseY - h * 0.88}`,
    `C${cx + r * 0.55},${baseY - h * 0.72} ${cx + r * 1.25},${baseY - h * 0.45} ${cx + r},${baseY}`,
    "Z",
  ].join(" ");
}

/** A chhatri (domed pavilion on pillars) silhouette. */
export function chhatri(cx: number, baseY: number, w: number): string {
  const h = w * 1.25;
  const plinth = `M${cx - w * 0.62},${baseY} h${w * 1.24} v-${w * 0.08} h-${w * 1.24} Z`;
  const pillars = [-0.45, -0.15, 0.15, 0.45].map((p) => `M${cx + p * w - w * 0.04},${baseY - w * 0.08} h${w * 0.08} v-${w * 0.42} h-${w * 0.08} Z`).join(" ");
  const eave = `M${cx - w * 0.7},${baseY - w * 0.5} h${w * 1.4} l-${w * 0.1},-${w * 0.09} h-${w * 1.2} Z`;
  const dome = onionDome(cx, baseY - w * 0.59, w * 0.95, h * 0.55);
  const finial = `M${cx - 1},${baseY - w * 0.59 - h * 0.55} h2 v-${w * 0.18} h-2 Z`;
  return [plinth, pillars, eave, dome, finial].join(" ");
}

/** Row of crenellations (kangura merlons) along a wall top. */
export function merlons(x0: number, x1: number, y: number, w = 9, h = 10): string {
  let d = "";
  for (let x = x0; x < x1 - w * 0.5; x += w * 1.25) {
    d += `M${x},${y} v-${h * 0.6} q0,-${h * 0.4} ${w / 2},-${h * 0.4} q${w / 2},0 ${w / 2},${h * 0.4} v${h * 0.6} Z `;
  }
  return d;
}

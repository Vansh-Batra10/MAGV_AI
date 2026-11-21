/**
 * Paper cut-out puppets. Each person is a rig of parts with pivots; poses are joint angles, so motion is
 * a pure function of time. Paper look = flat colour + a white "cut edge" stroke + a soft drop shadow.
 * Coordinates: origin at the feet centre, y up is negative, height ≈ 150.
 */
export type Joint = "armL" | "foreL" | "armR" | "foreR" | "head" | "body" | "hip";
export type Pose = Partial<Record<Joint, number>> & { y?: number; x?: number };

export interface PuppetLook {
  id: string;
  kind: "bride" | "groom" | "person";
  skin: string;
  hair: string;
  hairStyle: "bun" | "braid" | "short" | "curly" | "long";
  outfit: { main: string; accent: string; trim: string };
  glasses?: boolean;
  nosePin?: boolean;
  bindi?: boolean;
  beard?: boolean;
  turban?: string;
  dupatta?: boolean;
}

export interface RigJoint { pivot: [number, number]; parent?: Joint; min: number; max: number; length?: number; radius: number }

/** Rig definition (also exported as JSON for the admin rigging tool). */
export const RIG: Record<Joint, RigJoint> = {
  body: { pivot: [0, -60], min: -12, max: 12, radius: 14 },
  hip: { pivot: [0, -60], min: -10, max: 10, radius: 12 },
  head: { pivot: [0, -103], parent: "body", min: -20, max: 20, radius: 6 },
  armL: { pivot: [-14, -98], parent: "body", min: -60, max: 175, length: 25, radius: 5.2 },
  foreL: { pivot: [-14, -73], parent: "armL", min: -150, max: 30, length: 22, radius: 4.6 },
  armR: { pivot: [14, -98], parent: "body", min: -175, max: 60, length: 25, radius: 5.2 },
  foreR: { pivot: [14, -73], parent: "armR", min: -30, max: 150, length: 22, radius: 4.6 },
};

const EDGE = `stroke="#FFFDF6" stroke-width="1.6" stroke-linejoin="round"`;

function limb(x: number, y0: number, len: number, w: number, fill: string, cls: string) {
  // A capsule: round ends overlap the joint so rotation never opens a gap.
  return `<path class="${cls}" d="M${x - w / 2},${y0} v${len} a${w / 2},${w / 2} 0 0 0 ${w},0 v-${len} a${w / 2},${w / 2} 0 0 0 -${w},0 Z" fill="${fill}" ${EDGE}/>`;
}

function head(l: PuppetLook): string {
  const s = l.skin, hr = l.hair;
  const hy = -118;
  let hairBack = "", hairFront = "";
  switch (l.hairStyle) {
    case "bun": hairBack = `<circle cx="9" cy="${hy - 10}" r="9" fill="${hr}" ${EDGE}/>`; hairFront = `<path d="M-15,${hy} q0,-17 15,-17 q15,0 15,13 q-10,-8 -30,4 z" fill="${hr}"/>`; break;
    case "braid": hairBack = `<path d="M8,${hy + 4} q12,20 4,46 q-2,6 -6,0 q6,-24 -6,-42 z" fill="${hr}" ${EDGE}/>`; hairFront = `<path d="M-15,${hy + 2} q0,-19 15,-19 q15,0 15,15 q-14,-10 -30,4 z" fill="${hr}"/>`; break;
    case "long": hairBack = `<path d="M-16,${hy} q-4,34 4,44 h24 q8,-10 4,-44 z" fill="${hr}" ${EDGE}/>`; hairFront = `<path d="M-15,${hy + 1} q0,-18 15,-18 q15,0 15,16 q-16,-12 -30,2 z" fill="${hr}"/>`; break;
    case "curly": hairFront = Array.from({ length: 7 }, (_, i) => `<circle cx="${-13 + i * 4.4}" cy="${hy - 12 + Math.abs(3 - i) * 1.6}" r="5.2" fill="${hr}"/>`).join(""); break;
    default: hairFront = `<path d="M-15,${hy + 1} q-1,-18 15,-18 q16,0 15,15 q-6,-7 -16,-7 q-8,0 -14,10 z" fill="${hr}"/>`;
  }
  const turban = l.turban ? `<path d="M-17,${hy - 2} q0,-22 17,-22 q17,0 17,20 q-17,-6 -34,2 z" fill="${l.turban}" ${EDGE}/><path d="M-12,${hy - 10} q12,-10 24,-4" stroke="#fff" stroke-opacity=".5" stroke-width="1.5" fill="none"/>` : "";
  const glasses = l.glasses ? `<g fill="none" stroke="#231942" stroke-width="1.4"><circle cx="-6" cy="${hy + 1}" r="4.4"/><circle cx="6" cy="${hy + 1}" r="4.4"/><path d="M-1.6,${hy + 1} h3.2"/></g>` : "";
  const beard = l.beard ? `<path d="M-13,${hy + 4} q1,14 13,15 q12,-1 13,-15 q-5,6 -13,6 q-8,0 -13,-6 z" fill="${hr}"/>` : "";
  const bindi = l.bindi ? `<circle cx="0" cy="${hy - 6}" r="1.3" fill="#C8102E"/>` : "";
  const nose = l.nosePin ? `<circle cx="2.4" cy="${hy + 5}" r="1" fill="#F4D03F" stroke="#B8860B" stroke-width=".4"/>` : "";
  return `<g class="pp-head">${hairBack}<rect x="-4" y="${hy + 12}" width="8" height="8" fill="${s}"/><circle cx="0" cy="${hy}" r="15" fill="${s}" ${EDGE}/>
<circle cx="-15" cy="${hy + 2}" r="3" fill="${s}"/><circle cx="15" cy="${hy + 2}" r="3" fill="${s}"/>
<g class="pp-eyes"><path d="M-8,${hy + 1} q2.5,-2.4 5,0 M3,${hy + 1} q2.5,-2.4 5,0" stroke="#231942" stroke-width="1.5" fill="none" stroke-linecap="round"/></g>
<circle cx="-9" cy="${hy + 6}" r="2.6" fill="#E0218A" opacity=".25"/><circle cx="9" cy="${hy + 6}" r="2.6" fill="#E0218A" opacity=".25"/>
<path class="pp-mouth" d="M-4,${hy + 8} q4,4 8,0" stroke="#231942" stroke-width="1.4" fill="none" stroke-linecap="round"/>
${beard}${glasses}${bindi}${nose}${hairFront}${turban}</g>`;
}

export function puppetSvg(l: PuppetLook): string {
  const o = l.outfit, s = l.skin;
  const fem = l.kind === "bride" || (l.kind === "person" && (l.hairStyle === "bun" || l.hairStyle === "braid"));
  const arm = (side: "L" | "R") => {
    const sx = side === "L" ? -14 : 14;
    return `<g class="pp-arm${side}" data-pivot="${sx},-98">
${limb(sx, -98, 25, 9.5, o.main, "pp-upper")}
<g class="pp-fore${side}" data-pivot="${sx},-73">${limb(sx, -73, 20, 8.4, fem ? s : o.main, "pp-lower")}<circle class="pp-hand" cx="${sx}" cy="-50" r="4.6" fill="${s}" ${EDGE}/>
${fem ? `<path d="M${sx - 4},-68 h8 M${sx - 4},-65 h8" stroke="${o.trim}" stroke-width="1.6"/>` : ""}</g></g>`;
  };
  const lower = fem
    ? `<path d="M-13,-62 L13,-62 L34,-4 Q0,6 -34,-4 Z" fill="${o.main}" ${EDGE}/><path d="M-33,-8 Q0,2 33,-8" stroke="${o.trim}" stroke-width="3.5" fill="none"/><path d="M-26,-26 Q0,-18 26,-26" stroke="${o.accent}" stroke-width="2" fill="none" stroke-dasharray="3 3"/>
<ellipse cx="-9" cy="-1" rx="6" ry="3" fill="${o.accent}"/><ellipse cx="9" cy="-1" rx="6" ry="3" fill="${o.accent}"/>`
    : `<path d="M-11,-62 h9 v60 h-9 z" fill="${o.accent}" ${EDGE}/><path d="M2,-62 h9 v60 h-9 z" fill="${o.accent}" ${EDGE}/><ellipse cx="-7" cy="-1" rx="7" ry="3" fill="#3B2314"/><ellipse cx="7" cy="-1" rx="7" ry="3" fill="#3B2314"/>`;
  const torso = fem
    ? `<path d="M-15,-100 Q0,-104 15,-100 L13,-62 L-13,-62 Z" fill="${o.accent}" ${EDGE}/>${l.dupatta !== false ? `<path d="M-15,-100 Q4,-86 13,-62 L18,-60 Q8,-90 -10,-102 Z" fill="${o.trim}" opacity=".85"/>` : ""}`
    : `<path d="M-16,-100 Q0,-104 16,-100 L19,-38 Q0,-34 -19,-38 Z" fill="${o.main}" ${EDGE}/><path d="M0,-100 v58" stroke="${o.trim}" stroke-width="1.6" stroke-dasharray="1 4"/><path d="M-4,-101 l4,6 l4,-6" stroke="${o.trim}" stroke-width="1.6" fill="none"/>`;
  return `<g class="pp" data-id="${l.id}" filter="url(#rk-paper-shadow)">
<g class="pp-hip">${lower}</g>
<g class="pp-body">${arm("L")}${torso}${head(l)}${arm("R")}</g>
</g>`;
}

/** Apply a pose by setting SVG transforms around each joint's pivot (pure; no timeline needed). */
export function applyPose(root: Element, p: Pose): void {
  const set = (sel: string, deg: number | undefined, px: number, py: number) => {
    const el = root.querySelector(sel);
    if (el) el.setAttribute("transform", `rotate(${(deg ?? 0).toFixed(2)} ${px} ${py})`);
  };
  const clampJ = (j: Joint, v: number | undefined) => (v === undefined ? 0 : Math.max(RIG[j].min, Math.min(RIG[j].max, v)));
  set(".pp-body", clampJ("body", p.body), 0, -60);
  set(".pp-hip", clampJ("hip", p.hip), 0, -60);
  set(".pp-head", clampJ("head", p.head), 0, -103);
  set(".pp-armL", clampJ("armL", p.armL), -14, -98);
  set(".pp-foreL", clampJ("foreL", p.foreL), -14, -73);
  set(".pp-armR", clampJ("armR", p.armR), 14, -98);
  set(".pp-foreR", clampJ("foreR", p.foreR), 14, -73);
  (root as SVGGElement).style.transform = `translate(${(p.x ?? 0).toFixed(2)}px, ${(p.y ?? 0).toFixed(2)}px)`;
}

const sin = (t: number, f: number, ph = 0) => Math.sin(t * f * Math.PI * 2 + ph);

/** Idle: breathe 3 s, sway; blink handled separately. */
export function idlePose(t: number, phase = 0): Pose {
  return { body: sin(t, 1 / 3, phase) * 1.5, head: sin(t, 1 / 3, phase + 1) * 3, armL: 8 + sin(t, 1 / 3, phase) * 2, armR: -8 - sin(t, 1 / 3, phase) * 2, foreL: -6, foreR: 6, y: sin(t, 1 / 3, phase) * 0.8 };
}

export type Action = "idle" | "wave" | "laugh" | "showHands" | "dance" | "varmala" | "sway" | "jump" | "shrug" | "sad" | "ride";

export function actionPose(a: Action, t: number, phase = 0, side: 1 | -1 = 1): Pose {
  switch (a) {
    case "wave": return { ...idlePose(t, phase), armR: -150 * side, foreR: 40 + sin(t, 1.6) * 30 };
    case "laugh": return { body: sin(t, 3) * 4, head: -6 + sin(t, 3) * 5, armL: 120, foreL: -60, armR: -120, foreR: 60, y: -Math.abs(sin(t, 1.5)) * 4 };
    case "showHands": return { body: 0, head: 6, armL: 140, foreL: -110, armR: -140, foreR: 110 };
    case "dance": {
      const beat = Math.floor(t * 2) % 4;
      const poses: Pose[] = [
        { armL: 160, foreL: -40, armR: -60, foreR: 80, body: -6, hip: 6, head: 6 },
        { armL: 60, foreL: -90, armR: -160, foreR: 40, body: 6, hip: -6, head: -6 },
        { armL: 170, foreL: -20, armR: -170, foreR: 20, body: 0, hip: 0, head: 0 },
        { armL: 90, foreL: -120, armR: -90, foreR: 120, body: 4 * side, hip: -4 * side, head: 4 },
      ];
      const p = poses[beat]!;
      return { ...p, y: -Math.abs(sin(t, 2)) * 5 };
    }
    case "varmala": return { armL: 150, foreL: -100, armR: -150, foreR: 100, head: 4 * side, body: 3 * side };
    case "sway": return { body: sin(t, 0.4) * 5, hip: -sin(t, 0.4) * 3, head: sin(t, 0.4, 1) * 4, armL: 100, foreL: -40, armR: -100, foreR: 40, x: sin(t, 0.4) * 3 };
    case "jump": return { armL: 165, foreL: -10, armR: -165, foreR: 10, y: -Math.abs(sin(t, 1.4)) * 18, head: -4 };
    case "shrug": return { armL: 40, foreL: -100, armR: -40, foreR: 100, head: 10, body: 0 };
    case "sad": return { armL: 4, foreL: 0, armR: -4, foreR: 0, head: 14, body: 2 };
    case "ride": return { armL: -40, foreL: -60, armR: 40, foreR: 60, body: sin(t, 3) * 1.2, y: Math.abs(sin(t, 3)) * 1.5 };
    default: return idlePose(t, phase);
  }
}

/** Blink every 4–6 s (seeded by phase). Returns true when eyes are closed. */
export function blinking(t: number, phase: number): boolean {
  const period = 4 + (phase % 2);
  return (t + phase) % period < 0.12;
}

// ---- Default puppets (procedural, diverse; used when the couple has no personal AI puppets) ----
export const DEFAULT_LOOKS: PuppetLook[] = [
  { id: "bride-a", kind: "bride", skin: "#C68642", hair: "#1B1212", hairStyle: "braid", outfit: { main: "#E0218A", accent: "#F4B400", trim: "#F4B400" }, nosePin: true, bindi: true },
  { id: "groom-a", kind: "groom", skin: "#B07444", hair: "#1B1212", hairStyle: "short", outfit: { main: "#2E2A7A", accent: "#FFF1D6", trim: "#F4B400" }, glasses: true, beard: true },
  { id: "bride-b", kind: "bride", skin: "#8D5524", hair: "#120B0B", hairStyle: "bun", outfit: { main: "#0E5E4B", accent: "#E0218A", trim: "#F4B400" }, bindi: true },
  { id: "groom-b", kind: "groom", skin: "#E0AC69", hair: "#2B1A10", hairStyle: "curly", outfit: { main: "#FFF1D6", accent: "#2E2A7A", trim: "#E0218A" } },
];

const OUTFITS: Record<string, { bride: PuppetLook["outfit"]; groom: PuppetLook["outfit"] }> = {
  haldi: { bride: { main: "#F4B400", accent: "#FFF1D6", trim: "#0E5E4B" }, groom: { main: "#FFE07A", accent: "#FFF1D6", trim: "#0E5E4B" } },
  mehendi: { bride: { main: "#0E5E4B", accent: "#E0218A", trim: "#F4B400" }, groom: { main: "#7FB069", accent: "#FFF1D6", trim: "#E0218A" } },
  sangeet: { bride: { main: "#2E2A7A", accent: "#E0218A", trim: "#C0C0D8" }, groom: { main: "#1B1640", accent: "#2E2A7A", trim: "#E0218A" } },
  wedding: { bride: { main: "#C8102E", accent: "#F4B400", trim: "#F4B400" }, groom: { main: "#FFF1D6", accent: "#E8D9B0", trim: "#C8102E" } },
  reception: { bride: { main: "#C0C0D8", accent: "#2E2A7A", trim: "#FFFFFF" }, groom: { main: "#1B1640", accent: "#2A2A3A", trim: "#C0C0D8" } },
  cocktail: { bride: { main: "#E0218A", accent: "#1B1640", trim: "#F4B400" }, groom: { main: "#2A2A3A", accent: "#1B1640", trim: "#E0218A" } },
  custom: { bride: { main: "#E0218A", accent: "#F4B400", trim: "#F4B400" }, groom: { main: "#2E2A7A", accent: "#FFF1D6", trim: "#F4B400" } },
};

export function dressFor(look: PuppetLook, fn: string): PuppetLook {
  const set = OUTFITS[fn] ?? OUTFITS.custom!;
  const turban = look.kind === "groom" && fn === "wedding" ? "#F4B400" : look.turban;
  return { ...look, outfit: look.kind === "groom" ? set.groom : set.bride, turban };
}

/** Pet (indie dog) with a wagging tail. */
export function dogSvg(): string {
  return `<g class="pp-pet" filter="url(#rk-paper-shadow)">
<g class="pp-tail"><path d="M18,-22 q14,-6 16,-20" stroke="#C68642" stroke-width="5" fill="none" stroke-linecap="round"/></g>
<ellipse cx="0" cy="-18" rx="20" ry="11" fill="#D9A066" ${EDGE}/>
<path d="M-12,-10 v10 M-4,-10 v10 M6,-10 v10 M13,-10 v10" stroke="#C68642" stroke-width="4.5" stroke-linecap="round"/>
<circle cx="-20" cy="-30" r="10" fill="#D9A066" ${EDGE}/><path d="M-27,-36 l-3,-10 l9,5 z M-16,-38 l2,-10 l5,8 z" fill="#8B5A2B"/>
<circle cx="-23" cy="-31" r="1.4" fill="#231942"/><circle cx="-29" cy="-27" r="2" fill="#231942"/><path d="M-24,-24 q2,3 5,1" stroke="#231942" stroke-width="1" fill="none"/>
<path d="M-17,-21 q4,3 10,0" stroke="#E0218A" stroke-width="2.4" fill="none"/></g>`;
}

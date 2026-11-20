// Generates 12 tasteful placeholder "photos" (SVG compositions → WebP). No stock images, no real people.
import sharp from "sharp";
import fs from "node:fs";

const W = 900, H = 1125;
const sky = (id, stops) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient>`;
const couple = (x, y, s = 1, fill = "#1a0f22") => `
<g transform="translate(${x} ${y}) scale(${s})" fill="${fill}">
  <circle cx="-38" cy="-250" r="34"/><path d="M-90 -205 Q-38 -230 10 -205 L22 40 L-102 40 Z"/>
  <path d="M-30 -60 Q 0 -110 40 -150 L 52 -140 Q 20 -90 -8 -40Z"/>
  <circle cx="58" cy="-238" r="31"/><path d="M14 -196 Q58 -222 104 -196 Q 118 -60 128 40 L -6 40 Q 6 -80 14 -196Z"/>
  <path d="M 6 -150 Q -20 -40 -60 -20" stroke="${fill}" stroke-width="14" fill="none"/>
</g>`;
const grain = `<filter id="gr"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.06 0"/></filter><rect width="100%" height="100%" filter="url(#gr)"/>`;
const bokeh = (n, colors, seed) => {
  let s = seed, out = "";
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < n; i++) out += `<circle cx="${r() * W}" cy="${r() * H * 0.7}" r="${8 + r() * 46}" fill="${colors[i % colors.length]}" opacity="${0.12 + r() * 0.35}" filter="url(#blur)"/>`;
  return out;
};
const defs = `<filter id="blur"><feGaussianBlur stdDeviation="6"/></filter><filter id="soft"><feGaussianBlur stdDeviation="30"/></filter>`;

const scenes = {
  "sunset-beach": `${sky("s", [[0, "#2b1a4a"], [0.45, "#ff7a6b"], [0.62, "#ffc870"], [0.63, "#3a2a5a"], [1, "#1a1030"]])}
    <rect width="100%" height="100%" fill="url(#s)"/><circle cx="450" cy="700" r="120" fill="#ffd89a" opacity="0.9" filter="url(#soft)"/><circle cx="450" cy="700" r="80" fill="#fff0c9"/>
    <rect y="705" width="100%" height="420" fill="#2a1d48"/><path d="M0 760 Q 225 740 450 760 T 900 760" stroke="#ffc870" stroke-opacity="0.35" stroke-width="4" fill="none"/>
    ${couple(450, 1020, 1.25)}`,
  "city-lights": `${sky("s", [[0, "#0b0714"], [0.6, "#3b1f5c"], [1, "#6b3fa0"]])}<rect width="100%" height="100%" fill="url(#s)"/>
    ${bokeh(38, ["#ffc870", "#ff7a9c", "#c9b6ff", "#fff"], 7)}
    <g fill="#120b20">${Array.from({ length: 14 }, (_, i) => `<rect x="${i * 66}" y="${560 + ((i * 53) % 220)}" width="60" height="700"/>`).join("")}</g>
    <g fill="#ffc870" opacity="0.8">${Array.from({ length: 80 }, (_, i) => `<rect x="${(i * 97) % 880 + 8}" y="${620 + ((i * 131) % 380)}" width="8" height="12"/>`).join("")}</g>
    ${couple(450, 1125, 1.15, "#07040c")}`,
  "cafe-cups": `<rect width="100%" height="100%" fill="#2a1a22"/><rect y="640" width="100%" height="500" fill="#4a2c2a"/>
    <circle cx="200" cy="200" r="160" fill="#ffc870" opacity="0.25" filter="url(#soft)"/>
    <g transform="translate(300 640)"><ellipse cx="0" cy="40" rx="130" ry="26" fill="#f3e6d3"/><path d="M-90 -110 L90 -110 L72 30 L-72 30Z" fill="#fff8ef"/><ellipse cx="0" cy="-110" rx="90" ry="20" fill="#6b3a28"/><path d="M90 -80 q60 0 50 50 q-8 34 -60 30" stroke="#fff8ef" stroke-width="16" fill="none"/></g>
    <g transform="translate(610 660)"><ellipse cx="0" cy="40" rx="120" ry="24" fill="#f3e6d3"/><path d="M-80 -100 L80 -100 L64 30 L-64 30Z" fill="#ffe4ec"/><ellipse cx="0" cy="-100" rx="80" ry="18" fill="#8a4a30"/><path d="M-20 -104 q20 -14 40 0 q-20 14 -40 0" fill="#fff8ef" opacity="0.8"/></g>
    <path d="M300 470 q-20 -40 0 -80 q20 -40 0 -80" stroke="#fff" stroke-opacity="0.25" stroke-width="8" fill="none"/>`,
  "mountain-road": `${sky("s", [[0, "#1a0f2e"], [0.5, "#6b3fa0"], [0.75, "#ff8a65"], [1, "#ffc870"]])}<rect width="100%" height="100%" fill="url(#s)"/>
    <path d="M0 700 L180 420 L320 600 L520 340 L720 620 L900 460 L900 1125 L0 1125Z" fill="#2a1840"/>
    <path d="M0 820 L260 640 L460 780 L680 600 L900 760 L900 1125 L0 1125Z" fill="#1a0f2e"/>
    <path d="M380 1125 Q 450 900 470 760" stroke="#ffc870" stroke-opacity="0.5" stroke-width="40" fill="none"/>
    ${couple(560, 1000, 0.8, "#0b0714")}`,
  "rain-window": `<rect width="100%" height="100%" fill="#16122a"/>${bokeh(50, ["#ff7a9c", "#ffc870", "#c9b6ff"], 3)}
    <g stroke="#c9b6ff" stroke-opacity="0.3" stroke-width="3">${Array.from({ length: 40 }, (_, i) => `<line x1="${(i * 71) % 900}" y1="${(i * 113) % 1000}" x2="${((i * 71) % 900) - 6}" y2="${((i * 113) % 1000) + 60}"/>`).join("")}</g>
    <rect x="60" y="60" width="780" height="1005" fill="none" stroke="#2a2040" stroke-width="40"/><line x1="450" y1="60" x2="450" y2="1065" stroke="#2a2040" stroke-width="24"/>`,
  "fairy-lights": `<rect width="100%" height="100%" fill="#1a0f2e"/>
    ${[200, 420, 640].map((y, k) => `<path d="M-20 ${y} Q 450 ${y + 140} 920 ${y}" stroke="#3b2a50" stroke-width="3" fill="none"/>` + Array.from({ length: 12 }, (_, i) => { const t = i / 11; const x = -20 + 940 * t; const yy = y + 4 * 140 * t * (1 - t) * 0.5 * 2; return `<circle cx="${x}" cy="${yy}" r="16" fill="${["#ffc870", "#ff7a9c", "#fff8ef"][(i + k) % 3]}" opacity="0.9"/><circle cx="${x}" cy="${yy}" r="48" fill="${["#ffc870", "#ff7a9c", "#fff8ef"][(i + k) % 3]}" opacity="0.18" filter="url(#blur)"/>`; }).join("")).join("")}
    ${couple(450, 1125, 1.1, "#0b0714")}`,
  "polaroid-picnic": `${sky("s", [[0, "#ffd9b0"], [1, "#ff9c8a"]])}<rect width="100%" height="100%" fill="url(#s)"/>
    <rect y="700" width="100%" height="425" fill="#7a9a5a"/><g transform="translate(450 860) rotate(-6)"><rect x="-300" y="-90" width="600" height="220" fill="#ff4d7e"/>${Array.from({ length: 6 }, (_, i) => `<rect x="${-300 + i * 100}" y="-90" width="50" height="220" fill="#fff8ef" opacity="0.8"/>`).join("")}</g>
    <circle cx="700" cy="220" r="90" fill="#fff4d6"/>`,
  "night-moon": `${sky("s", [[0, "#05030a"], [1, "#2a1a4a"]])}<rect width="100%" height="100%" fill="url(#s)"/>
    <g fill="#fff">${Array.from({ length: 120 }, (_, i) => `<circle cx="${(i * 137) % 900}" cy="${(i * 89) % 700}" r="${(i % 5) * 0.5 + 0.6}" opacity="${0.3 + (i % 7) / 10}"/>`).join("")}</g>
    <circle cx="640" cy="260" r="150" fill="#c9b6ff" opacity="0.25" filter="url(#soft)"/><circle cx="640" cy="260" r="90" fill="#f4eeff"/><circle cx="672" cy="240" r="84" fill="#2a1a4a" opacity="0.15"/>
    <path d="M0 900 Q 300 820 600 880 T 900 860 L900 1125 L0 1125Z" fill="#0b0714"/>${couple(300, 960, 0.9, "#05030a")}`,
  "birthday-cake": `<rect width="100%" height="100%" fill="#1a0f2e"/><circle cx="450" cy="420" r="300" fill="#ffc870" opacity="0.2" filter="url(#soft)"/>
    <g transform="translate(450 720)"><ellipse cx="0" cy="170" rx="300" ry="40" fill="#120b20"/><rect x="-230" y="-10" width="460" height="170" rx="20" fill="#ffe4ec"/><path d="M-230 30 q38 40 76 0 t76 0 t76 0 t76 0 t76 0 t76 0" fill="#ff7a9c"/><rect x="-170" y="-130" width="340" height="130" rx="18" fill="#fff8ef"/>
    ${[-110, -40, 30, 100].map((x) => `<rect x="${x}" y="-210" width="16" height="84" rx="6" fill="#c9b6ff"/><ellipse cx="${x + 8}" cy="-232" rx="12" ry="22" fill="#ffc870"/><ellipse cx="${x + 8}" cy="-226" rx="5" ry="10" fill="#fff"/>`).join("")}</g>`,
  "festival-lamps": `<rect width="100%" height="100%" fill="#140a1e"/>${bokeh(30, ["#ffc870", "#ff8a65"], 11)}
    ${[150, 330, 510, 690].map((x, i) => `<g transform="translate(${x + 30} ${880 - (i % 2) * 40})"><path d="M-70 0 Q 0 70 70 0 Z" fill="#c8693a"/><ellipse cx="0" cy="0" rx="70" ry="14" fill="#8a3f22"/><ellipse cx="0" cy="-40" rx="16" ry="36" fill="#ffc870"/><ellipse cx="0" cy="-34" rx="7" ry="16" fill="#fff8ef"/><circle cx="0" cy="-40" r="80" fill="#ffc870" opacity="0.2" filter="url(#blur)"/></g>`).join("")}`,
  "snowy-street": `${sky("s", [[0, "#1a1034"], [1, "#3b2a5c"]])}<rect width="100%" height="100%" fill="url(#s)"/>
    <g fill="#fff">${Array.from({ length: 140 }, (_, i) => `<circle cx="${(i * 151) % 900}" cy="${(i * 97) % 1125}" r="${2 + (i % 4)}" opacity="${0.4 + (i % 5) / 10}"/>`).join("")}</g>
    <rect y="900" width="100%" height="225" fill="#e8e0f8"/><g fill="#120b20"><rect x="40" y="520" width="240" height="380"/><path d="M20 520 L160 400 L300 520Z"/><rect x="600" y="560" width="260" height="340"/><path d="M580 560 L730 450 L880 560Z"/></g>
    <g fill="#ffc870"><rect x="90" y="600" width="50" height="60"/><rect x="180" y="600" width="50" height="60"/><rect x="660" y="640" width="50" height="60"/><rect x="760" y="640" width="50" height="60"/></g>${couple(450, 990, 0.85, "#120b20")}`,
  "friends-group": `${sky("s", [[0, "#3b1f5c"], [1, "#ff7a9c"]])}<rect width="100%" height="100%" fill="url(#s)"/>${bokeh(26, ["#ffc870", "#fff"], 5)}
    <g fill="#1a0f22">${[120, 290, 460, 630, 790].map((x, i) => `<circle cx="${x}" cy="${700 - (i % 2) * 30}" r="${52 - (i % 3) * 4}"/><path d="M${x - 80} ${790 - (i % 2) * 30} Q ${x} ${740 - (i % 2) * 30} ${x + 80} ${790 - (i % 2) * 30} L ${x + 96} 1125 L ${x - 96} 1125Z"/>`).join("")}</g>
    <g stroke="#1a0f22" stroke-width="22" stroke-linecap="round">${[120, 790].map((x) => `<line x1="${x}" y1="800" x2="${x + (x < 400 ? -40 : 40)}" y2="560"/>`).join("")}</g>`,
};

fs.mkdirSync("public/demo", { recursive: true });
for (const [name, body] of Object.entries(scenes)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs>${body}${grain}</svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 78 }).toFile(`public/demo/${name}.webp`);
  console.log("✓", name);
}

import sharp from "sharp";
const svg = (s) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 64 64"><defs><radialGradient id="g" cx="50%" cy="40%"><stop offset="0" stop-color="#3B1F5C"/><stop offset="1" stop-color="#0B0714"/></radialGradient></defs><rect width="64" height="64" rx="14" fill="url(#g)"/><g transform="translate(0 15)"><path d="M4 24 C 14 24, 24 24, 32 22 C 26 18, 21 13, 21 9 C 21 5, 25 3.5, 28 4.5 C 30.5 5.3, 31.5 7, 32 9 C 32.5 7, 33.5 5.3, 36 4.5 C 39 3.5, 43 5, 43 9 C 43 13, 38 18, 32 22 C 40 24, 50 24, 60 24" fill="none" stroke="#FF4D7E" stroke-width="2.6" stroke-linecap="round"/><circle cx="4" cy="24" r="3" fill="#FF7A9C"/><circle cx="60" cy="24" r="3" fill="#FF7A9C"/></g></svg>`;
for (const s of [192, 512]) await sharp(Buffer.from(svg(s))).png().toFile(`public/icon-${s}.png`);
await sharp(Buffer.from(svg(180))).png().toFile("src/app/apple-icon.png");
await sharp(Buffer.from(svg(64))).png().toFile("src/app/icon.png");
console.log("icons ok");

export const CSS = `
.inv-sheesh-mahal{--backdrop:#0E1233;background:radial-gradient(120% 80% at 50% 0%, var(--sky2), var(--backdrop) 70%);color:var(--ivory);font-family:Martel,"Noto Serif Devanagari",Georgia,serif}
.sm-col{position:relative}
.sm-stage{position:relative;height:100svh;min-height:540px;overflow:hidden;background:var(--sky);isolation:isolate;touch-action:pan-y}
.inv-scripted .sm-stage{height:100%;min-height:0}
.sm-scene{position:absolute;left:50%;bottom:0;width:360px;height:740px;transform-origin:50% 100%;transform:translateX(-50%) scale(var(--s,1))}
.sm-layer{position:absolute;inset:0;will-change:transform}
.sm-layer>svg,.sm-svg{position:absolute;inset:0;width:100%;height:100%;display:block}
.sm-doors{position:absolute;inset:0;perspective:1200px;perspective-origin:180px 470px;transform-style:preserve-3d}
.sm-door{position:absolute;top:0;height:740px;width:100px;transform-style:preserve-3d;backface-visibility:visible;will-change:transform}
.sm-door svg{position:absolute;inset:0;width:100%;height:100%}
.sm-door-l{left:80px;transform-origin:0 50%}
.sm-door-r{left:180px;transform-origin:100% 50%}
.sm-plate{position:absolute;left:92px;top:174px;width:176px;height:42px;border-radius:3px;display:flex;align-items:center;justify-content:center;padding:0 10px;
 background:linear-gradient(180deg,#F7DC93 0%,var(--brass) 48%,#8A5D1E 100%);box-shadow:0 0 0 1.5px #6A4512,inset 0 0 0 3px rgba(255,241,194,.45),0 3px 6px rgba(0,0,0,.45)}
.sm-plate::before,.sm-plate::after{content:"";position:absolute;top:50%;width:4px;height:4px;margin-top:-2px;border-radius:50%;background:#5A3A10;box-shadow:inset 0 1px 0 rgba(255,255,255,.5)}
.sm-plate::before{left:5px}.sm-plate::after{right:5px}
.sm-plate-text{font-family:"Rozha One",serif;color:#4A2C08;text-shadow:0 1px 0 rgba(255,244,200,.65),0 -1px 0 rgba(60,30,0,.35);line-height:1.1;text-align:center;width:100%;font-size:20px;white-space:normal}
.sm-diya{position:absolute;width:60px;height:70px;top:640px}
.sm-diya svg{width:100%;height:100%;overflow:visible}
.sm-diya-l{left:16px}.sm-diya-r{left:284px}
.sm-particles{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:6}
.sm-flash{position:absolute;inset:0;background:radial-gradient(60% 45% at 50% 58%,#FFF6DA,rgba(255,214,140,.85) 45%,rgba(255,200,120,0) 100%);opacity:0;pointer-events:none;z-index:5}
.sm-css-petal{position:absolute;width:26px;height:16px;border-radius:50% 50% 50% 0;background:radial-gradient(circle at 30% 30%,#FFE08A,var(--marigold) 60%,var(--marigold-deep));opacity:0;z-index:6;pointer-events:none}
.sm-gate-ui{position:absolute;left:0;right:0;bottom:max(6svh,calc(env(safe-area-inset-bottom) + 24px));display:flex;flex-direction:column;align-items:center;gap:10px;z-index:8}
.sm-open-btn{appearance:none;border:0;cursor:pointer;padding:14px 26px;border-radius:999px;font-family:Martel,serif;font-weight:800;font-size:calc(16px*var(--inv-text-scale));letter-spacing:.01em;color:#3A2108;
 background:linear-gradient(180deg,#FFF1C2,var(--gold-2) 55%,#B8842A);box-shadow:0 0 0 1px rgba(90,58,16,.6),0 8px 24px rgba(0,0,0,.45),0 0 32px rgba(255,200,110,.35);min-height:48px}
.sm-hand{width:38px;height:38px;opacity:0;pointer-events:none;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5))}
.sm-hall{position:absolute;inset:0;opacity:0;z-index:4;visibility:hidden}
.sm-mosaic-canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.sm-hall-css{position:absolute;inset:0;background:
 radial-gradient(circle at 50% 50%,rgba(255,255,255,.22) 0 1.2px,transparent 1.8px) 0 0/14px 14px,
 radial-gradient(circle at 50% 50%,rgba(220,226,236,.18) 0 2.2px,transparent 3px) 7px 7px/14px 14px,
 linear-gradient(180deg,#0b0e26,#141a45)}
.sm-hall-frame{position:absolute;inset:0;pointer-events:none}
.sm-hall-vignette{position:absolute;inset:0;background:radial-gradient(80% 60% at 50% 48%,rgba(8,10,30,.72),rgba(8,10,30,.35) 70%,rgba(8,10,30,.2));opacity:0;pointer-events:none}
.sm-hero{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:clamp(28px,7svh,64px) 22px calc(96px + env(safe-area-inset-bottom));gap:calc(6px*var(--inv-text-scale))}
.sm-motif{width:52px;height:52px;color:var(--gold-2);margin-bottom:2px}
.sm-motifs{display:flex;gap:14px;justify-content:center}
.sm-motif svg{width:100%;height:100%}
.sm-invocation{font-weight:600;font-size:calc(13px*var(--inv-text-scale));color:var(--ivory);opacity:.92;letter-spacing:.02em}
.sm-blessing{font-size:calc(13.5px*var(--inv-text-scale));line-height:1.55;max-width:30ch;color:var(--ivory);opacity:.9}
.sm-names{display:flex;flex-direction:column;align-items:center;width:100%;margin:4px 0 6px}
.sm-name{font-family:"Rozha One",serif;line-height:1.08;width:100%;font-size:58px;
 background:linear-gradient(180deg,var(--gold-1) 0%,var(--gold-2) 46%,var(--gold-3) 58%,var(--gold-2) 80%,var(--gold-1) 100%);-webkit-background-clip:text;background-clip:text;color:transparent;
 filter:drop-shadow(0 1px 0 rgba(40,20,0,.55)) drop-shadow(0 0 18px rgba(255,200,110,.25));padding:0 4px}
.sm-amp{font-family:"Rozha One",serif;font-size:26px;color:var(--ivory);opacity:.85;line-height:1}
.sm-date{display:flex;align-items:center;gap:12px;margin-top:6px;color:var(--ivory)}
.sm-date-day{font-family:"Rozha One",serif;font-size:calc(54px*var(--inv-text-scale));line-height:1}
.sm-date-rest{display:flex;flex-direction:column;align-items:flex-start;text-align:left;font-size:calc(15px*var(--inv-text-scale));line-height:1.35}
.sm-date-rest b{font-weight:800}
.sm-family-line{font-style:italic;opacity:.85}
.sm-city{font-size:calc(14px*var(--inv-text-scale));opacity:.9;margin-top:2px}
.sm-note{font-size:calc(13px*var(--inv-text-scale));font-style:italic;opacity:.9;max-width:30ch;margin-top:4px}
.inv-root .sm-tilt{margin-top:4px;appearance:none;border:1px solid rgba(255,241,194,.3);background:rgba(10,12,40,.35);border-radius:999px;padding:5px 12px;font:600 12px/1.3 Martel,serif;color:var(--ivory);cursor:pointer;min-height:32px}
.sm-dock{position:absolute;left:12px;right:12px;bottom:calc(14px + env(safe-area-inset-bottom));display:flex;justify-content:center;gap:10px;z-index:9;opacity:0;visibility:hidden}
.sm-dock a{flex:1;max-width:120px;display:flex;flex-direction:column;align-items:center;gap:2px;padding:9px 6px 8px;text-decoration:none;color:var(--ivory);font-size:calc(12.5px*var(--inv-text-scale));font-weight:600;
 background:rgba(14,18,51,.72);border:1px solid rgba(255,241,194,.28);border-radius:14px;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);min-height:52px;justify-content:center}
.sm-dock a.sm-dock-primary{background:var(--accent);border-color:transparent}
.sm-dock svg{width:20px;height:20px}
.sm-sound{position:fixed;top:calc(10px + env(safe-area-inset-top));right:max(10px,calc(50vw - 220px + 10px));z-index:30;appearance:none;border:1px solid rgba(255,241,194,.35);background:rgba(14,18,51,.6);color:var(--ivory);
 width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(6px)}
.sm-sound svg{width:20px;height:20px}
.inv-scripted .sm-sound,.inv-scripted .sm-dock,.inv-scripted .sm-gate-ui,.inv-scripted .sm-tilt{display:none!important}
/* chambers */
.sm-chapters{position:relative;background:var(--backdrop)}
.sm-chamber{position:relative;height:100svh;min-height:600px;display:flex;flex-direction:column;overflow:hidden;background:var(--backdrop)}
.sm-chamber-art{position:relative;flex:1 1 auto;min-height:0}
.sm-chamber-art>svg{position:absolute;inset:0;width:100%;height:100%;display:block}
.sm-card{position:relative;flex:0 0 auto;margin:0 14px calc(16px + env(safe-area-inset-bottom));padding:16px 18px 14px;background:var(--card);color:var(--card-ink);border-radius:2px;
 box-shadow:0 0 0 1px var(--brass),inset 0 0 0 4px var(--card),inset 0 0 0 5px rgba(201,154,63,.55),0 10px 30px rgba(0,0,0,.45)}
.sm-card::before{content:"";position:absolute;left:50%;top:-11px;width:22px;height:22px;margin-left:-11px;transform:rotate(45deg);background:var(--card);box-shadow:0 0 0 1px var(--brass)}
.sm-card-k{font-size:calc(12.5px*var(--inv-text-scale));color:var(--accent);font-weight:800;margin:0}
.sm-card h3{font-family:"Rozha One",serif;font-weight:400;font-size:calc(30px*var(--inv-text-scale));line-height:1.1;margin:2px 0 0}
.sm-card .sm-alt{font-size:calc(14px*var(--inv-text-scale));opacity:.75;margin-left:6px;font-family:Martel,serif}
.sm-card p{margin:6px 0 0;font-size:calc(15px*var(--inv-text-scale));line-height:1.45}
.sm-card .sm-when{font-weight:800}
.sm-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.sm-chip{display:inline-flex;align-items:center;gap:6px;padding:3px 10px 3px 4px;border-radius:999px;background:rgba(30,35,79,.07);font-size:calc(13px*var(--inv-text-scale));font-weight:600}
.sm-chip i{width:16px;height:16px;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(0,0,0,.2)}
.sm-actions{display:flex;gap:8px;margin-top:12px}
.sm-actions a,.sm-actions button{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:44px;padding:8px 10px;border-radius:10px;font-weight:700;font-size:calc(14px*var(--inv-text-scale));text-decoration:none;cursor:pointer;border:1px solid rgba(30,35,79,.25);background:transparent;color:var(--card-ink)}
.sm-actions .sm-primary{background:var(--card-ink);color:var(--card);border-color:transparent}
.sm-actions svg{width:18px;height:18px}
/* montage (video) */
.sm-montage{position:absolute;inset:0;z-index:7;pointer-events:none}
.sm-montage .sm-chamber{position:absolute;inset:0;height:100%;min-height:0;opacity:0}
.sm-endcard{position:absolute;inset:0;z-index:8;opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;background:radial-gradient(90% 70% at 50% 40%,var(--sky2),var(--backdrop));padding:24px}
.sm-title-card{position:absolute;left:0;right:0;top:40%;padding:0 24px;text-align:center;font-family:"Rozha One",serif;font-size:40px;color:var(--ivory);z-index:8;opacity:0;text-shadow:0 2px 12px rgba(0,0,0,.6)}
/* lite / reduced */
.inv-lite .sm-layer,.inv-lite .sm-door{will-change:auto}
`;

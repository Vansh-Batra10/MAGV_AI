export const CSS = `
.inv-rang-kahani{background:var(--backdrop);color:var(--ink);font-family:"Baloo 2","Noto Sans Devanagari",system-ui,sans-serif}
.rk-stage{position:relative;height:100svh;min-height:560px;overflow:hidden;isolation:isolate;perspective:1400px;touch-action:pan-y}
.inv-scripted .rk-stage{height:100%;min-height:0}
.rk-cloth{position:absolute;inset:0}
.rk-cloth svg{width:100%;height:100%;display:block}
.rk-book{position:absolute;left:50%;top:46%;width:min(80%,330px);aspect-ratio:320/440;transform:translate(-50%,-50%);transform-style:preserve-3d}
.rk-pages{position:absolute;inset:0;background:var(--paper);border-radius:4px 10px 10px 4px;box-shadow:0 22px 40px rgba(0,0,0,.45),inset -6px 0 0 #e9dcc0,inset -8px 0 0 #fff8e8}
.rk-cover{position:absolute;inset:0;border-radius:4px 10px 10px 4px;transform-origin:0 50%;transform-style:preserve-3d;will-change:transform}
.rk-cover-front,.rk-cover-back{position:absolute;inset:0;border-radius:inherit;backface-visibility:hidden;-webkit-backface-visibility:hidden;overflow:hidden}
.rk-cover-front{background:var(--rani);box-shadow:inset 6px 0 0 rgba(0,0,0,.18)}
.rk-cover-back{transform:rotateY(180deg);background:var(--paper)}
.rk-cover-front>svg{position:absolute;inset:0;width:100%;height:100%}
.rk-cover-shade{position:absolute;inset:0;border-radius:inherit;background:linear-gradient(90deg,rgba(0,0,0,.35),rgba(0,0,0,0) 60%);opacity:0;pointer-events:none}
.rk-glint{position:absolute;inset:0;background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.35) 48%,transparent 60%);background-size:300% 100%;background-position:150% 0;pointer-events:none;mix-blend-mode:soft-light}
.rk-cover-art{position:absolute;left:0;right:0;top:20%;height:46%}
.rk-cover-art svg{width:100%;height:100%;overflow:visible}
.rk-title{position:absolute;left:8%;right:8%;top:6%;text-align:center}
.rk-truck{position:relative;font-family:"Yatra One",serif;line-height:1.08;color:var(--ink);
 text-shadow:0 2px 0 var(--ink),2px 0 0 var(--ink),0 -2px 0 var(--ink),-2px 0 0 var(--ink),2px 2px 0 var(--ink),-2px 2px 0 var(--ink),2px -2px 0 var(--ink),-2px -2px 0 var(--ink),4px 4px 0 var(--bottle),6px 6px 0 var(--ink)}
.rk-truck::after{content:attr(data-text);position:absolute;inset:0;text-shadow:none;color:transparent;-webkit-text-fill-color:transparent;pointer-events:none;
 background:linear-gradient(180deg,var(--fill,var(--turmeric)) 0 46%,#FFF6C9 46% 53%,var(--fill,var(--turmeric)) 53% 100%);-webkit-background-clip:text;background-clip:text}
.rk-title .rk-truck{font-size:34px}
.rk-title .rk-ki{display:block;font-family:"Baloo 2",sans-serif;font-weight:700;font-size:15px;color:var(--paper);margin-top:2px}
.rk-plate{position:absolute;left:50%;bottom:7%;transform:translateX(-50%) rotate(-3deg);background:var(--paper);color:var(--ink);padding:8px 16px 6px;border-radius:999px;font-weight:700;font-size:15px;white-space:nowrap;max-width:86%;overflow:hidden;text-overflow:clip;
 box-shadow:0 0 0 3px var(--turmeric),0 0 0 5px var(--ink),3px 5px 0 5px rgba(0,0,0,.25)}
.rk-gate-ui{position:absolute;left:0;right:0;bottom:max(5svh,calc(env(safe-area-inset-bottom) + 20px));display:flex;flex-direction:column;align-items:center;gap:8px;z-index:8}
.rk-open-btn{appearance:none;border:0;cursor:pointer;padding:13px 28px;border-radius:14px;font-family:"Baloo 2",sans-serif;font-weight:700;font-size:calc(18px*var(--inv-text-scale));color:var(--ink);background:var(--turmeric);box-shadow:0 0 0 3px var(--ink),5px 6px 0 3px var(--ink);min-height:50px;transform:rotate(-1.5deg)}
.rk-spread{position:absolute;inset:0;background:var(--paper);overflow:hidden;opacity:0;visibility:hidden}
.rk-spread::after,.rk-page::after{content:"";position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(rgba(35,25,66,.07) 1px,transparent 1.2px);background-size:5px 5px;opacity:.6}
.rk-scene{position:absolute;left:0;right:0;top:0;height:58%;perspective:900px;overflow:hidden}
.rk-scene>svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.rk-pop{transform-origin:50% 100%}
.rk-pop>svg{position:absolute;inset:0;width:100%;height:100%;display:block;overflow:visible}
.rk-bubble{position:absolute;max-width:62%;background:#fff;color:var(--ink);border-radius:18px;padding:8px 12px;font-weight:700;font-size:calc(15px*var(--inv-text-scale));line-height:1.25;box-shadow:0 0 0 2.5px var(--ink),3px 4px 0 2.5px var(--ink);z-index:4}
.rk-bubble::after{content:"";position:absolute;left:22px;bottom:-12px;border:8px solid transparent;border-top:10px solid #fff;filter:drop-shadow(0 2.5px 0 var(--ink))}
.rk-hero{position:absolute;left:0;right:0;top:56%;bottom:0;padding:6px 18px calc(84px + env(safe-area-inset-bottom));text-align:center;display:flex;flex-direction:column;align-items:center;gap:4px}
.rk-names{font-size:40px;margin:0;font-weight:400;width:100%}
.rk-date{font-weight:700;font-size:calc(19px*var(--inv-text-scale));color:var(--ink)}
.rk-kab{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:4px}
.rk-kab svg{width:18px;height:18px;flex:none}
.rk-kab a{white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis;display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:999px;background:var(--ink);color:var(--paper);text-decoration:none;font-weight:700;font-size:calc(14px*var(--inv-text-scale));min-height:40px}
.rk-formal{font-size:calc(14.5px*var(--inv-text-scale));line-height:1.45;max-width:32ch;margin:2px 0 0;color:var(--ink)}
.rk-note{font-size:calc(14px*var(--inv-text-scale));font-style:italic;margin:0;max-width:32ch}
.rk-dock{position:absolute;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));display:flex;gap:8px;justify-content:center;z-index:9;opacity:0;visibility:hidden}
.rk-dock a{flex:1;max-width:120px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;min-height:52px;border-radius:12px;background:var(--paper);color:var(--ink);text-decoration:none;font-weight:700;font-size:calc(13px*var(--inv-text-scale));box-shadow:0 0 0 2px var(--ink),3px 3px 0 2px var(--ink)}
.rk-dock a.rk-primary{background:var(--rani);color:#fff}
.rk-dock svg{width:20px;height:20px}
.rk-sound{position:fixed;top:calc(10px + env(safe-area-inset-top));right:max(10px,calc(50vw - 220px + 10px));z-index:30;appearance:none;border:0;background:var(--paper);color:var(--ink);width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 0 0 2px var(--ink),2px 3px 0 2px var(--ink)}
.rk-sound svg{width:20px;height:20px}
.inv-scripted .rk-sound,.inv-scripted .rk-dock,.inv-scripted .rk-gate-ui{display:none!important}
/* story */
.rk-page{position:relative;background:var(--paper);padding:34px 16px 26px;overflow:hidden}
.rk-page h2{font-family:"Yatra One",serif;font-weight:400;font-size:calc(30px*var(--inv-text-scale));margin:0 0 14px;color:var(--rani);text-align:center}
.rk-panels{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.rk-panel{position:relative;background:#fff;border:3px solid var(--ink);border-radius:4px;aspect-ratio:1/1.05;overflow:hidden;display:flex;flex-direction:column}
.rk-panel svg{flex:1;width:100%}
.rk-panel figcaption{font-size:calc(13px*var(--inv-text-scale));line-height:1.3;padding:6px 8px;font-weight:600;border-top:2px solid var(--ink);background:var(--paper)}
.rk-panel .rk-fill{transition:none}
/* function spreads */
.rk-fn{position:relative;height:100svh;min-height:620px;overflow:hidden;background:var(--c1);display:flex;flex-direction:column}
.rk-fn .rk-scene{position:relative;flex:1 1 auto;min-height:0;height:auto;top:auto}
.rk-fn-title{position:relative;padding:calc(12px + env(safe-area-inset-top)) 12px 0;text-align:center;z-index:3;flex:none}
.rk-fn-title .rk-truck{font-size:calc(38px*var(--inv-text-scale));--fill:var(--c2)}
.rk-ticket{position:relative;flex:none;margin:8px 14px calc(14px + env(safe-area-inset-bottom));background:var(--paper);color:var(--ink);border-radius:6px;padding:14px 16px 12px;box-shadow:0 0 0 2.5px var(--ink),5px 6px 0 2.5px var(--ink);
 -webkit-mask:radial-gradient(circle 9px at 0 62%,transparent 98%,#000) ,radial-gradient(circle 9px at 100% 62%,transparent 98%,#000);-webkit-mask-composite:source-in;mask-composite:intersect}
.rk-ticket h3{margin:0;font-family:"Yatra One",serif;font-weight:400;font-size:calc(26px*var(--inv-text-scale));line-height:1.1}
.rk-ticket .rk-alt{font-family:"Baloo 2",sans-serif;font-weight:500;font-size:calc(15px*var(--inv-text-scale));opacity:.75;margin-left:6px}
.rk-ticket p{margin:4px 0 0;font-size:calc(15.5px*var(--inv-text-scale));line-height:1.35}
.rk-ticket .rk-when{font-weight:700}
.rk-ticket hr{border:0;border-top:2px dashed rgba(35,25,66,.35);margin:10px 0 8px}
.rk-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
.rk-chip{display:inline-flex;align-items:center;gap:6px;padding:2px 10px 2px 3px;border-radius:999px;border:2px solid var(--ink);font-weight:700;font-size:calc(13px*var(--inv-text-scale))}
.rk-chip i{width:16px;height:16px;border-radius:50%;border:1.5px solid var(--ink)}
.rk-actions{display:flex;gap:8px}
.rk-actions a,.rk-actions button{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:44px;border-radius:10px;font-weight:700;font-size:calc(14.5px*var(--inv-text-scale));text-decoration:none;color:var(--ink);background:transparent;border:2px solid var(--ink);cursor:pointer;font-family:inherit}
.rk-actions .rk-primary{background:var(--ink);color:var(--paper)}
.rk-actions svg{width:18px;height:18px}
.rk-extra{position:relative;flex:none;margin:6px 14px 0;z-index:4;display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.rk-team{appearance:none;border:0;border-radius:999px;padding:6px 12px;font-weight:700;font-family:inherit;cursor:pointer;background:var(--paper);color:var(--ink);box-shadow:0 0 0 2px var(--ink);min-height:40px;font-size:14px}
.rk-team[aria-pressed="true"]{background:var(--c2);color:#fff}
.rk-song{display:flex;gap:6px;width:100%}
.rk-song input{flex:1;min-height:40px;border-radius:10px;border:2px solid var(--ink);padding:6px 10px;font:inherit;font-size:16px}
.rk-song button{border:0;border-radius:10px;background:var(--ink);color:var(--paper);font-weight:700;padding:0 14px;font-family:inherit}
.rk-palm{position:absolute;inset:0;z-index:6;background:rgba(35,25,66,.55);display:flex;align-items:center;justify-content:center}
.rk-palm svg{width:min(78%,300px)}
.rk-hand-hit{position:absolute;width:56px;height:56px;border-radius:50%;z-index:5;background:transparent;border:2px dashed rgba(255,255,255,.7);cursor:pointer}
/* rsvp / shagun / back cover */
.rk-rsvp-stage{position:relative;height:250px;margin:0 -18px 12px;background:var(--sky);overflow:hidden}
.rk-rsvp-stage svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.rk-gullak{display:flex;justify-content:center;margin:0 0 6px}
.rk-gullak svg{width:150px;height:130px;overflow:visible}
.rk-back{background:var(--rani);color:var(--paper);text-align:center;padding:40px 20px 34px;display:grid;gap:10px;justify-items:center}
.rk-back .rk-truck{font-size:calc(30px*var(--inv-text-scale))}
.rk-back button{appearance:none;border:0;border-radius:12px;background:var(--turmeric);color:var(--ink);font-weight:800;padding:10px 18px;min-height:48px;font-family:inherit;cursor:pointer;box-shadow:0 0 0 2px var(--ink),3px 4px 0 2px var(--ink);font-size:16px}
.rk-montage{position:absolute;inset:0;z-index:7}
.rk-montage>section{position:absolute;inset:0;height:100%;min-height:0;opacity:0}
.rk-endcard{position:absolute;inset:0;z-index:8;opacity:0;background:var(--rani);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;color:var(--paper);padding:24px}
`;

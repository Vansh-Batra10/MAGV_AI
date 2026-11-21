export const CSS = `
.inv-mohar{background:var(--backdrop);color:var(--ink);font-family:"EB Garamond","Tiro Devanagari Hindi",Georgia,serif}
.mh-stage{position:relative;height:100svh;min-height:560px;overflow:hidden;isolation:isolate;touch-action:pan-y}
.inv-scripted .mh-stage{height:100%;min-height:0}
.mh-velvet{position:absolute;inset:0}
.mh-velvet svg{width:100%;height:100%;display:block}
.mh-box{position:absolute;left:50%;top:45%;width:min(82%,320px);aspect-ratio:300/380;transform:translate(-50%,-50%);perspective:1100px;transform-style:preserve-3d}
.mh-box>div{position:absolute;inset:0}
.mh-box svg{width:100%;height:100%;display:block;overflow:visible}
.mh-shadow{inset:auto!important;left:3%!important;right:-4%!important;top:5%!important;bottom:-5%!important;background:rgba(0,0,0,.38);filter:blur(14px);border-radius:12px}
.mh-inside{inset:4%!important;overflow:hidden}
.mh-tis{position:absolute;top:4%!important;bottom:4%!important;width:46%;transform-style:preserve-3d}
.mh-tis-l{left:4%!important;right:auto!important;transform-origin:0 50%}
.mh-tis-r{right:4%!important;left:auto!important;transform-origin:100% 50%}
.mh-lid{transform-origin:50% 0;transform-style:preserve-3d;will-change:transform}
.mh-ribbon{position:absolute;inset:0;pointer-events:none}
.mh-lid>svg{position:absolute;inset:0}
.mh-seal{position:absolute!important;inset:auto!important;left:50%!important;top:60%!important;width:34%;aspect-ratio:1;transform:translate(-50%,-50%);cursor:pointer;touch-action:none;-webkit-user-select:none;user-select:none}
.mh-ring{position:absolute;inset:-14%;pointer-events:none}
.mh-ring circle{fill:none;stroke:var(--gold-hi);stroke-width:2.2;stroke-linecap:round;transform:rotate(-90deg);transform-origin:50% 50%}
.mh-tag{position:absolute!important;inset:auto!important;right:-6%!important;top:16%!important;width:44%;transform:rotate(8deg);transform-origin:0 0;pointer-events:none}
.mh-tag-card{background:var(--ivory);color:var(--ink);padding:10px 10px 8px 18px;border-radius:2px 8px 8px 2px;box-shadow:2px 4px 8px rgba(0,0,0,.35);font-family:"Bodoni Moda",serif;font-style:italic;font-size:15px;line-height:1.2;position:relative;clip-path:polygon(10% 0,100% 0,100% 100%,10% 100%,0 50%)}
.mh-tag-card::before{content:"";position:absolute;left:9px;top:50%;width:6px;height:6px;margin-top:-3px;border-radius:50%;background:var(--velvet);box-shadow:inset 0 1px 1px rgba(0,0,0,.5)}
.mh-tag-string{position:absolute;left:-30%;top:46%;width:34%;height:1.5px;background:var(--gold);transform:rotate(-12deg);transform-origin:100% 0}
.mh-hint{position:absolute;left:0;right:0;bottom:max(4svh,calc(env(safe-area-inset-bottom) + 14px));display:flex;flex-direction:column;align-items:center;gap:8px;z-index:8;text-align:center;color:var(--ivory)}
.mh-hint p{margin:0;font-family:"Bodoni Moda",serif;font-style:italic;font-size:calc(20px*var(--inv-text-scale));text-shadow:0 1px 6px rgba(0,0,0,.5)}
.mh-open-btn{appearance:none;border:1px solid var(--gold-hi);background:rgba(0,0,0,.22);color:var(--ivory);border-radius:999px;padding:9px 18px;font-family:"EB Garamond",serif;font-size:calc(16px*var(--inv-text-scale));cursor:pointer;min-height:44px}
.mh-card{position:relative;background:var(--ivory);color:var(--ink);border-radius:3px;
 background-image:radial-gradient(120% 80% at 15% 0%,rgba(255,255,255,.75),rgba(255,255,255,0) 55%),radial-gradient(100% 80% at 100% 100%,rgba(0,0,0,.06),rgba(0,0,0,0) 60%);
 box-shadow:0 1px 0 rgba(255,255,255,.8) inset,6px 10px 22px rgba(0,0,0,.35),2px 3px 4px rgba(0,0,0,.2)}
.mh-lp{text-shadow:0 1px 0 rgba(255,255,255,.85),0 -.5px 0 rgba(0,0,0,.25)}
.mh-main{position:absolute;left:50%;top:calc(env(safe-area-inset-top) + 2svh);width:min(90%,380px);height:min(68svh,600px);transform:translateX(-50%);padding:16px 18px 10px;display:flex;flex-direction:column;align-items:center;text-align:center;opacity:0;visibility:hidden;z-index:5}
.inv-scripted .mh-main{height:76%}
.mh-main::before{content:"";position:absolute;inset:7px;border:1px solid var(--gold);pointer-events:none}
.mh-main .mh-crest-s{width:56px;height:56px;flex:none}
.mh-main .mh-crest-s svg{width:100%;height:100%}
.mh-motif{width:30px;height:30px;color:var(--gold);flex:none}
.mh-motif svg{width:100%;height:100%}
.mh-invoc{margin:0;font-size:calc(12.5px*var(--inv-text-scale));letter-spacing:.02em;opacity:.85}
.mh-body{margin:4px 0 0;font-size:calc(14.5px*var(--inv-text-scale));line-height:1.45;max-width:30ch}
.mh-names{margin:4px 0 2px;font-family:"Bodoni Moda","Tiro Devanagari Hindi",serif;font-style:italic;font-weight:400;line-height:1.02;width:100%}
.mh-names span{display:block;font-size:42px}
.mh-names .mh-amp{font-size:22px;font-style:italic;color:var(--gold);margin:2px 0}
.mh-when{margin:2px 0 0;font-size:calc(16px*var(--inv-text-scale));font-weight:600}
.mh-where{margin:0;font-size:calc(15px*var(--inv-text-scale))}
.mh-venue-box{flex:1 1 auto;min-height:60px;width:100%;margin-top:6px;display:flex;align-items:flex-end;justify-content:center}
.mh-venue-box svg{width:100%;max-height:100%}
.mh-fan{position:absolute;left:0;right:0;bottom:calc(env(safe-area-inset-bottom) + 40px);height:110px;z-index:4;opacity:0;visibility:hidden}
.mh-mini{position:absolute;left:50%;bottom:0;width:104px;height:132px;margin-left:-52px;padding:10px 8px;transform-origin:50% 120%;cursor:pointer;font-size:12px;line-height:1.25;text-align:center;display:flex;flex-direction:column;align-items:center;gap:3px;border:0;font-family:inherit}
.mh-mini b{font-family:"Bodoni Moda",serif;font-style:italic;font-weight:400;font-size:17px}
.mh-mini i{width:24px;height:6px;border-radius:3px;display:block}
.mh-dock{position:absolute;left:12px;right:12px;bottom:calc(10px + env(safe-area-inset-bottom));display:flex;gap:8px;justify-content:center;z-index:9;opacity:0;visibility:hidden}
.mh-dock a{flex:1;max-width:120px;min-height:48px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;text-decoration:none;color:var(--ivory);font-size:calc(13px*var(--inv-text-scale));border:1px solid rgba(227,196,138,.55);border-radius:10px;background:rgba(0,0,0,.25);backdrop-filter:blur(4px)}
.mh-dock a.mh-primary{background:var(--ivory);color:var(--ink);border-color:transparent}
.mh-dock svg{width:19px;height:19px}
.mh-sound{position:fixed;top:calc(10px + env(safe-area-inset-top));right:max(10px,calc(50vw - 220px + 10px));z-index:30;appearance:none;border:1px solid var(--gold-hi);background:rgba(0,0,0,.25);color:var(--ivory);width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer}
.mh-sound svg{width:20px;height:20px}
.inv-scripted .mh-sound,.inv-scripted .mh-dock,.inv-scripted .mh-hint{display:none!important}
/* viewer */
.mh-viewer{position:fixed;inset:0;z-index:40;background:rgba(20,6,16,.78);display:flex;align-items:center;justify-content:center;touch-action:pan-y}
.mh-viewer .mh-read{width:min(88vw,380px);min-height:50svh;padding:26px 22px;font-size:16px;text-align:center}
.mh-viewer .mh-close{position:absolute;top:calc(12px + env(safe-area-inset-top));right:max(12px,calc(50vw - 220px + 12px));width:44px;height:44px;border-radius:50%;border:1px solid var(--gold-hi);background:transparent;color:var(--ivory);font-size:22px;cursor:pointer}
.mh-viewer .mh-nav{position:absolute;bottom:calc(20px + env(safe-area-inset-bottom));color:var(--ivory);font-size:14px}
/* functions under stained glass */
.mh-fns{position:relative;background:var(--ivory);overflow:hidden;padding:0 16px 30px}
.mh-sg{position:relative;width:100%;max-width:340px;margin:0 auto;aspect-ratio:1/1}
.mh-sg svg{width:100%;height:100%}
.mh-pool{position:absolute;width:280px;height:280px;border-radius:50%;filter:blur(30px);mix-blend-mode:multiply;opacity:.38;pointer-events:none;z-index:0}
.mh-fn{position:relative;z-index:1;margin:14px auto 0;max-width:380px;padding:18px 18px 14px;text-align:center}
.mh-fn::before{content:"";position:absolute;inset:6px;border:1px solid var(--gold);pointer-events:none}
.mh-pane{display:inline-block;width:34px;height:8px;border-radius:4px;margin-bottom:6px}
.mh-fn h3{margin:0;font-family:"Bodoni Moda","Tiro Devanagari Hindi",serif;font-style:italic;font-weight:400;font-size:calc(28px*var(--inv-text-scale))}
.mh-fn .mh-alt{display:block;font-size:calc(15px*var(--inv-text-scale));opacity:.7;font-style:normal;font-family:"Tiro Devanagari Hindi","EB Garamond",serif}
.mh-fn p{margin:6px 0 0;font-size:calc(16px*var(--inv-text-scale));line-height:1.4}
.mh-fn .mh-wh{font-weight:600}
.mh-chips{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:8px}
.mh-chip{display:inline-flex;align-items:center;gap:6px;font-size:calc(14px*var(--inv-text-scale))}
.mh-chip i{width:14px;height:14px;border-radius:50%;box-shadow:0 0 0 1px var(--gold)}
.mh-actions{display:flex;gap:8px;margin-top:12px}
.mh-actions a{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:44px;border-radius:2px;border:1px solid var(--ink);color:var(--ink);text-decoration:none;font-size:calc(15px*var(--inv-text-scale))}
.mh-actions .mh-p{background:var(--ink);color:var(--ivory)}
.mh-actions svg{width:17px;height:17px}
.mh-h2{font-family:"Bodoni Moda",serif;font-style:italic;font-weight:400;text-align:center;font-size:calc(30px*var(--inv-text-scale));margin:6px 0 0;position:relative;z-index:1}
/* story photo corners */
.mh-story{background:var(--ivory);padding:10px 16px 30px}
.mh-photo{position:relative;margin:16px auto 0;max-width:300px;padding:10px;background:#fff;box-shadow:3px 5px 12px rgba(0,0,0,.18);transform:rotate(var(--r,0deg))}
.mh-photo .mh-ph{aspect-ratio:4/3;background:linear-gradient(135deg,var(--opal1),var(--opal2),var(--opal3));display:flex;align-items:center;justify-content:center}
.mh-photo img{width:100%;display:block;aspect-ratio:4/3;object-fit:cover}
.mh-photo::before,.mh-photo::after{content:"";position:absolute;width:26px;height:26px;background:var(--ink);opacity:.85}
.mh-photo::before{left:-4px;top:-4px;clip-path:polygon(0 0,100% 0,0 100%)}
.mh-photo::after{right:-4px;bottom:-4px;clip-path:polygon(100% 0,100% 100%,0 100%)}
.mh-photo figcaption{font-style:italic;text-align:center;margin-top:8px;font-size:calc(15px*var(--inv-text-scale))}
/* reply card tick boxes */
.inv-mohar .inv-seg .inv-btn{border-radius:2px;justify-content:flex-start;gap:10px;font-weight:400;border-color:rgba(43,27,38,.35)}
.inv-mohar .inv-seg .inv-btn::before{content:"";width:18px;height:18px;border:1.5px solid var(--ink);flex:none;background:linear-gradient(var(--ink),var(--ink)) no-repeat center/0% 0%;transition:background-size .35s ease}
.inv-mohar .inv-seg .inv-btn[aria-pressed="true"]{background:transparent;color:var(--ink);border-color:var(--ink)}
.inv-mohar .inv-seg .inv-btn[aria-pressed="true"]::before{background-size:70% 70%}
.mh-reply-head{text-align:center;margin-bottom:12px}
.mh-reply-head .mh-crest-s{width:64px;height:64px;margin:0 auto}
.mh-ashirwad{margin-top:14px}
.mh-sig{width:100%;height:130px;background:#fff;border:1px dashed var(--gold);touch-action:none;display:block;border-radius:2px}
.mh-envelope{display:flex;justify-content:center;margin:0 0 6px}
.mh-envelope svg{width:180px}
.mh-closing{display:flex;justify-content:center;margin:16px 0 0}
.mh-closing svg{width:160px}
.inv-mohar .inv-block{border-radius:2px;border-color:var(--gold);transform-style:preserve-3d}
.mh-montage{position:absolute;inset:0;z-index:7}
.mh-montage>.mh-fn{position:absolute;left:6%;right:6%;top:50%;transform:translateY(-50%);margin:0;opacity:0}
.mh-endcard{position:absolute;inset:0;z-index:8;opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;color:var(--ivory);padding:24px}
.mh-endcard .mh-crest-s{width:110px;height:110px}
.mh-opal{background:linear-gradient(110deg,var(--opal1),var(--opal2),var(--opal3),var(--opal1));background-size:300% 100%}
`;

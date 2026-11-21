/** Shared guest-page sections, styled entirely through template tokens (--sec-*). */
export const SECTIONS_CSS = `
.inv-sections{position:relative;background:var(--sec-bg);color:var(--sec-ink);font-family:var(--sec-font-text);padding:8px 0 0}
.inv-sec{padding:40px 18px 8px}
.inv-sec h2{font-family:var(--sec-font-display);font-weight:var(--sec-display-weight,400);font-size:calc(30px*var(--inv-text-scale));line-height:1.15;margin:0 0 14px;color:var(--sec-heading,var(--sec-ink))}
.inv-sec p{line-height:1.55}
.inv-panel{background:var(--sec-card);color:var(--sec-card-ink);border-radius:var(--sec-radius,4px);padding:16px;box-shadow:var(--sec-card-shadow,0 0 0 1px var(--sec-line))}
.inv-panel+.inv-panel{margin-top:10px}
.inv-fn{display:grid;grid-template-columns:56px 1fr;gap:12px;align-items:start}
.inv-fn-date{text-align:center;border-right:1px solid var(--sec-line);padding-right:10px}
.inv-fn-date b{display:block;font-family:var(--sec-font-display);font-size:calc(28px*var(--inv-text-scale));line-height:1}
.inv-fn-date span{font-size:calc(12px*var(--inv-text-scale));display:block;margin-top:2px}
.inv-fn h3{margin:0;font-family:var(--sec-font-display);font-weight:var(--sec-display-weight,400);font-size:calc(21px*var(--inv-text-scale))}
.inv-fn p{margin:3px 0 0;font-size:calc(14.5px*var(--inv-text-scale))}
.inv-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.inv-btn{appearance:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:44px;padding:9px 14px;border-radius:var(--sec-btn-radius,10px);border:1px solid var(--sec-line);background:transparent;color:inherit;font:inherit;font-weight:700;font-size:calc(14.5px*var(--inv-text-scale));text-decoration:none;cursor:pointer}
.inv-btn svg{width:18px;height:18px;flex:none}
.inv-btn-primary{background:var(--sec-accent);color:var(--sec-accent-ink,#fff);border-color:transparent}
.inv-btn[aria-pressed="true"]{background:var(--sec-accent);color:var(--sec-accent-ink,#fff);border-color:transparent}
.inv-btn:disabled{opacity:.5;cursor:not-allowed}
.inv-map{display:block;width:100%;aspect-ratio:16/9;border-radius:var(--sec-radius,4px);overflow:hidden;margin:10px 0 0;background:#e9e4da}
.inv-map svg{width:100%;height:100%;display:block}
.inv-story{display:grid;gap:10px}
.inv-story figure{margin:0}
.inv-story img{width:100%;border-radius:var(--sec-radius,4px);display:block}
.inv-story figcaption{font-size:calc(15px*var(--inv-text-scale));line-height:1.5}
.inv-story-n{font-family:var(--sec-font-display);font-size:calc(22px*var(--inv-text-scale));color:var(--sec-accent);margin-right:6px}
.inv-blocks{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
.inv-block{appearance:none;text-align:left;cursor:pointer;border:1px solid var(--sec-line);background:var(--sec-card);color:var(--sec-card-ink);border-radius:var(--sec-radius,4px);padding:12px;min-height:96px;display:flex;flex-direction:column;gap:4px;font:inherit}
.inv-block .e{font-size:24px;line-height:1}
.inv-block b{font-size:calc(14.5px*var(--inv-text-scale))}
.inv-block .amt{font-family:var(--sec-font-display);font-size:calc(19px*var(--inv-text-scale))}
.inv-block small{opacity:.75;font-size:calc(12.5px*var(--inv-text-scale))}
.inv-safety{font-size:calc(13px*var(--inv-text-scale));padding:10px 12px;border-left:3px solid var(--sec-accent);background:var(--sec-note-bg,rgba(0,0,0,.04));margin:10px 0}
.inv-sheet-back{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:60;display:flex;align-items:flex-end;justify-content:center}
.inv-sheet{width:100%;max-width:440px;background:var(--sec-card);color:var(--sec-card-ink);border-radius:18px 18px 0 0;padding:20px 18px calc(20px + env(safe-area-inset-bottom));max-height:90svh;overflow:auto;font-family:var(--sec-font-text)}
.inv-sheet h3{margin:0 0 6px;font-family:var(--sec-font-display);font-weight:var(--sec-display-weight,400);font-size:calc(24px*var(--inv-text-scale))}
.inv-qr{width:200px;height:200px;margin:12px auto;display:block;padding:8px;background:#fff}
.inv-qr svg{width:100%;height:100%}
.inv-form{display:grid;gap:14px}
.inv-field label,.inv-legend{display:block;font-weight:700;font-size:calc(14px*var(--inv-text-scale));margin-bottom:6px}
.inv-field input,.inv-field select,.inv-field textarea{width:100%;min-height:44px;padding:10px 12px;border-radius:10px;border:1px solid var(--sec-line);background:var(--sec-input-bg,#fff);color:var(--sec-card-ink);font:inherit;font-size:16px}
.inv-field textarea{min-height:80px;resize:vertical}
.inv-seg{display:flex;flex-wrap:wrap;gap:6px}
.inv-seg .inv-btn{flex:1 1 auto;min-width:0}
.inv-stepper{display:inline-flex;align-items:center;gap:10px}
.inv-stepper button{width:44px;height:44px;border-radius:50%;border:1px solid var(--sec-line);background:transparent;font-size:20px;cursor:pointer;color:inherit}
.inv-stepper output{min-width:2ch;text-align:center;font-weight:800;font-size:18px}
.inv-check{display:flex;align-items:center;gap:10px;min-height:44px;font-weight:600}
.inv-check input{width:22px;height:22px;accent-color:var(--sec-accent)}
.inv-rsvp-fn{border-top:1px solid var(--sec-line);padding-top:12px}
.inv-rsvp-fn:first-child{border-top:0;padding-top:0}
.inv-rsvp-fn h4{margin:0 0 8px;font-size:calc(16px*var(--inv-text-scale))}
.inv-counts{display:flex;gap:18px;margin-top:10px;flex-wrap:wrap}
.inv-msg{font-weight:700;padding:10px 12px;border-radius:10px;background:var(--sec-note-bg,rgba(0,0,0,.05))}
.inv-faq details{border-bottom:1px solid var(--sec-line);padding:12px 0}
.inv-faq summary{cursor:pointer;font-weight:700;font-size:calc(16px*var(--inv-text-scale));min-height:32px}
.inv-faq p{margin:8px 0 0}
.inv-footer{padding:36px 18px calc(40px + env(safe-area-inset-bottom));font-size:calc(13.5px*var(--inv-text-scale));text-align:center;display:grid;gap:12px;justify-items:center}
.inv-footer .inv-row{justify-content:center}
.inv-footer a{opacity:.85}
.inv-banner{position:fixed;left:50%;transform:translateX(-50%);top:calc(10px + env(safe-area-inset-top));width:calc(100% - 76px);max-width:364px;z-index:29;background:var(--sec-card);color:var(--sec-card-ink);border-radius:12px;padding:10px 12px;box-shadow:0 8px 24px rgba(0,0,0,.35);font-size:calc(14px*var(--inv-text-scale));display:flex;gap:10px;align-items:center;margin-left:-22px}
.inv-banner b{font-weight:800}
.inv-banner button{margin-left:auto;appearance:none;border:0;background:transparent;font-size:20px;cursor:pointer;color:inherit;min-width:32px;min-height:32px}
.inv-banner a{font-weight:700}
.inv-watermark{position:fixed;inset:0;pointer-events:none;z-index:50;display:flex;align-items:center;justify-content:center;font-size:42px;font-weight:800;color:rgba(255,255,255,.18);transform:rotate(-28deg);letter-spacing:.2em;text-shadow:0 0 2px rgba(0,0,0,.2)}
`;

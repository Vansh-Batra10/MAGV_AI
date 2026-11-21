"use client";
import { useState } from "react";
import { TEMPLATES } from "@/lib/content/marketing";

/** The hero is a real invite (not a video). It loads on tap so the marketing page stays fast. */
export function LiveDemo({ tapLabel }: { tapLabel: string }) {
  const [i, setI] = useState(0);
  const [live, setLive] = useState(false);
  const t = TEMPLATES[i]!;
  return (
    <div>
      <div className="mk-phone">
        {live ? <iframe title={`${t.name} live demo`} src={t.demo} allow="autoplay; vibrate" /> : <>
          <img src={`/marketing/${t.id}.jpg`} alt={`${t.name} invitation`} width={360} height={740} fetchPriority="high" />
          <button aria-label={`${tapLabel}: ${t.name}`} onClick={() => setLive(true)} />
          <span style={{ position: "absolute", left: "50%", bottom: 22, transform: "translateX(-50%)", background: "rgba(0,0,0,.55)", color: "#fff", padding: "6px 14px", borderRadius: 999, fontWeight: 700, pointerEvents: "none", whiteSpace: "nowrap" }}>{tapLabel}</span>
        </>}
      </div>
      <div className="mk-switch" role="group" aria-label="Templates">{TEMPLATES.map((x, j) => <button key={x.id} aria-pressed={i === j} onClick={() => { setI(j); setLive(false); }}>{x.name}</button>)}</div>
    </div>
  );
}

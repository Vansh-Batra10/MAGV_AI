"use client";
import { useState } from "react";
import { useLocale } from "next-intl";
import { RENDERERS } from "@/templates/renderers";
import { getTemplate } from "@/templates/registry";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import type { GiftLanguage } from "@/config/markets";

/** Interactive live demo in a phone frame (preview mode — taps work, replies are explained). */
export function TemplatePlayer({ slug }: { slug: string }) {
  const lang = useLocale() as GiftLanguage;
  const tpl = getTemplate(slug)!;
  const R = RENDERERS[slug];
  const [k, setK] = useState(0);
  const c = tpl.defaults(lang);
  return (
    <div className="mx-auto max-w-[340px]">
      <PhoneFrame tilt>
        <R key={k} content={c} mode="preview" watermark={false} ctx={{ lang, recipientName: c.recipientName, senderFirstName: c.senderName, isFree: tpl.meta.tier === "free" }} />
      </PhoneFrame>
      <button type="button" onClick={() => setK(k + 1)} className="mx-auto mt-3 block text-xs text-mid underline-offset-4 hover:underline">↺ Replay</button>
    </div>
  );
}

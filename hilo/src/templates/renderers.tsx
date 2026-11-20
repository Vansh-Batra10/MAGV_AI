"use client";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { RendererProps } from "./types";

/** Each renderer is its own chunk, so a gift page only downloads the template it shows. */
const loading = () => <div className="h-full w-full bg-ink-950" />;
export const RENDERERS: Record<string, ComponentType<RendererProps<any>>> = {
  "quick-surprise": dynamic(() => import("./quick-surprise/Renderer"), { loading }),
  "laal-dhaaga": dynamic(() => import("./laal-dhaaga/Renderer"), { loading }),
  "midnight-birthday": dynamic(() => import("./midnight-birthday/Renderer"), { loading }),
  "sorry-wala-meter": dynamic(() => import("./sorry-wala-meter/Renderer"), { loading }),
  "snow-globe": dynamic(() => import("./snow-globe/Renderer"), { loading }),
  "our-year-rewound": dynamic(() => import("./our-year-rewound/Renderer"), { loading }),
  "sab-ki-taraf-se": dynamic(() => import("./sab-ki-taraf-se/Renderer"), { loading }),
};

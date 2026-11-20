"use client";
import { createContext, useContext } from "react";
import { SITES, type SiteKey } from "@/config/markets";

const Ctx = createContext<SiteKey>("global");
export function SiteProvider({ site, children }: { site: SiteKey; children: React.ReactNode }) {
  return <Ctx.Provider value={site}>{children}</Ctx.Provider>;
}
export function useSite() {
  const site = useContext(Ctx);
  return { site, ...SITES[site], href: (p: string) => (SITES[site].prefix + (p === "/" ? "" : p)) || "/" };
}

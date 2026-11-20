import { NextResponse, type NextRequest } from "next/server";

/**
 * Edition routing:
 *   /...        → Global edition (en)        → rewrite /m/global/...
 *   /in/...     → India edition (Hinglish)   → rewrite /m/in/...
 *   /in/en/...  → India edition (English)    → rewrite /m/in-en/...
 *   /in/hi/...  → India edition (Hindi)      → rewrite /m/in-hi/...
 * App routes (/create, /g, /c, /checkout, /dashboard, /api, …) are not prefixed.
 */
const MARKETING = /^\/(?:$|gifts(?:\/[\w-]+)?$|for\/[\w-]+$|t\/[\w-]+$|group$|long-distance$|pricing$|reviews$|guides(?:\/[\w-]+)?$|about$|contact$|privacy$|terms$|refunds$|delivery$|partners$)/;

function siteFor(pathname: string): { site: string; rest: string } | null {
  let site = "global";
  let rest = pathname;
  if (pathname === "/in" || pathname.startsWith("/in/")) {
    rest = pathname.slice(3) || "/";
    site = "in";
    if (rest === "/en" || rest.startsWith("/en/")) {
      site = "in-en";
      rest = rest.slice(3) || "/";
    } else if (rest === "/hi" || rest.startsWith("/hi/")) {
      site = "in-hi";
      rest = rest.slice(3) || "/";
    }
  }
  return MARKETING.test(rest) ? { site, rest } : null;
}

const YEAR = 60 * 60 * 24 * 365;

export function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Internal rewrite target must never be addressed directly.
  if (pathname.startsWith("/m/")) {
    const [, , site, ...rest] = pathname.split("/");
    const prefix = site === "in" ? "/in" : site === "in-en" ? "/in/en" : site === "in-hi" ? "/in/hi" : "";
    const url = req.nextUrl.clone();
    url.pathname = (prefix + "/" + rest.join("/")).replace(/\/$/, "") || "/";
    return NextResponse.redirect(url);
  }

  const match = siteFor(pathname);
  const country = req.headers.get("x-vercel-ip-country") ?? searchParams.get("country") ?? "";
  let res: NextResponse;

  if (match) {
    // First visit only: send Indian visitors to the India edition. Never override a manual choice.
    const chosen = req.cookies.get("hilo_site")?.value;
    if (!chosen && match.site === "global" && country === "IN") {
      const url = req.nextUrl.clone();
      url.pathname = "/in" + (match.rest === "/" ? "" : match.rest);
      res = NextResponse.redirect(url);
      res.cookies.set("hilo_site", "in", { maxAge: YEAR, path: "/" });
      return withCommonCookies(req, res, country);
    }
    const url = req.nextUrl.clone();
    url.pathname = `/m/${match.site}${match.rest === "/" ? "" : match.rest}`;
    const headers = new Headers(req.headers);
    headers.set("x-hilo-site", match.site);
    headers.set("x-hilo-path", match.rest);
    res = NextResponse.rewrite(url, { request: { headers } });
    if (!chosen) res.cookies.set("hilo_site", match.site, { maxAge: YEAR, path: "/" });
  } else {
    res = NextResponse.next();
  }
  return withCommonCookies(req, res, country);
}

function withCommonCookies(req: NextRequest, res: NextResponse, country: string) {
  if (!req.cookies.get("hilo_anon")) res.cookies.set("hilo_anon", crypto.randomUUID(), { maxAge: YEAR, path: "/", sameSite: "lax" });
  if (!req.cookies.get("hilo_ab")) res.cookies.set("hilo_ab", Math.random() < 0.5 ? "A" : "B", { maxAge: YEAR, path: "/", sameSite: "lax" });
  if (country && req.cookies.get("hilo_country")?.value !== country) res.cookies.set("hilo_country", country, { maxAge: 60 * 60 * 24, path: "/" });
  const sp = req.nextUrl.searchParams;
  const utm: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref", "partner"]) {
    const v = sp.get(k);
    if (v) utm[k] = v.slice(0, 80);
  }
  if (Object.keys(utm).length) res.cookies.set("hilo_utm", JSON.stringify(utm), { maxAge: 60 * 60 * 24 * 30, path: "/", sameSite: "lax" });
  return res;
}

export const config = {
  matcher: ["/((?!api|_next|favicon|icon|apple-icon|manifest|sw\\.js|demo|fonts|og|robots\\.txt|sitemap).*)"],
};

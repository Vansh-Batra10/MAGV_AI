import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/g/", "/c/", "/dashboard", "/admin", "/studio", "/brand", "/create", "/checkout", "/success", "/group/", "/api/", "/m/"] }],
    sitemap: [`${SITE_URL}/sitemap.xml`],
  };
}

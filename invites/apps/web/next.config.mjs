/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ["@invites/ai-assets", "@invites/db", "@invites/renderer", "@invites/config", "@invites/content-schema", "@invites/i18n", "@invites/template-sheesh-mahal", "@invites/template-rang-kahani", "@invites/template-mohar"],
  poweredByHeader: false,
  devIndicators: false,
  serverExternalPackages: [],
  async headers() {
    return [{ source: "/fonts/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }, { key: "Access-Control-Allow-Origin", value: "*" }] }];
  },
};
export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ["@invites/ai-assets", "@invites/db", "@invites/renderer", "@invites/config", "@invites/content-schema", "@invites/i18n", "@invites/template-sheesh-mahal", "@invites/template-rang-kahani", "@invites/template-mohar"],
  poweredByHeader: false,
  devIndicators: false,
  serverExternalPackages: [],
  async headers() {
    const dev = process.env.NODE_ENV !== "production";
    const csp = [
      "default-src 'self'", `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`, "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:", "font-src 'self' data:", "connect-src 'self'", "media-src 'self' blob:", "frame-src 'self'",
      "frame-ancestors 'self'", "base-uri 'self'", "form-action 'self'", "object-src 'none'",
    ].join("; ");
    const security = [
      { key: "Content-Security-Policy", value: csp },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), accelerometer=(self), gyroscope=(self)" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
    ];
    return [
      { source: "/:path*", headers: security },{ source: "/fonts/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }, { key: "Access-Control-Allow-Origin", value: "*" }] }];
  },
};
export default nextConfig;

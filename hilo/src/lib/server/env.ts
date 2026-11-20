import "server-only";

/** Central env access. Any missing service credential → that service runs in MOCK mode. */
const e = process.env;

export const ENV = {
  databaseUrl: e.DATABASE_URL || e.SUPABASE_DB_URL || "",
  supabaseUrl: e.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseServiceKey: e.SUPABASE_SERVICE_ROLE_KEY || "",
  supabaseBucket: e.SUPABASE_STORAGE_BUCKET || "gift-media",
  razorpayKeyId: e.RAZORPAY_KEY_ID || "",
  razorpayKeySecret: e.RAZORPAY_KEY_SECRET || "",
  razorpayWebhookSecret: e.RAZORPAY_WEBHOOK_SECRET || "",
  whatsappToken: e.WHATSAPP_TOKEN || "",
  whatsappPhoneId: e.WHATSAPP_PHONE_NUMBER_ID || "",
  twilioSid: e.TWILIO_ACCOUNT_SID || "",
  twilioToken: e.TWILIO_AUTH_TOKEN || "",
  twilioFrom: e.TWILIO_FROM || "",
  resendKey: e.RESEND_API_KEY || "",
  emailFrom: e.EMAIL_FROM || "Hilo <hello@hilo.example>",
  anthropicKey: e.ANTHROPIC_API_KEY || "",
  anthropicModel: e.ANTHROPIC_MODEL || "claude-sonnet-5-5",
  authSecret: e.AUTH_SECRET || "dev-only-insecure-secret-change-me-please-32b",
  adminEmails: (e.ADMIN_EMAILS || "admin@hilo.example").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
  cronSecret: e.CRON_SECRET || "",
  dataDir: e.HILO_DATA_DIR || ".data",
  siteUrl: e.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  upstashUrl: e.UPSTASH_REDIS_REST_URL || "",
  upstashToken: e.UPSTASH_REDIS_REST_TOKEN || "",
  fakeNow: e.HILO_FAKE_NOW || "",
};

export const MOCK = {
  db: !ENV.databaseUrl,
  payments: !(ENV.razorpayKeyId && ENV.razorpayKeySecret),
  whatsapp: !(ENV.whatsappToken && ENV.whatsappPhoneId),
  sms: !(ENV.twilioSid && ENV.twilioToken),
  email: !ENV.resendKey,
  llm: !ENV.anthropicKey,
  storage: !(ENV.supabaseUrl && ENV.supabaseServiceKey),
};

export const IS_PROD = e.NODE_ENV === "production";

/** Server clock. HILO_FAKE_NOW (ISO) lets e2e tests time-travel; also via the `hilo_now` cookie in mock mode. */
export function now(): Date {
  return ENV.fakeNow ? new Date(ENV.fakeNow) : new Date();
}

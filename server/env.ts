/**
 * Environment variables for the yfit-admin service.
 * All secrets are injected via Railway environment variables.
 */
export const ENV = {
  // Server
  port: parseInt(process.env.PORT ?? "3000"),
  isProduction: process.env.NODE_ENV === "production",

  // Database (shared MySQL/TiDB with yfit-marketing)
  databaseUrl: process.env.DATABASE_URL ?? "",

  // Session signing secret
  cookieSecret: process.env.JWT_SECRET ?? "fallback-dev-secret-do-not-use-in-prod",

  // Accounting dashboard admin PIN
  accountingAdminPin: process.env.ACCOUNTING_ADMIN_PIN ?? "",

  // Stripe (read-only restricted key for income sync)
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",

  // Email (Resend)
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  reportRecipient: "support@yfitai.com",
  reportSender: "noreply@yfitai.com",

  // Analytics — Umami
  umamiEndpoint: process.env.VITE_ANALYTICS_ENDPOINT ?? "https://manus-analytics.com",
  umamiWebsiteId: process.env.VITE_ANALYTICS_WEBSITE_ID ?? "9d198333-8322-4848-9258-0476c99e5df5",

  // Analytics — Upload-Post social media
  uploadPostApiKey: process.env.UPLOAD_POST_API_KEY ?? "",
  facebookPageId: "972545122618897",

  // Manus Forge API (for LLM analytics summaries)
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

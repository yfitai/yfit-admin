export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Analytics
  umamiEndpoint: process.env.VITE_ANALYTICS_ENDPOINT ?? "https://manus-analytics.com",
  umamiWebsiteId: process.env.VITE_ANALYTICS_WEBSITE_ID ?? "9d198333-8322-4848-9258-0476c99e5df5",
  uploadPostApiKey: process.env.UPLOAD_POST_API_KEY ?? "",
  facebookPageId: "972545122618897",
  // Email
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  reportRecipient: "support@yfitai.com",
  reportSender: "noreply@yfitai.com",
};

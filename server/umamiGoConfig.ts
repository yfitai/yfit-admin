/** Server-only preparation. Operator gates are documented evidence, never HTTP-200 detection. */
export function umamiGoConfig(env: NodeJS.ProcessEnv = process.env) {
  const readApiKey = env.YFIT_UMAMI_READ_API_KEY?.trim() || null;
  return {
    readApiKey,
    scopeVerified:
      Boolean(readApiKey) && env.YFIT_UMAMI_GO_SCOPE_VERIFIED === "true",
    sourceScopeVerified:
      Boolean(readApiKey) && env.YFIT_UMAMI_GO_SOURCE_SCOPE_VERIFIED === "true",
  };
}

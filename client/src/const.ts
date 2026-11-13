export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const LOGIN_CONFIGURATION_ERROR_MESSAGE =
  "Sign-in is unavailable because authentication configuration is missing or invalid. Please contact the administrator.";

export class LoginConfigurationError extends Error {
  constructor() {
    super(LOGIN_CONFIGURATION_ERROR_MESSAGE);
    this.name = "LoginConfigurationError";
  }
}

// Resolve only when starting login, so the callback reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const isConfigured = (value: unknown): value is string =>
    typeof value === "string" &&
    value.trim().length > 0 &&
    value !== "undefined" &&
    value !== "null";

  if (!isConfigured(oauthPortalUrl) || !isConfigured(appId)) {
    throw new LoginConfigurationError();
  }

  let portal: URL;
  try {
    portal = new URL(oauthPortalUrl);
  } catch {
    // Never expose the candidate URL or a native parser error to users/logs.
    throw new LoginConfigurationError();
  }
  if (
    !["https:", "http:"].includes(portal.protocol) ||
    portal.username ||
    portal.password ||
    portal.search ||
    portal.hash
  ) {
    throw new LoginConfigurationError();
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  // Preserve the SDK's existing base64 redirect URI state contract.
  const state = btoa(redirectUri);
  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

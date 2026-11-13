import { getLoginUrl, LOGIN_CONFIGURATION_ERROR_MESSAGE } from "@/const";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { TRPCClientError } from "@trpc/client";
import { toast } from "sonner";

// Called by query/mutation cache error events, never during render.
export const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;
  if (error.message !== UNAUTHED_ERR_MSG) return;

  try {
    window.location.href = getLoginUrl();
  } catch {
    toast.error(LOGIN_CONFIGURATION_ERROR_MESSAGE);
  }
};

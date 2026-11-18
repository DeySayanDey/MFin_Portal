import "server-only";

import { ApiError } from "@/lib/api/errors";

export type SupportApiConfig = {
  url: string;
  key: string;
  secret: string;
};

/**
 * Server-only support desk credentials.
 * Raise sends the API key and the project domain. The API secret is not sent.
 * Never import this from a Client Component.
 */
export function getSupportApiConfig(): SupportApiConfig {
  const url = process.env.SUPPORT_API_URL?.trim().replace(/\/+$/, "") ?? "";
  const key = process.env.SUPPORT_API_KEY?.trim() ?? "";
  const secret = process.env.SUPPORT_API_SECRET?.trim() ?? "";

  let validUrl = false;
  try {
    const parsed = new URL(url);
    validUrl = parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    validUrl = false;
  }

  if (!validUrl || !key) {
    throw new ApiError({
      message: "Support API is not configured",
      status: 500,
      code: "UNEXPECTED",
    });
  }

  return { url, key, secret };
}

/** Domain raise. API key only. No secret and no client token. */
export function supportKeyHeaders(config: SupportApiConfig): HeadersInit {
  return {
    "X-Api-Key": config.key,
    Accept: "application/json",
  };
}

/** List and detail. Key and client token. The API secret must not be sent. */
export function supportClientListHeaders(
  config: SupportApiConfig,
  clientToken: string,
): HeadersInit {
  return {
    "X-Api-Key": config.key,
    "X-Client-Token": clientToken,
    Accept: "application/json",
  };
}

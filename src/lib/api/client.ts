import { env } from "@/lib/config/env";
import { joinApiUrl, toApiPath } from "@/lib/api/endpoints";
import {
  ApiError,
  mapStatusToApiErrorCode,
  toNetworkApiError,
  toTimeoutApiError,
} from "@/lib/api/errors";
import type { LaravelResponse } from "@/types/api";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiSearchParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export type ApiRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
  searchParams?: ApiSearchParams;
  /** Override default timeout in milliseconds. Set `false` to disable. */
  timeoutMs?: number | false;
  /** Override configured public API base URL (tests / advanced use). */
  baseUrl?: string;
  /**
   * Bearer token for Laravel Authorization header.
   * Prefer passing from server-side session helpers — never from localStorage.
   */
  accessToken?: string | null;
  /** When false, skip Laravel envelope unwrapping and return raw JSON. */
  expectEnvelope?: boolean;
};

const DEFAULT_TIMEOUT_MS = 30_000;

function buildUrl(
  path: string,
  searchParams: ApiSearchParams | undefined,
  baseUrl: string,
): string {
  const url = new URL(joinApiUrl(baseUrl, toApiPath(path)));

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }

  const text = await response.text();
  return text.length > 0 ? text : undefined;
}

function createAbortSignal(
  timeoutMs: number | false | undefined,
  external?: AbortSignal,
): { signal: AbortSignal | undefined; cleanup: () => void } {
  if (timeoutMs === false && !external) {
    return { signal: undefined, cleanup: () => undefined };
  }

  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const onExternalAbort = () => {
    controller.abort(external?.reason);
  };

  if (external) {
    if (external.aborted) {
      controller.abort(external.reason);
    } else {
      external.addEventListener("abort", onExternalAbort, { once: true });
    }
  }

  if (timeoutMs !== false) {
    const ms = timeoutMs ?? DEFAULT_TIMEOUT_MS;
    timeoutId = setTimeout(() => {
      controller.abort(new DOMException("Request timed out", "TimeoutError"));
    }, ms);
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (external) external.removeEventListener("abort", onExternalAbort);
    },
  };
}

function isLaravelEnvelope(value: unknown): value is LaravelResponse<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    typeof (value as { success: unknown }).success === "boolean" &&
    "message" in value &&
    typeof (value as { message: unknown }).message === "string"
  );
}

/**
 * Central HTTP client for Laravel backend communication.
 *
 * Intended call chain:
 * Feature UI → Feature service → apiClient → Laravel
 *
 * Does not store secrets. Auth tokens must be supplied from server session / BFF.
 */
export async function apiClient<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const {
    method = "GET",
    body,
    headers,
    signal,
    searchParams,
    timeoutMs,
    baseUrl = env.NEXT_PUBLIC_API_BASE_URL,
    accessToken,
    expectEnvelope = true,
  } = options;

  const url = buildUrl(path, searchParams, baseUrl);
  const { signal: requestSignal, cleanup } = createAbortSignal(
    timeoutMs,
    signal,
  );

  const requestHeaders = new Headers(headers);
  if (body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }
  if (accessToken) {
    requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: requestSignal,
      // Browser never holds the Laravel token; server/BFF calls use Bearer header.
      credentials: "omit",
      cache: "no-store",
    });

    const payload = await parseResponseBody(response);

    if (!response.ok) {
      const message =
        isLaravelEnvelope(payload) && typeof payload.message === "string"
          ? payload.message
          : typeof payload === "object" &&
              payload !== null &&
              "message" in payload &&
              typeof (payload as { message: unknown }).message === "string"
            ? (payload as { message: string }).message
            : `Request failed with status ${response.status}`;

      throw new ApiError({
        message,
        status: response.status,
        code: mapStatusToApiErrorCode(response.status),
        details: isLaravelEnvelope(payload) ? payload.errors : payload,
      });
    }

    if (expectEnvelope && isLaravelEnvelope(payload)) {
      if (!payload.success) {
        throw new ApiError({
          message: payload.message || "Request failed",
          status: response.status,
          code: mapStatusToApiErrorCode(response.status || 400),
          details: payload.errors,
        });
      }
      return payload.data as TResponse;
    }

    return payload as TResponse;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (
      error instanceof DOMException &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      if (error.name === "TimeoutError" || signal?.aborted !== true) {
        throw toTimeoutApiError(error);
      }
    }

    if (error instanceof TypeError) {
      throw toNetworkApiError(error);
    }

    throw toNetworkApiError(error);
  } finally {
    cleanup();
  }
}

export const api = {
  get: <T>(path: string, options?: Omit<ApiRequestOptions, "method" | "body">) =>
    apiClient<T>(path, { ...options, method: "GET" }),
  post: <T>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ) => apiClient<T>(path, { ...options, method: "POST", body }),
  put: <T>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ) => apiClient<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ) => apiClient<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(
    path: string,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ) => apiClient<T>(path, { ...options, method: "DELETE" }),
};

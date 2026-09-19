export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "TIMEOUT"
  | "NETWORK"
  | "SERVER"
  | "UNEXPECTED";

export type ApiErrorInit = {
  message: string;
  status: number;
  code: ApiErrorCode;
  details?: unknown;
};

/**
 * Normalized application API error.
 * UI layers should map `code` to next-intl `errors.*` keys — never show raw backend payloads.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: unknown;

  constructor({ message, status, code, details }: ApiErrorInit) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get isUnauthorized(): boolean {
    return this.code === "UNAUTHORIZED";
  }

  get isForbidden(): boolean {
    return this.code === "FORBIDDEN";
  }

  get isNotFound(): boolean {
    return this.code === "NOT_FOUND";
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

export function mapStatusToApiErrorCode(status: number): ApiErrorCode {
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 408 || status === 504) return "TIMEOUT";
  if (status === 400 || status === 422) return "VALIDATION";
  if (status >= 500) return "SERVER";
  return "UNEXPECTED";
}

export function toNetworkApiError(cause?: unknown): ApiError {
  return new ApiError({
    message: "Network request failed",
    status: 0,
    code: "NETWORK",
    details: cause,
  });
}

export function toTimeoutApiError(cause?: unknown): ApiError {
  return new ApiError({
    message: "Request timed out",
    status: 408,
    code: "TIMEOUT",
    details: cause,
  });
}

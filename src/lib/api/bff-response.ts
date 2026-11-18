import "server-only";

import { NextResponse } from "next/server";
import { ApiError, isApiError, type ApiErrorCode } from "@/lib/api/errors";
import { isProductionEnv } from "@/lib/config/env";

const SAFE_MESSAGE: Record<ApiErrorCode, string> = {
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: "Resource not found",
  VALIDATION: "Validation failed",
  TIMEOUT: "Request timed out",
  NETWORK: "Network request failed",
  SERVER: "Something went wrong",
  UNEXPECTED: "Something went wrong",
};

function sanitizeFieldErrors(
  value: unknown,
): Record<string, string[]> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  const out: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(value)) {
    if (!/^[a-zA-Z0-9_.[\]]{1,64}$/.test(key)) continue;
    if (!Array.isArray(messages)) continue;
    const cleaned = messages
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.slice(0, 200))
      .slice(0, 10);
    if (cleaned.length > 0) out[key] = cleaned;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Only Zod-style flatten shapes are safe for clients.
 * Raw Laravel payloads / unexpected details are dropped.
 */
export function sanitizeClientErrors(details: unknown): unknown {
  if (details == null) return null;
  if (typeof details !== "object") return null;

  const record = details as Record<string, unknown>;
  if (!("fieldErrors" in record) && !("formErrors" in record)) {
    return null;
  }

  const formErrors = Array.isArray(record.formErrors)
    ? record.formErrors
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.slice(0, 200))
        .slice(0, 20)
    : [];

  const fieldErrors = sanitizeFieldErrors(record.fieldErrors);

  return {
    formErrors,
    fieldErrors: fieldErrors ?? {},
  };
}

function isUserFacingMessage(value: string): boolean {
  if (!value || value.length > 200) return false;
  if (/[\\{}$<>]/.test(value)) return false;
  if (/https?:\/\//i.test(value)) return false;
  return true;
}

function pushSentence(found: string[], value: unknown) {
  if (typeof value !== "string") return;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!isUserFacingMessage(trimmed)) return;
  if (/^validation failed\.?$/i.test(trimmed)) return;
  if (/^the given data was invalid\.?$/i.test(trimmed)) return;
  if (!found.includes(trimmed)) found.push(trimmed);
}

/** Plain Laravel / field sentences a person can act on. Internal payloads stay hidden. */
function validationSentences(error: ApiError): string[] {
  const found: string[] = [];
  const details = error.details;
  if (details && typeof details === "object" && !Array.isArray(details)) {
    for (const [key, value] of Object.entries(
      details as Record<string, unknown>,
    )) {
      if (key === "fieldErrors" || key === "formErrors") continue;
      if (Array.isArray(value)) {
        for (const item of value) pushSentence(found, item);
      }
    }
  }
  pushSentence(found, error.message);
  return found.slice(0, 4);
}

function clientMessageFor(error: ApiError): string {
  // Prefer stable code messages for server/unexpected to avoid leaking internals.
  if (error.code === "SERVER") {
    return SAFE_MESSAGE[error.code];
  }
  if (error.code === "UNEXPECTED") {
    const trimmed = error.message?.trim();
    if (trimmed && trimmed.length <= 200 && !/[\\{}$]/.test(trimmed)) {
      return trimmed;
    }
    return SAFE_MESSAGE.UNEXPECTED;
  }
  if (error.code === "VALIDATION") {
    const sentences = validationSentences(error);
    if (sentences.length > 0) return sentences.join(" ");
    return SAFE_MESSAGE.VALIDATION;
  }
  // Auth/not-found may use the ApiError message when already client-safe.
  const trimmed = error.message?.trim();
  if (trimmed && trimmed.length <= 120 && !/[\\{}$]/.test(trimmed)) {
    return trimmed;
  }
  return SAFE_MESSAGE[error.code] ?? SAFE_MESSAGE.UNEXPECTED;
}

/**
 * Non-production only: expose which Laravel API failed so Network-tab shares
 * are useful for backend debugging. Never include tokens or full payloads.
 */
function debugUpstream(error: ApiError): Record<string, unknown> | undefined {
  if (isProductionEnv() || !error.upstream) return undefined;
  return {
    laravelPath: error.upstream.path,
    method: error.upstream.method,
    upstreamStatus: error.upstream.status ?? error.status,
    upstreamMessage: error.upstream.message ?? error.message,
  };
}

/** Canonical BFF error JSON — never forwards raw upstream payloads. */
export function toBffErrorResponse(error: unknown): NextResponse {
  if (isApiError(error)) {
    const debug = debugUpstream(error);
    return NextResponse.json(
      {
        success: false,
        message: clientMessageFor(error),
        code: error.code,
        errors:
          error.code === "VALIDATION"
            ? sanitizeClientErrors(error.details)
            : null,
        data: null,
        ...(debug ? { debug } : {}),
      },
      { status: error.status || 500 },
    );
  }

  return NextResponse.json(
    {
      success: false,
      message: SAFE_MESSAGE.UNEXPECTED,
      code: "UNEXPECTED",
      errors: null,
      data: null,
    },
    { status: 500 },
  );
}

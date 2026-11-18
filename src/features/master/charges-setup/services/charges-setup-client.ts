/**
 * Browser-safe charge setup helpers — BFF only.
 */

import { endpoints } from "@/lib/api/endpoints";
import { clearDedupe, dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  ChargeKind,
  ChargeSetup,
  ChargeSetupListQuery,
  ChargeSetupListResult,
  ChargeSetupSaveInput,
} from "../types/charges-setup.types";

export type ChargesSetupClientError = {
  status: number;
  message: string;
  code?: string;
  details?: unknown;
};

type Envelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
};

function bffPath(kind: ChargeKind): string {
  return kind === "deposit"
    ? endpoints.bff.depositCharges
    : endpoints.bff.loanCharges;
}

async function parseEnvelope<T>(response: Response): Promise<T> {
  let payload: Envelope<T> = {};
  try {
    payload = (await response.json()) as Envelope<T>;
  } catch {
    payload = {};
  }

  if (!response.ok || payload.success === false) {
    const error: ChargesSetupClientError = {
      status: response.status || 500,
      message: payload.message || `Request failed (${response.status})`,
      details: payload.errors ?? null,
      code:
        response.status === 401
          ? "UNAUTHORIZED"
          : response.status === 422
            ? "VALIDATION"
            : response.status === 404
              ? "NOT_FOUND"
              : "UNEXPECTED",
    };
    throw error;
  }

  return payload.data as T;
}

export function isChargesSetupClientError(
  value: unknown,
): value is ChargesSetupClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as ChargesSetupClientError).status === "number" &&
    typeof (value as ChargesSetupClientError).message === "string"
  );
}

function listQueryKey(kind: ChargeKind, query: ChargeSetupListQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
  if (query.chargeId != null) params.set("charge_id", String(query.chargeId));
  if (query.search) params.set("keyword", query.search);
  if (query.figureCd != null) params.set("figure_cd", String(query.figureCd));
  if (query.duringCd != null) {
    const key =
      kind === "deposit" ? "charges_during_cd" : "deduct_during_cd";
    params.set(key, String(query.duringCd));
  }
  if (kind === "loan" && query.isRefundable != null) {
    params.set("is_refundable", query.isRefundable ? "1" : "0");
  }
  if (query.isActive != null) params.set("is_active", String(query.isActive));
  return params.toString() || "default";
}

export async function fetchChargeSetups(
  kind: ChargeKind,
  query: ChargeSetupListQuery = {},
): Promise<ChargeSetupListResult> {
  const qs = listQueryKey(kind, query);
  return dedupeRequest(
    `master:charges-setup:${kind}:${qs}`,
    async () => {
      const response = await fetch(
        `${bffPath(kind)}${qs === "default" ? "" : `?${qs}`}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      return parseEnvelope<ChargeSetupListResult>(response);
    },
    0,
  );
}

export async function saveChargeSetup(
  kind: ChargeKind,
  input: ChargeSetupSaveInput,
): Promise<ChargeSetup> {
  const response = await fetch(bffPath(kind), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({
      action: input.chargeId ? "update" : "create",
      ...input,
    }),
  });
  const data = await parseEnvelope<ChargeSetup>(response);
  clearDedupe();
  return data;
}

export async function toggleChargeSetupStatus(
  kind: ChargeKind,
  chargeId: number,
  isActive: boolean,
): Promise<ChargeSetup> {
  const response = await fetch(bffPath(kind), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({
      action: "status",
      chargeId,
      isActive,
    }),
  });
  const data = await parseEnvelope<ChargeSetup>(response);
  clearDedupe();
  return data;
}

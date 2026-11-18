/**
 * Browser-safe Loan Disbursement client — BFF only.
 */

import { endpoints } from "@/lib/api/endpoints";
import type {
  LoanDisbursementAddInput,
  LoanDisbursementAddResult,
  LoanDisbursementApproveInput,
  LoanDisbursementListQuery,
  LoanDisbursementListResult,
  LoanDisbursementPreviewQuery,
  LoanDisbursementPreviewResult,
  LoanDisbursementRow,
} from "../types/disbursement.types";

export type DisbursementClientError = {
  status: number;
  message: string;
  code?: string;
  details?: unknown;
};

type RawEnvelope = {
  success?: boolean;
  message?: string;
  data?: unknown;
  meta?: unknown;
  errors?: unknown;
};

async function parseRawEnvelope(response: Response): Promise<{ data: unknown; meta?: unknown }> {
  let payload: RawEnvelope = {};
  try {
    payload = (await response.json()) as RawEnvelope;
  } catch {
    payload = {};
  }

  if (!response.ok || payload.success === false) {
    const error: DisbursementClientError = {
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

  return { data: payload.data, meta: payload.meta };
}

async function parseEnvelope<T>(response: Response): Promise<T> {
  const { data } = await parseRawEnvelope(response);
  return data as T;
}

export function isDisbursementClientError(value: unknown): value is DisbursementClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as DisbursementClientError).message === "string"
  );
}

function extractItemsAndTotal<T>(data: unknown, meta: unknown): { items: T[]; total: number } {
  let items: T[] = [];
  let total = typeof (meta as Record<string, unknown> | undefined)?.total === "number"
    ? ((meta as Record<string, unknown>).total as number)
    : 0;

  if (Array.isArray(data)) {
    items = data as T[];
    total = total || data.length;
  } else if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.items)) {
      items = obj.items as T[];
      total = typeof obj.total === "number" ? obj.total : items.length;
    }
  }

  return { items, total };
}

export async function fetchDisbursements(
  query: LoanDisbursementListQuery = {},
): Promise<LoanDisbursementListResult> {
  const params = new URLSearchParams();
  if (query.disbursement_id != null) params.set("disbursement_id", String(query.disbursement_id));
  if (query.loan_account_id != null) params.set("loan_account_id", String(query.loan_account_id));
  if (query.branch_id != null) params.set("branch_id", String(query.branch_id));
  if (query.approval) params.set("approval", query.approval);
  if (query.is_final !== undefined) params.set("is_final", query.is_final ? "1" : "0");
  if (query.payment_mode_cd != null) params.set("payment_mode_cd", String(query.payment_mode_cd));
  if (query.from_date) params.set("from_date", query.from_date);
  if (query.to_date) params.set("to_date", query.to_date);
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.page != null) params.set("page", String(query.page));
  if (query.per_page != null) params.set("per_page", String(query.per_page));

  const url = `${endpoints.bff.loanDisbursements}${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const { data, meta } = await parseRawEnvelope(res);

  return extractItemsAndTotal<LoanDisbursementRow>(data, meta);
}

export async function fetchDisbursementPreview(
  query: LoanDisbursementPreviewQuery,
): Promise<LoanDisbursementPreviewResult> {
  const params = new URLSearchParams();
  params.set("loan_account_id", String(query.loan_account_id));
  if (query.gross_amount != null) params.set("gross_amount", String(query.gross_amount));
  if (query.other_deduction != null) params.set("other_deduction", String(query.other_deduction));

  const url = `${endpoints.bff.loanDisbursementPreview}?${params.toString()}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  return parseEnvelope<LoanDisbursementPreviewResult>(res);
}

export async function submitDisbursementAdd(
  input: LoanDisbursementAddInput,
): Promise<LoanDisbursementAddResult> {
  const res = await fetch(endpoints.bff.loanDisbursements, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input),
  });
  return parseEnvelope<LoanDisbursementAddResult>(res);
}

export async function submitDisbursementApprove(
  input: LoanDisbursementApproveInput,
): Promise<LoanDisbursementAddResult> {
  const res = await fetch(endpoints.bff.loanDisbursementApprove, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input),
  });
  return parseEnvelope<LoanDisbursementAddResult>(res);
}

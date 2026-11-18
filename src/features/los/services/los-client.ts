/**
 * Browser-safe LOS and Loan Application helpers — BFF only.
 */

import { endpoints } from "@/lib/api/endpoints";
import type {
  LoanApplicationAddInput,
  LoanApplicationBulkAddInput,
  LoanApplicationCharge,
  LoanApplicationDepositFreeze,
  LoanApplicationDetail,
  LoanApplicationEditInput,
  LoanApplicationGuarantor,
  LoanApplicationListQuery,
  LoanApplicationListResult,
  LoanApplicationMortgage,
  LoanApplicationProject,
  LoanApplicationRow,
  LoanApplicationStatusInput,
  LoanApplicationTimelineEvent,
  LoanApprovalAddInput,
  LoanApprovalAddResult,
  LoanApprovalListQuery,
  LoanApprovalRow,
  LoanBorrowerLookupItem,
  LoanBorrowerLookupQuery,
  LoanEligibilityResult,
  LoanInspectionAddInput,
  LoanInspectionEditInput,
  LoanInspectionListQuery,
  LoanInspectionRow,
  LoanSanctionPreviewQuery,
  LoanSanctionPreviewResult,
} from "../types/los.types";

export type LosClientError = {
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
    const error: LosClientError = {
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

export function isLosClientError(value: unknown): value is LosClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as LosClientError).message === "string"
  );
}

function extractArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as T[];
  }
  return [];
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

/* ─── Borrower Lookup ─────────────────────────────────────────────────── */

export async function fetchBorrowerLookup(
  query: LoanBorrowerLookupQuery = {},
): Promise<{ items: LoanBorrowerLookupItem[]; total: number }> {
  const params = new URLSearchParams();
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.branch_id != null) params.set("branch_id", String(query.branch_id));
  if (query.group_id != null) params.set("group_id", String(query.group_id));
  if (query.center_id != null) params.set("center_id", String(query.center_id));
  if (query.cust_type_cd != null) params.set("cust_type_cd", String(query.cust_type_cd));
  if (query.eligible_only !== undefined) params.set("eligible_only", query.eligible_only ? "1" : "0");
  if (query.page != null) params.set("page", String(query.page));
  if (query.per_page != null) params.set("per_page", String(query.per_page));

  const url = `${endpoints.bff.loanBorrowerLookup}${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const { data, meta } = await parseRawEnvelope(res);

  return extractItemsAndTotal<LoanBorrowerLookupItem>(data, meta);
}

/* ─── Loan Applications ───────────────────────────────────────────────── */

export async function fetchLoanApplications(
  query: LoanApplicationListQuery = {},
): Promise<LoanApplicationListResult> {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.per_page != null) params.set("per_page", String(query.per_page));
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.stage) params.set("stage", query.stage);
  if (query.application_id != null) params.set("application_id", String(query.application_id));
  if (query.scheme_id != null) params.set("scheme_id", String(query.scheme_id));
  if (query.branch_id != null) params.set("branch_id", String(query.branch_id));
  if (query.fo_id != null) params.set("fo_id", String(query.fo_id));
  if (query.cust_type_cd != null) params.set("cust_type_cd", String(query.cust_type_cd));
  if (query.appl_status_cd != null) params.set("appl_status_cd", String(query.appl_status_cd));
  if (query.member_id != null) params.set("member_id", String(query.member_id));
  if (query.group_id != null) params.set("group_id", String(query.group_id));
  if (query.from_date) params.set("from_date", query.from_date);
  if (query.to_date) params.set("to_date", query.to_date);

  const url = `${endpoints.bff.loanApplications}${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const { data, meta } = await parseRawEnvelope(res);

  let items: LoanApplicationRow[] = [];
  let paginationMeta: LoanApplicationListResult["meta"] = (meta as LoanApplicationListResult["meta"]) ?? {
    total: 0,
    page: 1,
    per_page: 20,
    last_page: 1,
    has_more: false,
  };

  if (Array.isArray(data)) {
    items = data as LoanApplicationRow[];
  } else if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.items)) {
      items = obj.items as LoanApplicationRow[];
      if (obj.meta) paginationMeta = obj.meta as LoanApplicationListResult["meta"];
    }
  }

  return {
    items,
    meta: paginationMeta,
  };
}

export async function fetchLoanApplicationDetail(
  applicationId: number,
): Promise<LoanApplicationDetail> {
  const url = `${endpoints.bff.loanApplications}/${applicationId}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  return parseEnvelope<LoanApplicationDetail>(res);
}

export async function submitLoanApplication(
  input: LoanApplicationAddInput,
): Promise<LoanApplicationDetail> {
  const res = await fetch(endpoints.bff.loanApplications, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ action: "create", ...input }),
  });
  return parseEnvelope<LoanApplicationDetail>(res);
}

export async function submitLoanApplicationBulk(
  input: LoanApplicationBulkAddInput,
): Promise<LoanApplicationDetail> {
  const res = await fetch(endpoints.bff.loanApplications, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ action: "bulk_create", ...input }),
  });
  return parseEnvelope<LoanApplicationDetail>(res);
}

export async function updateLoanApplication(
  input: LoanApplicationEditInput,
): Promise<LoanApplicationDetail> {
  const res = await fetch(endpoints.bff.loanApplications, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ action: "edit", ...input }),
  });
  return parseEnvelope<LoanApplicationDetail>(res);
}

export async function updateLoanApplicationStatus(
  input: LoanApplicationStatusInput,
): Promise<LoanApplicationRow> {
  const res = await fetch(endpoints.bff.loanApplications, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ action: "status", ...input }),
  });
  return parseEnvelope<LoanApplicationRow>(res);
}

export async function fetchLoanApplicationTimeline(
  applicationId: number,
): Promise<LoanApplicationTimelineEvent[]> {
  const url = `${endpoints.bff.loanApplications}/${applicationId}/timeline`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const { data } = await parseRawEnvelope(res);
  return extractArray<LoanApplicationTimelineEvent>(data);
}

export async function fetchLoanEligibility(
  applicationId: number,
): Promise<LoanEligibilityResult> {
  const url = `${endpoints.bff.loanApplications}/${applicationId}/eligibility`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  return parseEnvelope<LoanEligibilityResult>(res);
}

/* ─── Charges ─────────────────────────────────────────────────────────── */

export async function fetchCharges(applicationId: number): Promise<LoanApplicationCharge[]> {
  const url = `${endpoints.bff.loanApplicationCharges}?application_id=${applicationId}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const { data } = await parseRawEnvelope(res);
  return extractArray<LoanApplicationCharge>(data);
}

export async function saveCharge(
  data: Record<string, unknown>,
  action: "add" | "edit" | "status" = "add",
): Promise<LoanApplicationCharge> {
  const res = await fetch(endpoints.bff.loanApplicationCharges, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ action, ...data }),
  });
  return parseEnvelope<LoanApplicationCharge>(res);
}

/* ─── Guarantors ──────────────────────────────────────────────────────── */

export async function fetchGuarantors(applicationId: number): Promise<LoanApplicationGuarantor[]> {
  const url = `${endpoints.bff.loanGuarantors}?application_id=${applicationId}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const { data } = await parseRawEnvelope(res);
  return extractArray<LoanApplicationGuarantor>(data);
}

export async function saveGuarantor(
  body: Record<string, unknown>,
  action: "add" | "edit" | "status" = "add",
): Promise<LoanApplicationGuarantor> {
  const res = await fetch(endpoints.bff.loanGuarantors, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ action, ...body }),
  });
  return parseEnvelope<LoanApplicationGuarantor>(res);
}

/* ─── Mortgages / Collateral ──────────────────────────────────────────── */

export async function fetchMortgages(applicationId: number): Promise<LoanApplicationMortgage[]> {
  const url = `${endpoints.bff.loanMortgages}?application_id=${applicationId}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const { data } = await parseRawEnvelope(res);
  return extractArray<LoanApplicationMortgage>(data);
}

export async function saveMortgage(
  data: Record<string, unknown>,
  action: "add" | "edit" | "status" = "add",
): Promise<LoanApplicationMortgage> {
  const res = await fetch(endpoints.bff.loanMortgages, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ action, ...data }),
  });
  return parseEnvelope<LoanApplicationMortgage>(res);
}

/* ─── Projects ────────────────────────────────────────────────────────── */

export async function fetchProjects(applicationId: number): Promise<LoanApplicationProject[]> {
  const url = `${endpoints.bff.loanProjects}?application_id=${applicationId}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const { data } = await parseRawEnvelope(res);
  return extractArray<LoanApplicationProject>(data);
}

export async function saveProject(
  data: Record<string, unknown>,
  action: "add" | "edit" = "add",
): Promise<LoanApplicationProject> {
  const res = await fetch(endpoints.bff.loanProjects, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ action, ...data }),
  });
  return parseEnvelope<LoanApplicationProject>(res);
}

/* ─── Deposit Freezes ─────────────────────────────────────────────────── */

export async function fetchDepositFreezes(applicationId: number): Promise<LoanApplicationDepositFreeze[]> {
  const url = `${endpoints.bff.loanDepositFreezes}?application_id=${applicationId}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const { data } = await parseRawEnvelope(res);
  return extractArray<LoanApplicationDepositFreeze>(data);
}

export async function saveDepositFreeze(
  data: Record<string, unknown>,
  action: "add" | "edit" | "status" = "add",
): Promise<LoanApplicationDepositFreeze> {
  const res = await fetch(endpoints.bff.loanDepositFreezes, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ action, ...data }),
  });
  return parseEnvelope<LoanApplicationDepositFreeze>(res);
}

/* ─── Field Verification & Inspections ────────────────────────────────── */

export async function fetchLoanInspections(
  query: LoanInspectionListQuery = {},
): Promise<{ items: LoanInspectionRow[]; total: number }> {
  const params = new URLSearchParams();
  if (query.pending_only) params.set("pending_only", "1");
  if (query.application_id != null) params.set("application_id", String(query.application_id));
  if (query.inspection_id != null) params.set("inspection_id", String(query.inspection_id));
  if (query.fo_id != null) params.set("fo_id", String(query.fo_id));
  if (query.branch_id != null) params.set("branch_id", String(query.branch_id));
  if (query.inspection_result_cd != null) params.set("inspection_result_cd", String(query.inspection_result_cd));
  if (query.from_date) params.set("from_date", query.from_date);
  if (query.to_date) params.set("to_date", query.to_date);
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.page != null) params.set("page", String(query.page));
  if (query.per_page != null) params.set("per_page", String(query.per_page));

  const url = `${endpoints.bff.loanInspections}${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const { data, meta } = await parseRawEnvelope(res);

  return extractItemsAndTotal<LoanInspectionRow>(data, meta);
}

export async function saveLoanInspection(
  data: Record<string, unknown>,
  action: "add" | "edit" = "add",
): Promise<LoanInspectionRow> {
  const res = await fetch(endpoints.bff.loanInspections, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ action, ...data }),
  });
  return parseEnvelope<LoanInspectionRow>(res);
}

/* ─── Sanction Preview & Approval ─────────────────────────────────────── */

export async function fetchSanctionPreview(
  query: LoanSanctionPreviewQuery,
): Promise<LoanSanctionPreviewResult> {
  const params = new URLSearchParams();
  params.set("application_id", String(query.application_id));
  if (query.sanctioned_amount != null) params.set("sanctioned_amount", String(query.sanctioned_amount));
  if (query.interest_rate != null) params.set("interest_rate", String(query.interest_rate));
  if (query.loan_duration != null) params.set("loan_duration", String(query.loan_duration));
  if (query.repay_schedule_cd != null) params.set("repay_schedule_cd", String(query.repay_schedule_cd));
  if (query.moratorium_days != null) params.set("moratorium_days", String(query.moratorium_days));
  if (query.first_due_date) params.set("first_due_date", query.first_due_date);

  const url = `${endpoints.bff.loanSanctionPreview}?${params.toString()}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  return parseEnvelope<LoanSanctionPreviewResult>(res);
}

export async function fetchLoanApprovals(
  query: LoanApprovalListQuery = {},
): Promise<{ items: LoanApprovalRow[]; total: number }> {
  const params = new URLSearchParams();
  if (query.pending_only) params.set("pending_only", "1");
  if (query.approval_status_cd != null) params.set("approval_status_cd", String(query.approval_status_cd));
  if (query.application_id != null) params.set("application_id", String(query.application_id));
  if (query.loan_approval_id != null) params.set("loan_approval_id", String(query.loan_approval_id));
  if (query.branch_id != null) params.set("branch_id", String(query.branch_id));
  if (query.from_date) params.set("from_date", query.from_date);
  if (query.to_date) params.set("to_date", query.to_date);
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.page != null) params.set("page", String(query.page));
  if (query.per_page != null) params.set("per_page", String(query.per_page));

  const url = `${endpoints.bff.loanApprovals}${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const { data, meta } = await parseRawEnvelope(res);

  return extractItemsAndTotal<LoanApprovalRow>(data, meta);
}

export async function submitLoanApproval(
  input: LoanApprovalAddInput,
): Promise<LoanApprovalAddResult> {
  const res = await fetch(endpoints.bff.loanApprovals, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input),
  });
  return parseEnvelope<LoanApprovalAddResult>(res);
}

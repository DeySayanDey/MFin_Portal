import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import type { LaravelResponse } from "@/types/api";
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

async function requireAccessToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError({
      message: "Unauthorized. Bearer token required.",
      status: 401,
      code: "UNAUTHORIZED",
    });
  }
  return token;
}

async function withUnauthorizedClear<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      await clearAuthSession();
    }
    throw error;
  }
}

function assertSuccess<T>(payload: LaravelResponse<T>, fallback = "Request failed"): asserts payload is Extract<LaravelResponse<T>, { success: true }> {
  if (!payload || !payload.success) {
    throw new ApiError({
      message: (payload && payload.message) || fallback,
      status: 422,
      code: "VALIDATION",
    });
  }
}

/* ─── Borrower Lookup ─────────────────────────────────────────────────── */

export async function lookupLoanBorrowers(
  query: LoanBorrowerLookupQuery = {},
): Promise<{ items: LoanBorrowerLookupItem[]; total: number }> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<LoanBorrowerLookupItem[]>>(
      endpoints.loanBorrowerLookup,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          keyword: query.keyword,
          branch_id: query.branch_id,
          group_id: query.group_id,
          center_id: query.center_id,
          cust_type_cd: query.cust_type_cd,
          eligible_only: query.eligible_only !== undefined ? (query.eligible_only ? 1 : 0) : undefined,
          page: query.page ?? 1,
          per_page: query.per_page ?? 50,
        },
      },
    );
    assertSuccess(payload, "Failed to lookup borrowers");
    const rows = Array.isArray(payload.data) ? payload.data : [];
    return {
      items: rows,
      total: payload.meta?.total ?? rows.length,
    };
  });
}

/* ─── Loan Applications ───────────────────────────────────────────────── */

export async function listLoanApplications(
  query: LoanApplicationListQuery = {},
): Promise<LoanApplicationListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<LoanApplicationRow[]>>(
      endpoints.loanApplication.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: query.per_page ?? 50,
          keyword: query.keyword,
          stage: query.stage,
          application_id: query.application_id,
          scheme_id: query.scheme_id,
          branch_id: query.branch_id,
          fo_id: query.fo_id,
          cust_type_cd: query.cust_type_cd,
          appl_status_cd: query.appl_status_cd,
          member_id: query.member_id,
          group_id: query.group_id,
          from_date: query.from_date,
          to_date: query.to_date,
        },
      },
    );
    assertSuccess(payload, "Failed to load loan applications");
    const rows = Array.isArray(payload.data) ? payload.data : [];
    return {
      items: rows,
      meta: {
        total: payload.meta?.total ?? rows.length,
        page: payload.meta?.page ?? query.page ?? 1,
        per_page: payload.meta?.per_page ?? query.per_page ?? 50,
        last_page: payload.meta?.last_page ?? 1,
        has_more: payload.meta?.has_more ?? false,
        summary: (payload.meta as any)?.summary,
      },
    };
  });
}

export async function getLoanApplication(applicationId: number): Promise<LoanApplicationDetail> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<LoanApplicationDetail>>(
      endpoints.loanApplication.get,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: { application_id: applicationId },
      },
    );
    assertSuccess(payload, "Failed to retrieve loan application");
    return payload.data;
  });
}

export async function createLoanApplication(
  input: LoanApplicationAddInput,
): Promise<LoanApplicationDetail> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<LoanApplicationDetail>>(
      endpoints.loanApplication.add,
      input,
      { accessToken: token, expectEnvelope: false },
    );
    assertSuccess(payload, "Failed to submit loan application");
    return payload.data;
  });
}

export async function createLoanApplicationBulk(
  input: LoanApplicationBulkAddInput,
): Promise<LoanApplicationDetail> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<LoanApplicationDetail>>(
      endpoints.loanApplication.bulkAdd,
      input,
      { accessToken: token, expectEnvelope: false },
    );
    assertSuccess(payload, "Failed to submit bulk group loan application");
    return payload.data;
  });
}

export async function editLoanApplication(
  input: LoanApplicationEditInput,
): Promise<LoanApplicationDetail> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<LoanApplicationDetail>>(
      endpoints.loanApplication.edit,
      input,
      { accessToken: token, expectEnvelope: false },
    );
    assertSuccess(payload, "Failed to update loan application");
    return payload.data;
  });
}

export async function changeLoanApplicationStatus(
  input: LoanApplicationStatusInput,
): Promise<LoanApplicationRow> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<LoanApplicationRow>>(
      endpoints.loanApplication.status,
      input,
      { accessToken: token, expectEnvelope: false },
    );
    assertSuccess(payload, "Failed to change loan application status");
    return payload.data;
  });
}

export async function getLoanApplicationTimeline(
  applicationId: number,
): Promise<LoanApplicationTimelineEvent[]> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<LoanApplicationTimelineEvent[]>>(
      endpoints.loanApplication.timeline,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: { application_id: applicationId },
      },
    );
    assertSuccess(payload, "Failed to load application timeline");
    return Array.isArray(payload.data) ? payload.data : [];
  });
}

export async function checkLoanEligibility(
  applicationId: number,
): Promise<LoanEligibilityResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<LoanEligibilityResult>>(
      endpoints.loanApplication.eligibilityCheck,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: { application_id: applicationId },
      },
    );
    assertSuccess(payload, "Failed to check loan eligibility");
    return payload.data;
  });
}

/* ─── Child Records: Charges ──────────────────────────────────────────── */

export async function listLoanApplicationCharges(
  applicationId: number,
): Promise<LoanApplicationCharge[]> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<LoanApplicationCharge[]>>(
      endpoints.loanApplicationCharge.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: { application_id: applicationId },
      },
    );
    assertSuccess(payload, "Failed to load application charges");
    return Array.isArray(payload.data) ? payload.data : [];
  });
}

export async function addLoanApplicationCharge(input: {
  application_id: number;
  charge_id: number;
  charge_amount?: number;
  tax_amount?: number;
  waived_amount?: number;
  waiver_reason?: string;
}): Promise<LoanApplicationCharge> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<LoanApplicationCharge>>(
      endpoints.loanApplicationCharge.add,
      input,
      { accessToken: token, expectEnvelope: false },
    );
    assertSuccess(payload, "Failed to add application charge");
    return payload.data;
  });
}

export async function editLoanApplicationCharge(input: {
  loan_charge_id: number;
  charge_amount?: number;
  tax_amount?: number;
  waived_amount?: number;
  waiver_reason?: string;
}): Promise<LoanApplicationCharge> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<LoanApplicationCharge>>(
      endpoints.loanApplicationCharge.edit,
      input,
      { accessToken: token, expectEnvelope: false },
    );
    assertSuccess(payload, "Failed to edit application charge");
    return payload.data;
  });
}

export async function changeLoanApplicationChargeStatus(input: {
  loan_charge_id: number;
  tr_status_cd: number; // 5 delete
}): Promise<LoanApplicationCharge> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<LoanApplicationCharge>>(
      endpoints.loanApplicationCharge.status,
      input,
      { accessToken: token, expectEnvelope: false },
    );
    assertSuccess(payload, "Failed to update charge status");
    return payload.data;
  });
}

/* ─── Child Records: Guarantors ───────────────────────────────────────── */

export async function listLoanApplicationGuarantors(
  applicationId: number,
): Promise<LoanApplicationGuarantor[]> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<LoanApplicationGuarantor[]>>(
      endpoints.loanApplicationGuarantor.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: { application_id: applicationId },
      },
    );
    assertSuccess(payload, "Failed to load application guarantors");
    return Array.isArray(payload.data) ? payload.data : [];
  });
}

export async function addLoanApplicationGuarantor(
  body: Record<string, unknown> | FormData,
): Promise<LoanApplicationGuarantor> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<LoanApplicationGuarantor>>(
      endpoints.loanApplicationGuarantor.add,
      body,
      { accessToken: token, expectEnvelope: false },
    );
    assertSuccess(payload, "Failed to add guarantor");
    return payload.data;
  });
}

export async function editLoanApplicationGuarantor(
  body: Record<string, unknown> | FormData,
): Promise<LoanApplicationGuarantor> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<LoanApplicationGuarantor>>(
      endpoints.loanApplicationGuarantor.edit,
      body,
      { accessToken: token, expectEnvelope: false },
    );
    assertSuccess(payload, "Failed to edit guarantor");
    return payload.data;
  });
}

export async function releaseLoanApplicationGuarantor(input: {
  loan_guarantor_id: number;
  remarks?: string;
}): Promise<LoanApplicationGuarantor> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<LoanApplicationGuarantor>>(
      endpoints.loanApplicationGuarantor.status,
      input,
      { accessToken: token, expectEnvelope: false },
    );
    assertSuccess(payload, "Failed to release guarantor");
    return payload.data;
  });
}

/* ─── Child Records: Mortgages / Collateral ───────────────────────────── */

export async function listLoanApplicationMortgages(
  applicationId: number,
): Promise<LoanApplicationMortgage[]> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<LoanApplicationMortgage[]>>(
      endpoints.loanApplicationMortgage.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: { application_id: applicationId },
      },
    );
    assertSuccess(payload, "Failed to load mortgages");
    return Array.isArray(payload.data) ? payload.data : [];
  });
}

export async function addLoanApplicationMortgage(input: {
  application_id: number;
  collateral_type_cd: number;
  mortgage_description: string;
  ownership_type_cd?: number | null;
  market_value?: number | null;
  mortgage_execution_date?: string | null;
  expiry_date?: string | null;
}): Promise<LoanApplicationMortgage> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<LoanApplicationMortgage>>(
      endpoints.loanApplicationMortgage.add,
      input,
      { accessToken: token, expectEnvelope: false },
    );
    assertSuccess(payload, "Failed to add collateral/mortgage");
    return payload.data;
  });
}

export async function editLoanApplicationMortgage(input: {
  mortgage_id: number;
  collateral_type_cd?: number;
  mortgage_description?: string;
  ownership_type_cd?: number | null;
  market_value?: number | null;
  mortgage_execution_date?: string | null;
  expiry_date?: string | null;
}): Promise<LoanApplicationMortgage> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<LoanApplicationMortgage>>(
      endpoints.loanApplicationMortgage.edit,
      input,
      { accessToken: token, expectEnvelope: false },
    );
    assertSuccess(payload, "Failed to edit collateral/mortgage");
    return payload.data;
  });
}

export async function releaseLoanApplicationMortgage(input: {
  mortgage_id: number;
  release_reason?: string;
}): Promise<LoanApplicationMortgage> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<LoanApplicationMortgage>>(
      endpoints.loanApplicationMortgage.status,
      input,
      { accessToken: token, expectEnvelope: false },
    );
    assertSuccess(payload, "Failed to release mortgage");
    return payload.data;
  });
}

/* ─── Child Records: Project ──────────────────────────────────────────── */

export async function listLoanApplicationProjects(
  applicationId: number,
): Promise<LoanApplicationProject[]> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<LoanApplicationProject[]>>(
      endpoints.loanApplicationProject.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: { application_id: applicationId },
      },
    );
    assertSuccess(payload, "Failed to load project details");
    return Array.isArray(payload.data) ? payload.data : [];
  });
}

export async function addLoanApplicationProject(
  input: Partial<LoanApplicationProject> & { application_id: number; project_name: string },
): Promise<LoanApplicationProject> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<LoanApplicationProject>>(
      endpoints.loanApplicationProject.add,
      input,
      { accessToken: token, expectEnvelope: false },
    );
    assertSuccess(payload, "Failed to add project");
    return payload.data;
  });
}

export async function editLoanApplicationProject(
  input: Partial<LoanApplicationProject> & { project_id: number },
): Promise<LoanApplicationProject> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<LoanApplicationProject>>(
      endpoints.loanApplicationProject.edit,
      input,
      { accessToken: token, expectEnvelope: false },
    );
    assertSuccess(payload, "Failed to edit project");
    return payload.data;
  });
}

/* ─── Child Records: Deposit Freezes (Lien) ────────────────────────────── */

export async function listLoanApplicationDepositFreezes(
  applicationId: number,
): Promise<LoanApplicationDepositFreeze[]> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<LoanApplicationDepositFreeze[]>>(
      endpoints.loanApplicationDepositFreeze.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: { application_id: applicationId },
      },
    );
    assertSuccess(payload, "Failed to load deposit freezes");
    return Array.isArray(payload.data) ? payload.data : [];
  });
}

export async function addLoanApplicationDepositFreeze(input: {
  application_id: number;
  deposit_account_id: number;
  freeze_type_cd: number;
  freeze_amount: number;
}): Promise<LoanApplicationDepositFreeze> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<LoanApplicationDepositFreeze>>(
      endpoints.loanApplicationDepositFreeze.add,
      input,
      { accessToken: token, expectEnvelope: false },
    );
    assertSuccess(payload, "Failed to add deposit freeze");
    return payload.data;
  });
}

export async function releaseLoanApplicationDepositFreeze(input: {
  freeze_id: number;
  release_reason?: string;
  force?: boolean;
}): Promise<LoanApplicationDepositFreeze> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<LoanApplicationDepositFreeze>>(
      endpoints.loanApplicationDepositFreeze.status,
      input,
      { accessToken: token, expectEnvelope: false },
    );
    assertSuccess(payload, "Failed to release deposit freeze");
    return payload.data;
  });
}

/* ─── Field Verification & Inspections ────────────────────────────────── */

export async function listLoanInspections(
  query: LoanInspectionListQuery = {},
): Promise<{ items: LoanInspectionRow[]; total: number }> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<LoanInspectionRow[]>>(
      endpoints.loanInspection.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          pending_only: query.pending_only ? 1 : undefined,
          application_id: query.application_id,
          inspection_id: query.inspection_id,
          fo_id: query.fo_id,
          branch_id: query.branch_id,
          inspection_result_cd: query.inspection_result_cd,
          from_date: query.from_date,
          to_date: query.to_date,
          keyword: query.keyword,
          page: query.page ?? 1,
          per_page: query.per_page ?? 50,
        },
      },
    );
    assertSuccess(payload, "Failed to load loan inspections");
    const rows = Array.isArray(payload.data) ? payload.data : [];
    return {
      items: rows,
      total: payload.meta?.total ?? rows.length,
    };
  });
}

export async function createLoanInspection(
  body: Record<string, unknown> | FormData,
): Promise<LoanInspectionRow> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<LoanInspectionRow>>(
      endpoints.loanInspection.add,
      body,
      { accessToken: token, expectEnvelope: false },
    );
    assertSuccess(payload, "Failed to save field verification");
    return payload.data;
  });
}

export async function editLoanInspection(
  body: Record<string, unknown> | FormData,
): Promise<LoanInspectionRow> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<LoanInspectionRow>>(
      endpoints.loanInspection.edit,
      body,
      { accessToken: token, expectEnvelope: false },
    );
    assertSuccess(payload, "Failed to edit field verification");
    return payload.data;
  });
}

/* ─── Sanction Preview & Approval ─────────────────────────────────────── */

export async function previewLoanSanction(
  query: LoanSanctionPreviewQuery,
): Promise<LoanSanctionPreviewResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<LoanSanctionPreviewResult>>(
      endpoints.loanSanctionPreview,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          application_id: query.application_id,
          sanctioned_amount: query.sanctioned_amount,
          interest_rate: query.interest_rate,
          loan_duration: query.loan_duration,
          repay_schedule_cd: query.repay_schedule_cd,
          moratorium_days: query.moratorium_days,
          first_due_date: query.first_due_date,
        },
      },
    );
    assertSuccess(payload, "Failed to generate sanction preview");
    return payload.data;
  });
}

export async function listLoanApprovals(
  query: LoanApprovalListQuery = {},
): Promise<{ items: LoanApprovalRow[]; total: number }> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<LoanApprovalRow[]>>(
      endpoints.loanApproval.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          pending_only: query.pending_only ? 1 : undefined,
          approval_status_cd: query.approval_status_cd,
          application_id: query.application_id,
          loan_approval_id: query.loan_approval_id,
          branch_id: query.branch_id,
          from_date: query.from_date,
          to_date: query.to_date,
          keyword: query.keyword,
          page: query.page ?? 1,
          per_page: query.per_page ?? 50,
        },
      },
    );
    assertSuccess(payload, "Failed to load loan approvals");
    const rows = Array.isArray(payload.data) ? payload.data : [];
    return {
      items: rows,
      total: payload.meta?.total ?? rows.length,
    };
  });
}

export async function createLoanApproval(
  input: LoanApprovalAddInput,
): Promise<LoanApprovalAddResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<LoanApprovalAddResult>>(
      endpoints.loanApproval.add,
      input,
      { accessToken: token, expectEnvelope: false },
    );
    assertSuccess(payload, "Failed to record loan approval");
    return payload.data;
  });
}

import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import { mapSavingsTransactionDto } from "@/features/deposits/savings-transaction/mappers/savings-transaction.mapper";
import { savingsTransactionDtoSchema } from "@/features/deposits/savings-transaction/schemas/savings-transaction.schema";
import { SAVINGS_DEPOSIT_TYPE } from "../deposit-account.constants";
import {
  mapCustomerRow,
  mapDepositAccountCloseToDto,
  mapDepositAccountMemberDto,
  mapDepositOpeningTransactionDto,
  mapDepositProductSchemeDto,
  mapDepositNomineeAddToDto,
  mapDepositNomineeDto,
  mapDepositNomineeEditToDto,
  mapDepositNomineeStatusToDto,
  mapDepositSignatoryAddToDto,
  mapDepositSignatoryDto,
  mapDepositSignatoryEditToDto,
  mapDepositSignatoryStatusToDto,
  mapGroupMember,
  mapDepositAccountCreateToDto,
  mapDepositAccountDto,
  mapDepositAccountEditToDto,
  mapDepositAccountStatusToDto,
  mapPaginationMetaDto,
} from "../mappers/deposit-account.mapper";
import {
  depositAccountCloseSchema,
  depositAccountCreateSchema,
  depositAccountDtoSchema,
  depositAccountEditSchema,
  depositAccountIdSchema,
  depositAccountMemberDtoSchema,
  depositOpeningTransactionDtoSchema,
  depositProductSchemeDtoSchema,
  depositProductTypeDtoSchema,
  depositAccountStatusSchema,
  depositNomineeAddSchema,
  depositNomineeDtoSchema,
  depositNomineeEditSchema,
  depositNomineeStatusSchema,
  depositSignatoryAddSchema,
  depositSignatoryDtoSchema,
  depositSignatoryEditSchema,
  depositSignatoryStatusSchema,
  paginationMetaDtoSchema,
} from "../schemas/deposit-account.schema";
import type {
  DepositAccount,
  DepositAccountDetail,
  DepositAccountDto,
  DepositAccountListQuery,
  DepositAccountListResult,
  DepositAccountMember,
  DepositAccountMemberSyncResult,
  DepositAccountSaveResult,
  DepositProductQuery,
  DepositProductType,
  DepositCustomer,
  DepositCustomerQuery,
  DepositNominee,
  DepositSignatory,
  DepositProductScheme,
  DepositAccountMember,
  DepositAccountTransaction,
  DepositAccountViewData,
  SignatoryCandidate,
  TermPayoutItem,
  TermScheduleItem,
  TermScheduleSummary,
  PaginationMetaDto,
} from "../types/deposit-account.types";
import type { LaravelResponse } from "@/types/api";

const DEFAULT_PER_PAGE = 50;
const MAX_PER_PAGE = 200;

function clampPerPage(value: number | undefined): number {
  const raw = value ?? DEFAULT_PER_PAGE;
  if (!Number.isFinite(raw) || raw < 1) return DEFAULT_PER_PAGE;
  return Math.min(Math.floor(raw), MAX_PER_PAGE);
}

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

function assertSuccess(
  payload: unknown,
  fallback: string,
): asserts payload is { success: true; data?: unknown; meta?: unknown } {
  if (
    !payload ||
    typeof payload !== "object" ||
    !("success" in payload) ||
    payload.success !== true
  ) {
    const message =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : fallback;
    throw new ApiError({
      message,
      status: 500,
      code: "UNEXPECTED",
      details: payload,
    });
  }
}

function parseAccount(row: unknown): DepositAccount | null {
  const parsed = depositAccountDtoSchema.safeParse(row);
  if (!parsed.success) return null;
  return mapDepositAccountDto(parsed.data as DepositAccountDto);
}

function parseAccountOrThrow(row: unknown, fallback: string): DepositAccount {
  const item = parseAccount(row);
  if (!item) {
    throw new ApiError({
      message: fallback,
      status: 500,
      code: "UNEXPECTED",
    });
  }
  return item;
}

function parseSaveResult(row: unknown, fallback: string): DepositAccountSaveResult {
  const account = parseAccountOrThrow(row, fallback);
  const raw =
    row && typeof row === "object" && "opening_transaction" in row
      ? (row as { opening_transaction: unknown }).opening_transaction
      : null;
  const opening = raw ? depositOpeningTransactionDtoSchema.safeParse(raw) : null;
  return {
    account,
    openingTransaction: opening?.success
      ? mapDepositOpeningTransactionDto(opening.data)
      : null,
  };
}

function asRows(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** Child rows of the View payload may omit their parent `account_id`. */
function withAccountId(row: unknown, accountId: number): unknown {
  if (!row || typeof row !== "object") return row;
  return { account_id: accountId, ...(row as Record<string, unknown>) };
}

function parseMembers(rows: unknown[], accountId: number): DepositAccountMember[] {
  return rows.flatMap((row) => {
    const parsed = depositAccountMemberDtoSchema.safeParse(
      withAccountId(row, accountId),
    );
    return parsed.success ? [mapDepositAccountMemberDto(parsed.data)] : [];
  });
}

function validationError(error: { flatten: () => unknown }): ApiError {
  return new ApiError({
    message: "Validation failed",
    status: 422,
    code: "VALIDATION",
    details: error.flatten(),
  });
}

/** Laravel: GET /api/DepositAccountList */
export async function listDepositAccounts(
  query: DepositAccountListQuery = {},
): Promise<DepositAccountListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<DepositAccountDto[]>>(
      endpoints.depositAccount.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: clampPerPage(query.perPage),
          account_id: query.accountId,
          branch_id: query.branchId,
          fo_id: query.foId,
          prod_type_cd: query.prodTypeCd,
          scheme_id: query.schemeId,
          deposit_type_cd: query.depositTypeCd,
          prod_type_cd: query.prodTypeCd,
          cust_type_cd: query.custTypeCd,
          member_id: query.memberId,
          group_id: query.groupId,
          op_mode_cd: query.opModeCd,
          status_cd: query.statusCd,
          is_closed:
            query.isClosed == null ? undefined : query.isClosed ? 1 : 0,
          from_date: query.fromDate,
          to_date: query.toDate,
          keyword: query.search,
        },
      },
    );

    assertSuccess(payload, "Failed to load deposit accounts");
    const rows = Array.isArray(payload.data) ? payload.data : [];
    const items = rows.flatMap((row) => {
      const item = parseAccount(row);
      return item ? [item] : [];
    });

    let meta: DepositAccountListResult["meta"] = null;
    if ("meta" in payload && payload.meta) {
      const metaParsed = paginationMetaDtoSchema.safeParse(payload.meta);
      if (metaParsed.success) {
        meta = mapPaginationMetaDto(metaParsed.data as PaginationMetaDto);
      }
    }

    return { items, meta };
  });
}

/** Rejects an account outside the caller's branch as not found. */
export async function assertDepositAccountInScope(
  accountId: number,
  branchId: number | undefined,
): Promise<void> {
  if (branchId == null) return;
  const result = await listDepositAccounts({ accountId, branchId, perPage: 1 });
  if (!result.items.some((item) => item.accountId === accountId)) {
    throw new ApiError({
      message: "Deposit account not found",
      status: 404,
      code: "NOT_FOUND",
    });
  }
}

/** Laravel: GET /api/DepositProductSchemeList */
export async function listDepositProducts(
  query: DepositProductQuery = {},
): Promise<DepositProductType[]> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<unknown[]>>(
      endpoints.depositAccount.productSchemeList,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          deposit_type_cd: query.depositTypeCd ?? SAVINGS_DEPOSIT_TYPE,
          prod_type_cd: query.prodTypeCd,
          is_active: query.isActive ?? 1,
        },
      },
    );
    assertSuccess(payload, "Failed to load deposit products");
    return asRows(payload.data).flatMap((row) => {
      const parsed = depositProductTypeDtoSchema.safeParse(row);
      if (!parsed.success) return [];
      const schemes = asRows(parsed.data.schemes).flatMap((scheme) => {
        const item = depositProductSchemeDtoSchema.safeParse(scheme);
        return item.success ? [mapDepositProductSchemeDto(item.data)] : [];
      });
      return [
        {
          depositTypeCd: parsed.data.deposit_type_cd,
          prodTypeCd: parsed.data.prod_type_cd,
          prodTypeDesc: parsed.data.prod_type_desc?.trim() ?? "",
          schemes,
        },
      ];
    });
  });
}

/** Laravel: GET /api/DepositAccountView */
export async function getDepositAccountView(
  accountId: number,
  txnLimit?: number,
): Promise<DepositAccountDetail> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.get<Record<string, unknown>>(
      endpoints.depositAccount.view,
      {
        accessToken: token,
        expectEnvelope: true,
        searchParams: { account_id: accountId, txn_limit: txnLimit },
      },
    );
    const account = parseAccountOrThrow(
      data,
      "Deposit account view returned an unexpected response",
    );
    const nominees = asRows(data?.nominees).flatMap((row) => {
      const parsed = depositNomineeDtoSchema.safeParse(withAccountId(row, accountId));
      return parsed.success ? [mapDepositNomineeDto(parsed.data)] : [];
    });
    const signatories = asRows(data?.signatories).flatMap((row) => {
      const parsed = depositSignatoryDtoSchema.safeParse(
        withAccountId(row, accountId),
      );
      return parsed.success ? [mapDepositSignatoryDto(parsed.data)] : [];
    });
    const transactions = asRows(data?.transactions).flatMap((row) => {
      const parsed = savingsTransactionDtoSchema.safeParse(
        withAccountId(row, accountId),
      );
      return parsed.success ? [mapSavingsTransactionDto(parsed.data)] : [];
    });
    const count = Number(data?.transaction_count);
    return {
      ...account,
      members: parseMembers(asRows(data?.members), accountId),
      nominees,
      signatories,
      transactions,
      transactionCount: Number.isFinite(count) ? count : transactions.length,
    };
  });
}

/** Laravel: GET /api/DepositAccountMemberList */
export async function listDepositAccountMembers(
  accountId: number,
): Promise<DepositAccountMember[]> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<unknown[]>>(
      endpoints.depositAccount.memberList,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: { account_id: accountId },
      },
    );
    assertSuccess(payload, "Failed to load account members");
    return parseMembers(asRows(payload.data), accountId);
  });
}

/** Laravel: POST /api/DepositAccountMemberSync */
export async function syncDepositAccountMembers(
  input: unknown,
): Promise<DepositAccountMemberSyncResult> {
  const validated = depositAccountIdSchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<unknown[]>>(
      endpoints.depositAccount.memberSync,
      { account_id: validated.data.accountId },
      { accessToken: token, expectEnvelope: false },
    );
    assertSuccess(payload, "Failed to sync account members");
    return {
      members: parseMembers(asRows(payload.data), validated.data.accountId),
      message:
        "message" in payload && typeof payload.message === "string"
          ? payload.message
          : "",
    };
  });
}

/** Laravel: POST /api/DepositAccountAdd */
export async function createDepositAccount(
  input: unknown,
): Promise<DepositAccountSaveResult> {
  const validated = depositAccountCreateSchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.post<DepositAccountDto>(
      endpoints.depositAccount.add,
      mapDepositAccountCreateToDto(validated.data),
      { accessToken: token, expectEnvelope: true },
    );
    return parseSaveResult(
      data,
      "Deposit account creation returned an unexpected response",
    );
  });
}

/** Laravel: POST /api/DepositAccountEdit */
export async function updateDepositAccount(
  input: unknown,
): Promise<DepositAccountSaveResult> {
  const validated = depositAccountEditSchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.post<DepositAccountDto>(
      endpoints.depositAccount.edit,
      mapDepositAccountEditToDto(validated.data),
      { accessToken: token, expectEnvelope: true },
    );
    return parseSaveResult(
      data,
      "Deposit account update returned an unexpected response",
    );
  });
}

/** Laravel: POST /api/DepositAccountStatus */
export async function changeDepositAccountStatus(
  input: unknown,
): Promise<DepositAccount> {
  const validated = depositAccountStatusSchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.post<DepositAccountDto>(
      endpoints.depositAccount.status,
      mapDepositAccountStatusToDto(validated.data),
      { accessToken: token, expectEnvelope: true },
    );
    return parseAccountOrThrow(
      data,
      "Deposit account status returned an unexpected response",
    );
  });
}

/** Laravel: POST /api/DepositAccountClose */
export async function closeDepositAccount(
  input: unknown,
): Promise<DepositAccount> {
  const validated = depositAccountCloseSchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.post<DepositAccountDto>(
      endpoints.depositAccount.close,
      mapDepositAccountCloseToDto(validated.data),
      { accessToken: token, expectEnvelope: true },
    );
    return parseAccountOrThrow(
      data,
      "Deposit account close returned an unexpected response",
    );
  });
}

/** Laravel: GET /api/DepositNomineeList */
export async function listDepositNominees(
  accountId: number,
): Promise<DepositNominee[]> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<unknown[]>>(
      endpoints.depositAccount.nomineeList,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          account_id: accountId,
          is_active: 1,
          per_page: MAX_PER_PAGE,
        },
      },
    );
    assertSuccess(payload, "Failed to load nominees");
    const rows = Array.isArray(payload.data) ? payload.data : [];
    return rows.flatMap((row) => {
      const parsed = depositNomineeDtoSchema.safeParse(row);
      return parsed.success ? [mapDepositNomineeDto(parsed.data)] : [];
    });
  });
}

/** Laravel: POST /api/DepositNomineeEdit */
export async function editDepositNominee(input: unknown): Promise<void> {
  const validated = depositNomineeEditSchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);
  await withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    await api.post(
      endpoints.depositAccount.nomineeEdit,
      mapDepositNomineeEditToDto(validated.data),
      { accessToken: token, expectEnvelope: true },
    );
  });
}

/** Laravel: POST /api/DepositNomineeStatus */
export async function changeDepositNomineeStatus(input: unknown): Promise<void> {
  const validated = depositNomineeStatusSchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);
  await withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    await api.post(
      endpoints.depositAccount.nomineeStatus,
      mapDepositNomineeStatusToDto(validated.data),
      { accessToken: token, expectEnvelope: true },
    );
  });
}

/** Laravel: POST /api/DepositNomineeAdd */
export async function addDepositNominees(input: unknown): Promise<void> {
  const validated = depositNomineeAddSchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);

  await withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    await api.post(
      endpoints.depositAccount.nomineeAdd,
      mapDepositNomineeAddToDto(validated.data),
      { accessToken: token, expectEnvelope: true },
    );
  });
}

/** Laravel: GET /api/DepositSignatoryList */
export async function listDepositSignatories(
  accountId: number,
): Promise<DepositSignatory[]> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<unknown[]>>(
      endpoints.depositAccount.signatoryList,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          account_id: accountId,
          is_active: 1,
          per_page: MAX_PER_PAGE,
        },
      },
    );
    assertSuccess(payload, "Failed to load signatories");
    const rows = Array.isArray(payload.data) ? payload.data : [];
    return rows.flatMap((row) => {
      const parsed = depositSignatoryDtoSchema.safeParse(row);
      return parsed.success ? [mapDepositSignatoryDto(parsed.data)] : [];
    });
  });
}

/** Laravel: POST /api/DepositSignatoryAdd */
export async function addDepositSignatories(input: unknown): Promise<void> {
  const validated = depositSignatoryAddSchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);
  await withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    await api.post(
      endpoints.depositAccount.signatoryAdd,
      mapDepositSignatoryAddToDto(validated.data),
      { accessToken: token, expectEnvelope: true },
    );
  });
}

/** Laravel: POST /api/DepositSignatoryEdit */
export async function editDepositSignatory(input: unknown): Promise<void> {
  const validated = depositSignatoryEditSchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);
  await withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    await api.post(
      endpoints.depositAccount.signatoryEdit,
      mapDepositSignatoryEditToDto(validated.data),
      { accessToken: token, expectEnvelope: true },
    );
  });
}

/** Laravel: POST /api/DepositSignatoryStatus */
export async function changeDepositSignatoryStatus(input: unknown): Promise<void> {
  const validated = depositSignatoryStatusSchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);
  await withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    await api.post(
      endpoints.depositAccount.signatoryStatus,
      mapDepositSignatoryStatusToDto(validated.data),
      { accessToken: token, expectEnvelope: true },
    );
  });
}

/** Laravel: GET /api/MemberGroupList */
export async function listGroupMembers(
  groupId: number,
): Promise<SignatoryCandidate[]> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<unknown[]>>(
      endpoints.memberGroup.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          group_id: groupId,
          is_active: 1,
          per_page: MAX_PER_PAGE,
        },
      },
    );
    assertSuccess(payload, "Failed to load group members");
    const rows = Array.isArray(payload.data) ? payload.data : [];
    return rows.flatMap((row) => {
      if (typeof row !== "object" || row === null) return [];
      const item = mapGroupMember(row as Record<string, unknown>);
      return item ? [item] : [];
    });
  });
}

/** Laravel: GET /api/MemberList or GET /api/GroupList */
export async function listDepositCustomers(
  query: DepositCustomerQuery,
): Promise<DepositCustomer[]> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const path =
      query.kind === "member" ? endpoints.member.list : endpoints.group.list;
    const payload = await api.get<LaravelResponse<unknown[]>>(path, {
      accessToken: token,
      expectEnvelope: false,
      searchParams: {
        page: query.page ?? 1,
        per_page: clampPerPage(query.perPage),
        status_cd: 1,
        keyword: query.keyword,
        branch_id: query.branchId,
      },
    });

    assertSuccess(payload, "Failed to load customers");
    const rows = Array.isArray(payload.data) ? payload.data : [];
    return rows.flatMap((row) => {
      if (typeof row !== "object" || row === null) return [];
      const item = mapCustomerRow(row as Record<string, unknown>, query.kind);
      return item ? [item] : [];
    });
  });
}

/** Laravel: GET /api/DepositProductSchemeList?deposit_type_cd=1 */
export async function listDepositProductSchemes(
  depositTypeCd = 1,
): Promise<DepositProductScheme[]> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<unknown[]>>(
      endpoints.depositAccount.productSchemeList,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          deposit_type_cd: depositTypeCd,
          is_active: 1,
        },
      },
    );
    assertSuccess(payload, "Failed to load deposit product schemes");
    const rows = Array.isArray(payload.data) ? payload.data : [];
    return rows.flatMap((row) => {
      if (typeof row !== "object" || row === null) return [];
      const item = row as Record<string, unknown>;
      const schemesRaw = Array.isArray(item.schemes) ? item.schemes : [];
      return [
        {
          depositTypeCd: Number(item.deposit_type_cd) || 1,
          depositTypeDesc: String(item.deposit_type_desc ?? ""),
          optGrpId: Number(item.opt_grp_id) || 5,
          prodTypeCd: Number(item.prod_type_cd) || 0,
          prodTypeDesc: String(item.prod_type_desc ?? ""),
          schemes: schemesRaw.map((s: Record<string, unknown>) => ({
            schemeId: Number(s.scheme_id),
            schemeCode: String(s.scheme_code ?? ""),
            schemeName: String(s.scheme_name ?? ""),
            roiPercent: s.roi_percent != null ? Number(s.roi_percent) : null,
            inttTypeCd: s.intt_type_cd != null ? Number(s.intt_type_cd) : undefined,
            inttTypeDesc: s.intt_type_desc != null ? String(s.intt_type_desc) : undefined,
            inttPayoutCd: s.intt_payout_cd != null ? Number(s.intt_payout_cd) : undefined,
            inttPayoutDesc: s.intt_payout_desc != null ? String(s.intt_payout_desc) : undefined,
            minBalance: s.min_balance != null ? Number(s.min_balance) : null,
            withdAllow: Boolean(s.withd_allow),
            maxWithdAmt: s.max_withd_amt != null ? Number(s.max_withd_amt) : null,
            inopDays: s.inop_days != null ? Number(s.inop_days) : null,
            fieldColl: Boolean(s.field_coll),
            isActive: s.is_active !== false,
          })),
        },
      ];
    });
  });
}

/** Laravel: GET /api/DepositAccountView */
export async function viewDepositAccount(
  accountId: number,
  txnLimit = 10,
): Promise<DepositAccountViewData> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<Record<string, unknown>>>(
      endpoints.depositAccount.view,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          account_id: accountId,
          txn_limit: txnLimit,
        },
      },
    );
    assertSuccess(payload, "Failed to load deposit account view");
    const data = payload.data as Record<string, unknown>;
    const account = parseAccountOrThrow(data, "Invalid account view payload");

    const membersRaw = Array.isArray(data.members) ? data.members : [];
    const members: DepositAccountMember[] = membersRaw.map((m: Record<string, unknown>) => ({
      id: Number(m.id ?? m.member_id),
      accountId: Number(m.account_id ?? accountId),
      memberId: Number(m.member_id),
      memberRefCode: String(m.member_ref_code ?? ""),
      memberName: String(m.member_name ?? ""),
      mobileNo: m.mobile_no != null ? String(m.mobile_no) : null,
      groupId: m.group_id != null ? Number(m.group_id) : null,
      groupName: m.group_name != null ? String(m.group_name) : null,
      memberRole: m.member_role != null ? String(m.member_role) : null,
      isCurrentMember: Boolean(m.is_current_member),
      openDate: m.open_date != null ? String(m.open_date) : null,
      currentBalance: Number(m.current_balance ?? 0),
      acStatusCd: Number(m.ac_status_cd ?? 1),
      acStatusDesc: String(m.ac_status_desc ?? ""),
      createdBy: m.created_by != null ? Number(m.created_by) : null,
      createdOn: m.created_on != null ? String(m.created_on) : null,
    }));

    const nomineesRaw = Array.isArray(data.nominees) ? data.nominees : [];
    const nominees = nomineesRaw.flatMap((row) => {
      const parsed = depositNomineeDtoSchema.safeParse(row);
      return parsed.success ? [mapDepositNomineeDto(parsed.data)] : [];
    });

    const signatoriesRaw = Array.isArray(data.signatories) ? data.signatories : [];
    const signatories = signatoriesRaw.flatMap((row) => {
      const parsed = depositSignatoryDtoSchema.safeParse(row);
      return parsed.success ? [mapDepositSignatoryDto(parsed.data)] : [];
    });

    const txnsRaw = Array.isArray(data.transactions) ? data.transactions : [];
    const transactions: DepositAccountTransaction[] = txnsRaw.map((t: Record<string, unknown>) => ({
      transId: Number(t.trans_id),
      transNo: String(t.trans_no ?? ""),
      transDate: String(t.trans_date ?? ""),
      effectDate: String(t.effect_date ?? ""),
      transMode: String(t.trans_mode ?? ""),
      transModeDesc: String(t.trans_mode_desc ?? ""),
      transTypeCd: Number(t.trans_type_cd ?? 1),
      transTypeDesc: String(t.trans_type_desc ?? ""),
      transAmount: Number(t.trans_amount ?? 0),
      balanceAfter: t.balance_after != null ? Number(t.balance_after) : null,
      ledgerNarration: String(t.ledger_narration ?? ""),
      voucherId: t.voucher_id != null ? Number(t.voucher_id) : null,
      voucherNo: t.voucher_no != null ? String(t.voucher_no) : null,
      statusCd: Number(t.status_cd ?? 1),
      statusDesc: String(t.status_desc ?? ""),
    }));

    return {
      ...account,
      members,
      nominees,
      signatories,
      transactions,
      transactionCount: Number(data.transaction_count ?? transactions.length),
      rdSchedule: mapScheduleItems(data.rd_schedule),
      scheduleSummary: mapScheduleSummary(data.schedule_summary),
      misPayouts: mapPayoutItems(data.mis_payouts),
    };
  });
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asNumberOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapScheduleItems(value: unknown): TermScheduleItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    const item = asRecord(row);
    if (!item) return [];
    return [
      {
        scheduleId: asNumber(item.schedule_id),
        instlNo: asNumber(item.instl_no),
        dueDate: String(item.due_date ?? ""),
        instlAmt: asNumber(item.instl_amt),
        paidDate: item.paid_date != null ? String(item.paid_date) : null,
        paidAmount: asNumber(item.paid_amount),
        balanceAmount: asNumber(item.balance_amount),
        daysOverdue: asNumber(item.days_overdue),
        statusCd: asNumber(item.status_cd, 5),
        statusDesc: String(item.status_desc ?? ""),
      },
    ];
  });
}

function mapScheduleSummary(value: unknown): TermScheduleSummary | null {
  const item = asRecord(value);
  if (!item) return null;
  return {
    totalInstallments: asNumber(item.total_installments),
    paidInstallments: asNumber(item.paid_installments),
    overdueInstallments: asNumber(item.overdue_installments),
    paidAmount: asNumber(item.paid_amount),
    balanceAmount: asNumber(item.balance_amount),
    nextDueDate: item.next_due_date != null ? String(item.next_due_date) : null,
    nextDueAmount: asNumberOrNull(item.next_due_amount),
  };
}

function mapPayoutItems(value: unknown): TermPayoutItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    const item = asRecord(row);
    if (!item) return [];
    return [
      {
        payoutId: asNumber(item.payout_id),
        dueDate: String(item.due_date ?? ""),
        dueAmount: asNumber(item.due_amount),
        paidDate: item.paid_date != null ? String(item.paid_date) : null,
        statusCd: asNumber(item.status_cd, 3),
        statusDesc: String(item.status_desc ?? ""),
        voucherNo: item.voucher_no != null ? String(item.voucher_no) : null,
      },
    ];
  });
}

/** Laravel: POST /api/TermDepositScheduleSync */
export async function syncTermDepositSchedule(accountId: number): Promise<string> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<unknown>>(
      endpoints.depositAccount.scheduleSync,
      { account_id: accountId },
      { accessToken: token, expectEnvelope: false },
    );
    const message = payload.message ?? "Term deposit schedule synced";
    assertSuccess(payload, "Failed to sync the term deposit schedule");
    return message;
  });
}

/** Laravel: POST /api/DepositAccountMemberSync */
export async function syncDepositAccountMembers(
  accountId: number,
): Promise<{ message: string; members: DepositAccountMember[] }> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<unknown[]>>(
      endpoints.depositAccount.memberSync,
      { account_id: accountId },
      {
        accessToken: token,
        expectEnvelope: false,
      },
    );
    assertSuccess(payload, "Failed to sync deposit account members");
    const rows = Array.isArray(payload.data) ? payload.data : [];
    const members: DepositAccountMember[] = rows.map((m: any) => ({
      id: Number(m.id ?? m.member_id),
      accountId: Number(m.account_id ?? accountId),
      memberId: Number(m.member_id),
      memberRefCode: String(m.member_ref_code ?? ""),
      memberName: String(m.member_name ?? ""),
      mobileNo: m.mobile_no != null ? String(m.mobile_no) : null,
      groupId: m.group_id != null ? Number(m.group_id) : null,
      groupName: m.group_name != null ? String(m.group_name) : null,
      memberRole: m.member_role != null ? String(m.member_role) : null,
      isCurrentMember: Boolean(m.is_current_member),
      openDate: m.open_date != null ? String(m.open_date) : null,
      currentBalance: Number(m.current_balance ?? 0),
      acStatusCd: Number(m.ac_status_cd ?? 1),
      acStatusDesc: String(m.ac_status_desc ?? ""),
      createdBy: m.created_by != null ? Number(m.created_by) : null,
      createdOn: m.created_on != null ? String(m.created_on) : null,
    }));
    return {
      message: typeof payload.message === "string" ? payload.message : "Account synced",
      members,
    };
  });
}

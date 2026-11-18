import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import type { LaravelResponse, PaginationMeta } from "@/types/api";
import type {
  MemberLedger,
  MemberLedgerAccount,
  MemberLedgerMember,
  MemberLedgerMeta,
  MemberLedgerSection,
  MemberLedgerSummary,
  MemberLedgerTransaction,
  MemberLedgerTransactionQuery,
  MemberLedgerTransactions,
} from "../types/member-ledger.types";

type Raw = Record<string, unknown>;

function asRecord(value: unknown): Raw {
  return value && typeof value === "object" ? (value as Raw) : {};
}

function text(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function num(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function flag(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

async function token(): Promise<string> {
  const value = await getAccessToken();
  if (!value) {
    throw new ApiError({ message: "Unauthorized", status: 401, code: "UNAUTHORIZED" });
  }
  return value;
}

async function run<T>(callback: (accessToken: string) => Promise<T>): Promise<T> {
  try {
    return await callback(await token());
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) await clearAuthSession();
    throw error;
  }
}

function mapMember(raw: Raw): MemberLedgerMember {
  return {
    memberId: num(raw.member_id) ?? 0,
    memberCode: text(raw.member_code),
    refCode: text(raw.ref_code),
    memberName: text(raw.member_name),
    mobileNo: text(raw.mobile_no),
    branchId: num(raw.branch_id),
  };
}

function mapAccount(value: unknown): MemberLedgerAccount | null {
  const raw = asRecord(value);
  const accountId = num(raw.account_id);
  if (accountId == null || accountId <= 0) return null;
  return {
    accountId,
    holderRole: text(raw.holder_role),
    fullAccountNo: text(raw.full_account_no),
    applNo: text(raw.appl_no),
    holderName: text(raw.holder_name),
    depositTypeCd: num(raw.deposit_type_cd) ?? 0,
    depositTypeDesc: text(raw.deposit_type_desc),
    schemeCode: text(raw.scheme_code),
    schemeName: text(raw.scheme_name),
    prodTypeDesc: text(raw.prod_type_desc),
    statusCd: num(raw.status_cd) ?? 0,
    statusDesc: text(raw.status_desc),
    isClosed: flag(raw.is_closed),
    closingDate: text(raw.closing_date) || null,
    currentBalance: num(raw.current_balance),
    instAmount: num(raw.inst_amount),
    instNo: num(raw.inst_no),
    maturityDate: text(raw.maturity_date) || null,
    maturityAmt: num(raw.maturity_amt),
  };
}

function mapSection(value: unknown): MemberLedgerSection {
  const raw = asRecord(value);
  const accounts = Array.isArray(raw.accounts)
    ? raw.accounts.flatMap((item) => {
        const account = mapAccount(item);
        return account ? [account] : [];
      })
    : [];
  return {
    accountCount: num(raw.account_count) ?? accounts.length,
    openAccountCount: num(raw.open_account_count) ?? 0,
    totalBalance: num(raw.total_balance) ?? 0,
    totalCredit: num(raw.total_credit) ?? 0,
    totalDebit: num(raw.total_debit) ?? 0,
    accounts,
  };
}

function mapSummary(value: unknown): MemberLedgerSummary {
  const raw = asRecord(value);
  return {
    fromDate: text(raw.from_date) || null,
    toDate: text(raw.to_date) || null,
    openingBalance: num(raw.opening_balance) ?? 0,
    totalCredit: num(raw.total_credit) ?? 0,
    totalDebit: num(raw.total_debit) ?? 0,
    closingBalance: num(raw.closing_balance) ?? 0,
    postedCount: num(raw.posted_count) ?? 0,
    pendingCount: num(raw.pending_count) ?? 0,
    rejectedCount: num(raw.rejected_count) ?? 0,
  };
}

function mapTransaction(value: unknown): MemberLedgerTransaction | null {
  const raw = asRecord(value);
  const transId = num(raw.trans_id);
  if (transId == null) return null;
  return {
    transId,
    transNo: text(raw.trans_no),
    transDate: text(raw.trans_date),
    transModeDesc: text(raw.trans_mode_desc),
    transTypeDesc: text(raw.trans_type_desc),
    creditAmount: num(raw.credit_amount) ?? 0,
    debitAmount: num(raw.debit_amount) ?? 0,
    runningBalance: num(raw.running_balance),
    ledgerNarration: text(raw.ledger_narration),
    voucherNo: text(raw.voucher_no),
    statusCd: num(raw.status_cd) ?? 0,
    statusDesc: text(raw.status_desc),
  };
}

function mapMeta(meta: PaginationMeta | undefined, fallbackCount: number): MemberLedgerMeta {
  return {
    total: meta?.total ?? fallbackCount,
    page: meta?.page ?? 1,
    perPage: meta?.per_page ?? fallbackCount,
    lastPage: meta?.last_page ?? 1,
    hasMore: meta?.has_more ?? false,
  };
}

/** Laravel: GET /api/MemberLedger */
export async function getMemberLedger(
  memberId: number,
  includeClosed = true,
): Promise<MemberLedger> {
  return run(async (accessToken) => {
    const payload = await api.get<LaravelResponse<Raw>>(endpoints.memberLedger.accounts, {
      accessToken,
      expectEnvelope: false,
      searchParams: {
        member_id: memberId,
        include_closed: includeClosed ? 1 : 0,
      },
    });
    if (!payload || payload.success !== true || !payload.data) {
      throw new ApiError({
        message: payload?.message || "Failed to load the member ledger",
        status: payload?.success === false ? 422 : 500,
        code: "VALIDATION",
      });
    }
    const data = payload.data;
    return {
      member: mapMember(asRecord(data.member)),
      savings: mapSection(data.savings),
      termDeposit: mapSection(data.term_deposit),
    };
  });
}

/** Laravel: GET MemberLedgerSavingsTransactions or MemberLedgerTermTransactions */
export async function getMemberLedgerTransactions(
  query: MemberLedgerTransactionQuery,
): Promise<MemberLedgerTransactions> {
  return run(async (accessToken) => {
    const path =
      query.section === "term"
        ? endpoints.memberLedger.termTransactions
        : endpoints.memberLedger.savingsTransactions;
    const payload = await api.get<LaravelResponse<Raw>>(path, {
      accessToken,
      expectEnvelope: false,
      searchParams: {
        member_id: query.memberId,
        account_id: query.accountId,
        from_date: query.fromDate,
        to_date: query.toDate,
        include_pending: query.includePending ? 1 : 0,
        sort: query.sort === "asc" ? "asc" : "desc",
        page: query.page ?? 1,
        per_page: query.perPage ?? 20,
      },
    });
    if (!payload || payload.success !== true || !payload.data) {
      throw new ApiError({
        message: payload?.message || "Failed to load ledger transactions",
        status: payload?.success === false ? 422 : 500,
        code: "VALIDATION",
      });
    }
    const rows = Array.isArray(payload.data.transactions) ? payload.data.transactions : [];
    const transactions = rows.flatMap((item) => {
      const row = mapTransaction(item);
      return row ? [row] : [];
    });
    return {
      summary: mapSummary(payload.data.summary),
      transactions,
      meta: mapMeta(payload.meta, transactions.length),
    };
  });
}

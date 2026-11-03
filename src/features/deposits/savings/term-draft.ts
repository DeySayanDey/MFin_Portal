import {
  MATU_INS_PAY_TO_SB,
  MATU_INS_RENEW_PAY_INTEREST,
  TD_PROD_DAILY,
  TD_PROD_RECURRING,
} from "./deposit-account.constants";
import { todayYmd } from "./deposit-account.rules";
import type { DepositAccountTdInput } from "./types/deposit-account.types";

export type TermDraft = {
  startDate: string;
  startTouched: boolean;
  refAcNo: string;
  periodYy: string;
  periodMm: string;
  periodDd: string;
  instAmount: string;
  instNo: string;
  matuInsCd: string;
  sbCreditAcId: string;
  tdsDeduct: boolean;
};

export type TermField =
  | "tdStartDate"
  | "tdRefAcNo"
  | "tdPeriod"
  | "tdInstAmount"
  | "tdInstNo"
  | "tdSbCreditAcId";

export type TermIssue =
  | "start"
  | "ref"
  | "periodRange"
  | "periodRequired"
  | "periodWholeMonths"
  | "amount"
  | "instNo"
  | "sbCredit";

const MAX_AMOUNT = 99999999.99;

export function emptyTermDraft(): TermDraft {
  return {
    startDate: "",
    startTouched: false,
    refAcNo: "",
    periodYy: "",
    periodMm: "",
    periodDd: "",
    instAmount: "",
    instNo: "",
    matuInsCd: "",
    sbCreditAcId: "",
    tdsDeduct: false,
  };
}

/** Daily and recurring deposits collect installments; others take one deposit. */
export function takesInstallments(prodTypeCd: number | null): boolean {
  return prodTypeCd === TD_PROD_DAILY || prodTypeCd === TD_PROD_RECURRING;
}

export function needsSbCredit(matuInsCd: string): boolean {
  const code = Number(matuInsCd);
  return code === MATU_INS_RENEW_PAY_INTEREST || code === MATU_INS_PAY_TO_SB;
}

export function sbCreditRequired(matuInsCd: string): boolean {
  return Number(matuInsCd) === MATU_INS_PAY_TO_SB;
}

function wholeNumber(value: string): number {
  return value.trim() ? Number(value) : 0;
}

export function termStartDate(draft: TermDraft, applDate: string): string {
  return draft.startTouched ? draft.startDate : applDate;
}

export function termIssues(
  draft: TermDraft,
  applDate: string,
  prodTypeCd: number | null,
): Partial<Record<TermField, TermIssue>> {
  const issues: Partial<Record<TermField, TermIssue>> = {};
  const start = termStartDate(draft, applDate);
  if (!start || start < applDate || start > todayYmd()) issues.tdStartDate = "start";
  if (draft.refAcNo.trim().length > 15) issues.tdRefAcNo = "ref";

  const yy = wholeNumber(draft.periodYy);
  const mm = wholeNumber(draft.periodMm);
  const dd = wholeNumber(draft.periodDd);
  if (
    ![yy, mm, dd].every(Number.isInteger) ||
    yy < 0 ||
    yy > 50 ||
    mm < 0 ||
    mm > 120 ||
    dd < 0 ||
    dd > 120
  ) {
    issues.tdPeriod = "periodRange";
  } else if (yy + mm + dd === 0) {
    issues.tdPeriod = "periodRequired";
  } else if (prodTypeCd === TD_PROD_RECURRING && dd > 0) {
    issues.tdPeriod = "periodWholeMonths";
  }

  const amount = Number(draft.instAmount);
  if (!draft.instAmount.trim() || !Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    issues.tdInstAmount = "amount";
  }

  if (takesInstallments(prodTypeCd) && draft.instNo.trim()) {
    const count = Number(draft.instNo);
    const max = prodTypeCd === TD_PROD_RECURRING ? yy * 12 + mm : null;
    if (!Number.isInteger(count) || count < 1 || count > 32767 || (max != null && count > max)) {
      issues.tdInstNo = "instNo";
    }
  }

  if (sbCreditRequired(draft.matuInsCd) && !draft.sbCreditAcId) {
    issues.tdSbCreditAcId = "sbCredit";
  }
  return issues;
}

export function toTermInput(
  draft: TermDraft,
  prodTypeCd: number | null,
): DepositAccountTdInput {
  const sbCredit = needsSbCredit(draft.matuInsCd) && draft.sbCreditAcId
    ? Number(draft.sbCreditAcId)
    : null;
  return {
    startDate: draft.startTouched ? draft.startDate : undefined,
    refAcNo: draft.refAcNo.trim().toUpperCase() || null,
    periodYy: wholeNumber(draft.periodYy),
    periodMm: wholeNumber(draft.periodMm),
    periodDd: wholeNumber(draft.periodDd),
    instAmount: Number(draft.instAmount),
    instNo: takesInstallments(prodTypeCd) && draft.instNo.trim() ? Number(draft.instNo) : null,
    matuInsCd: draft.matuInsCd ? Number(draft.matuInsCd) : null,
    sbCreditAcId: sbCredit,
    tdsDeduct: draft.tdsDeduct,
  };
}

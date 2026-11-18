import { TERM_DEPOSIT_TYPE } from "@/features/deposits/savings/deposit-account.constants";
import { parseYmd } from "@/features/deposits/savings/deposit-account.rules";
import type { Member360 } from "./types/member-360.types";

export const ACTIVE_MEMBER_STATUS = 1;
const MATURITY_WINDOW_DAYS = 30;
const DAY_MS = 86_400_000;

export type Member360AlertTone = "danger" | "warning" | "info";

export type Member360Alert =
  | { key: "inactive"; tone: Member360AlertTone; status: string }
  | { key: "kycMissing"; tone: Member360AlertTone }
  | { key: "kycPending" | "kycRejected" | "kycExpired"; tone: Member360AlertTone; count: number }
  | { key: "overdue"; tone: Member360AlertTone; count: number; amount: number }
  | { key: "npa"; tone: Member360AlertTone; count: number }
  | { key: "maturing"; tone: Member360AlertTone; count: number; days: number };

/** Derives attention flags on the client so every message stays translatable. */
export function member360Alerts(data: Member360, today = new Date()): Member360Alert[] {
  const alerts: Member360Alert[] = [];
  const { profile, kyc, loans, deposits } = data;

  if (profile.statusCd !== ACTIVE_MEMBER_STATUS) {
    alerts.push({ key: "inactive", tone: "danger", status: profile.statusDesc });
  }

  if (kyc.length === 0) {
    alerts.push({ key: "kycMissing", tone: "warning" });
  } else {
    const rejected = kyc.filter((doc) => doc.verifyStatus === 2).length;
    const pending = kyc.filter((doc) => doc.verifyStatus === 0).length;
    const expired = kyc.filter((doc) => doc.isExpired).length;
    if (rejected) alerts.push({ key: "kycRejected", tone: "danger", count: rejected });
    if (pending) alerts.push({ key: "kycPending", tone: "warning", count: pending });
    if (expired) alerts.push({ key: "kycExpired", tone: "warning", count: expired });
  }

  const activeLoans = loans.filter((loan) => !loan.isClosed);
  const npa = activeLoans.filter((loan) => loan.isNpa).length;
  if (npa) alerts.push({ key: "npa", tone: "danger", count: npa });
  const overdue = activeLoans.filter((loan) => loan.overdueAmount > 0);
  if (overdue.length) {
    alerts.push({
      key: "overdue",
      tone: "danger",
      count: overdue.length,
      amount: overdue.reduce((sum, loan) => sum + loan.overdueAmount, 0),
    });
  }

  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const end = start + MATURITY_WINDOW_DAYS * DAY_MS;
  const maturing = deposits.filter((deposit) => {
    if (deposit.isClosed || deposit.depositTypeCd !== TERM_DEPOSIT_TYPE) return false;
    const time = parseYmd(deposit.maturityDate)?.getTime();
    return time != null && time >= start && time <= end;
  }).length;
  if (maturing) alerts.push({ key: "maturing", tone: "info", count: maturing, days: MATURITY_WINDOW_DAYS });

  return alerts;
}

import type { BadgeTone } from "@/components/ui/Badge";
import { STATUS_PENDING as TRANSACTION_STATUS_PENDING } from "@/features/deposits/savings-transaction/savings-transaction.constants";
import {
  CUST_TYPE_GROUP,
  CUST_TYPE_INDIVIDUAL,
  GROUP_OP_MODES,
  GROUP_SPECIAL,
  OP_MODE_ANY,
  OP_MODE_EITHER,
  OP_MODE_JOINTLY,
  PROD_TYPE_GROUP,
  PROD_TYPE_INDIVIDUAL,
  SPECIAL_SENIOR,
} from "./deposit-account.constants";
import type {
  DepositAccount,
  DepositAccountCreateInput,
  DepositAccountEditInput,
  DepositAccountSaveResult,
} from "./types/deposit-account.types";

export type DepositAccountField =
  | "prodTypeCd"
  | "schemeId"
  | "custIdPrimary"
  | "opModeCd"
  | "specialCatgCd"
  | "branchId"
  | "foId"
  | "applNo"
  | "applDate"
  | "custIdJoint1"
  | "custIdJoint2"
  | "holderName"
  | "nominees"
  | "signatories"
  | "sbStartDate"
  | "sbAccountNo"
  | "sbRefAcNo"
  | "sbCbsAcNo"
  | "sbRoi"
  | "sbOpening"
  | "sbRemarks";

export function todayYmd(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseYmd(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  if (
    date.getFullYear() !== Number(match[1]) ||
    date.getMonth() !== Number(match[2]) - 1 ||
    date.getDate() !== Number(match[3])
  ) {
    return null;
  }
  return date;
}

export function ageOn(dateOfBirth: string, onDate: string): number | null {
  const birth = parseYmd(dateOfBirth);
  const on = parseYmd(onDate);
  if (!birth || !on) return null;
  let age = on.getFullYear() - birth.getFullYear();
  const month = on.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && on.getDate() < birth.getDate())) age -= 1;
  return age;
}

export function holderPreview(
  primary: string,
  joint1: string,
  joint2: string,
): string {
  return [primary, joint1, joint2].map((name) => name.trim()).filter(Boolean).join(" & ");
}

export function jointVisibility(custTypeCd: number, opModeCd: number) {
  if (custTypeCd !== CUST_TYPE_INDIVIDUAL) {
    return { joint1: false, joint2: false, joint2Required: false };
  }
  if (opModeCd === OP_MODE_JOINTLY || opModeCd === OP_MODE_EITHER) {
    return { joint1: true, joint2: true, joint2Required: false };
  }
  if (opModeCd === OP_MODE_ANY) {
    return { joint1: true, joint2: true, joint2Required: true };
  }
  return { joint1: false, joint2: false, joint2Required: false };
}

export function isOpModeAllowed(custTypeCd: number, opModeCd: number): boolean {
  if (custTypeCd !== CUST_TYPE_GROUP) return true;
  return GROUP_OP_MODES.some((mode) => mode === opModeCd);
}

export function isSpecialAllowed(
  custTypeCd: number,
  specialCatgCd: number,
  age: number | null,
): boolean {
  if (custTypeCd === CUST_TYPE_GROUP) {
    return GROUP_SPECIAL.some((code) => code === specialCatgCd);
  }
  if (specialCatgCd === SPECIAL_SENIOR && age != null && age < 60) return false;
  return true;
}

/** Detail page URL carrying the save notice and the opening deposit outcome. */
export function accountDetailHref(
  result: DepositAccountSaveResult,
  notice: "created" | "updated",
): string {
  const params = new URLSearchParams();
  params.set(notice, result.account.fullAccountNo || result.account.applNo);
  const opening = result.openingTransaction;
  if (opening?.statusCd === TRANSACTION_STATUS_PENDING) params.set("opening", "pending");
  if (opening?.voucherNote) params.set("voucherNote", opening.voucherNote);
  return `/deposits/savings/${result.account.accountId}?${params.toString()}`;
}

export function depositStatusTone(statusCd: number): BadgeTone {
  if (statusCd === 1) return "success";
  if (statusCd === 7) return "warning";
  if (statusCd === 4) return "danger";
  if (statusCd === 5 || statusCd === 6) return "amber";
  return "neutral";
}

/** Customer type a savings product type requires; `null` when either is allowed. */
export function custTypeForProduct(prodTypeCd: number | null): number | null {
  if (prodTypeCd === PROD_TYPE_INDIVIDUAL) return CUST_TYPE_INDIVIDUAL;
  if (prodTypeCd === PROD_TYPE_GROUP) return CUST_TYPE_GROUP;
  return null;
}

/** Product, scheme, customer type and primary customer lock once the account is opened. */
export function accountFieldsLocked(
  account: DepositAccount | null,
  transactionCount = 0,
): boolean {
  if (!account) return false;
  return account.accountNo != null || transactionCount > 0;
}

/** Start date, account number and opening deposit lock once money has moved. */
export function savingsFieldsLocked(
  account: DepositAccount | null,
  transactionCount = 0,
): boolean {
  if (!account) return false;
  return (account.currentBalance ?? 0) !== 0 || transactionCount > 0;
}

export function mapApiMessageToField(message: string): DepositAccountField | "toast" | "close" | null {
  const text = message.toLowerCase();
  if (text.includes("cannot be changed once")) return "toast";
  if (text.includes("closed deposit account")) return "toast";
  if (text.includes("individual deposit accounts only")) return "toast";
  if (text.includes("opening deposit")) return "sbOpening";
  if (text.includes("product type") || text.includes("savings product")) {
    return "prodTypeCd";
  }
  if (
    text.includes("nominee") ||
    text.includes("share") ||
    text.includes("guardian") ||
    text.includes("relation") ||
    text.includes("birth date") ||
    text.includes("contact number") ||
    text.includes("at most 4")
  ) {
    return "nominees";
  }
  if (text.includes("signatory")) return "signatories";
  if (
    text.includes("balance must be zero") ||
    text.includes("freezed") ||
    text.includes("closing")
  ) {
    return "close";
  }
  if (text.includes("start date")) return "sbStartDate";
  if (text.includes("opening")) return "sbOpening";
  if (text.includes("cbs")) return "sbCbsAcNo";
  if (text.includes("reference") || text.includes("ref")) return "sbRefAcNo";
  if (text.includes("account number") || text.includes("account no")) return "sbAccountNo";
  if (text.includes("rate") || text.includes("roi")) return "sbRoi";
  if (text.includes("application number")) return "applNo";
  if (text.includes("application date")) return "applDate";
  if (
    text.includes("open account in this savings scheme") ||
    text.includes("deposit type") ||
    text.includes("scheme")
  ) {
    return "schemeId";
  }
  if (
    text.includes("joint holder") ||
    text.includes("joint holders") ||
    text.includes("operation")
  ) {
    return "opModeCd";
  }
  if (text.includes("senior citizen") || text.includes("special category")) {
    return "specialCatgCd";
  }
  if (text.includes("field officer")) return "foId";
  if (text.includes("branch")) return "branchId";
  if (
    text.includes("member") ||
    text.includes("group") ||
    text.includes("primary")
  ) {
    return "custIdPrimary";
  }
  return null;
}

type FormSnapshot = {
  applDate: string;
  prodTypeCd: number | null;
  schemeId: number;
  custTypeCd: number;
  custIdPrimary: number;
  opModeCd: number;
  applNo: string;
  specialCatgCd: number | null;
  custIdJoint1: number | null;
  custIdJoint2: number | null;
  holderName: string | null;
  holderNameManual: boolean;
  nomRegd: boolean;
  foId: number | null;
  branchId: number | null;
  statusCd: number;
  sb?: DepositAccountCreateInput["sb"];
};

export function toCreateInput(form: FormSnapshot): DepositAccountCreateInput {
  const joints = jointVisibility(form.custTypeCd, form.opModeCd);
  return {
    applDate: form.applDate,
    prodTypeCd: form.prodTypeCd,
    schemeId: form.schemeId,
    custTypeCd: form.custTypeCd,
    custIdPrimary: form.custIdPrimary,
    opModeCd: form.opModeCd,
    applNo: form.applNo.trim() ? form.applNo.trim().toUpperCase() : null,
    specialCatgCd: form.specialCatgCd,
    custIdJoint1: joints.joint1 ? form.custIdJoint1 : null,
    custIdJoint2:
      joints.joint2 && form.custIdJoint1 != null ? form.custIdJoint2 : null,
    holderName: form.holderNameManual ? form.holderName : null,
    nomRegd: form.custTypeCd === CUST_TYPE_INDIVIDUAL ? form.nomRegd : false,
    foId: form.foId,
    branchId: form.branchId,
    statusCd: form.statusCd === 7 ? 7 : 1,
    sb: form.sb,
  };
}

export function toEditInput(
  account: DepositAccount,
  form: FormSnapshot,
): DepositAccountEditInput {
  const next = toCreateInput(form);
  const input: DepositAccountEditInput = { accountId: account.accountId };
  if (next.applDate !== account.applDate) input.applDate = next.applDate;
  if (next.schemeId !== account.schemeId) {
    input.schemeId = next.schemeId;
    input.prodTypeCd = next.prodTypeCd ?? null;
  }
  if (next.custTypeCd !== account.custTypeCd) input.custTypeCd = next.custTypeCd;
  if (next.custIdPrimary !== account.custIdPrimary) {
    input.custIdPrimary = next.custIdPrimary;
  }
  if (next.opModeCd !== account.opModeCd) input.opModeCd = next.opModeCd;
  const currentApplNo = account.applNo.trim().toUpperCase();
  const nextApplNo = next.applNo?.trim().toUpperCase() ?? "";
  if (nextApplNo && nextApplNo !== currentApplNo) input.applNo = nextApplNo;
  if ((next.specialCatgCd ?? null) !== (account.specialCatgCd ?? null)) {
    input.specialCatgCd = next.specialCatgCd ?? null;
  }
  if ((next.custIdJoint1 ?? null) !== (account.custIdJoint1 ?? null)) {
    input.custIdJoint1 = next.custIdJoint1 ?? null;
  }
  if ((next.custIdJoint2 ?? null) !== (account.custIdJoint2 ?? null)) {
    input.custIdJoint2 = next.custIdJoint2 ?? null;
  }
  if (form.holderNameManual && (next.holderName ?? "") !== account.holderName) {
    input.holderName = next.holderName ?? null;
  }
  if (Boolean(next.nomRegd) !== account.nomRegd) input.nomRegd = next.nomRegd;
  if ((next.foId ?? null) !== (account.foId ?? null)) input.foId = next.foId ?? null;
  if ((next.branchId ?? null) !== (account.branchId ?? null)) {
    input.branchId = next.branchId ?? null;
  }
  if (next.sb) {
    const sb: NonNullable<DepositAccountEditInput["sb"]> = {};
    if ((next.sb.startDate ?? null) !== (account.startDate || null)) {
      sb.startDate = next.sb.startDate ?? null;
    }
    if ((next.sb.accountNo ?? null) !== (account.accountNo ?? null)) {
      sb.accountNo = next.sb.accountNo ?? null;
    }
    if ((next.sb.refAcNo ?? "") !== (account.refAcNo ?? "")) {
      sb.refAcNo = next.sb.refAcNo ?? null;
    }
    if ((next.sb.cbsAcNo ?? "") !== (account.cbsAcNo ?? "")) {
      sb.cbsAcNo = next.sb.cbsAcNo ?? null;
    }
    if (
      next.sb.roi !== undefined &&
      (next.sb.roi ?? null) !== (account.sbRoi ?? null)
    ) {
      sb.roi = next.sb.roi ?? null;
    }
    if ((next.sb.openingDeposit ?? null) !== (account.openingDeposit ?? null)) {
      sb.openingDeposit = next.sb.openingDeposit ?? null;
      if (next.sb.paymentModeCd != null) sb.paymentModeCd = next.sb.paymentModeCd;
      if (next.sb.remarks) sb.remarks = next.sb.remarks;
    }
    if (Object.keys(sb).length > 0) input.sb = sb;
  }
  return input;
}

import {
  SAVINGS_DEPOSIT_TYPE,
  TERM_DEPOSIT_TYPE,
} from "@/features/deposits/savings/deposit-account.constants";
import { depositAccountHref, savingsTransactionHref } from "@/features/deposits/savings/deposit-account.rules";
import { settlementAccountHref } from "@/features/deposits/fd-settlement/fd-settlement.routes";
import { recordCode } from "@/lib/navigation/record-code";
import type { Member360Deposit, Member360Profile } from "./types/member-360.types";

export const MEMBER_360_PATH = "/onboarding/member-360-enquiry";

export function member360Code(member: { memberCode: string | number | null; memberId: number }): string {
  return recordCode(member.memberCode == null ? "" : String(member.memberCode), member.memberId);
}

export function member360Href(code: string): string {
  return `${MEMBER_360_PATH}?${new URLSearchParams({ member: code })}`;
}

/** Screens that open for this member, keyed by the quick-link they back. */
export function memberLinks(profile: Member360Profile) {
  const byMember = new URLSearchParams({ member_id: String(profile.memberId) });
  return {
    registration: "/onboarding/member-registration",
    kyc: `/customer-kyc?${byMember}`,
    groups: `/onboarding/group-member-mapping?${byMember}`,
    shares: "/onboarding/share-subscription",
    ledger: "/deposits/member-ledger",
    closure: "/onboarding/membership-closure",
    openSavings: "/deposits/savings/open",
    openTerm: "/deposits/fd/new",
    loanApplications: "/los/applications",
    disbursement: "/lms/disbursement",
    collections: "/lms/collections",
  } as const;
}

export type DepositLink = { key: "view" | "transactions" | "settle"; href: string };

export function depositLinks(deposit: Member360Deposit): DepositLink[] {
  const ref = { accountId: deposit.accountId, fullAccountNo: deposit.fullAccountNo, applNo: deposit.applNo };
  if (deposit.depositTypeCd === SAVINGS_DEPOSIT_TYPE) {
    return [
      { key: "view", href: depositAccountHref(ref) },
      { key: "transactions", href: savingsTransactionHref(ref) },
    ];
  }
  if (deposit.depositTypeCd === TERM_DEPOSIT_TYPE) {
    const links: DepositLink[] = [
      { key: "view", href: `/deposits/fd?${new URLSearchParams({ account_id: String(deposit.accountId) })}` },
    ];
    if (deposit.fullAccountNo) {
      links.push({ key: "settle", href: settlementAccountHref(deposit.fullAccountNo, deposit.accountId) });
    }
    return links;
  }
  return [];
}

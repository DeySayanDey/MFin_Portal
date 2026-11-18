import { recordCode, recordPath } from "@/lib/navigation/record-code";

export const FD_SETTLEMENT_PATH = "/deposits/fd-settlement";

export function settlementAccountCode(accountNumber: string, accountId: number): string {
  return recordCode(accountNumber, accountId);
}

export function settlementAccountHref(accountNumber: string, accountId: number): string {
  return recordPath(FD_SETTLEMENT_PATH, settlementAccountCode(accountNumber, accountId));
}

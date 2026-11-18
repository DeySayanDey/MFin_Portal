"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import type { DepositAccount } from "@/features/deposits/savings/types/deposit-account.types";
import {
  fetchSavingsTransactions,
  isSavingsTransactionClientError,
} from "@/features/deposits/savings-transaction/services/savings-transaction-client";
import type {
  SavingsTransaction,
  SavingsTransactionListQuery,
} from "@/features/deposits/savings-transaction/types/savings-transaction.types";

const PRINT_PAGE_SIZE = 200;
const PRINT_MAX_PAGES = 25;
export const MEMBER_LEDGER_PRINT_ROW_LIMIT = PRINT_PAGE_SIZE * PRINT_MAX_PAGES;

type PrintQuery = Omit<SavingsTransactionListQuery, "page" | "perPage">;

export type MemberLedgerPrintReport = {
  rows: SavingsTransaction[];
  generatedAt: Date;
  truncated: boolean;
  account: DepositAccount;
  fromDate: string;
  toDate: string;
  sort: "asc" | "desc";
};

type PrintContext = Pick<MemberLedgerPrintReport, "account" | "fromDate" | "toDate" | "sort">;

export function useMemberLedgerPrint() {
  const t = useTranslations("deposits.savingsTransaction");
  const [preparing, setPreparing] = useState(false);
  const [report, setReport] = useState<MemberLedgerPrintReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(
    async (query: PrintQuery, context: PrintContext) => {
      setPreparing(true);
      setError(null);
      try {
        const rows: SavingsTransaction[] = [];
        let expected = 0;
        for (let page = 1; page <= PRINT_MAX_PAGES; page += 1) {
          const result = await fetchSavingsTransactions({
            ...query,
            page,
            perPage: PRINT_PAGE_SIZE,
          });
          const items = result.items ?? [];
          rows.push(...items);
          expected = result.meta?.total ?? rows.length;
          if (items.length < PRINT_PAGE_SIZE || rows.length >= expected) break;
        }
        setReport({
          ...context,
          rows,
          generatedAt: new Date(),
          truncated: expected > rows.length,
        });
      } catch (cause) {
        setError(
          isSavingsTransactionClientError(cause) ? cause.message : t("print.failed"),
        );
      } finally {
        setPreparing(false);
      }
    },
    [t],
  );

  const close = useCallback(() => setReport(null), []);

  return {
    report,
    error,
    preparing,
    busy: preparing || report != null,
    start,
    close,
  };
}

"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  fetchSavingsTransactions,
  isSavingsTransactionClientError,
} from "../services/savings-transaction-client";
import type {
  SavingsTransaction,
  SavingsTransactionListQuery,
  SavingsTransactionReport,
} from "../types/savings-transaction.types";

/* Matches the BFF per_page cap; PRINT_MAX_PAGES bounds the report size. */
const PRINT_PAGE_SIZE = 200;
const PRINT_MAX_PAGES = 25;
export const PRINT_ROW_LIMIT = PRINT_PAGE_SIZE * PRINT_MAX_PAGES;

type ReportQuery = Omit<SavingsTransactionListQuery, "page" | "perPage">;

/** Loads every transaction matching the list filters for the printed report. */
export function useSavingsTransactionPrint(onError: (message: string) => void) {
  const t = useTranslations("deposits.savingsTransaction");
  const [preparing, setPreparing] = useState(false);
  const [report, setReport] = useState<SavingsTransactionReport | null>(null);

  const start = useCallback(
    async (query: ReportQuery) => {
      setPreparing(true);
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
        setReport({ rows, generatedAt: new Date(), truncated: expected > rows.length });
      } catch (error) {
        onError(isSavingsTransactionClientError(error) ? error.message : t("print.failed"));
      } finally {
        setPreparing(false);
      }
    },
    [onError, t],
  );

  const close = useCallback(() => setReport(null), []);

  return { report, busy: preparing || report != null, preparing, start, close };
}

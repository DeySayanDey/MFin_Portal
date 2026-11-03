"use client";

import { useMemo } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { parseYmd } from "@/features/deposits/savings/deposit-account.rules";
import {
  STATUS_PENDING,
  STATUS_REJECTED,
  TRANS_MODES,
  TRANS_WITHDRAWAL,
  type TransMode,
} from "../savings-transaction.constants";
import type { SavingsTransaction } from "../types/savings-transaction.types";

/** Display text for transaction fields, shared by the table and the printed report. */
export function useSavingsTransactionLabels() {
  const t = useTranslations("deposits.savingsTransaction");
  const format = useFormatter();

  return useMemo(() => {
    const money = (value: number | null) =>
      value == null ? "—" : format.number(value, { style: "currency", currency: "INR" });

    return {
      money,
      account: (row: SavingsTransaction) =>
        row.fullAccountNo || (row.accountNo != null ? String(row.accountNo) : "—"),
      type: (row: SavingsTransaction) =>
        row.transTypeDesc ||
        (row.transTypeCd === TRANS_WITHDRAWAL ? t("types.2") : t("types.1")),
      mode: (row: SavingsTransaction) =>
        row.transModeDesc ||
        (TRANS_MODES.includes(row.transMode as TransMode)
          ? t(`modes.${row.transMode as TransMode}`)
          : row.transMode),
      balance: (row: SavingsTransaction) =>
        row.statusCd === STATUS_PENDING ? t("form.sentForApproval") : money(row.balanceAfter),
      status: (row: SavingsTransaction) =>
        row.statusDesc ||
        (row.statusCd === STATUS_PENDING
          ? t("statuses.2")
          : row.statusCd === STATUS_REJECTED
            ? t("statuses.3")
            : t("statuses.1")),
      date: (row: SavingsTransaction) => {
        const parsed = parseYmd(row.transDate);
        return parsed
          ? format.dateTime(parsed, { month: "short", day: "numeric", year: "numeric" })
          : "—";
      },
    };
  }, [format, t]);
}

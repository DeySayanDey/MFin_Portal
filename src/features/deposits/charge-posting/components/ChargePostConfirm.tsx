"use client";

import { MinusCircle } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { chargeLine, type ChargeAmountMap } from "../charge-posting.rules";
import type { ChargeRow } from "../types/charge-posting.types";
import { useChargeFormat } from "./useChargeFormat";

type ChargePostConfirmProps = {
  open: boolean;
  rows: ChargeRow[];
  amounts: ChargeAmountMap;
  chargeDate: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function ChargePostConfirm({ open, rows, amounts, chargeDate, onClose, onConfirm }: ChargePostConfirmProps) {
  const { t, money, date } = useChargeFormat();
  let total = 0;
  let tax = 0;
  for (const row of rows) {
    const line = chargeLine(row, amounts[row.rowKey]);
    total += line?.total ?? 0;
    tax += line?.tax ?? 0;
  }
  const accounts = new Set(rows.map((row) => row.accountId)).size;

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      actionType="custom"
      variant="danger"
      icon={MinusCircle}
      title={t("confirm.title")}
      description={t("confirm.description", {
        count: rows.length,
        accounts,
        total: money(total),
        tax: money(tax),
        date: date(chargeDate),
      })}
      confirmLabel={t("confirm.button")}
    />
  );
}

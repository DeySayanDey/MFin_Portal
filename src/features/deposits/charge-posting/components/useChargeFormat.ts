"use client";

import { useCallback } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { parseYmd } from "@/features/deposits/savings/deposit-account.rules";
import { FIGURE_PERCENT_OPT_CODE } from "@/features/master/charges-setup/constants";
import type { ChargeRow } from "../types/charge-posting.types";

export function useChargeFormat() {
  const t = useTranslations("deposits.chargePosting");
  const format = useFormatter();

  const money = useCallback(
    (value: number | null) =>
      value == null
        ? t("dash")
        : format.number(value, { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    [format, t],
  );

  const date = useCallback(
    (value: string) => {
      const parsed = parseYmd(value);
      return parsed ? format.dateTime(parsed, { day: "numeric", month: "short", year: "numeric" }) : t("dash");
    },
    [format, t],
  );

  const percent = useCallback(
    (value: number) => format.number(value / 100, { style: "percent", maximumFractionDigits: 2 }),
    [format],
  );

  /** How the charge is worked out, from the charge setup. */
  const basis = useCallback(
    (row: ChargeRow) => {
      if (row.figureCd === FIGURE_PERCENT_OPT_CODE) {
        if (row.chargeRate == null) return t("basis.manual");
        return row.maxAmount != null && row.maxAmount > 0
          ? t("basis.percentMax", { rate: percent(row.chargeRate), max: money(row.maxAmount) })
          : t("basis.percent", { rate: percent(row.chargeRate) });
      }
      const fixed = row.chargeRate ?? row.maxAmount;
      return fixed != null && fixed > 0 ? t("basis.fixed", { amount: money(fixed) }) : t("basis.manual");
    },
    [money, percent, t],
  );

  return { t, money, date, percent, basis };
}

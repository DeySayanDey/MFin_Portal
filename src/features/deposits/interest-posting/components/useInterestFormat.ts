"use client";

import { useCallback } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { parseYmd } from "@/features/deposits/savings/deposit-account.rules";

export function useInterestFormat() {
  const t = useTranslations("deposits.interestPosting");
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

  return { t, money, date, percent };
}

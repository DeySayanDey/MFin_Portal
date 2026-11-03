"use client";

import { useCallback } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { parseYmd } from "@/features/deposits/savings/deposit-account.rules";

export function useDashboardFormat() {
  const t = useTranslations("dashboard");
  const format = useFormatter();

  const money = useCallback(
    (value: number | null | undefined) =>
      format.number(value ?? 0, {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [format],
  );

  const integer = useCallback((value: number) => format.number(Math.round(value), { maximumFractionDigits: 0 }), [format]);

  const percent = useCallback(
    (value: number) => format.number(value / 100, { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    [format],
  );

  const date = useCallback(
    (value: string) => {
      const parsed = parseYmd(value);
      return parsed ? format.dateTime(parsed, { day: "numeric", month: "short", year: "numeric" }) : t("dash");
    },
    [format, t],
  );

  return { t, money, integer, percent, date };
}

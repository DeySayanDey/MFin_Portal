"use client";

import { useCallback } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { parseYmd } from "@/features/deposits/savings/deposit-account.rules";

export function useMember360Format() {
  const t = useTranslations("onboarding.member360");
  const format = useFormatter();

  const money = useCallback(
    (value: number | null) =>
      value == null
        ? t("dash")
        : format.number(value, {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
    [format, t],
  );

  const date = useCallback(
    (value: string) => {
      const parsed = parseYmd(value);
      return parsed ? format.dateTime(parsed, { month: "short", day: "numeric", year: "numeric" }) : t("dash");
    },
    [format, t],
  );

  const count = useCallback((value: number) => format.number(value), [format]);

  const text = useCallback((value: string | null | undefined) => (value ? value : t("dash")), [t]);

  return { money, date, count, text, t };
}

"use client";

import { Send } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useInterestFormat } from "./useInterestFormat";

type InterestPostConfirmProps = {
  open: boolean;
  count: number;
  total: number;
  postingDate: string;
  asOnDate: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function InterestPostConfirm({ open, count, total, postingDate, asOnDate, onClose, onConfirm }: InterestPostConfirmProps) {
  const { t, money, date } = useInterestFormat();
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      actionType="custom"
      variant="success"
      icon={Send}
      title={t("confirm.title")}
      description={t("confirm.description", {
        count,
        total: money(total),
        asOn: date(asOnDate),
        posting: date(postingDate),
      })}
      confirmLabel={t("confirm.button")}
    />
  );
}

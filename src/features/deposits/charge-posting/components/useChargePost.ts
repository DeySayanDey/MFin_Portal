"use client";

import { useState } from "react";
import { showToast } from "@/components/ui/toast";
import { toChargePostRows, type ChargeAmountMap } from "../charge-posting.rules";
import { isChargeClientError, postCharges } from "../services/charge-posting-client";
import type { ChargeMode, ChargeRow } from "../types/charge-posting.types";
import { useChargeFormat } from "./useChargeFormat";

/** Confirm-and-post flow shared by the single and bulk panels. */
export function useChargePost(mode: ChargeMode, chargeDate: string, onPosted: () => void) {
  const { t, money } = useChargeFormat();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [remarks, setRemarks] = useState("");

  async function post(rows: ChargeRow[], amounts: ChargeAmountMap) {
    const payload = toChargePostRows(rows, amounts);
    if (!payload) {
      showToast(t("summary.invalidAmounts", { count: 1 }), "error");
      return;
    }
    setPosting(true);
    try {
      const result = await postCharges({
        mode,
        chargeDate,
        remarks: remarks.trim() || undefined,
        rows: payload,
      });
      showToast(
        t("posted", {
          count: result.postedCount,
          total: money(result.totalCharge + result.totalTax),
          batch: result.batchNo || t("dash"),
        }),
        "success",
      );
      setRemarks("");
      setConfirmOpen(false);
      onPosted();
    } catch (error) {
      showToast(isChargeClientError(error) ? error.message : t("postFailed"), "error");
    } finally {
      setPosting(false);
    }
  }

  return { confirmOpen, setConfirmOpen, posting, remarks, setRemarks, post };
}

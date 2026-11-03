"use client";

import { useState } from "react";
import { showToast } from "@/components/ui/toast";
import { toPostRows, type AmountMap } from "../interest-posting.rules";
import { isInterestClientError, postInterest } from "../services/interest-posting-client";
import type { InterestMode, InterestRow } from "../types/interest-posting.types";
import { useInterestFormat } from "./useInterestFormat";

/** Confirm-and-post flow shared by the single and bulk panels. */
export function useInterestPost(mode: InterestMode, asOnDate: string, postingDate: string, onPosted: () => void) {
  const { t, money } = useInterestFormat();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [remarks, setRemarks] = useState("");

  async function post(rows: InterestRow[], amounts: AmountMap) {
    const payload = toPostRows(rows, amounts);
    if (!payload) {
      showToast(t("summary.invalidAmounts", { count: 1 }), "error");
      return;
    }
    setPosting(true);
    try {
      const result = await postInterest({
        mode,
        asOnDate,
        postingDate,
        remarks: remarks.trim() || undefined,
        rows: payload,
      });
      showToast(
        t("posted", { count: result.postedCount, total: money(result.totalInterest), batch: result.batchNo || t("dash") }),
        "success",
      );
      setRemarks("");
      setConfirmOpen(false);
      onPosted();
    } catch (error) {
      showToast(isInterestClientError(error) ? error.message : t("postFailed"), "error");
    } finally {
      setPosting(false);
    }
  }

  return { confirmOpen, setConfirmOpen, posting, remarks, setRemarks, post };
}

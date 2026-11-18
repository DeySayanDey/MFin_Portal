import type { BadgeTone } from "@/components/ui/Badge";
import { STATUS_APPROVED, STATUS_ENTERED, STATUS_REJECTED } from "./share-subscription.constants";

export function moneyAmount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  return Number(trimmed);
}

export function wholeNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return value > 0 ? value : null;
}

export function cents(value: number): number {
  return Math.round(value * 100);
}

export function statusTone(statusCd: number): BadgeTone {
  if (statusCd === STATUS_APPROVED) return "success";
  if (statusCd === STATUS_ENTERED) return "warning";
  if (statusCd === STATUS_REJECTED) return "danger";
  return "neutral";
}

/** Laravel sends `Y-m-d H:i:s` without a zone. */
export function parseDateTime(raw: string | null): Date | null {
  if (!raw) return null;
  const date = new Date(raw.includes("T") ? raw : raw.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? null : date;
}

import { z } from "zod";
import {
  LOAN_ELIGIBILITY_COMPARE_OPERATORS,
  LOAN_ELIGIBILITY_EQUALITY_OPERATORS,
} from "../constants";

function hasMaxTwoDecimals(value: number): boolean {
  const scaled = value * 100;
  return Math.abs(scaled - Math.round(scaled)) < 1e-6;
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const NUMERIC_TYPES = new Set(["NUMBER", "AMOUNT", "PERCENTAGE", "BOOLEAN"]);
const TEXT_TYPES = new Set(["TEXT", "DATE"]);

export const loanEligibilitySaveInputSchema = z
  .object({
    paramId: z.number().int().positive(),
    dataType: z.string().min(1),
    operator: z.string().min(1),
    reqValue: z.number().nullable().optional(),
    valueCd: z.number().int().positive().nullable().optional(),
    parameterValue: z.string().max(500).nullable().optional(),
    isMandatory: z.boolean().optional(),
    effectiveFrom: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const kind = data.dataType.trim().toUpperCase();
    const operator = data.operator.trim();
    const equalityOnly = kind === "BOOLEAN" || kind === "TEXT";
    const allowed = equalityOnly
      ? LOAN_ELIGIBILITY_EQUALITY_OPERATORS
      : LOAN_ELIGIBILITY_COMPARE_OPERATORS;

    if (!(allowed as readonly string[]).includes(operator)) {
      ctx.addIssue({ code: "custom", path: ["operator"] });
    }

    if (NUMERIC_TYPES.has(kind)) {
      if (data.reqValue == null || !hasMaxTwoDecimals(data.reqValue)) {
        ctx.addIssue({ code: "custom", path: ["reqValue"] });
      } else if (kind === "BOOLEAN" && data.reqValue !== 0 && data.reqValue !== 1) {
        ctx.addIssue({ code: "custom", path: ["reqValue"] });
      } else if (kind === "PERCENTAGE" && (data.reqValue < 0 || data.reqValue > 100)) {
        ctx.addIssue({ code: "custom", path: ["reqValue"] });
      } else if (data.reqValue < 0) {
        ctx.addIssue({ code: "custom", path: ["reqValue"] });
      }
    }

    if (TEXT_TYPES.has(kind)) {
      const text = data.parameterValue?.trim() ?? "";
      if (!text) {
        ctx.addIssue({ code: "custom", path: ["parameterValue"] });
      } else if (kind === "DATE" && !isIsoDate(text)) {
        ctx.addIssue({ code: "custom", path: ["parameterValue"] });
      }
    }

    if (data.effectiveFrom && !isIsoDate(data.effectiveFrom)) {
      ctx.addIssue({ code: "custom", path: ["effectiveFrom"] });
    }
  });

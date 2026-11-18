/** ApplOptions group 7: term unit (Days, Months, Year). */
export const LOAN_ELIGIBILITY_TERM_OPT_GRP_ID = 7;

export const LOAN_ELIGIBILITY_DATA_TYPES = [
  "NUMBER",
  "AMOUNT",
  "PERCENTAGE",
  "BOOLEAN",
  "TEXT",
  "DATE",
] as const;

export type LoanEligibilityDataType =
  (typeof LOAN_ELIGIBILITY_DATA_TYPES)[number];

export const LOAN_ELIGIBILITY_COMPARE_OPERATORS = [
  "=",
  "!=",
  ">",
  ">=",
  "<",
  "<=",
] as const;

export const LOAN_ELIGIBILITY_EQUALITY_OPERATORS = ["=", "!="] as const;

export function isLoanEligibilityDataType(
  value: string,
): value is LoanEligibilityDataType {
  return (LOAN_ELIGIBILITY_DATA_TYPES as readonly string[]).includes(value);
}

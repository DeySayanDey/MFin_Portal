import type {
  LoanScheduleRow,
  LoanScheduleRowDto,
} from "../types/repayment-schedule.types";

function asNumber(value: unknown, fallback = 0): number {
  if (value == null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asNullableNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function asText(value: unknown): string {
  if (value == null) return "";
  return String(value);
}

function pick<T>(
  dto: LoanScheduleRowDto,
  snake: keyof LoanScheduleRowDto,
  pascal: keyof LoanScheduleRowDto,
): T | undefined {
  const a = dto[snake];
  if (a !== undefined && a !== null) return a as T;
  const b = dto[pascal];
  if (b !== undefined && b !== null) return b as T;
  return undefined;
}

export function mapLoanScheduleRow(dto: LoanScheduleRowDto): LoanScheduleRow {
  return {
    scheduleId: asNumber(pick(dto, "schedule_id", "Schedule_Id")),
    loanAccountId: asNumber(pick(dto, "loan_account_id", "Loan_Account_Id")),
    installmentNo: asNumber(pick(dto, "installment_no", "Installment_No")),
    dueDate: asText(pick(dto, "due_date", "Due_Date")),
    principalDue: asNumber(pick(dto, "principal_due", "Principal_Due")),
    interestDue: asNumber(pick(dto, "interest_due", "Interest_Due")),
    totalDue: asNumber(pick(dto, "total_due", "Total_Due")),
    principalWaived: asNumber(pick(dto, "principal_waived", "Principal_Waived")),
    interestWaived: asNumber(pick(dto, "interest_waived", "Interest_Waived")),
    advancePaid: asNumber(pick(dto, "advance_paid", "Advance_Paid")),
    principalPaid: asNumber(pick(dto, "principal_paid", "Principal_Paid")),
    interestPaid: asNumber(pick(dto, "interest_paid", "Interest_Paid")),
    paidAmount: asNumber(pick(dto, "paid_amount", "Paid_Amount")),
    balanceDue: asNumber(pick(dto, "balance_due", "Balance_Due")),
    outsPrincipal: asNumber(pick(dto, "outs_principal", "Outs_Principal")),
    collectionId: asNullableNumber(
      pick(dto, "collection_id", "Collection_Id"),
    ),
    collectionTransNo:
      asText(pick(dto, "collection_trans_no", "Collection_Trans_No")) || null,
    status: asText(pick(dto, "status", "Status")) || "Upcoming",
  };
}

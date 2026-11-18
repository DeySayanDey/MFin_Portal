import { todayYmd } from "@/features/deposits/savings/deposit-account.rules";

export function monthStartYmd(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

export function defaultDashboardRange(now = new Date()) {
  return { fromDate: monthStartYmd(now), toDate: todayYmd(now) };
}

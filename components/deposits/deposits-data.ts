export type DepositProduct = "Savings" | "RD" | "FD" | "Voluntary";

export type DepositAccount = {
  account: string;
  member: string;
  memberId: string;
  group: string;
  product: DepositProduct;
  productLabel: string;
  rate: number;
  balance: number;
  status: "Active" | "Matured" | "Closed" | "Pending";
  openedOn: string;
  maturityDate?: string;
  installment?: number;
  tenureMonths?: number;
  branch: string;
};

export type LedgerTxn = {
  date: string;
  ref: string;
  narrative: string;
  mode: string;
  credit: number;
  debit: number;
  balance: number;
};

export type WithdrawalRequest = {
  id: string;
  account: string;
  member: string;
  amount: number;
  reason: string;
  requestedOn: string;
  status: "Pending" | "Approved" | "Rejected" | "Disbursed";
  mode: string;
};

export const depositAccounts: DepositAccount[] = [
  {
    account: "DEP-SB-2026-0001",
    member: "Sunita Ramesh Kamble",
    memberId: "CUST-2026-0001",
    group: "Laxmi Mahila Bachat JLG",
    product: "Savings",
    productLabel: "Compulsory Savings",
    rate: 6.5,
    balance: 8592.33,
    status: "Active",
    openedOn: "12 Mar 2026",
    branch: "Karveer Rural Branch",
  },
  {
    account: "DEP-SB-2026-0003",
    member: "Gita Saha",
    memberId: "CUST-2026-0120",
    group: "Swanirbhar Mahila JLG #005",
    product: "Savings",
    productLabel: "Compulsory Savings",
    rate: 6.5,
    balance: 4820,
    status: "Active",
    openedOn: "18 Apr 2026",
    branch: "Karveer Rural Branch",
  },
  {
    account: "DEP-SB-2026-0005",
    member: "Aarti Saha",
    memberId: "CUST-2026-0112",
    group: "Swanirbhar Mahila JLG #112",
    product: "Savings",
    productLabel: "Compulsory Savings",
    rate: 6.5,
    balance: 3650,
    status: "Active",
    openedOn: "02 May 2026",
    branch: "Sonarpur Branch",
  },
  {
    account: "DEP-SB-2026-0007",
    member: "Mousumi Ghosh",
    memberId: "CUST-2026-0117",
    group: "Swanirbhar Mahila JLG #002",
    product: "Voluntary",
    productLabel: "Voluntary Savings",
    rate: 5.5,
    balance: 2140,
    status: "Active",
    openedOn: "20 Jun 2026",
    branch: "Karveer Rural Branch",
  },
  {
    account: "DEP-RD-2026-0002",
    member: "Rani Vijay Gaikwad",
    memberId: "CUST-2026-0002",
    group: "Laxmi Mahila Bachat JLG",
    product: "RD",
    productLabel: "Recurring Deposit (RD)",
    rate: 7.5,
    balance: 12400,
    status: "Active",
    openedOn: "12 Jan 2026",
    maturityDate: "12 Jan 2027",
    installment: 1000,
    tenureMonths: 12,
    branch: "Karveer Rural Branch",
  },
  {
    account: "DEP-RD-2026-0004",
    member: "Anjali Chakraborty",
    memberId: "CUST-2026-0119",
    group: "Swanirbhar Mahila JLG #004",
    product: "RD",
    productLabel: "Recurring Deposit (RD)",
    rate: 7.5,
    balance: 8500,
    status: "Active",
    openedOn: "05 Feb 2026",
    maturityDate: "05 Feb 2027",
    installment: 500,
    tenureMonths: 24,
    branch: "Sonarpur Branch",
  },
  {
    account: "DEP-RD-2026-0006",
    member: "Aparna Sen",
    memberId: "CUST-2026-0118",
    group: "Swanirbhar Mahila JLG #003",
    product: "RD",
    productLabel: "Recurring Deposit (RD)",
    rate: 7.25,
    balance: 6200,
    status: "Active",
    openedOn: "15 Mar 2026",
    maturityDate: "15 Sep 2026",
    installment: 800,
    tenureMonths: 12,
    branch: "Barasat Branch",
  },
  {
    account: "DEP-FD-2026-0008",
    member: "Supriya Mondal",
    memberId: "CUST-2026-0116",
    group: "Swanirbhar Mahila JLG #001",
    product: "FD",
    productLabel: "Fixed Deposit (FD)",
    rate: 8.25,
    balance: 25000,
    status: "Active",
    openedOn: "10 Jan 2026",
    maturityDate: "10 Jan 2027",
    tenureMonths: 12,
    branch: "Karveer Rural Branch",
  },
  {
    account: "DEP-FD-2026-0009",
    member: "Meena Patil",
    memberId: "CUST-2026-0114",
    group: "Pragati Self-Help JLG",
    product: "FD",
    productLabel: "Fixed Deposit (FD)",
    rate: 8.5,
    balance: 50000,
    status: "Active",
    openedOn: "22 Feb 2026",
    maturityDate: "22 Feb 2028",
    tenureMonths: 24,
    branch: "Sonarpur Branch",
  },
  {
    account: "DEP-FD-2026-0010",
    member: "Lakshmi Saha",
    memberId: "CUST-2026-0104",
    group: "Swanirbhar Mahila JLG #002",
    product: "FD",
    productLabel: "Fixed Deposit (FD)",
    rate: 7.9,
    balance: 15000,
    status: "Matured",
    openedOn: "01 Sep 2025",
    maturityDate: "01 Sep 2026",
    tenureMonths: 12,
    branch: "Karveer Rural Branch",
  },
];

export const ledgerTxns: LedgerTxn[] = [
  {
    date: "12 Sep 2026",
    ref: "INT-20260912-7610",
    narrative: "Monthly Savings Interest Credit @ 6.5% p.a.",
    mode: "System",
    credit: 46.5,
    debit: 0,
    balance: 8592.33,
  },
  {
    date: "12 Aug 2026",
    ref: "TXN-DEP-003",
    narrative: "Kendra Meeting Monthly Compulsory Deposit",
    mode: "Cash",
    credit: 500,
    debit: 0,
    balance: 8545.83,
  },
  {
    date: "12 Jul 2026",
    ref: "TXN-WDL-001",
    narrative: "Emergency Medical Withdrawal (Group Approved)",
    mode: "Cash",
    credit: 0,
    debit: 1500,
    balance: 8045.83,
  },
  {
    date: "12 May 2026",
    ref: "TXN-DEP-002",
    narrative: "Kendra Meeting Monthly Compulsory Deposit",
    mode: "Cash",
    credit: 500,
    debit: 0,
    balance: 9545.83,
  },
  {
    date: "12 Mar 2026",
    ref: "TXN-DEP-001",
    narrative: "Kendra Meeting Monthly Compulsory Deposit",
    mode: "Cash",
    credit: 500,
    debit: 0,
    balance: 9045.83,
  },
];

export const withdrawalRequests: WithdrawalRequest[] = [
  {
    id: "WDL-2026-0041",
    account: "DEP-SB-2026-0001",
    member: "Sunita Ramesh Kamble",
    amount: 2000,
    reason: "Emergency Medical",
    requestedOn: "14 Sep 2026",
    status: "Pending",
    mode: "Cash",
  },
  {
    id: "WDL-2026-0040",
    account: "DEP-SB-2026-0003",
    member: "Gita Saha",
    amount: 1000,
    reason: "School Fees",
    requestedOn: "13 Sep 2026",
    status: "Approved",
    mode: "Cash",
  },
  {
    id: "WDL-2026-0039",
    account: "DEP-RD-2026-0002",
    member: "Rani Vijay Gaikwad",
    amount: 3000,
    reason: "Premature RD Partial",
    requestedOn: "12 Sep 2026",
    status: "Pending",
    mode: "NEFT",
  },
  {
    id: "WDL-2026-0038",
    account: "DEP-SB-2026-0005",
    member: "Aarti Saha",
    amount: 500,
    reason: "Household Expense",
    requestedOn: "10 Sep 2026",
    status: "Disbursed",
    mode: "Cash",
  },
  {
    id: "WDL-2026-0037",
    account: "DEP-FD-2026-0010",
    member: "Lakshmi Saha",
    amount: 15000,
    reason: "FD Maturity Payout",
    requestedOn: "01 Sep 2026",
    status: "Disbursed",
    mode: "A/c Transfer",
  },
];

export function formatInr(value: number, digits = 2) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export const metricToneClass = {
  green: "border-emerald-100 bg-emerald-50/80 text-emerald-800",
  blue: "border-blue-100 bg-blue-50/80 text-blue-800",
  amber: "border-amber-100 bg-amber-50/80 text-amber-900",
  violet: "border-violet-100 bg-violet-50/80 text-violet-800",
  rose: "border-rose-100 bg-rose-50/80 text-rose-800",
  slate: "border-slate-200 bg-slate-50 text-slate-800",
} as const;

export function accountsByProduct(product: DepositProduct | DepositProduct[]) {
  const list = Array.isArray(product) ? product : [product];
  return depositAccounts.filter((row) => list.includes(row.product));
}

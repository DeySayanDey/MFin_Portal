/**
 * Sample loan applications.
 * Replace `listLoanApplications` with the loan-application API when it is ready.
 * Amounts are stored on each record. The screen does not calculate them.
 */

export const LOAN_APPLICATION_STATUSES = [
  "draft",
  "assessment",
  "field_verification",
  "approval",
  "sanctioned",
  "disbursed",
] as const;

export type LoanApplicationStatus = (typeof LOAN_APPLICATION_STATUSES)[number];

export type LoanApplication = {
  id: string;
  appNumber: string;
  borrower: string;
  scheme: string;
  purpose: string;
  tenureMonths: number;
  repayment: string;
  bankAccount: string;
  guarantor: string;
  collateral: string;
  chargesNote: string;
  requestedAmount: number;
  sanctionedAmount: number | null;
  disbursedAmount: number | null;
  principalOutstanding: number | null;
  dueAmount: number | null;
  collectedAmount: number | null;
  totalAmount: number | null;
  score: number | null;
  risk: "low" | "fair" | "high" | null;
  status: LoanApplicationStatus;
};

export type LoanApplicationQuery = {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  scheme?: string;
};

export type LoanApplicationPage = {
  items: LoanApplication[];
  total: number;
  page: number;
  perPage: number;
};

export const loanApplicationSeed: LoanApplication[] = [
  {
    id: "1",
    appNumber: "APP-2026-00120",
    borrower: "Gita Saha",
    scheme: "Mahila Krishi & Dairy Loan",
    purpose: "Dairy unit",
    tenureMonths: 18,
    repayment: "Monthly",
    bankAccount: "SBI · 204418",
    guarantor: "Rina Saha",
    collateral: "Group guarantee",
    chargesNote: "Processing fee collected",
    requestedAmount: 50000,
    sanctionedAmount: 50000,
    disbursedAmount: 48525,
    principalOutstanding: 31200,
    dueAmount: 3520.5,
    collectedAmount: 18800,
    totalAmount: 50000,
    score: 750,
    risk: "low",
    status: "disbursed",
  },
  {
    id: "2",
    appNumber: "APP-2026-00119",
    borrower: "Anjali Chakraborty",
    scheme: "Gramin Micro Enterprise Loan",
    purpose: "Tailoring shop",
    tenureMonths: 12,
    repayment: "Monthly",
    bankAccount: "PNB · 118902",
    guarantor: "Mita Das",
    collateral: "Group guarantee",
    chargesNote: "Processing fee collected",
    requestedAmount: 45000,
    sanctionedAmount: 45000,
    disbursedAmount: 43672.5,
    principalOutstanding: 27400,
    dueAmount: 3010,
    collectedAmount: 17600,
    totalAmount: 45000,
    score: 732,
    risk: "low",
    status: "disbursed",
  },
  {
    id: "3",
    appNumber: "APP-2026-00118",
    borrower: "Aparna Sen",
    scheme: "Mahila Krishi & Dairy Loan",
    purpose: "Crop input",
    tenureMonths: 12,
    repayment: "Monthly",
    bankAccount: "UBI · 552190",
    guarantor: "Kabita Sen",
    collateral: "None",
    chargesNote: "",
    requestedAmount: 40000,
    sanctionedAmount: 38000,
    disbursedAmount: null,
    principalOutstanding: null,
    dueAmount: null,
    collectedAmount: null,
    totalAmount: 38000,
    score: 718,
    risk: "low",
    status: "sanctioned",
  },
  {
    id: "4",
    appNumber: "APP-2026-00117",
    borrower: "Mousumi Ghosh",
    scheme: "Gramin Micro Enterprise Loan",
    purpose: "Grocery stock",
    tenureMonths: 15,
    repayment: "Fortnightly",
    bankAccount: "SBI · 778120",
    guarantor: "Pampa Ghosh",
    collateral: "Group guarantee",
    chargesNote: "Pending committee",
    requestedAmount: 35000,
    sanctionedAmount: null,
    disbursedAmount: null,
    principalOutstanding: null,
    dueAmount: null,
    collectedAmount: null,
    totalAmount: null,
    score: 705,
    risk: "low",
    status: "approval",
  },
  {
    id: "5",
    appNumber: "APP-2026-00116",
    borrower: "Supriya Mondal",
    scheme: "Mahila Krishi & Dairy Loan",
    purpose: "Poultry shed",
    tenureMonths: 18,
    repayment: "Monthly",
    bankAccount: "Canara · 441902",
    guarantor: "Lata Mondal",
    collateral: "House visit pending",
    chargesNote: "",
    requestedAmount: 40000,
    sanctionedAmount: null,
    disbursedAmount: null,
    principalOutstanding: null,
    dueAmount: null,
    collectedAmount: null,
    totalAmount: null,
    score: null,
    risk: null,
    status: "field_verification",
  },
  {
    id: "6",
    appNumber: "APP-2026-00115",
    borrower: "Ruma More",
    scheme: "Gramin Micro Enterprise Loan",
    purpose: "Food stall",
    tenureMonths: 12,
    repayment: "Weekly",
    bankAccount: "SBI · 330184",
    guarantor: "",
    collateral: "",
    chargesNote: "",
    requestedAmount: 30000,
    sanctionedAmount: null,
    disbursedAmount: null,
    principalOutstanding: null,
    dueAmount: null,
    collectedAmount: null,
    totalAmount: null,
    score: 690,
    risk: "fair",
    status: "assessment",
  },
  {
    id: "7",
    appNumber: "APP-2026-00114",
    borrower: "Meena Patil",
    scheme: "Mahila Krishi & Dairy Loan",
    purpose: "Goat rearing",
    tenureMonths: 18,
    repayment: "Monthly",
    bankAccount: "",
    guarantor: "",
    collateral: "",
    chargesNote: "",
    requestedAmount: 42000,
    sanctionedAmount: null,
    disbursedAmount: null,
    principalOutstanding: null,
    dueAmount: null,
    collectedAmount: null,
    totalAmount: null,
    score: null,
    risk: null,
    status: "draft",
  },
  {
    id: "8",
    appNumber: "APP-2026-00113",
    borrower: "Pooja Gaikwad",
    scheme: "Gramin Micro Enterprise Loan",
    purpose: "Beauty parlour",
    tenureMonths: 12,
    repayment: "Monthly",
    bankAccount: "BOI · 902211",
    guarantor: "Seema Gaikwad",
    collateral: "Group guarantee",
    chargesNote: "Sanction note drafted",
    requestedAmount: 28000,
    sanctionedAmount: 25000,
    disbursedAmount: null,
    principalOutstanding: null,
    dueAmount: null,
    collectedAmount: null,
    totalAmount: 25000,
    score: 684,
    risk: "fair",
    status: "sanctioned",
  },
  {
    id: "9",
    appNumber: "APP-2026-00112",
    borrower: "Aarti Saha",
    scheme: "Mahila Krishi & Dairy Loan",
    purpose: "Vegetable trade",
    tenureMonths: 12,
    repayment: "Fortnightly",
    bankAccount: "SBI · 661004",
    guarantor: "Bina Saha",
    collateral: "Group guarantee",
    chargesNote: "Fee collected",
    requestedAmount: 38000,
    sanctionedAmount: 38000,
    disbursedAmount: 36879,
    principalOutstanding: 22150,
    dueAmount: 3071.56,
    collectedAmount: 15850,
    totalAmount: 38000,
    score: 710,
    risk: "low",
    status: "disbursed",
  },
  {
    id: "10",
    appNumber: "APP-2026-00111",
    borrower: "Kavita Chakraborty",
    scheme: "Gramin Micro Enterprise Loan",
    purpose: "Handloom",
    tenureMonths: 15,
    repayment: "Monthly",
    bankAccount: "UBI · 220018",
    guarantor: "Nila Roy",
    collateral: "Stock",
    chargesNote: "Appraisal in progress",
    requestedAmount: 32000,
    sanctionedAmount: null,
    disbursedAmount: null,
    principalOutstanding: null,
    dueAmount: null,
    collectedAmount: null,
    totalAmount: null,
    score: 698,
    risk: "fair",
    status: "assessment",
  },
];

function matches(row: LoanApplication, query: LoanApplicationQuery): boolean {
  const search = query.search?.trim().toLowerCase() ?? "";
  if (search) {
    const haystack = `${row.appNumber} ${row.borrower} ${row.scheme}`.toLowerCase();
    if (!haystack.includes(search)) return false;
  }
  if (query.status && row.status !== query.status) return false;
  if (query.scheme && row.scheme !== query.scheme) return false;
  return true;
}

/** Dummy list. Swap this function for the API without changing the page. */
export async function listLoanApplications(
  query: LoanApplicationQuery = {},
  source: LoanApplication[] = loanApplicationSeed,
): Promise<LoanApplicationPage> {
  const page = query.page && query.page > 0 ? query.page : 1;
  const perPage = query.perPage && query.perPage > 0 ? query.perPage : 5;
  const filtered = source.filter((row) => matches(row, query));
  const start = (page - 1) * perPage;
  return {
    items: filtered.slice(start, start + perPage),
    total: filtered.length,
    page,
    perPage,
  };
}

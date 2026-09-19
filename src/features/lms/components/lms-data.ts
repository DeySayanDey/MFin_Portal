export type LmsLoan = {
  loanId: string;
  borrower: string;
  group: string;
  mobile: string;
  principal: number;
  outstanding: number;
  collected: number;
  rate: number;
  dpd: number;
  emi: number;
  nextDue: string;
  status: "Current" | "PAR" | "NPA" | "Closed";
  tenure: number;
  paidInstallments: number;
  product: string;
};

export const lmsLoans: LmsLoan[] = [
  {
    loanId: "LN-2026-00120",
    borrower: "Gita Saha",
    group: "Swanirbhar Mahila JLG #005",
    mobile: "+91 98540 13720",
    principal: 50000,
    outstanding: 42580,
    collected: 7420,
    rate: 21.5,
    dpd: 0,
    emi: 4667.7,
    nextDue: "12 Oct 2026",
    status: "Current",
    tenure: 12,
    paidInstallments: 2,
    product: "Mahila Krishi & Dairy Loan",
  },
  {
    loanId: "LN-2026-00112",
    borrower: "Aarti Saha",
    group: "Swanirbhar Mahila JLG #112",
    mobile: "+91 98523 13689",
    principal: 45000,
    outstanding: 38820,
    collected: 6180,
    rate: 21.5,
    dpd: 0,
    emi: 4200,
    nextDue: "12 Oct 2026",
    status: "Current",
    tenure: 12,
    paidInstallments: 2,
    product: "Gramin Micro Enterprise Loan",
  },
  {
    loanId: "LN-2026-00104",
    borrower: "Lakshmi Saha",
    group: "Swanirbhar Mahila JLG #002",
    mobile: "+91 98489 13627",
    principal: 40000,
    outstanding: 35200,
    collected: 4800,
    rate: 21.5,
    dpd: 12,
    emi: 3730,
    nextDue: "05 Sep 2026",
    status: "PAR",
    tenure: 12,
    paidInstallments: 1,
    product: "Mahila Krishi & Dairy Loan",
  },
  {
    loanId: "LN-2026-00096",
    borrower: "Meena Saha",
    group: "Pragati Self-Help JLG",
    mobile: "+91 98472 13596",
    principal: 35000,
    outstanding: 31200,
    collected: 3800,
    rate: 21.5,
    dpd: 28,
    emi: 3260,
    nextDue: "20 Aug 2026",
    status: "PAR",
    tenure: 12,
    paidInstallments: 1,
    product: "Gramin Micro Enterprise Loan",
  },
  {
    loanId: "LN-2026-00088",
    borrower: "Rekha Saha",
    group: "Udyog Mahila JLG #012",
    mobile: "+91 98340 13450",
    principal: 42000,
    outstanding: 38950,
    collected: 3050,
    rate: 22,
    dpd: 45,
    emi: 3920,
    nextDue: "02 Aug 2026",
    status: "PAR",
    tenure: 12,
    paidInstallments: 1,
    product: "Mahila Krishi & Dairy Loan",
  },
  {
    loanId: "LN-2026-00080",
    borrower: "Supriya Saha",
    group: "Swanirbhar Mahila JLG #003",
    mobile: "+91 98210 13320",
    principal: 38000,
    outstanding: 36100,
    collected: 1900,
    rate: 21.5,
    dpd: 67,
    emi: 3540,
    nextDue: "10 Jul 2026",
    status: "PAR",
    tenure: 12,
    paidInstallments: 0,
    product: "Gramin Micro Enterprise Loan",
  },
  {
    loanId: "LN-2026-00072",
    borrower: "Soma Saha",
    group: "Laxmi Bachat JLG",
    mobile: "+91 98100 13210",
    principal: 30000,
    outstanding: 28400,
    collected: 1600,
    rate: 21.5,
    dpd: 95,
    emi: 2800,
    nextDue: "15 Jun 2026",
    status: "NPA",
    tenure: 12,
    paidInstallments: 0,
    product: "Mahila Krishi & Dairy Loan",
  },
  {
    loanId: "LN-2026-00064",
    borrower: "Aparna Saha",
    group: "Swanirbhar Mahila JLG #003",
    mobile: "+91 98000 13100",
    principal: 36000,
    outstanding: 34800,
    collected: 1200,
    rate: 21.5,
    dpd: 112,
    emi: 3360,
    nextDue: "28 May 2026",
    status: "NPA",
    tenure: 12,
    paidInstallments: 0,
    product: "Gramin Micro Enterprise Loan",
  },
  {
    loanId: "LN-2026-00056",
    borrower: "Rani Saha",
    group: "Pragati Self-Help JLG",
    mobile: "+91 97900 13000",
    principal: 28000,
    outstanding: 26500,
    collected: 1500,
    rate: 22,
    dpd: 38,
    emi: 2610,
    nextDue: "08 Aug 2026",
    status: "PAR",
    tenure: 12,
    paidInstallments: 1,
    product: "Mahila Krishi & Dairy Loan",
  },
  {
    loanId: "LN-2026-00003",
    borrower: "Meena More",
    group: "Pragati Self-Help JLG",
    mobile: "+91 98900 11223",
    principal: 50000,
    outstanding: 46236.95,
    collected: 3763.05,
    rate: 21.5,
    dpd: 74,
    emi: 4667.7,
    nextDue: "01 Jul 2026",
    status: "PAR",
    tenure: 12,
    paidInstallments: 1,
    product: "Gramin Micro Enterprise Loan",
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

export function buildSchedule(loan: LmsLoan) {
  const months = [
    "Sep 2026",
    "Oct 2026",
    "Nov 2026",
    "Dec 2026",
    "Jan 2027",
    "Feb 2027",
    "Mar 2027",
    "Apr 2027",
    "May 2027",
    "Jun 2027",
    "Jul 2027",
    "Aug 2027",
  ];
  let balance = loan.principal;
  return months.map((month, index) => {
    const interest = Math.round(balance * (loan.rate / 100 / 12) * 100) / 100;
    const principalPart =
      index === months.length - 1
        ? balance
        : Math.round((loan.emi - interest) * 100) / 100;
    const total = Math.round((principalPart + interest) * 100) / 100;
    balance = Math.max(0, Math.round((balance - principalPart) * 100) / 100);
    const status =
      index < loan.paidInstallments
        ? ("Paid" as const)
        : index === loan.paidInstallments
          ? ("Due" as const)
          : ("Upcoming" as const);
    return {
      installment: index + 1,
      dueDate: `12 ${month}`,
      principal: principalPart,
      interest,
      total,
      balance,
      status,
    };
  });
}

export const metricToneClass = {
  green: "border-emerald-100 bg-emerald-50/80 text-emerald-800",
  blue: "border-blue-100 bg-blue-50/80 text-blue-800",
  amber: "border-amber-100 bg-amber-50/80 text-amber-900",
  violet: "border-violet-100 bg-violet-50/80 text-violet-800",
  rose: "border-rose-100 bg-rose-50/80 text-rose-800",
  slate: "border-slate-200 bg-slate-50 text-slate-800",
} as const;

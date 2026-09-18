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

export type MisMetric = {
  label: string;
  value: string;
  hint: string;
  tone: keyof typeof metricToneClass;
};

export const branchGlRows = [
  {
    jlg: "KOL-HO",
    branch: "Kolkata Central HO",
    gl: "121100 — JLG Microfinance Loans",
    members: 48,
    debit: 33814.66,
    credit: 0,
    collection: 8420,
    efficiency: 99.16,
    par: 0,
  },
  {
    jlg: "HOW-BR",
    branch: "Howrah Rural Branch",
    gl: "121100 — JLG Microfinance Loans",
    members: 36,
    debit: 24500,
    credit: 0,
    collection: 6120,
    efficiency: 97.4,
    par: 1.12,
  },
  {
    jlg: "SNP-BR",
    branch: "Sonarpur Branch",
    gl: "121100 — JLG Microfinance Loans",
    members: 28,
    debit: 18240,
    credit: 0,
    collection: 4580,
    efficiency: 95.8,
    par: 2.45,
  },
  {
    jlg: "BRS-BR",
    branch: "Barasat Branch",
    gl: "121100 — JLG Microfinance Loans",
    members: 22,
    debit: 15680,
    credit: 0,
    collection: 3920,
    efficiency: 98.1,
    par: 0.86,
  },
];

export const demandRows = [
  {
    kendra: "CEN-WB002 · Howrah Uluberia",
    meeting: "Tuesday 09:30",
    members: 12,
    principal: 28400,
    interest: 4820,
    total: 33220,
  },
  {
    kendra: "CEN-GN-01 · Gandhinagar",
    meeting: "Wednesday 10:00",
    members: 10,
    principal: 22100,
    interest: 3650,
    total: 25750,
  },
  {
    kendra: "CEN-WB105 · Kharagpur",
    meeting: "Thursday 09:30",
    members: 14,
    principal: 31200,
    interest: 5180,
    total: 36380,
  },
  {
    kendra: "CEN-UC-02 · Uchgaon",
    meeting: "Friday 11:00",
    members: 8,
    principal: 16800,
    interest: 2740,
    total: 19540,
  },
];

export const collectionRows = [
  {
    receipt: "RCPT-20260912-001",
    member: "Gita Saha",
    loan: "LN-2026-00120",
    kendra: "CEN-WB002",
    agent: "Sachin Shinde",
    amount: 4667.7,
    mode: "Cash",
    time: "09:45 AM",
  },
  {
    receipt: "RCPT-20260912-002",
    member: "Aarti Saha",
    loan: "LN-2026-00112",
    kendra: "CEN-WB002",
    agent: "Sachin Shinde",
    amount: 4200,
    mode: "UPI",
    time: "09:52 AM",
  },
  {
    receipt: "RCPT-20260912-003",
    member: "Rani Patil",
    loan: "LN-2026-00002",
    kendra: "CEN-GN-01",
    agent: "Priya More",
    amount: 3017.49,
    mode: "Cash",
    time: "10:15 AM",
  },
  {
    receipt: "RCPT-20260912-004",
    member: "Mousumi Ghosh",
    loan: "LN-2026-00117",
    kendra: "CEN-WB002",
    agent: "Sachin Shinde",
    amount: 2868.2,
    mode: "Cash",
    time: "10:28 AM",
  },
];

export const disbursementRows = [
  {
    app: "APP-2026-00120",
    loan: "LN-2026-00120",
    borrower: "Gita Saha",
    product: "Mahila Krishi & Dairy Loan",
    gross: 50000,
    net: 48525,
    mode: "NEFT",
    date: "10 Aug 2026",
    status: "Disbursed",
  },
  {
    app: "APP-2026-00119",
    loan: "LN-2026-00119",
    borrower: "Anjali Chakraborty",
    product: "Gramin Micro Enterprise Loan",
    gross: 45000,
    net: 43672.5,
    mode: "IMPS",
    date: "10 Aug 2026",
    status: "Disbursed",
  },
  {
    app: "APP-2026-00113",
    loan: "LN-2026-00113",
    borrower: "Pooja Gaikwad",
    product: "Gramin Micro Enterprise Loan",
    gross: 28000,
    net: 27174,
    mode: "NEFT",
    date: "12 Sep 2026",
    status: "Queued",
  },
];

export const scorecardRows = [
  {
    branch: "Karveer Rural Branch",
    aum: 42850,
    collectionEff: 99.2,
    par30: 0.84,
    npa: 0.12,
    disbursal: 18,
    rank: 1,
  },
  {
    branch: "Kolkata Shyambazar Hub",
    aum: 61200,
    collectionEff: 98.4,
    par30: 1.05,
    npa: 0.28,
    disbursal: 24,
    rank: 2,
  },
  {
    branch: "Sonarpur Branch",
    aum: 28400,
    collectionEff: 96.1,
    par30: 2.45,
    npa: 0.66,
    disbursal: 11,
    rank: 3,
  },
  {
    branch: "Barasat Branch",
    aum: 22150,
    collectionEff: 97.8,
    par30: 1.32,
    npa: 0.4,
    disbursal: 9,
    rank: 4,
  },
];

export const parBuckets = [
  { bucket: "Current (0 DPD)", accounts: 142, amount: 312400, provisionPct: 0, provision: 0 },
  { bucket: "PAR 1–30 (SMA-0)", accounts: 18, amount: 24150, provisionPct: 0.4, provision: 96.6 },
  { bucket: "PAR 31–60 (SMA-1)", accounts: 9, amount: 11280, provisionPct: 10, provision: 1128 },
  { bucket: "PAR 61–90 (SMA-2)", accounts: 5, amount: 8640, provisionPct: 25, provision: 2160 },
  { bucket: "NPA 90+ (Sub-Standard)", accounts: 4, amount: 12460, provisionPct: 50, provision: 6230 },
];

export const npaRows = [
  {
    loan: "LN-2026-00072",
    borrower: "Soma Saha",
    branch: "Karveer Rural",
    outstanding: 28400,
    dpd: 95,
    class: "Sub-Standard",
    provisionPct: 50,
    provision: 14200,
  },
  {
    loan: "LN-2026-00064",
    borrower: "Aparna Saha",
    branch: "Sonarpur",
    outstanding: 34800,
    dpd: 112,
    class: "Doubtful",
    provisionPct: 60,
    provision: 20880,
  },
  {
    loan: "LN-2026-00048",
    borrower: "Gita Saha (Legacy)",
    branch: "Barasat",
    outstanding: 15200,
    dpd: 180,
    class: "Loss",
    provisionPct: 100,
    provision: 15200,
  },
];

export const exportPacks = [
  {
    id: "daily",
    title: "Daily Business MIS Pack",
    body: "Demand, collection, AUM, PAR and vault cash consolidated CSV/PDF.",
    schedule: "Daily 07:30 PM",
    format: "PDF + CSV",
  },
  {
    id: "par",
    title: "PAR Aging Export",
    body: "Bucket-wise PAR with branch and FO attribution for risk committee.",
    schedule: "Weekly Monday",
    format: "Excel",
  },
  {
    id: "npa",
    title: "NPA Provisioning Pack",
    body: "IRAC classification with provision ledger and GL mapping.",
    schedule: "Month-end",
    format: "Excel + PDF",
  },
  {
    id: "cic",
    title: "Credit Bureau (CIC) Upload",
    body: "CIBIL / CRIF / Equifax compliant monthly delinquency dump.",
    schedule: "Monthly 5th",
    format: "CIC Flat File",
  },
  {
    id: "rbi",
    title: "RBI Regulatory Returns",
    body: "Supervisory returns pack for NBFC-MFI reporting calendar.",
    schedule: "Quarterly",
    format: "Excel",
  },
  {
    id: "audit",
    title: "Security Audit Trail",
    body: "Operator, IP, entity change, and severity classification log.",
    schedule: "On demand",
    format: "CSV",
  },
];

export const glHierarchy = [
  {
    path: "100000 Assets > 110000 Cash & Bank > 111000 Branch Vault",
    debit: 85420,
    credit: 81200,
  },
  {
    path: "100000 Assets > 120000 Loan Portfolio > 121100 Standard Assets",
    debit: 338146.6,
    credit: 0,
  },
  {
    path: "400000 Revenue > 410000 Interest > 411000 Interest Income",
    debit: 0,
    credit: 28420,
  },
  {
    path: "500000 Expenses > 510000 Provisions > 511000 Bad Debt Prov.",
    debit: 9614.6,
    credit: 0,
  },
];

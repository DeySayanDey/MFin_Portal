import generated from "@/lib/mfin/registry.generated.json";
import type { MFinPageContent } from "@/lib/mfin/types";
import { sidebarForModule } from "@/lib/mfin/module-nav";

type GeneratedEntry = {
  slug: string;
  route: string;
  module: string;
  title: string;
  preview: string;
};

const kycMembers = [
  {
    member: "Supriya Mondal #001",
    group: "Swanirbhar Mahila JLG",
    mobile: "+91 98472 13596",
    aadhaar: "XXXX-XXXX-9468",
    pan: "BMFPK1116K",
  },
  {
    member: "Mousumi Ghosh #002",
    group: "Swanirbhar Mahila JLG",
    mobile: "+91 98489 13627",
    aadhaar: "XXXX-XXXX-9541",
    pan: "BNFPK1117N",
  },
  {
    member: "Aparna Sen #003",
    group: "Swanirbhar Mahila JLG",
    mobile: "+91 98506 13658",
    aadhaar: "XXXX-XXXX-9614",
    pan: "BOFPK1118Q",
  },
  {
    member: "Anjali Chakraborty #004",
    group: "Swanirbhar Mahila JLG",
    mobile: "+91 98523 13689",
    aadhaar: "XXXX-XXXX-9687",
    pan: "BPFPK1119T",
  },
  {
    member: "Gita Saha #005",
    group: "Swanirbhar Mahila JLG",
    mobile: "+91 98540 13720",
    aadhaar: "XXXX-XXXX-9760",
    pan: "BQFPK1120W",
  },
];

const branchRows = [
  {
    branch: "Karveer Rural Branch",
    manager: "Sachin Shinde",
    location: "Kolhapur, Maharashtra",
    bsr: "BSR-0091234",
    centres: "3 Centres",
    members: "48",
  },
  {
    branch: "Sangli Urban Branch",
    manager: "Anita Patil",
    location: "Sangli, Maharashtra",
    bsr: "BSR-0091235",
    centres: "2 Centres",
    members: "31",
  },
];

const depositRows = [
  {
    account: "DEP-SB-2026-0001",
    member: "Sunita Ramesh Kamble",
    group: "Laxmi Mahila Bachat JLG",
    product: "Compulsory Savings",
    rate: "6.5% p.a.",
    balance: "₹4,820.00",
    status: "Active",
  },
  {
    account: "DEP-RD-2026-0002",
    member: "Rani Vijay Gaikwad",
    group: "Laxmi Mahila Bachat JLG",
    product: "Recurring Deposit (RD)",
    rate: "7.5% p.a.",
    balance: "₹12,400.00",
    status: "Active",
  },
];

const misBranchRows = [
  {
    jlg: "KOL-HO",
    branch: "Kolkata Central HO",
    gl: "121100 — JLG Microfinance Loans",
    debit: "₹33,814.66",
    credit: "₹0.00",
    collection: "₹8,420.00",
    par: "0.00%",
  },
  {
    jlg: "HOW-BR",
    branch: "Howrah Rural Branch",
    gl: "121100 — JLG Microfinance Loans",
    debit: "₹24,500.00",
    credit: "₹0.00",
    collection: "₹6,180.00",
    par: "0.12%",
  },
  {
    jlg: "BND-BR",
    branch: "Bandhan Kendra Branch",
    gl: "121100 — JLG Microfinance Loans",
    debit: "₹18,200.00",
    credit: "₹0.00",
    collection: "₹5,640.00",
    par: "0.08%",
  },
];

const coaRows = [
  { code: "100000", title: "Total Assets", level: "L1 Group", balance: "₹1,24,500.00" },
  { code: "110000", title: "Cash & Bank (Liquid Funds)", level: "L2 Control", balance: "₹42,300.00" },
  { code: "111000", title: "Branch Vault Cash", level: "L3 GL", balance: "₹12,200.00" },
  { code: "120000", title: "Loan Portfolio", level: "L2 Control", balance: "₹33,814.66" },
  { code: "121100", title: "JLG Microfinance Loans", level: "L3 GL", balance: "₹33,814.66" },
  { code: "400000", title: "Total Revenue", level: "L1 Group", balance: "₹8,420.00" },
  { code: "500000", title: "Total Expenses", level: "L1 Group", balance: "₹1,240.00" },
];

const routeAliases: Record<string, string> = {
  "/accounting": "/accounting/voucher-entry",
  "/lms": "/lms/collections",
  "/los": "/los/applications",
  "/hr": "/hr/staff",
  "/security": "/security/users",
  "/branch-vault/cash-position": "/branch-vault",
  "/branch-vault/hand-in": "/master/branch-vault/hand-in",
  "/branch-vault/sync-queue": "/master/wifi-sync",
};

const overrides: Record<string, Partial<MFinPageContent>> = {
  "/deposits": {
    title: "Deposits & Member Savings Hub",
    subtitle:
      "Compulsory Bachat Gat member savings, recurring deposits, fixed deposits, and member ledger passbooks",
    metrics: [
      { label: "Total Deposits", value: "₹17,220.00", hint: "All products", tone: "green" },
      { label: "Savings Accounts", value: "48", hint: "Active", tone: "blue" },
      { label: "RD Accounts", value: "22", hint: "Active", tone: "violet" },
      { label: "FD Accounts", value: "8", hint: "Active", tone: "amber" },
    ],
    table: {
      title: "Recent Deposit Accounts",
      columns: [
        { key: "account", label: "Account No." },
        { key: "member", label: "Member" },
        { key: "product", label: "Product" },
        { key: "balance", label: "Balance", align: "right" },
      ],
      rows: depositRows.map(({ account, member, product, balance }) => ({
        account,
        member,
        product,
        balance,
      })),
    },
  },
  "/mis": {
    title: "MIS & Reports Studio (40 Domains)",
    subtitle:
      "Every operational, loan, collection, PAR and statutory report mapped to N-Level Chart of Accounts with strict Debit & Credit reconciliation",
    cards: [
      { title: "Daily Business MIS", body: "Consolidated executive snapshot of demand, collection, AUM, PAR and vault cash.", badge: "★ Featured" },
      { title: "Kendra Demand Sheet", body: "Meeting-wise demand register with principal and interest breakup.", badge: "Demand" },
      { title: "Collection Register", body: "Vault-credited collections with agent and Kendra attribution.", badge: "Collection" },
      { title: "PAR Aging (1–90 DPD)", body: "Portfolio at risk aging buckets with provisioning guidance.", badge: "PAR" },
      { title: "NPA & Provisioning", body: "Non-performing asset classification and provision ledger.", badge: "NPA" },
      { title: "RBI Regulatory Returns", body: "Statutory pack exports for supervisory reporting.", badge: "Regulatory" },
    ],
  },
  "/agent-portal": {
    title: "Mobile Collector App (Field Agent Portal)",
    subtitle:
      "GPS geofenced Kendra meeting schedule with real-time field collection triggers and offline SQLite sync",
    metrics: [
      { label: "Today's Target", value: "₹33,376.00", hint: "2 meetings", tone: "green" },
      { label: "Collected", value: "₹11,450.00", hint: "34% progress", tone: "blue" },
      { label: "Field Wallet", value: "₹3,200.00", hint: "Pending hand-in", tone: "amber" },
      { label: "Commission MTD", value: "₹1,500", hint: "Sourcing bonus", tone: "violet" },
    ],
    notes: [
      "Tier 3 — Standard EMP-FO-001 · Karveer Rural Branch · 45 Active Borrowers · 112 Kendra Centres",
      "Offline SQLite & Idempotency enabled for rural connectivity pockets",
    ],
  },
  "/settings/language": {
    title: "Language & Localization Settings",
    subtitle: "Switch portal language between English and Bengali for all CBS modules",
    form: {
      title: "Active Language Pack",
      fields: [
        { label: "Portal Language", value: "English / বাংলা" },
        { label: "Number Format", value: "Indian Rupee (₹) · en-IN" },
        { label: "Date Format", value: "DD / MM / YYYY" },
        { label: "Report Labels", value: "Dual-language (EN + BN)" },
      ],
    },
  },
  "/field-force/route": {
    title: "Field Agent Route & Kendra Meeting Map",
    subtitle: "GPS geofenced Kendra meeting schedule with real-time field collection triggers",
    table: {
      title: "Today's Kendra Route",
      columns: [
        { key: "centre", label: "Centre" },
        { key: "location", label: "Location" },
        { key: "time", label: "Meeting Time" },
        { key: "target", label: "Target Due", align: "right" },
        { key: "status", label: "Status", align: "center" },
      ],
      rows: [
        {
          centre: "CEN-GN-01",
          location: "Near Gram Panchayat Office, Gandhinagar",
          time: "10:30 AM",
          target: "₹16,688.00",
          status: "Scheduled",
        },
        {
          centre: "CEN-GN-02",
          location: "Uchgaon Kendra Market Yard",
          time: "02:00 PM",
          target: "₹16,688.00",
          status: "Scheduled",
        },
      ],
    },
  },
  "/customer-kyc": {
    title: "Onboard Borrower & KYC Registry",
    subtitle:
      "JLG member registration, Penny Drop bank verification, Guarantor/Nominee records, and RBI cashflow surplus",
    metrics: [
      { label: "Active JLG Members", value: "115", hint: "UIDAI tokenized", tone: "green" },
      { label: "Penny Drop Verified", value: "112", hint: "NPCI validated", tone: "blue" },
      { label: "CIBIL Checked", value: "108", hint: "Pre-sanction", tone: "violet" },
      { label: "FOIR Compliant", value: "100%", hint: "RBI ≤50% surplus", tone: "amber" },
    ],
    table: {
      title: "Borrower / Member KYC Profiles",
      columns: [
        { key: "member", label: "Member" },
        { key: "group", label: "JLG Group" },
        { key: "mobile", label: "Mobile" },
        { key: "aadhaar", label: "Masked Aadhaar" },
        { key: "pan", label: "PAN" },
      ],
      rows: kycMembers,
    },
    notes: [
      "UIDAI tokenized KYC profiles, group roles, verified bank accounts, and bureau status",
      "Mandatory Automated NPCI Penny-Drop Bank Account Verification before disbursement",
    ],
  },
  "/accounting/voucher-entry": {
    title: "Voucher Entry Studio",
    subtitle:
      "Cash/Bank Deposit, Savings Withdrawal, Office Expense, and Contra Transfer vouchers with N-Level COA mapping",
    form: {
      title: "Voucher Header",
      fields: [
        { label: "Voucher Type", value: "Cash/Bank Deposit Voucher" },
        { label: "Debit Account (Dr)", value: "111000 — Branch Vault Cash" },
        { label: "Credit Account (Cr)", value: "121100 — JLG Microfinance Loans" },
        { label: "Narration", value: "Official ledger narration description...", span: 2 },
        { label: "Collected By", value: "Ruma Banerjee (Sonarpur #01)" },
        { label: "Reference", value: "UTR-928174812 / CHQ-001248 / Direct Cash" },
      ],
    },
    table: {
      title: "Line Items",
      columns: [
        { key: "customer", label: "Customer" },
        { key: "debit", label: "Debit (Dr)", align: "right" },
        { key: "credit", label: "Credit (Cr)", align: "right" },
        { key: "status", label: "Status", align: "center" },
      ],
      rows: [
        { customer: "CUST-WB-00101", debit: "₹1,200.00", credit: "₹0.00", status: "✓ Posted" },
        { customer: "CUST-WB-00102", debit: "₹980.00", credit: "₹0.00", status: "✓ Posted" },
        { customer: "CUST-WB-00103", debit: "₹1,450.00", credit: "₹0.00", status: "✓ Posted" },
      ],
    },
    notes: ["Voucher Target: ₹0.00 balanced", "Double-entry invariant guarded across all voucher types"],
  },
  "/master/kendra-jlg": {
    title: "Kendra & JLG Master",
    subtitle:
      "All registered branches with manager assignments, BSR codes, and operational status",
    table: {
      title: "Operational Branches & Kendra Coverage",
      columns: [
        { key: "branch", label: "Branch" },
        { key: "manager", label: "Manager" },
        { key: "location", label: "Location" },
        { key: "bsr", label: "BSR Code" },
        { key: "centres", label: "Centres" },
        { key: "members", label: "Members", align: "right" },
      ],
      rows: branchRows,
    },
  },
  "/master/coa-tree": {
    title: "N-Level Chart of Accounts (COA) Tree Master",
    subtitle:
      "Double-Entry Invariant Guarded — Group (L1) → Control (L2) → General Ledger (L3) → Sub-Ledger (L4) → Child Accounts (L5)",
    table: {
      title: "Hierarchical COA Tree",
      columns: [
        { key: "code", label: "GL Code" },
        { key: "title", label: "Account Title" },
        { key: "level", label: "Level" },
        { key: "balance", label: "Balance", align: "right" },
      ],
      rows: coaRows,
    },
    cards: [
      {
        title: "GL-Wise Statement Report",
        body: "Ledger-wise account statement with debit/credit running balance.",
        badge: "Report",
      },
      {
        title: "Hierarchical Trial Balance",
        body: "Consolidated trial balance across all COA levels.",
        badge: "Report",
      },
      {
        title: "Sub-Ledger Master",
        body: "Customer, staff, and vendor sub-ledgers mapped to parent GL.",
        badge: "Master",
      },
    ],
  },
  "/master/wifi-sync": {
    title: "Wi-Fi Sync Master & Offline Data Hub",
    subtitle:
      "Perform morning Day Open to download Kendra manifests, then return to branch and commit evening Day Close",
    cards: [
      {
        title: "Branch Intranet Sync",
        body: "Direct intranet sync at branch. Works without internet.",
        badge: "Ready for Day Open Sync",
      },
      {
        title: "Central Cloud Sync",
        body: "Central cloud sync via mobile internet when field is available.",
        badge: "Awaiting Day Close Sync",
      },
      {
        title: "Mobile Hotspot Bridge",
        body: "Mobile-to-mobile hotspot bridge in remote rural pockets.",
        badge: "Offline Queue",
      },
    ],
    form: {
      title: "Sync Configuration",
      fields: [
        { label: "Cluster", value: "Shyambazar Kendra Cluster" },
        { label: "Sync Mode", value: "Wi-Fi Direct Intranet" },
        { label: "Morning Day Open", value: "08:00 AM — Download manifests" },
        { label: "Evening Day Close", value: "07:30 PM — Commit collections" },
      ],
    },
  },
  "/deposits/savings": {
    title: "Bachat Gat Group Savings & Member Deposits",
    subtitle:
      "Compulsory Bachat Gat member savings, monthly interest accrual, digital passbook, and JLG emergency buffer funds",
    table: {
      title: "Savings & RD Accounts",
      columns: [
        { key: "account", label: "Account No." },
        { key: "member", label: "Member" },
        { key: "group", label: "JLG Group" },
        { key: "product", label: "Product" },
        { key: "rate", label: "Interest" },
        { key: "balance", label: "Balance", align: "right" },
        { key: "status", label: "Status", align: "center" },
      ],
      rows: depositRows,
    },
    notes: [
      "Govt. Reg No: COOP-WB/2026/8942 | Share Face Value: ₹100 Each",
      "Limited share certificates, voting equity, distinctive share numbering, and ownership ledger",
    ],
  },
  "/mis/daily-business": {
    title: "Daily Business & MIS Report",
    subtitle:
      "Consolidated executive snapshot of daily demand, collection, AUM, PAR and vault cash with GL breakdown",
    metrics: [
      { label: "Gross Loan Portfolio (Dr)", value: "₹33,814.66", hint: "Standard Portfolio", tone: "green" },
      { label: "Today's Demand", value: "₹3,730.00", hint: "Principal + Interest", tone: "blue" },
      { label: "Total Collection", value: "₹3,700.00", hint: "99.16% Efficiency", tone: "violet" },
      { label: "PAR 30+ Overdue", value: "₹40,530", hint: "Provisioned", tone: "amber" },
    ],
    table: {
      title: "JLG Code × Branch GL Breakdown",
      columns: [
        { key: "jlg", label: "JLG Code" },
        { key: "branch", label: "Branch" },
        { key: "gl", label: "GL Head" },
        { key: "debit", label: "Debit (Dr)", align: "right" },
        { key: "credit", label: "Credit (Cr)", align: "right" },
        { key: "collection", label: "Collection", align: "right" },
        { key: "par", label: "PAR %", align: "right" },
      ],
      rows: misBranchRows,
    },
  },
  "/profile": {
    title: "My Profile & Account Settings",
    subtitle: "Chief Operations Officer profile with biometric enrollment and branch access",
    form: {
      title: "Profile Details",
      fields: [
        { label: "English Name", value: "Rajesh Patil" },
        { label: "Bangla Name", value: "রাজেশ পatile" },
        { label: "Employee ID", value: "EMP-WB001" },
        { label: "Designation", value: "Chief Operations Officer (COO)" },
        { label: "Branch", value: "Kolkata Shyambazar Hub Branch (BR-WB01)" },
        { label: "Biometric", value: "Mantra MFS100 Enrolled", type: "toggle" },
        { label: "GPS Location", value: "Kolkata HQ (22.5726° N)", span: 2 },
        { label: "IP Whitelist", value: "192.168.1.100 (HQ Secure Gateway)", span: 2 },
      ],
    },
    notes: ["All updates are timestamped in audit logs."],
  },
  "/lms/collections": {
    title: "LMS Repayment Collections",
    subtitle: "Kendra meeting cash collections, EMI receipts, and field wallet reconciliation",
    metrics: [
      { label: "Today's Collection", value: "₹8,420.00", hint: "Vault credited", tone: "green" },
      { label: "EMI Due Today", value: "₹3,730.00", hint: "1 Kendra meeting", tone: "blue" },
      { label: "Field Wallet Pending", value: "₹3,200.00", hint: "Hand-in queue", tone: "amber" },
      { label: "Collection Efficiency", value: "99.16%", hint: "MTD", tone: "violet" },
    ],
    table: {
      title: "Recent EMI Collections",
      columns: [
        { key: "receipt", label: "Receipt No." },
        { key: "member", label: "Member" },
        { key: "loan", label: "Loan A/c" },
        { key: "amount", label: "Amount", align: "right" },
        { key: "mode", label: "Mode" },
      ],
      rows: [
        {
          receipt: "RCPT-202608-001",
          member: "Laxmi Mahila JLG — Member #01",
          loan: "LN-2026-00001",
          amount: "₹3,017.49",
          mode: "Kendra Meeting Cash",
        },
        {
          receipt: "RCPT-202608-002",
          member: "Laxmi Mahila JLG — Member #02",
          loan: "LN-2026-00002",
          amount: "₹3,071.56",
          mode: "Kendra Meeting Cash",
        },
      ],
    },
  },
  "/los/applications": {
    title: "LOS Underwriting & Sanction",
    subtitle: "Loan application pipeline with automated fee & GST calculation and CIBIL checks",
    metrics: [
      { label: "Pending Applications", value: "12", hint: "In pipeline", tone: "amber" },
      { label: "Sanctioned Today", value: "₹40,000", hint: "1 loan", tone: "green" },
      { label: "Avg FOIR", value: "42%", hint: "Within RBI band", tone: "blue" },
      { label: "CIBIL Pass Rate", value: "96%", hint: "Pre-sanction", tone: "violet" },
    ],
    table: {
      title: "Application Queue",
      columns: [
        { key: "appId", label: "Application ID" },
        { key: "member", label: "Member" },
        { key: "amount", label: "Requested", align: "right" },
        { key: "scheme", label: "Scheme" },
        { key: "status", label: "Status", align: "center" },
      ],
      rows: [
        {
          appId: "APP-2026-0042",
          member: "Supriya Mondal",
          amount: "₹40,000.00",
          scheme: "JLG Reducing Balance 21.5%",
          status: "Sanctioned",
        },
        {
          appId: "APP-2026-0043",
          member: "Gita Saha",
          amount: "₹35,000.00",
          scheme: "JLG Reducing Balance 21.5%",
          status: "Under Appraisal",
        },
      ],
    },
  },
  "/hr/staff": {
    title: "Staff Directory & HR",
    subtitle: "Member & Employee Transfers · Salary Processing · Corporate Banking",
    metrics: [
      { label: "Active Staff", value: "114", hint: "All branches", tone: "green" },
      { label: "Transfer Orders", value: "3", hint: "Pending", tone: "amber" },
      { label: "Payroll Eligible", value: "112", hint: "This month", tone: "blue" },
      { label: "On Leave Today", value: "4", hint: "Approved", tone: "slate" },
    ],
    table: {
      title: "Recent Transfer Orders",
      columns: [
        { key: "from", label: "From Kendra" },
        { key: "to", label: "To Kendra" },
        { key: "reason", label: "Reason" },
        { key: "date", label: "Effective Date" },
      ],
      rows: [
        {
          from: "Gandhinagar Kendra 01",
          to: "Uchgaon Kendra 02",
          reason: "Member Relocation to New Area",
          date: "28 Aug 2026",
        },
      ],
    },
  },
  "/customer-portal/360": {
    title: "Customer 360° Multi-Product Passbook",
    subtitle:
      "Unified financial ledger across Micro Loans, Bachat Gat Savings, Recurring Deposits (RD), and Fixed Deposits (FD)",
    metrics: [
      { label: "Current Outstanding", value: "₹40,000.00", hint: "LN-2026-00001", tone: "green" },
      { label: "CIBIL Score", value: "745", hint: "Pre-Approved Limit", tone: "blue" },
      { label: "Next EMI Due", value: "Oct 12, 2026", hint: "₹717.00", tone: "amber" },
      { label: "Savings Balance", value: "₹4,820.00", hint: "Bachat Gat", tone: "violet" },
    ],
    table: {
      title: "360° Passbook Entries",
      columns: [
        { key: "date", label: "Date" },
        { key: "ref", label: "Reference" },
        { key: "narration", label: "Narration" },
        { key: "debit", label: "Debit", align: "right" },
        { key: "credit", label: "Credit", align: "right" },
        { key: "balance", label: "Balance", align: "right" },
      ],
      rows: [
        {
          date: "12-Jul-2026",
          ref: "DISB-LN-2026-00001",
          narration: "IMPS Direct Bank Transfer",
          debit: "₹40,000.00",
          credit: "₹0.00",
          balance: "₹40,000.00",
        },
        {
          date: "12-Aug-2026",
          ref: "RCPT-202608-001",
          narration: "Kendra Meeting Cash",
          debit: "₹0.00",
          credit: "₹3,017.49",
          balance: "₹36,983.00",
        },
        {
          date: "12-Sep-2026",
          ref: "RCPT-202608-002",
          narration: "Kendra Meeting Cash",
          debit: "₹0.00",
          credit: "₹3,071.56",
          balance: "₹33,912.00",
        },
      ],
    },
  },
};

function cleanPreview(preview: string): string {
  return preview
    .replace(/[\uE000-\uF8FF]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}

function defaultContent(entry: GeneratedEntry): MFinPageContent {
  const subtitle = cleanPreview(entry.preview);
  return {
    slug: entry.slug,
    route: entry.route,
    module: entry.module,
    title: entry.title.replace(/MasterMenu|Finance Ledger|Lending|MIS Report|Deposit|HR|User/g, "").trim() || entry.title,
    subtitle: subtitle || "eZi-Micro Core Banking module workspace",
    sidebar: sidebarForModule(entry.module, entry.route),
    notes: subtitle ? [subtitle] : undefined,
  };
}

const routeIndex = new Map<string, GeneratedEntry>(
  (generated as GeneratedEntry[]).map((entry) => [entry.route, entry]),
);

function slugTitle(segment: string): string {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function moduleFromPath(route: string): string {
  const root = route.split("/").filter(Boolean)[0] ?? "";
  const map: Record<string, string> = {
    master: "master",
    accounting: "accounting",
    lms: "lending",
    los: "lending",
    deposits: "deposits",
    mis: "mis",
    hr: "hr",
    security: "security",
    profile: "security",
    "customer-kyc": "lending",
    "branch-vault": "master",
    settings: "other",
    "field-force": "other",
    "agent-portal": "other",
    "customer-portal": "other",
  };
  return map[root] ?? "other";
}

function fallbackContent(route: string): MFinPageContent {
  const parts = route.split("/").filter(Boolean);
  const leaf = parts[parts.length - 1] ?? "Module";
  const module = moduleFromPath(route);
  return {
    slug: parts.join("_"),
    route,
    module,
    title: slugTitle(leaf),
    subtitle: `${slugTitle(parts[0] ?? "Module")} workspace — content mapped from MFin design pack`,
    sidebar: sidebarForModule(module, route),
    notes: ["Screen layout preserved from MFin_Pages reference PDFs."],
  };
}

export function resolvePageContent(route: string): MFinPageContent | null {
  const normalized = route.endsWith("/") && route.length > 1 ? route.slice(0, -1) : route;
  const resolved = routeAliases[normalized] ?? normalized;
  const entry = routeIndex.get(resolved);
  if (!entry) {
    const override = overrides[normalized];
    if (override) {
      return {
        ...fallbackContent(normalized),
        ...override,
        route: normalized,
        sidebar: override.sidebar ?? sidebarForModule(moduleFromPath(normalized), normalized),
      };
    }
    if (normalized.startsWith("/")) {
      return fallbackContent(normalized);
    }
    return null;
  }

  const base = {
    ...defaultContent(entry),
    route: normalized,
    sidebar: sidebarForModule(entry.module, normalized),
  };
  const override = overrides[resolved] ?? overrides[normalized];
  if (!override) return base;

  return {
    ...base,
    ...override,
    route: normalized,
    sidebar: override.sidebar ?? base.sidebar,
    metrics: override.metrics ?? base.metrics,
    table: override.table ?? base.table,
    form: override.form ?? base.form,
    cards: override.cards ?? base.cards,
    notes: override.notes ?? base.notes,
  };
}

export function allRoutes(): string[] {
  return (generated as GeneratedEntry[]).map((e) => e.route);
}

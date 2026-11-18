export function formatInr(value: number, digits = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export type MemberTransfer = {
  orderNo: string;
  member: string;
  fromBranch: string;
  fromKendra: string;
  toBranch: string;
  toKendra: string;
  reason: string;
  date: string;
  status: "Completed" | "Pending" | "Cancelled";
};

export type EmployeeTransfer = {
  orderNo: string;
  employee: string;
  empId: string;
  fromBranch: string;
  toBranch: string;
  effectiveDate: string;
  reason: string;
  status: "Issued" | "Completed" | "Pending";
};

export type PayrollRow = {
  name: string;
  empId: string;
  role: string;
  baseSalary: number;
  target: number | null;
  collected: number | null;
  achievement: number | null;
  incentive: number;
  deductions: number;
  netPayable: number;
  status: "Disbursed" | "Pending";
};

export type StaffMember = {
  empId: string;
  name: string;
  role: string;
  branch: string;
  mobile: string;
  status: "Active" | "On Leave" | "Transferred";
  joined: string;
};

export type MessageLog = {
  id: string;
  recipient: string;
  mobile: string;
  category: string;
  channel: "SMS" | "WhatsApp";
  status: "Delivered" | "Failed" | "Queued";
  preview: string;
  sentAt: string;
};

export const memberTransfers: MemberTransfer[] = [
  {
    orderNo: "MTO-2026-0001",
    member: "Sunita Ramesh Kamble",
    fromBranch: "Karveer Rural Branch",
    fromKendra: "Gandhinagar Kendra 01",
    toBranch: "Karveer Rural Branch",
    toKendra: "Uchgaon Kendra 02",
    reason: "Member Relocation to Nearby Village",
    date: "28 Aug 2026",
    status: "Completed",
  },
];

export const employeeTransfers: EmployeeTransfer[] = [
  {
    orderNo: "ETO-2026-0001",
    employee: "Sachin Shinde",
    empId: "EMP-FO-001",
    fromBranch: "Karveer Rural Branch",
    toBranch: "Sangli Urban Branch",
    effectiveDate: "13 Aug 2026",
    reason: "Branch Expansion",
    status: "Issued",
  },
];

export const payrollRows: PayrollRow[] = [
  {
    name: "Rajesh Patil",
    empId: "EMP-001",
    role: "Branch Manager",
    baseSalary: 65000,
    target: 1500000,
    collected: 950000,
    achievement: 63.3,
    incentive: 3250,
    deductions: 0,
    netPayable: 68250,
    status: "Disbursed",
  },
  {
    name: "Sachin Shinde",
    empId: "EMP-002",
    role: "Field Officer",
    baseSalary: 28000,
    target: 600000,
    collected: 420000,
    achievement: 70,
    incentive: 1400,
    deductions: 0,
    netPayable: 29400,
    status: "Disbursed",
  },
  {
    name: "Priya More",
    empId: "EMP-003",
    role: "Credit Underwriter",
    baseSalary: 42000,
    target: null,
    collected: null,
    achievement: null,
    incentive: 0,
    deductions: 2100,
    netPayable: 39900,
    status: "Disbursed",
  },
  {
    name: "Amit Deshmukh",
    empId: "EMP-004",
    role: "Branch Accountant",
    baseSalary: 38000,
    target: null,
    collected: null,
    achievement: null,
    incentive: 0,
    deductions: 1900,
    netPayable: 36100,
    status: "Disbursed",
  },
];

export const staffDirectory: StaffMember[] = [
  {
    empId: "EMP-001",
    name: "Rajesh Patil",
    role: "Branch Manager / COO",
    branch: "Kolkata Shyambazar Hub Branch",
    mobile: "+91 98200 10001",
    status: "Active",
    joined: "12 Jan 2024",
  },
  {
    empId: "EMP-FO-001",
    name: "Sachin Shinde",
    role: "Field Officer",
    branch: "Karveer Rural Branch",
    mobile: "+91 98234 56789",
    status: "Active",
    joined: "05 Mar 2025",
  },
  {
    empId: "EMP-003",
    name: "Priya More",
    role: "Credit Underwriter",
    branch: "Sonarpur Branch",
    mobile: "+91 98111 22334",
    status: "Active",
    joined: "18 Jun 2025",
  },
  {
    empId: "EMP-004",
    name: "Amit Deshmukh",
    role: "Branch Accountant",
    branch: "Barasat Branch",
    mobile: "+91 98000 44556",
    status: "On Leave",
    joined: "22 Feb 2025",
  },
  {
    empId: "EMP-005",
    name: "Neha Kulkarni",
    role: "Cashier",
    branch: "Karveer Rural Branch",
    mobile: "+91 97979 88990",
    status: "Active",
    joined: "01 Aug 2025",
  },
];

export const messageLogs: MessageLog[] = [
  {
    id: "MSG-001",
    recipient: "Meena More",
    mobile: "+91 98900 11223",
    category: "Overdue EMI Reminder",
    channel: "SMS",
    status: "Delivered",
    preview:
      "URGENT: Dear Meena More, your EMI of ₹4,676 for Loan LN-2026-00003 is overdue by 45 days.",
    sentAt: "12 Sep 2026 08:15",
  },
  {
    id: "MSG-002",
    recipient: "Sunita Kamble",
    mobile: "+91 98234 56789",
    category: "EMI Collection Receipt",
    channel: "WhatsApp",
    status: "Delivered",
    preview:
      "Receipt #RCPT-20260714-00001 · Received ₹3,733.00 via Cash at Gandhinagar Kendra.",
    sentAt: "12 Sep 2026 09:42",
  },
  {
    id: "MSG-003",
    recipient: "Gita Saha",
    mobile: "+91 98540 13720",
    category: "Kendra Meeting Reminder",
    channel: "WhatsApp",
    status: "Queued",
    preview:
      "Reminder: Kendra meeting tomorrow 09:30 at Howrah Uluberia Centre.",
    sentAt: "12 Sep 2026 18:00",
  },
];

export const borrowers = [
  "Sunita Ramesh Kamble",
  "Gita Saha",
  "Aarti Saha",
  "Rani Vijay Gaikwad",
  "Anjali Chakraborty",
];

export const branches = [
  "Karveer Rural Branch",
  "Sangli Urban Branch",
  "Sonarpur Branch",
  "Barasat Branch",
  "Kolkata Shyambazar Hub Branch",
];

export const kendras = [
  "Gandhinagar Kendra 01",
  "Uchgaon Kendra 02",
  "Howrah Uluberia #002",
  "Kharagpur #015",
];

export const transferReasons = [
  "Member Relocation to Nearby Village",
  "Marriage / Family Move",
  "Group Rebalancing",
  "Branch Expansion",
  "Operational Requirement",
];

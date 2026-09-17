import fs from "fs";
import path from "path";

const contentDir = path.join(process.cwd(), "lib", "mfin-content");
const index = JSON.parse(
  fs.readFileSync(path.join(contentDir, "index.json"), "utf8"),
);

const routeMap = {
  "01_Dashboard_Admin": "/",
  "02_Dashboard_BM": "/branch-vault",
  "03_Dashboard_Agent": "/field-force",
  "04_Dashboard_Customer": "/customer-portal",
  "05_MasterMenu_01": "/master",
  "05_MasterMenu_02": "/master/series",
  "05_MasterMenu_03": "/master/timings",
  "05_MasterMenu_04": "/master/roles",
  "05_MasterMenu_05": "/master/gateway",
  "05_MasterMenu_06": "/master/rbi-policies",
  "05_MasterMenu_07": "/master/database-seed",
  "05_MasterMenu_08": "/master/maker-checker",
  "05_MasterMenu_09": "/master/loan-schemes",
  "05_MasterMenu_09_01": "/master/loan-schemes/amortization",
  "05_MasterMenu_10": "/master/kendra-jlg",
  "05_MasterMenu_10_01": "/master/kendra-jlg/branches",
  "05_MasterMenu_11_01": "/master/coa-tree",
  "05_MasterMenu_11_02": "/master/coa-tree/trial-balance",
  "05_MasterMenu_11_03": "/master/coa-tree/sub-ledger",
  "05_MasterMenu_11_04": "/master/coa-tree/vouchers",
  "05_MasterMenu_11_05": "/master/coa-tree/day-book",
  "05_MasterMenu_11_06": "/master/coa-tree/cash-book",
  "05_MasterMenu_11_07": "/master/coa-tree/gl-statement",
  "05_MasterMenu_11_08": "/master/coa-tree/group-ledger",
  "05_MasterMenu_11_09": "/master/coa-tree/control-ledger",
  "05_MasterMenu_11_10": "/master/coa-tree/general-ledger",
  "05_MasterMenu_12_01": "/master/staff",
  "05_MasterMenu_12_02": "/master/staff/directory",
  "05_MasterMenu_12_02_01": "/master/staff/employee-form",
  "05_MasterMenu_12_03": "/master/staff/designations",
  "05_MasterMenu_12_04": "/master/staff/payroll-config",
  "05_MasterMenu_13_01": "/master/branch-vault",
  "05_MasterMenu_13_02": "/master/branch-vault/denominations",
  "05_MasterMenu_13_02_01": "/master/branch-vault/tally",
  "05_MasterMenu_13_03": "/master/branch-vault/custodians",
  "05_MasterMenu_13_03_01": "/master/branch-vault/dual-custody",
  "05_MasterMenu_13_04": "/master/branch-vault/limits",
  "05_MasterMenu_13_05": "/master/branch-vault/hand-in",
  "05_MasterMenu_14": "/master/wifi-sync",
  "06_Finance_Ledger_01": "/accounting/voucher-entry",
  "06_Finance_Ledger_02": "/accounting/journal-adjustment",
  "06_Finance_Ledger_03": "/accounting/cash-deposit",
  "06_Finance_Ledger_03_01": "/accounting/savings-withdrawal",
  "06_Finance_Ledger_04": "/accounting/contra-transfer",
  "07_Lending_01": "/customer-kyc",
  "07_Lending_01_Profile": "/customer-kyc/profile",
  "07_Lending_01_Doc": "/customer-kyc/documents",
  "07_Lending_01_Cibil": "/customer-kyc/cibil",
  "07_Lending_02_01": "/los/applications",
  "07_Lending_02_02": "/los/appraisal",
  "07_Lending_02_03": "/los/foir-check",
  "07_Lending_02_04": "/los/sanction",
  "07_Lending_02_05": "/los/disbursement",
  "07_Lending_02_06": "/los/agreement",
  "07_Lending_02_07": "/los/fee-gst",
  "07_Lending_03": "/lms/collections",
  "07_Lending_03_01": "/lms/repayment-schedule",
  "07_Lending_03_02": "/lms/emi-receipt",
  "07_Lending_03_03": "/lms/prepayment",
  "07_Lending_03_04": "/lms/restructuring",
  "07_Lending_03_05": "/lms/loan-book",
  "07_Lending_03_06": "/lms/passbook",
  "07_Lending_04": "/lms/par-npa",
  "07_Lending_04_01": "/lms/npa-classification",
  "07_Lending_04_02": "/lms/provisioning",
  "07_Lending_04_03": "/lms/legal-notice",
  "07_Lending_04_04": "/lms/recovery",
  "07_Lending_04_05_01": "/lms/write-off",
  "07_Lending_04_05_02": "/lms/settlement",
  "07_Lending_04_05_03": "/lms/auction",
  "07_Lending_04_05_04": "/lms/arbitration",
  "07_Lending_04_05_05": "/lms/court-case",
  "07_Lending_04_06": "/lms/defaulters",
  "07_Lending_04_07": "/lms/field-collection",
  "07_Lending_05": "/lms/reports",
  "07_Lending_05_01": "/lms/disbursement-register",
  "07_Lending_05_02": "/lms/collection-register",
  "07_Lending_05_03": "/lms/portfolio-summary",
  "08_Deposit": "/deposits",
  "08_Deposit_01": "/deposits/savings",
  "08_Deposit_02": "/deposits/rd",
  "08_Deposit_03": "/deposits/fd",
  "08_Deposit_04": "/deposits/member-ledger",
  "08_Deposit_05": "/deposits/interest",
  "08_Deposit_06": "/deposits/withdrawals",
  "09_MIS_Report": "/mis",
  "09_MIS_Report_01": "/mis/daily-business",
  "09_MIS_Report_02": "/mis/portfolio-health",
  "09_MIS_Report_02_01": "/mis/portfolio-gl",
  "09_MIS_Report_03": "/mis/demand-sheet",
  "09_MIS_Report_03_01": "/mis/kendra-demand",
  "09_MIS_Report_04": "/mis/collection",
  "09_MIS_Report_04_01": "/mis/collection-register",
  "09_MIS_Report_05": "/mis/disbursement",
  "09_MIS_Report_05_01": "/mis/disbursement-register",
  "09_MIS_Report_06": "/mis/branch-scorecard",
  "09_MIS_Report_06_01": "/mis/branch-performance",
  "09_MIS_Report_07": "/mis/agent-productivity",
  "09_MIS_Report_07_01": "/mis/agent-leaderboard",
  "09_MIS_Report_08": "/mis/par-aging",
  "09_MIS_Report_09": "/mis/npa-provisioning",
  "09_MIS_Report_10": "/mis/regulatory",
  "09_MIS_Report_11": "/mis/cic-upload",
  "09_MIS_Report_11_01": "/mis/cibil-export",
  "09_MIS_Report_11_02": "/mis/crif-export",
  "09_MIS_Report_11_03": "/mis/equifax-export",
  "09_MIS_Report_12": "/mis/audit-trail",
  "09_MIS_Report_13": "/mis/exports",
  "10_HR_01": "/hr/staff",
  "10_HR_02": "/hr/transfers",
  "10_HR_03": "/hr/payroll",
  "10_HR_04": "/hr/messaging",
  "10_HR_05": "/hr/attendance",
  "10_HR_05_01": "/hr/attendance/geofence",
  "11_User_01_01": "/profile",
  "11_User_01_02": "/profile/password",
  "11_User_01_03": "/profile/activity",
  "11_User_02_01": "/security/users",
  "11_User_02_02": "/security/roles",
  "11_User_02_03": "/security/permissions",
  "11_User_02_04": "/security/menu-matrix",
  "12_Customer_360": "/customer-portal/360",
  "13_Field": "/field-force/route",
  "14_Mobile": "/agent-portal",
  "15_Language": "/settings/language",
};

function titleFromSlug(slug) {
  return slug
    .replace(/^\d+_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function moduleFromSlug(slug) {
  if (slug.startsWith("05_MasterMenu")) return "master";
  if (slug.startsWith("06_Finance")) return "accounting";
  if (slug.startsWith("07_Lending")) return "lending";
  if (slug.startsWith("08_Deposit")) return "deposits";
  if (slug.startsWith("09_MIS")) return "mis";
  if (slug.startsWith("10_HR")) return "hr";
  if (slug.startsWith("11_User")) return "security";
  if (slug.startsWith("01_") || slug.startsWith("02_") || slug.startsWith("03_") || slug.startsWith("04_"))
    return "dashboard";
  return "other";
}

const pages = index.map((item) => ({
  slug: item.slug,
  pdf: item.file,
  route: routeMap[item.slug] ?? `/${item.slug.toLowerCase()}`,
  module: moduleFromSlug(item.slug),
  title: titleFromSlug(item.slug),
  pages: item.pages,
  preview: item.preview,
}));

const outDir = path.join(process.cwd(), "lib", "mfin");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(
  path.join(outDir, "registry.generated.json"),
  JSON.stringify(pages, null, 2),
  "utf8",
);

console.log(`Built registry for ${pages.length} pages`);

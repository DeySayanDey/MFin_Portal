const fs = require("fs");

const files = [
  "src/features/master/fin-year/components/FinYearView.tsx",
  "src/features/master/center/components/KendraCenterMasterTab.tsx",
  "src/features/master/branch/components/KendraBranchMasterTab.tsx",
  "src/features/master/staff/components/StaffView.tsx",
  "src/features/security/login-settings/components/LoginSettingsView.tsx",
  "src/features/master/working-hours/components/WorkingHoursForm.tsx",
  "src/features/master/whatsapp-settings/components/WhatsAppSettingsForm.tsx",
  "src/features/master/sms-settings/components/SmsSettingsForm.tsx",
  "src/features/master/operational-days/components/OperationalDaysView.tsx",
  "src/features/master/holiday/components/HolidayView.tsx",
  "src/features/master/roles/components/RolesView.tsx",
  "src/features/master/acct-subledger-branch/components/AcctSubledgerBranchView.tsx",
  "src/features/master/acct-subledger/components/AcctSubledgerView.tsx",
  "src/features/master/acct-ledger/components/AcctLedgerView.tsx",
  "src/features/master/acct-head/components/AcctHeadView.tsx",
  "src/features/master/acct-category/components/AcctCategoryView.tsx",
  "src/features/master/code-series/components/CodeSeriesView.tsx",
  "src/features/master/rbi-lending-policy/components/RbiLendingPolicyForm.tsx",
  "src/features/master/organization/components/OrganizationForm.tsx",
];

const line =
  "const [successMessage, setSuccessMessage] = useState<string | null>(null);";
const next = "const [successMessage, setSuccessMessage] = useToastText();";
const action =
  "const [actionError, setActionError] = useState<string | null>(null);";
const actionNext = "const [actionError, setActionError] = useToastText();";
const notice = "const [notice, setNotice] = useState<string | null>(null);";
const noticeNext = "const [notice, setNotice] = useToastText();";
const importFrom = 'import { PageToast } from "@/components/ui/PageToast";';
const importTo =
  'import { PageToast, useToastText } from "@/components/ui/PageToast";';

for (const file of files) {
  let text = fs.readFileSync(file, "utf8");
  if (!text.includes("useToastText")) {
    if (!text.includes(importFrom)) {
      throw new Error("missing import " + file);
    }
    text = text.replace(importFrom, importTo);
  }
  if (text.includes(line)) text = text.replace(line, next);
  if (text.includes(action)) text = text.replace(action, actionNext);
  if (file.includes("login-settings") && text.includes(notice)) {
    text = text.replace(notice, noticeNext);
  }
  fs.writeFileSync(file, text);
  console.log("updated", file);
}

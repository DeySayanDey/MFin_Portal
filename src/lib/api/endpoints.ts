/**
 * Documented Laravel API paths from apilist.txt.
 * Do not invent endpoints here.
 *
 * `bff` = same-origin Next.js route handlers the browser may call.
 * Laravel paths are only used server-side via the API client + Bearer token.
 */
export const endpoints = {
  auth: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    me: "/api/auth/me",
  },
  /** Same-origin BFF routes (browser → Next → Laravel). */
  bff: {
    menu: "/api/menu",
    auditLog: "/api/security/audit-log",
    smsSettings: "/api/master/sms-settings",
    whatsAppSettings: "/api/master/whatsapp-settings",
    globalSettings: "/api/master/global-settings",
    generalSettings: "/api/master/general-settings",
    finYear: "/api/master/fin-year",
    holiday: "/api/master/holiday",
    center: "/api/master/center",
    operationalDays: "/api/master/operational-days",
    roleMenu: "/api/master/role-menu",
    securityPolicy: "/api/security/login-settings",
    acctCategory: "/api/master/acct-category",
    acctHead: "/api/master/acct-head",
    acctLedger: "/api/master/acct-ledger",
    acctSubledger: "/api/master/acct-subledger",
    acctSubledgerBranch: "/api/master/acct-subledger-branch",
    makerChecker: "/api/master/maker-checker",
    depositSchemes: "/api/master/deposit-schemes",
    depositSchemeCharges: "/api/master/deposit-schemes/charges",
    depositInterest: "/api/master/deposit-interest",
    depositCharges: "/api/master/deposit-charges",
    loanCharges: "/api/master/loan-charges",
    loanSchemes: "/api/master/loan-schemes",
    loanSchemeCharges: "/api/master/loan-schemes/charges",
    loanRoiSlabs: "/api/master/loan-roi-slabs",
    loanEligibility: "/api/master/loan-eligibility-setup",
    applOptions: "/api/master/appl-options",
    depositAccounts: "/api/deposits/accounts",
    depositAccountCustomers: "/api/deposits/accounts/customers",
    depositAccountProducts: "/api/deposits/accounts/products",
    depositAccountMembers: "/api/deposits/accounts/members",
    depositAccountNominees: "/api/deposits/accounts/nominees",
    depositAccountSignatories: "/api/deposits/accounts/signatories",
    depositSignatoryFile: "/api/deposits/accounts/signatories/file",
    depositProductSchemes: "/api/deposits/accounts/product-schemes",
    depositAccountView: "/api/deposits/accounts/view",
    termDepositSchedule: "/api/deposits/term/schedule",
    depositAccountMemberSync: "/api/deposits/accounts/member-sync",
    supportTickets: "/api/support/tickets",
    supportRealtime: "/api/support/realtime",
    groupManagement: "/api/onboarding/group-management",
    memberRegistration: "/api/onboarding/member-registration",
    memberNominees: "/api/onboarding/member-nominees",
    memberLedger: "/api/deposits/member-ledger",
    memberLedgerTransactions: "/api/deposits/member-ledger/transactions",
    memberKyc: "/api/onboarding/member-kyc",
    groupKyc: "/api/onboarding/group-kyc",
    groupKycFile: "/api/onboarding/group-kyc/file",
    memberLocation: "/api/onboarding/member-location",
    groupMemberMapping: "/api/onboarding/group-member-mapping",
    shareSubscription: "/api/onboarding/share-subscription",
    savingsTransactions: "/api/deposits/savings-transactions",
    savingsTransactionCustomers: "/api/deposits/savings-transactions/customers",
    savingsTransactionBalance: "/api/deposits/savings-transactions/balance",
    savingsTransactionVouchers: "/api/deposits/savings-transactions/vouchers",
    loanAccounts: "/api/lms/loan-accounts",
    loanApplications: "/api/los/applications",
    loanBorrowerLookup: "/api/los/borrowers",
    loanApplicationCharges: "/api/los/charges",
    loanGuarantors: "/api/los/guarantors",
    loanMortgages: "/api/los/mortgages",
    loanProjects: "/api/los/projects",
    loanDepositFreezes: "/api/los/deposit-freezes",
    loanInspections: "/api/los/inspections",
    loanSanctionPreview: "/api/los/sanction-preview",
    loanApprovals: "/api/los/approvals",
    loanDisbursements: "/api/lms/disbursements",
    loanDisbursementPreview: "/api/lms/disbursements/preview",
    loanDisbursementApprove: "/api/lms/disbursements/approve",
  },
  menuTree: "/api/MenuTree",
  stateList: "/api/StateList",
  applOptions: {
    list: "/api/ApplOptionsList",
  },
  depositScheme: {
    list: "/api/DepositSchemeList",
    add: "/api/DepositSchemeAdd",
    edit: "/api/DepositSchemeEdit",
    status: "/api/DepositSchemeStatus",
  },
  depositAccount: {
    list: "/api/DepositAccountList",
    add: "/api/DepositAccountAdd",
    edit: "/api/DepositAccountEdit",
    status: "/api/DepositAccountStatus",
    close: "/api/DepositAccountClose",
    nomineeList: "/api/DepositNomineeList",
    nomineeAdd: "/api/DepositNomineeAdd",
    nomineeEdit: "/api/DepositNomineeEdit",
    nomineeStatus: "/api/DepositNomineeStatus",
    signatoryList: "/api/DepositSignatoryList",
    signatoryAdd: "/api/DepositSignatoryAdd",
    signatoryEdit: "/api/DepositSignatoryEdit",
    signatoryStatus: "/api/DepositSignatoryStatus",
    view: "/api/DepositAccountView",
    productSchemeList: "/api/DepositProductSchemeList",
    scheduleList: "/api/TermDepositScheduleList",
    scheduleSync: "/api/TermDepositScheduleSync",
    payoutList: "/api/TermDepositPayoutList",
    payoutPay: "/api/TermDepositPayoutPay",
    memberList: "/api/DepositAccountMemberList",
    memberSync: "/api/DepositAccountMemberSync",
  },
  depositSchemeCharges: {
    list: "/api/DepositSchemeChargesList",
    add: "/api/DepositSchemeChargesAdd",
    edit: "/api/DepositSchemeChargesEdit",
    status: "/api/DepositSchemeChargesStatus",
  },
  depositSchemeSlab: {
    list: "/api/DepositSchemeSlabList",
    add: "/api/DepositSchemeSlabAdd",
    status: "/api/DepositSchemeSlabStatus",
  },
  depositCharges: {
    list: "/api/DepositChargesList",
    add: "/api/DepositChargesAdd",
    edit: "/api/DepositChargesEdit",
    status: "/api/DepositChargesStatus",
  },
  loanCharges: {
    list: "/api/LoanChargesList",
    add: "/api/LoanChargesAdd",
    edit: "/api/LoanChargesEdit",
    status: "/api/LoanChargesStatus",
  },
  loanScheme: {
    list: "/api/LoanSchemeList",
    add: "/api/LoanSchemeAdd",
    edit: "/api/LoanSchemeEdit",
    status: "/api/LoanSchemeStatus",
  },
  loanSchemeCharges: {
    list: "/api/LoanSchemeChargesList",
    add: "/api/LoanSchemeChargesAdd",
    edit: "/api/LoanSchemeChargesEdit",
    status: "/api/LoanSchemeChargesStatus",
  },
  loanSchemeSlab: {
    list: "/api/LoanSchemeSlabList",
    add: "/api/LoanSchemeSlabAdd",
    edit: "/api/LoanSchemeSlabEdit",
    status: "/api/LoanSchemeSlabStatus",
  },
  loanEligibility: {
    list: "/api/LoanEligibilityParameterList",
    edit: "/api/LoanEligibilityParameterEdit",
    status: "/api/LoanEligibilityParameterStatus",
  },
  loanAccount: {
    list: "/api/LoanAccountList",
    add: "/api/LoanAccountAdd",
    edit: "/api/LoanAccountEdit",
    status: "/api/LoanAccountStatus",
  },
  loanBorrowerLookup: "/api/LoanBorrowerLookup",
  loanApplication: {
    list: "/api/LoanApplicationList",
    get: "/api/LoanApplicationGet",
    add: "/api/LoanApplicationAdd",
    bulkAdd: "/api/LoanApplicationBulkAdd",
    edit: "/api/LoanApplicationEdit",
    status: "/api/LoanApplicationStatus",
    timeline: "/api/LoanApplicationTimeline",
    eligibilityCheck: "/api/LoanEligibilityCheck",
  },
  loanApplicationCharge: {
    list: "/api/LoanApplicationChargeList",
    add: "/api/LoanApplicationChargeAdd",
    edit: "/api/LoanApplicationChargeEdit",
    status: "/api/LoanApplicationChargeStatus",
  },
  loanApplicationGuarantor: {
    list: "/api/LoanApplicationGuarantorList",
    add: "/api/LoanApplicationGuarantorAdd",
    edit: "/api/LoanApplicationGuarantorEdit",
    status: "/api/LoanApplicationGuarantorStatus",
  },
  loanApplicationMortgage: {
    list: "/api/LoanApplicationMortgageList",
    add: "/api/LoanApplicationMortgageAdd",
    edit: "/api/LoanApplicationMortgageEdit",
    status: "/api/LoanApplicationMortgageStatus",
  },
  loanApplicationProject: {
    list: "/api/LoanApplicationProjectList",
    add: "/api/LoanApplicationProjectAdd",
    edit: "/api/LoanApplicationProjectEdit",
  },
  loanApplicationDepositFreeze: {
    list: "/api/LoanApplicationDepositFreezeList",
    add: "/api/LoanApplicationDepositFreezeAdd",
    edit: "/api/LoanApplicationDepositFreezeEdit",
    status: "/api/LoanApplicationDepositFreezeStatus",
  },
  loanInspection: {
    list: "/api/LoanInspectionList",
    add: "/api/LoanInspectionAdd",
    edit: "/api/LoanInspectionEdit",
  },
  loanSanctionPreview: "/api/LoanSanctionPreview",
  loanApproval: {
    list: "/api/LoanApprovalList",
    add: "/api/LoanApprovalAdd",
  },
  loanDisbursement: {
    list: "/api/LoanDisbursementList",
    preview: "/api/LoanDisbursementPreview",
    add: "/api/LoanDisbursementAdd",
    approve: "/api/LoanDisbursementApprove",
  },
  role: {
    list: "/api/RoleList",
    add: "/api/RoleAdd",
    edit: "/api/RoleEdit",
  },
  roleMenu: {
    get: "/api/RoleMenuGet",
    assign: "/api/RoleMenuAssign",
  },
  acctCategory: {
    list: "/api/AcctCategoryList",
    add: "/api/AcctCategoryAdd",
    edit: "/api/AcctCategoryEdit",
  },
  acctHead: {
    list: "/api/AcctHeadList",
    add: "/api/AcctHeadAdd",
    edit: "/api/AcctHeadEdit",
  },
  acctLedger: {
    list: "/api/AcctLedgerList",
    add: "/api/AcctLedgerAdd",
    edit: "/api/AcctLedgerEdit",
  },
  acctSubledger: {
    list: "/api/AcctSubledgerList",
    add: "/api/AcctSubledgerAdd",
    edit: "/api/AcctSubledgerEdit",
  },
  acctSubledgerBranch: {
    list: "/api/AcctSubledgerBranchList",
    add: "/api/AcctSubledgerBranchAdd",
    edit: "/api/AcctSubledgerBranchEdit",
  },
  org: {
    get: "/api/OrgGet",
    update: "/api/OrgUpdate",
  },
  codeSeries: {
    list: "/api/CodeSeriesList",
    update: "/api/CodeSeriesUpdate",
  },
  workingHours: {
    get: "/api/WorkingHoursGet",
    update: "/api/WorkingHoursUpdate",
  },
  smsSettings: {
    get: "/api/SmsSettingsGet",
    update: "/api/SmsSettingsUpdate",
  },
  whatsAppSettings: {
    get: "/api/WhatsAppSettingsGet",
    update: "/api/WhatsAppSettingsUpdate",
  },
  /** Contract: docs/global-settings-api.md. Not yet in apilist.txt. */
  globalSettings: {
    get: "/api/GlobalSettingsGet",
    update: "/api/GlobalSettingsUpdate",
  },
  /** `mst_settings_general`. Contract: docs/general-settings-api.md. */
  generalSettings: {
    list: "/api/GeneralSettingsList",
    status: "/api/GeneralSettingsStatus",
    bulkStatus: "/api/GeneralSettingsBulkStatus",
  },
  rbiLendingPolicy: {
    get: "/api/RbiLendingPolicyGet",
    update: "/api/RbiLendingPolicyUpdate",
  },
  branch: {
    list: "/api/BranchList",
    add: "/api/BranchAdd",
    edit: "/api/BranchEdit",
  },
  staff: {
    list: "/api/StaffList",
    add: "/api/StaffAdd",
    edit: "/api/StaffEdit",
    designationList: "/api/DesignationList",
    moduleAccessList: "/api/ModuleAccessList",
  },
  auditLog: {
    list: "/api/AuditLogList",
  },
  securityPolicy: {
    get: "/api/SecurityPolicyGet",
    update: "/api/SecurityPolicyUpdate",
  },
  finYear: {
    list: "/api/FinYearGet",
    update: "/api/FinYearUpdate",
  },
  holiday: {
    list: "/api/HolidayGet",
    update: "/api/HolidayUpdate",
  },
  center: {
    list: "/api/CenterList",
    add: "/api/CenterAdd",
    edit: "/api/CenterEdit",
  },
  group: {
    list: "/api/GroupList",
    add: "/api/GroupAdd",
    edit: "/api/GroupEdit",
    status: "/api/GroupStatus",
  },
  member: {
    list: "/api/MemberList",
    add: "/api/MemberAdd",
    edit: "/api/MemberEdit",
    status: "/api/MemberStatus",
    nomineeList: "/api/MemberNomineeList",
  },
  memberLedger: {
    accounts: "/api/MemberLedger",
    savingsTransactions: "/api/MemberLedgerSavingsTransactions",
    termTransactions: "/api/MemberLedgerTermTransactions",
  },
  memberLocation: {
    list: "/api/MemberLocationList",
    add: "/api/MemberLocationAdd",
    edit: "/api/MemberLocationEdit",
    geoVerify: "/api/MemberLocationGeoVerify",
    status: "/api/MemberLocationStatus",
  },
  memberKyc: {
    list: "/api/MemberKycList",
    add: "/api/MemberKycAdd",
    edit: "/api/MemberKycEdit",
    verify: "/api/MemberKycVerify",
    status: "/api/MemberKycStatus",
  },
  /** Contract: docs/group-kyc-api.md. Not yet in apilist.txt. */
  groupKyc: {
    list: "/api/GroupKycList",
    add: "/api/GroupKycAdd",
    edit: "/api/GroupKycEdit",
    verify: "/api/GroupKycVerify",
    status: "/api/GroupKycStatus",
  },
  memberGroup: {
    list: "/api/MemberGroupList",
    check: "/api/MemberGroupCheck",
    assign: "/api/MemberGroupAssign",
    reassign: "/api/MemberGroupReassign",
    edit: "/api/MemberGroupEdit",
    exit: "/api/MemberGroupExit",
  },
  savingsTransaction: {
    list: "/api/SavingsTransactionList",
    add: "/api/SavingsTransactionAdd",
    approve: "/api/SavingsTransactionApprove",
    customerList: "/api/SavingsCustomerList",
    balance: "/api/SavingsAccountBalance",
    voucherPost: "/api/SavingsTransactionVoucherPost",
  },
  /** Contract: docs/share-subscription-api.md. Not yet in apilist.txt. */
  shareSubscription: {
    list: "/api/ShareSubscriptionList",
    add: "/api/ShareSubscriptionAdd",
    edit: "/api/ShareSubscriptionEdit",
    approve: "/api/ShareSubscriptionApprove",
    holding: "/api/ShareHoldingGet",
  },
  operationalDays: {
    list: "/api/OperationalDaysList",
    add: "/api/OperationalDaysAdd",
    edit: "/api/OperationalDaysEdit",
  },
  makerChecker: {
    list: "/api/MakerCheckerList",
    add: "/api/MakerCheckerAdd",
    edit: "/api/MakerCheckerEdit",
  },
  /**
   * Paths are appended to SUPPORT_API_URL (`http://host/api`).
   * Raise, list, detail, messages, and realtime use the project key or the client token.
   * The API secret is not sent.
   */
  supportTicket: {
    list: "/integrations/redirect/tickets",
    add: "/integrations/tickets",
    redirectAdd: "/integrations/redirect/tickets",
    one: "/integrations/redirect/tickets",
    realtime: "/integrations/redirect/realtime",
    realtimeAuth: "/integrations/redirect/realtime/auth",
  },
} as const;

/** Normalize a path to always start with `/`. */
export function toApiPath(path: string): string {
  if (!path) {
    throw new Error("API path must be a non-empty string");
  }
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * Join base URL and path without duplicating slashes.
 * Does not append query strings — use the API client `searchParams` option.
 */
export function joinApiUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = toApiPath(path);
  return `${normalizedBase}${normalizedPath}`;
}

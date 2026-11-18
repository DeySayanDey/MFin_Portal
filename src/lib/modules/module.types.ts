/**
 * Shared module page contracts for Master (and future modules).
 * Pages pass a ModulePage instance into ModulePageShell — no ad-hoc title props.
 */

export type ModuleId =
  | "master.organization"
  | "master.codeSeries"
  | "master.workingHours"
  | "master.roles"
  | "master.finYear"
  | "master.holiday"
  | "master.operationalDays"
  | "master.acctCategory"
  | "master.acctHead"
  | "master.acctLedger"
  | "master.acctSubledger"
  | "master.acctSubledgerBranch"
  | "master.branch"
  | "master.center"
  | "master.staff"
  | "master.smsSettings"
  | "master.globalSettings"
  | "master.generalSettings"
  | "master.makerChecker"
  | "master.depositSchemes"
  | "master.depositInterest"
  | "master.chargesSetup"
  | "master.loanSchemes"
  | "master.loanRoiSlabs"
  | "master.loanEligibility"
  | "security.auditLog"
  | "security.loginSettings"
  | "onboarding.memberRegistration"
  | "onboarding.groupManagement"
  | "onboarding.groupMemberMapping"
  | "onboarding.customerKyc"
  | "loan.module";

export type ModulePageMeta = {
  /** Stable module id used for registry / analytics. */
  id: ModuleId;
  /** App route without locale prefix, e.g. `/master/roles`. */
  route: string;
  /** next-intl namespace, e.g. `master.roles`. */
  messageNamespace: string;
  /** Key under that namespace for the page title. */
  titleKey: string;
  /** Key under that namespace for the page description. */
  descriptionKey: string;
};

/**
 * Typed carrier from route/feature → common ModulePageShell.
 * Prefer `toJSON()` when crossing server → client boundaries.
 */
export class ModulePage {
  readonly id: ModuleId;
  readonly route: string;
  readonly messageNamespace: string;
  readonly titleKey: string;
  readonly descriptionKey: string;

  constructor(meta: ModulePageMeta) {
    this.id = meta.id;
    this.route = meta.route;
    this.messageNamespace = meta.messageNamespace;
    this.titleKey = meta.titleKey;
    this.descriptionKey = meta.descriptionKey;
  }

  toJSON(): ModulePageMeta {
    return {
      id: this.id,
      route: this.route,
      messageNamespace: this.messageNamespace,
      titleKey: this.titleKey,
      descriptionKey: this.descriptionKey,
    };
  }

  static fromJSON(meta: ModulePageMeta): ModulePage {
    return new ModulePage(meta);
  }
}

/** Registry of Master module pages that use the common shell. */
export const masterModulePages = {
  organization: new ModulePage({
    id: "master.organization",
    route: "/master/company-profile",
    messageNamespace: "master.organization",
    titleKey: "title",
    descriptionKey: "description",
  }),
  codeSeries: new ModulePage({
    id: "master.codeSeries",
    route: "/master/series",
    messageNamespace: "master.codeSeries",
    titleKey: "title",
    descriptionKey: "description",
  }),
  workingHours: new ModulePage({
    id: "master.workingHours",
    route: "/master/timings",
    messageNamespace: "master.workingHours",
    titleKey: "title",
    descriptionKey: "description",
  }),
  roles: new ModulePage({
    id: "master.roles",
    route: "/master/roles",
    messageNamespace: "master.roles",
    titleKey: "title",
    descriptionKey: "description",
  }),
  finYear: new ModulePage({
    id: "master.finYear",
    route: "/master/fiscal-year",
    messageNamespace: "master.finYear",
    titleKey: "title",
    descriptionKey: "description",
  }),
  holiday: new ModulePage({
    id: "master.holiday",
    route: "/master/holiday-calendar",
    messageNamespace: "master.holiday",
    titleKey: "title",
    descriptionKey: "description",
  }),
  operationalDays: new ModulePage({
    id: "master.operationalDays",
    route: "/master/business-hours",
    messageNamespace: "master.operationalDays",
    titleKey: "title",
    descriptionKey: "description",
  }),
  acctCategory: new ModulePage({
    id: "master.acctCategory",
    route: "/master/account-categories",
    messageNamespace: "master.acctCategory",
    titleKey: "title",
    descriptionKey: "description",
  }),
  acctHead: new ModulePage({
    id: "master.acctHead",
    route: "/master/account-heads",
    messageNamespace: "master.acctHead",
    titleKey: "title",
    descriptionKey: "description",
  }),
  acctLedger: new ModulePage({
    id: "master.acctLedger",
    route: "/master/account-ledgers",
    messageNamespace: "master.acctLedger",
    titleKey: "title",
    descriptionKey: "description",
  }),
  acctSubledger: new ModulePage({
    id: "master.acctSubledger",
    route: "/master/account-subledgers",
    messageNamespace: "master.acctSubledger",
    titleKey: "title",
    descriptionKey: "description",
  }),
  acctSubledgerBranch: new ModulePage({
    id: "master.acctSubledgerBranch",
    route: "/master/account-subledger-branches",
    messageNamespace: "master.acctSubledgerBranch",
    titleKey: "title",
    descriptionKey: "description",
  }),
  branch: new ModulePage({
    id: "master.branch",
    route: "/master/branch-vault",
    messageNamespace: "master.branch",
    titleKey: "title",
    descriptionKey: "description",
  }),
  center: new ModulePage({
    id: "master.center",
    route: "/master/kendra-jlg",
    messageNamespace: "master.center",
    titleKey: "title",
    descriptionKey: "description",
  }),
  staff: new ModulePage({
    id: "master.staff",
    route: "/master/staff",
    messageNamespace: "master.staff",
    titleKey: "title",
    descriptionKey: "description",
  }),
  smsSettings: new ModulePage({
    id: "master.smsSettings",
    route: "/master/gateway",
    messageNamespace: "master.smsSettings",
    titleKey: "title",
    descriptionKey: "description",
  }),
  globalSettings: new ModulePage({
    id: "master.globalSettings",
    route: "/master/global-settings",
    messageNamespace: "master.globalSettings",
    titleKey: "title",
    descriptionKey: "description",
  }),
  generalSettings: new ModulePage({
    id: "master.generalSettings",
    route: "/master/general-settings",
    messageNamespace: "master.generalSettings",
    titleKey: "title",
    descriptionKey: "description",
  }),
  makerChecker: new ModulePage({
    id: "master.makerChecker",
    route: "/master/maker-checker",
    messageNamespace: "master.makerChecker",
    titleKey: "title",
    descriptionKey: "description",
  }),
  depositSchemes: new ModulePage({
    id: "master.depositSchemes",
    route: "/master/deposit-schemes",
    messageNamespace: "master.depositSchemes",
    titleKey: "title",
    descriptionKey: "description",
  }),
  depositInterest: new ModulePage({
    id: "master.depositInterest",
    route: "/master/deposit-interest",
    messageNamespace: "master.depositInterest",
    titleKey: "title",
    descriptionKey: "description",
  }),
  chargesSetup: new ModulePage({
    id: "master.chargesSetup",
    route: "/master/charges-setup",
    messageNamespace: "master.chargesSetup",
    titleKey: "title",
    descriptionKey: "description",
  }),
  loanSchemes: new ModulePage({
    id: "master.loanSchemes",
    route: "/master/loan-schemes",
    messageNamespace: "master.loanSchemes",
    titleKey: "title",
    descriptionKey: "description",
  }),
  loanRoiSlabs: new ModulePage({
    id: "master.loanRoiSlabs",
    route: "/master/loan-roi-slabs",
    messageNamespace: "master.loanRoiSlabs",
    titleKey: "title",
    descriptionKey: "description",
  }),
  loanEligibility: new ModulePage({
    id: "master.loanEligibility",
    route: "/master/loan-eligibility-setup",
    messageNamespace: "master.loanEligibility",
    titleKey: "title",
    descriptionKey: "description",
  }),
} as const;

export type MasterModulePageKey = keyof typeof masterModulePages;

/** Registry of Security module pages that use the common shell. */
export const securityModulePages = {
  auditLog: new ModulePage({
    id: "security.auditLog",
    route: "/security/audit-logs",
    messageNamespace: "security.auditLog",
    titleKey: "title",
    descriptionKey: "description",
  }),
  loginSettings: new ModulePage({
    id: "security.loginSettings",
    route: "/security/login-settings",
    messageNamespace: "security.loginSettings",
    titleKey: "title",
    descriptionKey: "description",
  }),
} as const;

export type SecurityModulePageKey = keyof typeof securityModulePages;

/** Registry of Onboarding module pages that use the common shell. */
export const onboardingModulePages = {
  groupManagement: new ModulePage({
    id: "onboarding.groupManagement",
    route: "/onboarding/group-management",
    messageNamespace: "onboarding.groupManagement",
    titleKey: "title",
    descriptionKey: "description",
  }),
  memberRegistration: new ModulePage({
    id: "onboarding.memberRegistration",
    route: "/onboarding/member-registration",
    messageNamespace: "onboarding.memberRegistration",
    titleKey: "title",
    descriptionKey: "description",
  }),
  groupMemberMapping: new ModulePage({
    id: "onboarding.groupMemberMapping",
    route: "/onboarding/group-member-mapping",
    messageNamespace: "onboarding.groupMemberMapping",
    titleKey: "title",
    descriptionKey: "description",
  }),
  customerKyc: new ModulePage({
    id: "onboarding.customerKyc",
    route: "/customer-kyc",
    messageNamespace: "onboarding.customerKyc",
    titleKey: "title",
    descriptionKey: "description",
  }),
} as const;

export type OnboardingModulePageKey = keyof typeof onboardingModulePages;

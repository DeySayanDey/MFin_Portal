/**
 * Shared module page contracts for Master (and future modules).
 * Pages pass a ModulePage instance into ModulePageShell — no ad-hoc title props.
 */

export type ModuleId =
  | "master.organization"
  | "master.codeSeries"
  | "master.workingHours"
  | "master.roles"
  | "master.branch"
  | "master.staff"
  | "security.auditLog";

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
  branch: new ModulePage({
    id: "master.branch",
    route: "/master/kendra-jlg",
    messageNamespace: "master.branch",
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
} as const;

export type MasterModulePageKey = keyof typeof masterModulePages;

/** Registry of Security module pages that use the common shell. */
export const securityModulePages = {
  auditLog: new ModulePage({
    id: "security.auditLog",
    route: "/security/audit-log",
    messageNamespace: "security.auditLog",
    titleKey: "title",
    descriptionKey: "description",
  }),
} as const;

export type SecurityModulePageKey = keyof typeof securityModulePages;

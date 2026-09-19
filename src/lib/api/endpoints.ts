/**
 * Documented Laravel API paths from apilist.txt.
 * Do not invent endpoints here.
 */
export const endpoints = {
  auth: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
  },
  menuTree: "/api/MenuTree",
  stateList: "/api/StateList",
  role: {
    list: "/api/RoleList",
    add: "/api/RoleAdd",
    edit: "/api/RoleEdit",
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

import type {
  AuthRole,
  AuthUser,
  AuthUserDto,
  LoginDataDto,
} from "@/features/auth/types/auth";

function asText(value: string | null | undefined, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

/**
 * Login user may arrive as snake_case (docs) or camelCase (live API).
 * Normalize either shape into AuthUserDto-compatible reads.
 */
function readUserFields(raw: AuthUserDto & Record<string, unknown>) {
  return {
    userId: asNumber(raw.user_id) ?? asNumber(raw.userId),
    orgId: asNumber(raw.org_id) ?? asNumber(raw.orgId),
    branchId: asNumber(raw.branch_id) ?? asNumber(raw.branchId),
    userName: asText(
      (raw.user_name as string | undefined) ?? (raw.userName as string | undefined),
    ),
    shortName: asText((raw.short_name ?? raw.shortName) as string | null | undefined) || null,
    staffId: asNumber(raw.staff_id ?? raw.staffId),
    fullName: asText((raw.full_name ?? raw.fullName) as string | null | undefined) || null,
    employeeCode: asText((raw.employee_code ?? raw.employeeCode) as string | null | undefined) || null,
    employeeRefCode: asText((raw.employee_ref_code ?? raw.employeeRefCode) as string | null | undefined) || null,
    designationId: asNumber(raw.designation_id ?? raw.designationId),
    designationName: asText((raw.designation_name ?? raw.designationName) as string | null | undefined) || null,
    mobile: asText(raw.mobile as string | null | undefined) || null,
    email: asText(raw.email as string | null | undefined) || null,
    joinDate: asText((raw.join_date ?? raw.joinDate) as string | null | undefined) || null,
    userPhone: asText((raw.user_phone ?? raw.userPhone) as string | null | undefined) || null,
    userCode: asText(
      (raw.user_code as string | null | undefined) ??
        (raw.userCode as string | null | undefined),
    ),
    userMob: asText(
      (raw.user_phone as string | null | undefined) ??
        (raw.userPhone as string | null | undefined) ??
        (raw.user_mob as string | null | undefined) ??
        (raw.userMob as string | null | undefined),
    ),
    userEmail: asText(
      (raw.user_email as string | null | undefined) ??
        (raw.userEmail as string | null | undefined),
    ),
    isActive:
      raw.is_active === true ||
      raw.isActive === true ||
      raw.status === 1,
    loginStatus: asText(
      (raw.login_status as string | null | undefined) ??
        (raw.loginStatus as string | null | undefined),
      "LogIn",
    ),
    orgDisplayName: asText(
      (raw.org_disp_nm as string | undefined) ??
        (raw.orgDisplayName as string | undefined),
    ),
    legalName: asText(
      (raw.legal_name as string | undefined) ??
        (raw.legalName as string | undefined),
    ),
    orgSchema: asText(
      (raw.org_schema as string | undefined) ??
        (raw.orgSchema as string | undefined),
    ),
    branchCode: asText(
      (raw.branch_code as string | undefined) ??
        (raw.branchCode as string | undefined),
    ) || null,
    branchName: asText(
      (raw.branch_name as string | undefined) ??
        (raw.branchName as string | undefined),
    ) || null,
    isHead: asBoolean(raw.is_head) || asBoolean(raw.isHead),
    roleId: asNumber(raw.role_id) ?? asNumber(raw.roleId),
    roleName: asText(
      (raw.role_name as string | null | undefined) ??
        (raw.roleName as string | null | undefined),
    ),
    isAdmin: asBoolean(raw.is_admin) || asBoolean(raw.isAdmin),
    rolesRaw: Array.isArray(raw.roles) ? raw.roles : [],
  };
}

function mapRoles(
  rolesRaw: unknown[],
  fallback: { roleId: number | null; roleName: string; isAdmin: boolean },
): AuthRole[] {
  const fromList = rolesRaw.flatMap((role) => {
    if (!role || typeof role !== "object") return [];
    const row = role as Record<string, unknown>;
    const roleId = asNumber(row.role_id) ?? asNumber(row.roleId);
    if (roleId == null) return [];
    return [
      {
        roleId,
        roleName: asText(
          (row.role_name as string | undefined) ??
            (row.roleName as string | undefined),
        ),
        isAdmin: asBoolean(row.is_admin) || asBoolean(row.isAdmin),
      },
    ];
  });

  if (fromList.length > 0) return fromList;

  if (fallback.roleId != null) {
    return [
      {
        roleId: fallback.roleId,
        roleName: fallback.roleName,
        isAdmin: fallback.isAdmin,
      },
    ];
  }

  return [];
}

export function mapAuthUserDto(dto: AuthUserDto): AuthUser {
  const raw = dto as AuthUserDto & Record<string, unknown>;
  const fields = readUserFields(raw);

  if (fields.userId == null || fields.orgId == null) {
    throw new Error("Login user DTO missing userId/orgId");
  }

  const roles = mapRoles(fields.rolesRaw, {
    roleId: fields.roleId,
    roleName: fields.roleName,
    isAdmin: fields.isAdmin,
  });

  const roleId = fields.roleId ?? roles[0]?.roleId ?? null;

  return {
    userId: fields.userId,
    orgId: fields.orgId,
    branchId: fields.branchId,
    userName: fields.userName,
    shortName: fields.shortName,
    staffId: fields.staffId,
    fullName: fields.fullName,
    employeeCode: fields.employeeCode,
    employeeRefCode: fields.employeeRefCode,
    designationId: fields.designationId,
    designationName: fields.designationName,
    mobile: fields.mobile,
    email: fields.email,
    joinDate: fields.joinDate,
    userCode: fields.userCode,
    userMob: fields.userMob,
    userPhone: fields.userPhone,
    userEmail: fields.userEmail,
    isActive: fields.isActive,
    loginStatus: fields.loginStatus,
    orgDisplayName: fields.orgDisplayName,
    legalName: fields.legalName,
    orgSchema: fields.orgSchema,
    branchCode: fields.branchCode,
    branchName: fields.branchName,
    isHead: fields.isHead,
    roleId,
    roleName: fields.roleName || roles[0]?.roleName || null,
    isAdmin: fields.isAdmin || roles.some((role) => role.isAdmin),
    roles,
  };
}

export function mapLoginDataToSession(dto: LoginDataDto): {
  token: string;
  tokenType: string;
  expiresAt: number;
  orgSchema: string;
  user: AuthUser;
} {
  const orgSchema = dto.org_schema ?? dto.orgSchema ?? dto.user.org_schema ?? "";
  return {
    token: dto.token,
    tokenType: dto.token_type ?? (dto as { tokenType?: string }).tokenType ?? "Bearer",
    expiresAt:
      Date.now() +
      ((dto.expires_in ?? (dto as { expiresIn?: number }).expiresIn ?? 28800) as number) *
        1000,
    orgSchema,
    user: {
      ...mapAuthUserDto(dto.user),
      orgSchema,
      passwordExpired: dto.password_expired === true || dto.passwordExpired === true,
    },
  };
}

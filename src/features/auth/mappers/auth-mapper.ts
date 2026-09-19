import type { AuthUser, AuthUserDto, LoginDataDto } from "@/features/auth/types/auth";

export function mapAuthUserDto(dto: AuthUserDto): AuthUser {
  return {
    userId: dto.user_id,
    orgId: dto.org_id,
    branchId: dto.branch_id,
    userName: dto.user_name,
    shortName: dto.short_name,
    userCode: dto.user_code,
    userMob: dto.user_mob,
    userEmail: dto.user_email,
    isActive: dto.is_active,
    loginStatus: dto.login_status,
    orgDisplayName: dto.org_disp_nm,
    legalName: dto.legal_name,
    orgSchema: dto.org_schema,
    branchCode: dto.branch_code,
    branchName: dto.branch_name,
    isHead: dto.is_head,
  };
}

export function mapLoginDataToSession(dto: LoginDataDto): {
  token: string;
  tokenType: string;
  expiresAt: number;
  orgSchema: string;
  user: AuthUser;
} {
  return {
    token: dto.token,
    tokenType: dto.token_type,
    expiresAt: Date.now() + dto.expires_in * 1000,
    orgSchema: dto.org_schema,
    user: mapAuthUserDto(dto.user),
  };
}

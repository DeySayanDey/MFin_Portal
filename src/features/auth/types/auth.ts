import { z } from "zod";

/** Documented login request body from apilist.txt */
export const loginRequestSchema = z.object({
  login: z.string().trim().min(1),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

/** Laravel login `data.user` DTO (snake_case, documented fields only). */
export type AuthUserDto = {
  user_id: number;
  org_id: number;
  branch_id: number;
  user_name: string;
  short_name: string;
  user_code: string;
  user_mob: string;
  user_email: string;
  is_active: boolean;
  login_status: string;
  org_disp_nm: string;
  legal_name: string;
  org_schema: string;
  branch_code: string;
  branch_name: string;
  is_head: boolean;
};

/** Laravel login `data` DTO (documented fields only). */
export type LoginDataDto = {
  token: string;
  token_type: "Bearer" | string;
  expires_in: number;
  org_schema: string;
  user: AuthUserDto;
};

/** Frontend domain user model. */
export type AuthUser = {
  userId: number;
  orgId: number;
  branchId: number;
  userName: string;
  shortName: string;
  userCode: string;
  userMob: string;
  userEmail: string;
  isActive: boolean;
  loginStatus: string;
  orgDisplayName: string;
  legalName: string;
  orgSchema: string;
  branchCode: string;
  branchName: string;
  isHead: boolean;
};

export type AuthSession = {
  token: string;
  tokenType: string;
  expiresAt: number;
  orgSchema: string;
  user: AuthUser;
};

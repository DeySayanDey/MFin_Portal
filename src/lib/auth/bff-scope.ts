import "server-only";

import type { AuthUser } from "@/features/auth/types/auth";
import { getSessionUser } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/errors";

function forbidden(message = "Forbidden"): ApiError {
  return new ApiError({
    message,
    status: 403,
    code: "FORBIDDEN",
  });
}

function unauthorized(): ApiError {
  return new ApiError({
    message: "Unauthorized",
    status: 401,
    code: "UNAUTHORIZED",
  });
}

/** Require an authenticated session user for BFF handlers. */
export async function requireSessionUser(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) throw unauthorized();
  return user;
}

/** Head-office (is_head) gate for sensitive master/security mutations. */
export function assertHeadOffice(user: AuthUser): void {
  if (!user.isHead) throw forbidden();
}

/**
 * Bind list/filter `branch_id` to the session.
 * Non–head-office users may only query their own branch.
 */
export function resolveBranchFilter(
  user: AuthUser,
  requested: number | undefined,
): number | undefined {
  if (user.isHead) return requested;

  if (requested != null && requested !== user.branchId) {
    throw forbidden();
  }
  return user.branchId;
}

/**
 * Bind audit `user_id` filter to the session.
 * Non–head-office users may only query their own audits.
 */
export function resolveAuditUserFilter(
  user: AuthUser,
  requested: number | undefined,
): number | undefined {
  if (user.isHead) return requested;

  if (requested != null && requested !== user.userId) {
    throw forbidden();
  }
  return user.userId;
}

/**
 * Force staff create/update branch to the caller's branch when not head office.
 */
export function applyStaffBranchScope(
  user: AuthUser,
  body: Record<string, unknown>,
): Record<string, unknown> {
  if (user.isHead) return body;

  const requested =
    typeof body.branchId === "number"
      ? body.branchId
      : typeof body.branch_id === "number"
        ? body.branch_id
        : undefined;

  if (requested != null && requested !== user.branchId) {
    throw forbidden();
  }

  return {
    ...body,
    branchId: user.branchId,
  };
}

/** Non–head-office users may only mutate their own branch row. */
export function assertBranchMutationScope(
  user: AuthUser,
  branchId: number | undefined,
  mode: "create" | "update",
): void {
  if (user.isHead) return;
  if (mode === "create") throw forbidden();
  if (branchId == null || branchId !== user.branchId) throw forbidden();
}

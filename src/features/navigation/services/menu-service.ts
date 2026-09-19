import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { getAccessToken } from "@/lib/auth/session";
import { clearAuthSession } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/errors";
import { mapMenuTreeNode } from "@/features/navigation/mappers/menu-mapper";
import type { MenuTreeNode, MenuTreeNodeDto } from "@/features/navigation/types/menu";

export type FetchMenuTreeParams = {
  status?: number;
  roleId?: number;
};

export async function fetchMenuTree(
  params: FetchMenuTreeParams = {},
): Promise<MenuTreeNode[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError({
      message: "Unauthorized. Bearer token required.",
      status: 401,
      code: "UNAUTHORIZED",
    });
  }

  try {
    const data = await api.get<MenuTreeNodeDto[]>(endpoints.menuTree, {
      accessToken: token,
      searchParams: {
        status: params.status ?? 1,
        role_id: params.roleId,
      },
      expectEnvelope: true,
    });

    return (data ?? []).map(mapMenuTreeNode);
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      await clearAuthSession();
    }
    throw error;
  }
}

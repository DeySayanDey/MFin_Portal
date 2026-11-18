import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import { mapMenuTreeNode } from "@/features/navigation/mappers/menu-mapper";
import {
  menuTreeChildDtoSchema,
  menuTreeNodeDtoSchema,
} from "@/features/navigation/schemas/menu.schema";
import type {
  MenuTreeChildDto,
  MenuTreeNode,
  MenuTreeNodeDto,
} from "@/features/navigation/types/menu";

export type FetchMenuTreeParams = {
  status?: number;
  /** Forwarded to Laravel as `role_id` (must be one of the token user's roles). */
  roleId?: number;
  /** Forwarded to Laravel as `lang` (EN|BN|HI|OR). */
  lang?: string;
};

function parseMenuNode(row: unknown): MenuTreeNode | null {
  const parsed = menuTreeNodeDtoSchema.safeParse(row);
  if (!parsed.success) return null;

  const children: MenuTreeChildDto[] = [];
  for (const child of parsed.data.children) {
    const childParsed = menuTreeChildDtoSchema.safeParse(child);
    if (childParsed.success) children.push(childParsed.data);
  }

  const dto: MenuTreeNodeDto = {
    menu_sl: parsed.data.menu_sl,
    menu_id: parsed.data.menu_id,
    menu_name: parsed.data.menu_name,
    menu_name_default: parsed.data.menu_name_default,
    icon: parsed.data.icon,
    route: parsed.data.route,
    status: parsed.data.status,
    lang_code: parsed.data.lang_code,
    children,
  };

  return mapMenuTreeNode(dto);
}

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
    // Laravel: GET /api/MenuTree?status=1&role_id=…&lang=HI
    const data = await api.get<unknown[]>(endpoints.menuTree, {
      accessToken: token,
      searchParams: {
        status: params.status ?? 1,
        role_id: params.roleId,
        lang: params.lang,
      },
      expectEnvelope: true,
    });

    const rows = Array.isArray(data) ? data : [];
    return rows.flatMap((row) => {
      const node = parseMenuNode(row);
      return node ? [node] : [];
    });
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      await clearAuthSession();
    }
    throw error;
  }
}

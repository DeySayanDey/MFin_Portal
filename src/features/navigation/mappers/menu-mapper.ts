import type {
  MenuTreeChild,
  MenuTreeChildDto,
  MenuTreeNode,
  MenuTreeNodeDto,
} from "@/features/navigation/types/menu";
import { menuEnglishName } from "@/features/navigation/utils/menu-label";
import { resolveMenuRoute } from "@/features/navigation/utils/menu-route-fallbacks";

function mapChild(dto: MenuTreeChildDto): MenuTreeChild {
  const name = dto.submenu_name;
  return {
    id: dto.menu_sl,
    menuId: dto.menu_id,
    submenuId: dto.submenu_id,
    name,
    nameDefault: menuEnglishName(name, dto.submenu_name_default),
    icon: dto.icon,
    route: resolveMenuRoute({
      route: dto.route,
      menuId: dto.menu_id,
      submenuId: dto.submenu_id,
      name: dto.submenu_name_default || name,
    }),
    status: dto.status,
  };
}

export function mapMenuTreeNode(dto: MenuTreeNodeDto): MenuTreeNode {
  const name = dto.menu_name;
  return {
    id: dto.menu_sl,
    menuId: dto.menu_id,
    name,
    nameDefault: menuEnglishName(name, dto.menu_name_default),
    icon: dto.icon,
    route: resolveMenuRoute({
      route: dto.route,
      menuId: dto.menu_id,
      name: dto.menu_name_default || name,
    }),
    status: dto.status,
    children: (dto.children ?? []).map(mapChild),
  };
}

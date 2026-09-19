import type {
  MenuTreeChildDto,
  MenuTreeNode,
  MenuTreeNodeDto,
} from "@/features/navigation/types/menu";
import { sanitizeMenuRoute } from "@/features/navigation/utils/safe-menu-route";

function mapChild(dto: MenuTreeChildDto) {
  return {
    id: dto.menu_sl,
    menuId: dto.menu_id,
    submenuId: dto.submenu_id,
    name: dto.submenu_name,
    icon: dto.icon,
    route: sanitizeMenuRoute(dto.route),
    status: dto.status,
  };
}

export function mapMenuTreeNode(dto: MenuTreeNodeDto): MenuTreeNode {
  return {
    id: dto.menu_sl,
    menuId: dto.menu_id,
    name: dto.menu_name,
    icon: dto.icon,
    route: sanitizeMenuRoute(dto.route),
    status: dto.status,
    children: (dto.children ?? []).map(mapChild),
  };
}

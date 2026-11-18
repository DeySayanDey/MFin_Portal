/**
 * MenuTree DTO shapes — GET /api/MenuTree (documented fields only).
 */

export type MenuTreeChildDto = {
  menu_sl: number;
  menu_id: number;
  submenu_id: number;
  submenu_name: string;
  /** English label from `mst_menus`. Omitted on older payloads. */
  submenu_name_default?: string | null;
  icon: string | null;
  route: string | null;
  status: number;
  lang_code?: string | null;
};

export type MenuTreeNodeDto = {
  menu_sl: number;
  menu_id: number;
  menu_name: string;
  /** English label from `mst_menus`. Omitted on older payloads. */
  menu_name_default?: string | null;
  icon: string | null;
  route: string | null;
  status: number;
  lang_code?: string | null;
  children: MenuTreeChildDto[];
};

export type MenuTreeChild = {
  id: number;
  menuId: number;
  submenuId: number;
  /** Label for the requested language (English when `lang` is EN). */
  name: string;
  /** English default, only when it differs from `name`. */
  nameDefault: string | null;
  icon: string | null;
  route: string | null;
  status: number;
};

export type MenuTreeNode = {
  id: number;
  menuId: number;
  /** Label for the requested language (English when `lang` is EN). */
  name: string;
  /** English default, only when it differs from `name`. */
  nameDefault: string | null;
  icon: string | null;
  route: string | null;
  status: number;
  children: MenuTreeChild[];
};

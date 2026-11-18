/**
 * Role Menu permissions — Laravel RoleMenuGet / RoleMenuAssign.
 */

export type RoleMenuRoleDto = {
  role_id: number;
  role_name: string;
  description?: string | null;
  is_admin: boolean;
  status: number;
};

export type RoleMenuItemDto = {
  menu_sl: number;
  menu_id: number;
  menu_name?: string | null;
  submenu_id?: number | null;
  submenu_name?: string | null;
  icon?: string | null;
  route?: string | null;
  menu_status: number;
  assigned: boolean;
  allow_create: boolean;
  allow_read: boolean;
  allow_edit: boolean;
  allow_del: boolean;
  allow_approve: boolean;
  allow_reverse: boolean;
  allow_print: boolean;
  grant_status?: number | null;
  role_menu_id?: number | null;
};

export type RoleMenuPayloadDto = {
  role: RoleMenuRoleDto;
  assigned_count: number;
  menus: RoleMenuItemDto[];
};

export type RoleMenuRole = {
  roleId: number;
  roleName: string;
  description: string | null;
  isAdmin: boolean;
  status: number;
};

export type RoleMenuItem = {
  menuSl: number;
  menuId: number;
  menuName: string | null;
  submenuId: number | null;
  submenuName: string | null;
  icon: string | null;
  route: string | null;
  menuStatus: number;
  assigned: boolean;
  allowCreate: boolean;
  allowRead: boolean;
  allowEdit: boolean;
  allowDel: boolean;
  allowApprove: boolean;
  allowReverse: boolean;
  allowPrint: boolean;
  grantStatus: number | null;
  roleMenuId: number | null;
};

export type RoleMenuMatrix = {
  role: RoleMenuRole;
  assignedCount: number;
  menus: RoleMenuItem[];
};

export type RoleMenuGetQuery = {
  roleId: number;
  /** Menu status filter; omit to use Laravel default (active). */
  status?: number;
  assignedOnly?: boolean;
};

export type RoleMenuGrantInput = {
  menuSl: number;
  allowCreate?: boolean;
  allowRead?: boolean;
  allowEdit?: boolean;
  allowDel?: boolean;
  allowApprove?: boolean;
  allowReverse?: boolean;
  allowPrint?: boolean;
  status?: number;
};

export type RoleMenuAssignInput = {
  roleId: number;
  menus: RoleMenuGrantInput[];
};

export type RoleMenuGrantDto = {
  menu_sl: number;
  allow_create?: boolean;
  allow_read?: boolean;
  allow_edit?: boolean;
  allow_del?: boolean;
  allow_approve?: boolean;
  allow_reverse?: boolean;
  allow_print?: boolean;
  status?: number;
};

export type RoleMenuAssignDto = {
  role_id: number;
  menus: RoleMenuGrantDto[];
};

/** Permission flags editable in the matrix (excludes `assigned`). */
export type RoleMenuPermissionKey =
  | "allowCreate"
  | "allowRead"
  | "allowEdit"
  | "allowDel"
  | "allowApprove"
  | "allowReverse"
  | "allowPrint";

export const ROLE_MENU_PERMISSION_KEYS: RoleMenuPermissionKey[] = [
  "allowCreate",
  "allowRead",
  "allowEdit",
  "allowDel",
  "allowApprove",
  "allowReverse",
  "allowPrint",
];

export const ROLE_MENU_DEFAULT_GRANTS: Record<RoleMenuPermissionKey, boolean> =
  {
    allowCreate: true,
    allowRead: true,
    allowEdit: true,
    allowDel: true,
    allowApprove: false,
    allowReverse: false,
    allowPrint: true,
  };

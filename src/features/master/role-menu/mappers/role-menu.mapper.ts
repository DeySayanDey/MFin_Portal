import type {
  RoleMenuAssignDto,
  RoleMenuAssignInput,
  RoleMenuGrantDto,
  RoleMenuGrantInput,
  RoleMenuItem,
  RoleMenuItemDto,
  RoleMenuMatrix,
  RoleMenuPayloadDto,
  RoleMenuRole,
  RoleMenuRoleDto,
} from "@/features/master/role-menu/types/role-menu.types";

export function mapRoleMenuRoleDto(dto: RoleMenuRoleDto): RoleMenuRole {
  return {
    roleId: dto.role_id,
    roleName: dto.role_name,
    description: dto.description ?? null,
    isAdmin: dto.is_admin === true,
    status: dto.status,
  };
}

export function mapRoleMenuItemDto(dto: RoleMenuItemDto): RoleMenuItem {
  const rawSubmenuId = dto.submenu_id ?? null;
  /** API may send `0` for parent/main-menu rows (no submenu). */
  const submenuId =
    rawSubmenuId == null || rawSubmenuId === 0 ? null : rawSubmenuId;

  return {
    menuSl: dto.menu_sl,
    menuId: dto.menu_id,
    menuName: dto.menu_name ?? null,
    submenuId,
    submenuName: dto.submenu_name ?? null,
    icon: dto.icon ?? null,
    route: dto.route ?? null,
    menuStatus: dto.menu_status,
    assigned: dto.assigned === true,
    allowCreate: dto.allow_create === true,
    allowRead: dto.allow_read === true,
    allowEdit: dto.allow_edit === true,
    allowDel: dto.allow_del === true,
    allowApprove: dto.allow_approve === true,
    allowReverse: dto.allow_reverse === true,
    allowPrint: dto.allow_print === true,
    grantStatus: dto.grant_status ?? null,
    roleMenuId: dto.role_menu_id ?? null,
  };
}

export function mapRoleMenuPayloadDto(
  dto: RoleMenuPayloadDto,
): RoleMenuMatrix {
  return {
    role: mapRoleMenuRoleDto(dto.role),
    assignedCount: dto.assigned_count,
    menus: dto.menus.map(mapRoleMenuItemDto),
  };
}

function mapGrantToDto(input: RoleMenuGrantInput): RoleMenuGrantDto {
  const dto: RoleMenuGrantDto = {
    menu_sl: input.menuSl,
  };
  if (input.allowCreate !== undefined) dto.allow_create = input.allowCreate;
  if (input.allowRead !== undefined) dto.allow_read = input.allowRead;
  if (input.allowEdit !== undefined) dto.allow_edit = input.allowEdit;
  if (input.allowDel !== undefined) dto.allow_del = input.allowDel;
  if (input.allowApprove !== undefined) dto.allow_approve = input.allowApprove;
  if (input.allowReverse !== undefined) dto.allow_reverse = input.allowReverse;
  if (input.allowPrint !== undefined) dto.allow_print = input.allowPrint;
  if (input.status !== undefined) dto.status = input.status;
  return dto;
}

export function mapRoleMenuAssignToDto(
  input: RoleMenuAssignInput,
): RoleMenuAssignDto {
  return {
    role_id: input.roleId,
    menus: input.menus.map(mapGrantToDto),
  };
}

/** Build assign payload from current matrix draft (assigned rows only). */
export function toRoleMenuAssignInput(
  roleId: number,
  menus: RoleMenuItem[],
): RoleMenuAssignInput {
  return {
    roleId,
    menus: menus
      .filter((menu) => menu.assigned)
      .map((menu) => ({
        menuSl: menu.menuSl,
        allowCreate: menu.allowCreate,
        allowRead: menu.allowRead,
        allowEdit: menu.allowEdit,
        allowDel: menu.allowDel,
        allowApprove: menu.allowApprove,
        allowReverse: menu.allowReverse,
        allowPrint: menu.allowPrint,
        status: 1,
      })),
  };
}

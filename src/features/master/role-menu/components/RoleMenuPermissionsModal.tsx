"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronRight, Save, Search } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { Badge } from "@/components/ui/Badge";
import {
  fetchRoleMenu,
  isRoleMenuClientError,
  saveRoleMenu,
} from "@/features/master/role-menu/services/role-menu-client";
import { toRoleMenuAssignInput } from "@/features/master/role-menu/mappers/role-menu.mapper";
import {
  ROLE_MENU_DEFAULT_GRANTS,
  ROLE_MENU_PERMISSION_KEYS,
  type RoleMenuItem,
  type RoleMenuMatrix,
  type RoleMenuPermissionKey,
} from "@/features/master/role-menu/types/role-menu.types";
import type { Role } from "@/features/master/roles/types/role.types";

type RoleMenuPermissionsModalProps = {
  open: boolean;
  role: Role | null;
  onClose: () => void;
  onSaved: () => void;
};

type MenuGroup = {
  menuId: number;
  parent: RoleMenuItem | null;
  children: RoleMenuItem[];
  title: string;
};

function isParentRow(menu: RoleMenuItem): boolean {
  return menu.submenuId == null;
}

function menuLabel(menu: RoleMenuItem): string {
  if (isParentRow(menu)) {
    return (
      menu.menuName?.trim() ||
      menu.submenuName?.trim() ||
      `Menu #${menu.menuId}`
    );
  }
  return (
    menu.submenuName?.trim() ||
    menu.menuName?.trim() ||
    `Item #${menu.menuSl}`
  );
}

function groupTitle(group: {
  menuId: number;
  parent: RoleMenuItem | null;
  children: RoleMenuItem[];
}): string {
  if (group.parent) return menuLabel(group.parent);
  const fromChild = group.children.find((child) => child.menuName?.trim());
  if (fromChild?.menuName?.trim()) return fromChild.menuName.trim();
  return `Menu #${group.menuId}`;
}

function groupMenus(menus: RoleMenuItem[]): MenuGroup[] {
  const byId = new Map<
    number,
    { menuId: number; parent: RoleMenuItem | null; children: RoleMenuItem[] }
  >();

  for (const menu of menus) {
    let group = byId.get(menu.menuId);
    if (!group) {
      group = { menuId: menu.menuId, parent: null, children: [] };
      byId.set(menu.menuId, group);
    }
    if (isParentRow(menu)) {
      group.parent = menu;
    } else {
      group.children.push(menu);
    }
  }

  for (const group of byId.values()) {
    group.children.sort((a, b) => a.menuSl - b.menuSl);
  }

  return Array.from(byId.values())
    .map((group) => ({
      ...group,
      title: groupTitle(group),
    }))
    .sort((a, b) => {
      const aSl = a.parent?.menuSl ?? a.children[0]?.menuSl ?? a.menuId;
      const bSl = b.parent?.menuSl ?? b.children[0]?.menuSl ?? b.menuId;
      return aSl - bSl;
    });
}

function applyDefaults(menu: RoleMenuItem, assigned: boolean): RoleMenuItem {
  if (!assigned) {
    return {
      ...menu,
      assigned: false,
      allowCreate: false,
      allowRead: false,
      allowEdit: false,
      allowDel: false,
      allowApprove: false,
      allowReverse: false,
      allowPrint: false,
    };
  }
  return {
    ...menu,
    assigned: true,
    ...ROLE_MENU_DEFAULT_GRANTS,
  };
}

function MatrixCheck({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <input autoComplete="off"
      type="checkbox"
      aria-label={label}
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
      className="h-4 w-4 rounded border-border text-brand focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}

function PermissionCells({
  menu,
  headers,
  saving,
  onPermission,
}: {
  menu: RoleMenuItem;
  headers: { key: RoleMenuPermissionKey; label: string }[];
  saving: boolean;
  onPermission: (
    menu: RoleMenuItem,
    key: RoleMenuPermissionKey,
    value: boolean,
  ) => void;
}) {
  return (
    <>
      {ROLE_MENU_PERMISSION_KEYS.map((key) => (
        <td key={key} className="px-2 py-2.5 text-center align-middle">
          <MatrixCheck
            label={headers.find((h) => h.key === key)?.label ?? key}
            checked={menu[key]}
            disabled={saving || !menu.assigned}
            onChange={(checked) => onPermission(menu, key, checked)}
          />
        </td>
      ))}
    </>
  );
}

export function RoleMenuPermissionsModal({
  open,
  role,
  onClose,
  onSaved,
}: RoleMenuPermissionsModalProps) {
  const t = useTranslations("master.roles.menuPermissions");
  const tErrors = useTranslations("errors");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useToastText();
  const [search, setSearch] = useState("");
  const [matrix, setMatrix] = useState<RoleMenuMatrix | null>(null);
  const [draft, setDraft] = useState<RoleMenuItem[]>([]);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!open || !role) return;
    let cancelled = false;
    const roleId = role.id;

    async function load() {
      setLoading(true);
      setErrorMessage(null);
      setSearch("");
      setCollapsed({});
      setMatrix(null);
      setDraft([]);
      try {
        const result = await fetchRoleMenu({ roleId });
        if (cancelled) return;
        setMatrix(result);
        setDraft(result.menus);
      } catch (err) {
        if (cancelled) return;
        if (isRoleMenuClientError(err) && err.status === 401) {
          router.replace("/login");
          router.refresh();
          return;
        }
        setErrorMessage(
          isRoleMenuClientError(err) ? err.message : tErrors("generic"),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, role, router, tErrors]);

  const assignedCount = useMemo(
    () => draft.filter((menu) => menu.assigned).length,
    [draft],
  );

  const allGroups = useMemo(() => groupMenus(draft), [draft]);

  const groups = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return allGroups;

    return allGroups
      .map((group) => {
        const parentMatch =
          group.title.toLowerCase().includes(needle) ||
          (group.parent?.route ?? "").toLowerCase().includes(needle);
        const matchedChildren = group.children.filter((child) => {
          const label = menuLabel(child).toLowerCase();
          const route = (child.route ?? "").toLowerCase();
          return label.includes(needle) || route.includes(needle);
        });

        if (parentMatch) return group;
        if (matchedChildren.length === 0) return null;
        return { ...group, children: matchedChildren };
      })
      .filter((group): group is MenuGroup => group != null);
  }, [allGroups, search]);

  function updateMenu(
    menuSl: number,
    updater: (menu: RoleMenuItem) => RoleMenuItem,
  ) {
    setDraft((prev) =>
      prev.map((menu) => (menu.menuSl === menuSl ? updater(menu) : menu)),
    );
  }

  function setAssigned(menu: RoleMenuItem, assigned: boolean) {
    setDraft((prev) => {
      let next = prev.map((row) =>
        row.menuSl === menu.menuSl ? applyDefaults(row, assigned) : row,
      );

      if (assigned && !isParentRow(menu)) {
        next = next.map((row) => {
          if (row.menuId !== menu.menuId || !isParentRow(row)) return row;
          if (row.assigned) return row;
          return applyDefaults(row, true);
        });
      }

      if (!assigned && isParentRow(menu)) {
        next = next.map((row) => {
          if (row.menuId !== menu.menuId || isParentRow(row)) return row;
          return applyDefaults(row, false);
        });
      }

      return next;
    });
  }

  function setGroupAssigned(group: MenuGroup, assigned: boolean) {
    const targets = new Set<number>([
      ...(group.parent ? [group.parent.menuSl] : []),
      ...group.children.map((child) => child.menuSl),
    ]);
    setDraft((prev) =>
      prev.map((row) =>
        targets.has(row.menuSl) ? applyDefaults(row, assigned) : row,
      ),
    );
  }

  function setPermission(
    menu: RoleMenuItem,
    key: RoleMenuPermissionKey,
    value: boolean,
  ) {
    updateMenu(menu.menuSl, (row) => {
      if (value && !row.assigned) {
        return { ...applyDefaults(row, true), [key]: true };
      }
      return { ...row, [key]: value };
    });
  }

  function selectAllVisible() {
    const visibleSl = new Set(
      groups.flatMap((group) => {
        const rows = [
          ...(group.parent ? [group.parent] : []),
          ...group.children,
        ];
        return rows.map((row) => row.menuSl);
      }),
    );
    setDraft((prev) =>
      prev.map((menu) =>
        visibleSl.has(menu.menuSl) ? applyDefaults(menu, true) : menu,
      ),
    );
  }

  function clearAllVisible() {
    const visibleSl = new Set(
      groups.flatMap((group) => {
        const rows = [
          ...(group.parent ? [group.parent] : []),
          ...group.children,
        ];
        return rows.map((row) => row.menuSl);
      }),
    );
    setDraft((prev) =>
      prev.map((menu) =>
        visibleSl.has(menu.menuSl) ? applyDefaults(menu, false) : menu,
      ),
    );
  }

  function toggleCollapsed(menuId: number) {
    setCollapsed((prev) => ({ ...prev, [menuId]: !prev[menuId] }));
  }

  async function handleSave() {
    if (!role) return;
    setSaving(true);
    setErrorMessage(null);
    try {
      const payload = toRoleMenuAssignInput(role.id, draft);
      const result = await saveRoleMenu(payload);
      setMatrix(result);
      setDraft(result.menus);
      onSaved();
      onClose();
    } catch (err) {
      if (isRoleMenuClientError(err) && err.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }
      setSaveError(
        isRoleMenuClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setSaving(false);
    }
  }

  const permissionHeaders: { key: RoleMenuPermissionKey; label: string }[] = [
    { key: "allowCreate", label: t("perms.create") },
    { key: "allowRead", label: t("perms.read") },
    { key: "allowEdit", label: t("perms.edit") },
    { key: "allowDel", label: t("perms.delete") },
    { key: "allowApprove", label: t("perms.approve") },
    { key: "allowReverse", label: t("perms.reverse") },
    { key: "allowPrint", label: t("perms.print") },
  ];

  return (
    <Modal
      open={open}
      onClose={() => {
        if (saving) return;
        onClose();
      }}
      title={t("title")}
      subtitle={
        role ? t("subtitle", { roleName: role.roleName }) : undefined
      }
      size="xl"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            icon={Save}
            disabled={saving || loading || !matrix}
            onClick={() => void handleSave()}
          >
            {saving ? t("saving") : t("save")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <PageToast message={saveError} tone="error" />
        {errorMessage ? <Alert tone="error">{errorMessage}</Alert> : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="relative block min-w-0 flex-1 sm:max-w-md">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              {t("search")}
            </span>
            <span className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("searchPlaceholder")}
                className="pl-9"
                disabled={loading}
              />
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info" caps={false}>
              {t("assignedCount", { count: assignedCount })}
            </Badge>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={loading || groups.length === 0}
              onClick={selectAllVisible}
            >
              {t("selectAll")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={loading || groups.length === 0}
              onClick={clearAllVisible}
            >
              {t("clearAll")}
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="rounded-xl border border-border bg-surface-muted px-4 py-8 text-center text-sm text-muted">
            {t("loading")}
          </p>
        ) : !matrix ? (
          <p className="rounded-xl border border-border bg-surface-muted px-4 py-8 text-center text-sm text-muted">
            {errorMessage ?? t("empty")}
          </p>
        ) : groups.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface-muted px-4 py-8 text-center text-sm text-muted">
            {t("empty")}
          </p>
        ) : (
          <div className="max-h-[min(60vh,34rem)] space-y-3 overflow-auto pe-1">
            {groups.map((group) => {
              const isOpen = !collapsed[group.menuId];
              const groupRows = [
                ...(group.parent ? [group.parent] : []),
                ...group.children,
              ];
              const grantedInGroup = groupRows.filter((row) => row.assigned)
                .length;
              const allGranted =
                groupRows.length > 0 && grantedInGroup === groupRows.length;
              const someGranted = grantedInGroup > 0 && !allGranted;

              return (
                <section
                  key={group.menuId}
                  className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-card)]"
                >
                  <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-muted/80 px-3 py-2.5 sm:px-4">
                    <button
                      type="button"
                      className="inline-flex min-w-0 flex-1 items-center gap-2 text-start"
                      onClick={() => toggleCollapsed(group.menuId)}
                      aria-expanded={isOpen}
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
                      )}
                      <span className="truncate text-sm font-semibold text-slate-900">
                        {group.title}
                      </span>
                      <Badge tone="neutral" caps={false}>
                        {t("submenuCount", { count: group.children.length })}
                      </Badge>
                      <Badge
                        tone={allGranted ? "success" : someGranted ? "info" : "neutral"}
                        caps={false}
                      >
                        {t("groupGranted", {
                          granted: grantedInGroup,
                          total: groupRows.length,
                        })}
                      </Badge>
                    </button>

                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-slate-700">
                      <input autoComplete="off"
                        type="checkbox"
                        checked={allGranted}
                        ref={(el) => {
                          if (el) el.indeterminate = someGranted;
                        }}
                        disabled={saving || groupRows.length === 0}
                        onChange={(event) =>
                          setGroupAssigned(group, event.target.checked)
                        }
                        className="h-4 w-4 rounded border-border text-brand focus:ring-brand/30"
                      />
                      {t("grantGroup")}
                    </label>
                  </div>

                  {isOpen ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-[880px] w-full border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-border text-left text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                            <th className="px-3 py-2 sm:px-4">
                              {t("columns.menu")}
                            </th>
                            <th className="px-2 py-2 text-center">
                              {t("columns.grant")}
                            </th>
                            {permissionHeaders.map((header) => (
                              <th
                                key={header.key}
                                className="px-2 py-2 text-center whitespace-nowrap"
                              >
                                {header.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {group.parent ? (
                            <tr className="border-b border-border/70 bg-slate-50/80">
                              <td className="px-3 py-2.5 align-middle sm:px-4">
                                <div>
                                  <p className="font-semibold text-slate-800">
                                    {menuLabel(group.parent)}
                                  </p>
                                  <p className="text-[11px] font-medium text-slate-500">
                                    {t("mainMenu")}
                                    {group.parent.route
                                      ? ` · ${group.parent.route}`
                                      : ""}
                                  </p>
                                </div>
                              </td>
                              <td className="px-2 py-2.5 text-center align-middle">
                                <MatrixCheck
                                  label={t("columns.grant")}
                                  checked={group.parent.assigned}
                                  disabled={saving}
                                  onChange={(checked) =>
                                    setAssigned(group.parent!, checked)
                                  }
                                />
                              </td>
                              <PermissionCells
                                menu={group.parent}
                                headers={permissionHeaders}
                                saving={saving}
                                onPermission={setPermission}
                              />
                            </tr>
                          ) : null}

                          {group.children.map((menu) => (
                            <tr
                              key={menu.menuSl}
                              className="border-b border-border/60 last:border-b-0"
                            >
                              <td className="px-3 py-2.5 align-middle sm:px-4">
                                <div className="flex items-start gap-2 ps-1 sm:ps-4">
                                  <span
                                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300"
                                    aria-hidden
                                  />
                                  <div className="min-w-0">
                                    <p className="font-medium text-slate-800">
                                      {menuLabel(menu)}
                                    </p>
                                    {menu.route ? (
                                      <p className="font-mono text-[11px] text-slate-500">
                                        {menu.route}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                              </td>
                              <td className="px-2 py-2.5 text-center align-middle">
                                <MatrixCheck
                                  label={t("columns.grant")}
                                  checked={menu.assigned}
                                  disabled={saving}
                                  onChange={(checked) =>
                                    setAssigned(menu, checked)
                                  }
                                />
                              </td>
                              <PermissionCells
                                menu={menu}
                                headers={permissionHeaders}
                                saving={saving}
                                onPermission={setPermission}
                              />
                            </tr>
                          ))}

                          {!group.parent && group.children.length === 0 ? (
                            <tr>
                              <td
                                colSpan={2 + ROLE_MENU_PERMISSION_KEYS.length}
                                className="px-4 py-6 text-center text-sm text-muted"
                              >
                                {t("empty")}
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

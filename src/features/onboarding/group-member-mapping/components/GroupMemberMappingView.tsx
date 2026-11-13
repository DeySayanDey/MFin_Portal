"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRightLeft, History, Pencil, Plus, UserMinus, UsersRound } from "lucide-react";
import { ModulePageShell } from "@/components/shared/ModulePageShell";
import { EmptyState } from "@/components/shared/EmptyState";
import { DataTable } from "@/components/shared/DataTable/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { showToast } from "@/components/ui/toast";
import { onboardingModulePages } from "@/lib/modules/module.types";
import { getStoredAuthUser } from "@/features/auth/utils/auth-user-storage";
import { fetchBranchList } from "@/features/master/branch/services/branch-client";
import { fetchCenterList } from "@/features/master/center/services/center-client";
import { fetchGroups } from "@/features/onboarding/group-management/services/group-client";
import type { Group } from "@/features/onboarding/group-management/types/group.types";
import {
  AssignMembersModal,
  EditMembershipModal,
  ExitMemberModal,
  MoveMemberModal,
} from "@/features/onboarding/group-member-mapping/components/GroupMemberDialogs";
import {
  fetchMemberGroupCheck,
  fetchMemberships,
  isMemberGroupClientError,
} from "@/features/onboarding/group-member-mapping/services/member-group-client";
import type { GroupMembership } from "@/features/onboarding/group-member-mapping/types/member-group.types";
import {
  groupCapacity,
  isBelowMinimum,
  normalizeRole,
} from "@/features/onboarding/group-member-mapping/lib/group-rules";
import { MIN_GROUP_MEMBERS } from "@/features/onboarding/group-member-mapping/types/member-group.types";

type DialogKind = "assign" | "move" | "edit" | "exit" | null;

export function GroupMemberMappingView() {
  const t = useTranslations("onboarding.groupMemberMapping");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [toast, setToast] = useToastText();
  const [user] = useState(() => getStoredAuthUser());
  const branchBound = Boolean(user && !user.isHead && user.branchId);

  const [branchId, setBranchId] = useState(branchBound ? String(user?.branchId ?? "") : "");
  const [centerId, setCenterId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [branches, setBranches] = useState<{ value: string; label: string }[]>([]);
  const [centers, setCenters] = useState<{ value: string; label: string }[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [history, setHistory] = useState(false);
  const [roster, setRoster] = useState<GroupMembership[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [activeRow, setActiveRow] = useState<GroupMembership | null>(null);
  const [loanMessage, setLoanMessage] = useState("");

  const selected = groups.find((group) => group.groupId === selectedId) ?? null;

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedKeyword(keyword.trim()), 300);
    return () => window.clearTimeout(handle);
  }, [keyword]);

  useEffect(() => {
    if (branchBound) return;
    fetchBranchList({ isActive: 1, perPage: 200 })
      .then((result) =>
        setBranches(result.items.map((branch) => ({ value: String(branch.branchId), label: branch.branchName }))),
      )
      .catch(() => setBranches([]));
  }, [branchBound]);

  useEffect(() => {
    if (!branchId) {
      setCenters([]);
      return;
    }
    fetchCenterList({ branchId: Number(branchId), isActive: 1, perPage: 200 })
      .then((result) =>
        setCenters(result.items.map((center) => ({ value: String(center.centerId), label: center.centerName }))),
      )
      .catch(() => setCenters([]));
  }, [branchId]);

  useEffect(() => {
    const controller = new AbortController();
    setGroupsLoading(true);
    fetchGroups({
      branchId: branchId ? Number(branchId) : undefined,
      centerId: centerId ? Number(centerId) : undefined,
      statusCd: 1,
      keyword: debouncedKeyword || undefined,
      page: 1,
      perPage: 200,
    })
      .then((result) => {
        if (!controller.signal.aborted) setGroups(result.items);
      })
      .catch(() => {
        if (!controller.signal.aborted) setGroups([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setGroupsLoading(false);
      });
    return () => controller.abort();
  }, [branchId, centerId, debouncedKeyword, reloadKey]);

  useEffect(() => {
    const fromQuery = Number(searchParams.get("group_id") ?? searchParams.get("groupId") ?? "");
    if (Number.isFinite(fromQuery) && fromQuery > 0) setSelectedId(fromQuery);
  }, [searchParams]);

  useEffect(() => {
    const memberId = Number(searchParams.get("member_id") ?? searchParams.get("memberId") ?? "");
    if (!Number.isFinite(memberId) || memberId <= 0) return;
    fetchMemberGroupCheck(memberId)
      .then((check) => {
        if (check.groupId) setSelectedId(check.groupId);
      })
      .catch(() => undefined);
  }, [searchParams]);

  useEffect(() => {
    if (!selectedId) {
      setRoster([]);
      return;
    }
    const controller = new AbortController();
    setRosterLoading(true);
    setRosterError(false);
    fetchMemberships(
      {
        groupId: selectedId,
        isActive: !history,
        page: 1,
        perPage: 50,
        branchId: branchId ? Number(branchId) : undefined,
      },
      controller.signal,
    )
      .then((result) => {
        if (!controller.signal.aborted) setRoster(result.items);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setRoster([]);
          setRosterError(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setRosterLoading(false);
      });
    return () => controller.abort();
  }, [selectedId, history, branchId, reloadKey]);

  function selectGroup(groupId: number) {
    setSelectedId(groupId);
    setHistory(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("groupId");
    params.delete("memberId");
    params.set("group_id", String(groupId));
    router.replace(`/onboarding/group-member-mapping?${params.toString()}`);
  }

  async function openChange(kind: "move" | "exit", row: GroupMembership) {
    try {
      const check = await fetchMemberGroupCheck(row.memberId);
      if (!check.canChange) {
        setLoanMessage(check.message);
        return;
      }
      setActiveRow(row);
      setDialog(kind);
    } catch (caught) {
      showToast(isMemberGroupClientError(caught) ? caught.message : t("requestFailed"), "error");
    }
  }

  function saved(message: string) {
    if (message) showToast(message, "success");
    setReloadKey((value) => value + 1);
  }

  const capacity = groupCapacity(selected?.memberNo);
  const activeCount = selected?.activeMembers ?? roster.filter((row) => row.isActive).length;
  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }),
    [locale],
  );

  function formatDate(value: string | null) {
    if (!value) return "—";
    const parsed = new Date(`${value.slice(0, 10)}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? value : dateFormat.format(parsed);
  }

  return (
    <ModulePageShell page={onboardingModulePages.groupMemberMapping}>
      <PageToast message={toast} onDismiss={() => setToast(null)} />
      <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <section className="rounded-xl border border-border bg-white p-3">
          <div className="space-y-2">
            {branchBound ? null : (
              <Select
                aria-label={t("branch")}
                placeholder={t("allBranches")}
                clearable
                value={branchId}
                onChange={(value) => {
                  setBranchId(value);
                  setCenterId("");
                }}
                options={branches}
              />
            )}
            <Select
              aria-label={t("center")}
              placeholder={t("allCenters")}
              clearable
              disabled={!branchId}
              value={centerId}
              onChange={setCenterId}
              options={centers}
            />
            <input autoComplete="off"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={t("searchGroups")}
              aria-label={t("searchGroups")}
              className="w-full rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-muted hover:border-border-strong focus:border-brand focus:shadow-[var(--focus-ring)]"
            />
          </div>
          <div className="mt-3 lg:hidden">
            <Select
              aria-label={t("searchGroups")}
              placeholder={t("selectGroup")}
              value={selectedId ? String(selectedId) : ""}
              onChange={(value) => selectGroup(Number(value))}
              options={groups.map((group) => ({
                value: String(group.groupId),
                label: t("groupOption", { name: group.groupName, code: String(group.groupCode) }),
              }))}
            />
          </div>
          <ul className="mt-3 hidden max-h-[32rem] space-y-1 overflow-auto lg:block">
            {groupsLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <li key={index} className="px-2 py-1">
                    <Skeleton className="h-10 w-full" />
                  </li>
                ))
              : null}
            {!groupsLoading && groups.length === 0 ? (
              <li className="flex flex-col items-center gap-2 px-3 py-8 text-center" role="status">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted text-muted">
                  <UsersRound className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-slate-800">{t("noGroups")}</span>
                <span className="max-w-[14rem] text-xs text-muted">{t("noGroupsHint")}</span>
              </li>
            ) : null}
            {groups.map((group) => {
              const cap = groupCapacity(group.memberNo);
              const low = isBelowMinimum(group.activeMembers);
              const current = group.groupId === selectedId;
              return (
                <li key={group.groupId}>
                  <button
                    type="button"
                    onClick={() => selectGroup(group.groupId)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-start text-sm ${current ? "bg-primary/10 text-primary" : "hover:bg-slate-50"}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{group.groupName}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 font-mono font-semibold text-blue-700">
                          {group.groupCode}
                        </span>
                        <span className="text-muted">
                          {group.activeMembers}/{cap}
                        </span>
                      </span>
                    </span>
                    {low ? <Badge tone="amber">{t("belowMinimum")}</Badge> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="min-w-0 rounded-xl border border-border bg-white p-4">
          {selected ? (
            <header className="mb-4 space-y-3 border-b border-border pb-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-slate-900">
                    {selected.groupName}
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-mono text-xs font-semibold text-blue-700">
                      {selected.groupCode}
                    </span>
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {[selected.groupTypeDesc, selected.groupGenderDesc, selected.statusDesc, selected.centerName, selected.foName]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" icon={Plus} onClick={() => setDialog("assign")}>
                    {t("addMembers")}
                  </Button>
                  <Button
                    type="button"
                    variant={history ? "primary" : "secondary"}
                    icon={History}
                    onClick={() => setHistory((value) => !value)}
                  >
                    {history ? t("currentRoster") : t("history")}
                  </Button>
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{t("capacityLabel", { active: activeCount, capacity })}</span>
                  <span className="text-muted">{t("minimumLabel", { count: MIN_GROUP_MEMBERS })}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${Math.min(100, (activeCount / capacity) * 100)}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-slate-700">
                {t("president")}: {selected.presidentName ?? t("vacant")} · {t("secretary")}:{" "}
                {selected.secretaryName ?? t("vacant")} · {t("treasurer")}: {selected.treasurerName ?? t("vacant")}
              </p>
            </header>
          ) : (
            <EmptyState
              title={t("noGroupSelected")}
              message={t("noGroupSelectedHint")}
              icon={<UsersRound className="h-5 w-5" aria-hidden="true" />}
              className="min-h-[18rem]"
            />
          )}

          {selected ? (
            <DataTable
              data={roster}
              loading={rosterLoading}
              error={rosterError}
              onRetry={() => setReloadKey((value) => value + 1)}
              emptyTitle={history ? t("noHistory") : t("noMembers")}
              emptyMessage={history ? t("noHistoryHint") : t("noMembersHint")}
              emptyAction={
                history ? undefined : (
                  <Button type="button" icon={Plus} onClick={() => setDialog("assign")}>
                    {t("addMembers")}
                  </Button>
                )
              }
              getRowKey={(row) => String(row.memGroupId)}
              columns={[
                {
                  id: "member",
                  header: t("member"),
                  cell: (row) => (
                    <div>
                      <div className="font-medium text-slate-900">{row.memberName}</div>
                      <div className="text-xs text-muted">{row.memberRefCode}</div>
                    </div>
                  ),
                },
                {
                  id: "role",
                  header: t("role"),
                  cell: (row) => {
                    const role = normalizeRole(row.memberRole);
                    return role === "Member" ? t("roles.Member") : `★ ${t(`roles.${role}`)}`;
                  },
                },
                {
                  id: "joined",
                  header: t("joined"),
                  cell: (row) => formatDate(row.joinDate),
                },
                {
                  id: "officer",
                  header: t("fieldOfficer"),
                  cell: (row) => row.foName ?? "—",
                },
                ...(history
                  ? [
                      {
                        id: "exit",
                        header: t("exitDate"),
                        cell: (row: GroupMembership) => formatDate(row.exitDate),
                      },
                      {
                        id: "reason",
                        header: t("reason"),
                        cell: (row: GroupMembership) => row.exitReason ?? "—",
                      },
                    ]
                  : []),
              ]}
              rowActions={
                history
                  ? undefined
                  : {
                      header: t("actions"),
                      render: (row) => (
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            icon={Pencil}
                            tooltip={t("edit")}
                            aria-label={t("edit")}
                            onClick={() => {
                              setActiveRow(row);
                              setDialog("edit");
                            }}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            icon={ArrowRightLeft}
                            tooltip={t("move")}
                            aria-label={t("move")}
                            onClick={() => void openChange("move", row)}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            icon={UserMinus}
                            tooltip={t("remove")}
                            aria-label={t("remove")}
                            onClick={() => void openChange("exit", row)}
                          />
                        </div>
                      ),
                    }
              }
            />
          ) : null}
        </section>
      </div>

      <AssignMembersModal
        open={dialog === "assign"}
        group={selected}
        roster={roster}
        onClose={() => setDialog(null)}
        onSaved={saved}
      />
      <MoveMemberModal
        open={dialog === "move"}
        group={selected}
        row={activeRow}
        onClose={() => setDialog(null)}
        onSaved={saved}
        onWarning={setLoanMessage}
      />
      <EditMembershipModal
        open={dialog === "edit"}
        group={selected}
        row={activeRow}
        roster={roster}
        onClose={() => setDialog(null)}
        onSaved={saved}
      />
      <ExitMemberModal
        open={dialog === "exit"}
        group={selected}
        row={activeRow}
        onClose={() => setDialog(null)}
        onSaved={saved}
        onWarning={setLoanMessage}
      />
      <ConfirmDialog
        open={loanMessage !== ""}
        onClose={() => setLoanMessage("")}
        variant="warning"
        title={t("loanTitle")}
        description={loanMessage}
        confirmLabel={t("ok")}
        onConfirm={() => setLoanMessage("")}
      />
    </ModulePageShell>
  );
}

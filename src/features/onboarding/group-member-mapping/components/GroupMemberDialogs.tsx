"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRightLeft, Save, UserMinus, UserPlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { DateField, SelectField, TextAreaField, TextField } from "@/components/ui/Form";
import { Select, type SelectOption } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { showToast } from "@/components/ui/toast";
import { fetchGroups } from "@/features/onboarding/group-management/services/group-client";
import { fetchMembers } from "@/features/onboarding/member-registration/services/member-client";
import type { Group } from "@/features/onboarding/group-management/types/group.types";
import type { Member } from "@/features/onboarding/member-registration/types/member.types";
import {
  assignMembers,
  editMembership,
  exitMember,
  fetchMemberships,
  isMemberGroupClientError,
  reassignMember,
} from "@/features/onboarding/group-member-mapping/services/member-group-client";
import type {
  GroupMembership,
  MemberRole,
} from "@/features/onboarding/group-member-mapping/types/member-group.types";
import {
  MEMBER_ROLES,
  genderBlock,
  groupCapacity,
  normalizeRole,
  todayYmd,
} from "@/features/onboarding/group-member-mapping/lib/group-rules";
import { MIN_GROUP_MEMBERS } from "@/features/onboarding/group-member-mapping/types/member-group.types";

function messageField(message: string): "group" | "role" | "date" | "reason" | "general" {
  const text = message.toLowerCase();
  if (text.includes("exit reason")) return "reason";
  if (text.includes("date")) return "date";
  if (text.includes("already has a")) return "role";
  if (
    text.includes("is full") ||
    text.includes("already in group") ||
    text.includes("women") ||
    text.includes("men") ||
    text.includes("branch") ||
    text.includes("center")
  ) {
    return "group";
  }
  return "general";
}

function heldRoles(roster: GroupMembership[], exceptMemberId?: number): Set<MemberRole> {
  const held = new Set<MemberRole>();
  for (const row of roster) {
    if (!row.isActive || row.memberId === exceptMemberId) continue;
    const role = normalizeRole(row.memberRole);
    if (role !== "Member") held.add(role);
  }
  return held;
}

export function AssignMembersModal({
  open,
  group,
  roster,
  onClose,
  onSaved,
}: {
  open: boolean;
  group: Group | null;
  roster: GroupMembership[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const t = useTranslations("onboarding.groupMemberMapping");
  const [keyword, setKeyword] = useState("");
  const [joinDate, setJoinDate] = useState(todayYmd());
  const [candidates, setCandidates] = useState<Member[]>([]);
  const [selected, setSelected] = useState<Record<number, MemberRole>>({});
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [rowErrorId, setRowErrorId] = useState<number | null>(null);

  const capacity = groupCapacity(group?.memberNo);
  const remaining = Math.max(0, capacity - (group?.activeMembers ?? roster.filter((row) => row.isActive).length));
  const taken = heldRoles(roster);

  useEffect(() => {
    if (!open || !group) return;
    setJoinDate(todayYmd());
    setSelected({});
    setError("");
    setRowErrorId(null);
    setKeyword("");
    setCandidates([]);
    setReady(false);
  }, [open, group]);

  useEffect(() => {
    if (!open || !group) return;
    const controller = new AbortController();
    const handle = window.setTimeout(() => {
      setLoading(true);
      fetchMembers(
        {
          branchId: group.branchId,
          centerId: group.centerId ?? undefined,
          statusCd: 1,
          keyword: keyword.trim() || undefined,
          perPage: 50,
          page: 1,
        },
        controller.signal,
      )
        .then((result) => {
          if (!controller.signal.aborted) setCandidates(result.items);
        })
        .catch(() => {
          if (!controller.signal.aborted) setCandidates([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
            setReady(true);
          }
        });
    }, 300);
    return () => {
      controller.abort();
      window.clearTimeout(handle);
    };
  }, [open, group, keyword]);

  const pickedRoles = new Set(Object.values(selected).filter((role) => role !== "Member"));

  function toggle(member: Member, blocked: boolean) {
    if (blocked) return;
    setSelected((current) => {
      const next = { ...current };
      if (next[member.memberId] != null) {
        delete next[member.memberId];
        return next;
      }
      if (Object.keys(next).length >= remaining) return current;
      next[member.memberId] = "Member";
      return next;
    });
  }

  async function submit() {
    if (!group) return;
    const members = Object.entries(selected).map(([memberId, memberRole]) => ({
      memberId: Number(memberId),
      memberRole,
    }));
    if (members.length === 0) return;
    setSaving(true);
    setError("");
    setRowErrorId(null);
    try {
      const saved = await assignMembers({ groupId: group.groupId, joinDate, members });
      onSaved(saved.message);
      onClose();
    } catch (caught) {
      const message = isMemberGroupClientError(caught) ? caught.message : t("requestFailed");
      const match = /member\s+(\d+)/i.exec(message);
      setRowErrorId(match ? Number(match[1]) : null);
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  const count = Object.keys(selected).length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={t("addTitle", { group: group?.groupName ?? "" })}
      subtitle={t("remaining", { count: remaining })}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="button" icon={UserPlus} loading={saving} disabled={count === 0} onClick={() => void submit()}>
            {t("addSelected", { count })}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <DateField
          label={t("joinDate")}
          value={joinDate}
          onChange={setJoinDate}
          max={todayYmd()}
        />
        <TextField
          label={t("searchMembers")}
          value={keyword}
          onChange={setKeyword}
          placeholder={t("searchMembersPlaceholder")}
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <ul className="space-y-2" aria-busy={loading}>
          {loading && !ready
            ? Array.from({ length: 3 }).map((_, index) => (
                <li key={index} className="rounded-xl border border-border bg-surface p-3">
                  <Skeleton className="h-14 w-full" />
                </li>
              ))
            : null}
          {ready && candidates.length === 0 ? (
            <li className="rounded-xl border border-dashed border-border bg-surface-muted px-4 py-8 text-center text-sm text-muted">
              {t("noCandidates")}
            </li>
          ) : null}
          {candidates.map((member) => {
            const gender = genderBlock(member.genderCd, group?.groupGenderDesc);
            const inGroup = member.groupId != null;
            const picked = selected[member.memberId] != null;
            const blocked = inGroup || gender != null || (!picked && count >= remaining);
            const reason = inGroup
              ? t("inGroupUseMove", { group: member.groupName ?? "" })
              : gender === "women"
                ? t("womenOnly")
                : gender === "men"
                  ? t("menOnly")
                  : null;
            const initial = member.memberName.trim().charAt(0).toUpperCase();
            return (
              <li
                key={member.memberId}
                className={`rounded-xl border bg-surface p-3 shadow-[var(--shadow-card)] ${
                  rowErrorId === member.memberId
                    ? "border-danger"
                    : picked
                      ? "border-brand/40 bg-brand-soft"
                      : "border-border"
                } ${loading ? "opacity-70" : ""}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="flex min-w-0 flex-1 items-start gap-3 text-sm">
                    <input autoComplete="off"
                      type="checkbox"
                      className="mt-3"
                      checked={picked}
                      disabled={blocked && !picked}
                      onChange={() => toggle(member, Boolean(blocked && !picked))}
                    />
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand-ink">
                      {initial}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-900">{member.memberName}</span>
                      <span className="mt-0.5 block truncate text-muted">
                        {[member.refCode, member.mobileNo].filter(Boolean).join(" · ")}
                      </span>
                      <span className="mt-0.5 block text-muted">
                        {[member.genderDesc, member.age].filter((part) => part != null && part !== "").join(" · ")}
                      </span>
                      {reason ? <span className="mt-1 block text-amber-700">{reason}</span> : null}
                    </span>
                  </label>
                  <Select
                    aria-label={t("role")}
                    size="sm"
                    searchable={false}
                    clearable={false}
                    className="w-full sm:w-44"
                    disabled={!picked}
                    value={selected[member.memberId] ?? "Member"}
                    onChange={(value) =>
                      setSelected((current) => ({ ...current, [member.memberId]: value as MemberRole }))
                    }
                    options={MEMBER_ROLES.filter((role) => {
                      if (role === "Member") return true;
                      if (selected[member.memberId] === role) return true;
                      return !taken.has(role) && !pickedRoles.has(role);
                    }).map((role) => ({ value: role, label: t(`roles.${role}`) }))}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Modal>
  );
}

export function MoveMemberModal({
  open,
  group,
  row,
  onClose,
  onSaved,
  onWarning,
}: {
  open: boolean;
  group: Group | null;
  row: GroupMembership | null;
  onClose: () => void;
  onSaved: (message: string) => void;
  onWarning: (message: string) => void;
}) {
  const t = useTranslations("onboarding.groupMemberMapping");
  const [groups, setGroups] = useState<Group[]>([]);
  const [targetRoster, setTargetRoster] = useState<GroupMembership[]>([]);
  const [groupId, setGroupId] = useState("");
  const [role, setRole] = useState<MemberRole>("Member");
  const [transferDate, setTransferDate] = useState(todayYmd());
  const [reason, setReason] = useState("");
  const [fieldError, setFieldError] = useState<{ field: string; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !group || !row) return;
    setGroupId("");
    setTargetRoster([]);
    setRole("Member");
    setTransferDate(todayYmd());
    setReason("");
    setFieldError(null);
    fetchGroups({
      branchId: group.branchId,
      centerId: group.centerId ?? undefined,
      statusCd: 1,
      perPage: 200,
      page: 1,
    })
      .then((result) => setGroups(result.items.filter((item) => item.groupId !== group.groupId)))
      .catch(() => setGroups([]));
  }, [open, group, row]);

  useEffect(() => {
    if (!groupId) {
      setTargetRoster([]);
      return;
    }
    fetchMemberships({ groupId: Number(groupId), isActive: true, perPage: 50, page: 1 })
      .then((result) => setTargetRoster(result.items))
      .catch(() => setTargetRoster([]));
  }, [groupId]);

  useEffect(() => {
    if (role !== "Member" && heldRoles(targetRoster).has(role)) setRole("Member");
  }, [targetRoster, role]);

  const active = group?.activeMembers ?? 0;
  const roleName = row ? normalizeRole(row.memberRole) : "Member";

  const options: SelectOption[] = groups.map((item) => {
    const capacity = groupCapacity(item.memberNo);
    const full = item.activeMembers >= capacity;
    const gender = genderBlock(row?.genderCd, item.groupGenderDesc);
    const reasonText = full ? t("groupFull") : gender === "women" ? t("womenOnly") : gender === "men" ? t("menOnly") : "";
    return {
      value: String(item.groupId),
      label: reasonText
        ? `${item.groupName} · ${item.activeMembers}/${capacity} · ${reasonText}`
        : `${item.groupName} · ${item.activeMembers}/${capacity}`,
      disabled: full || gender != null,
    };
  });

  async function submit() {
    if (!row || !groupId) return;
    setSaving(true);
    setFieldError(null);
    try {
      const saved = await reassignMember({
        memberId: row.memberId,
        groupId: Number(groupId),
        memberRole: role,
        transferDate,
        reason: reason.trim() || undefined,
      });
      onSaved(saved.message);
      onClose();
    } catch (caught) {
      if (isMemberGroupClientError(caught) && caught.warning) {
        onWarning(caught.message);
        onClose();
        return;
      }
      const message = isMemberGroupClientError(caught) ? caught.message : t("requestFailed");
      setFieldError({ field: messageField(message), message });
      if (messageField(message) === "general") showToast(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("moveTitle", { name: row?.memberName ?? "" })}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="button" icon={ArrowRightLeft} loading={saving} disabled={!groupId} onClick={() => void submit()}>
            {t("move")}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="rounded-lg border border-border bg-slate-50 p-3">
          <p className="font-medium text-slate-900">{group?.groupName}</p>
          <p className="text-muted">
            {t(`roles.${roleName}`)} · {row?.joinDate}
          </p>
        </div>
        <SelectField
          label={t("newGroup")}
          placeholder={t("selectGroup")}
          value={groupId}
          onChange={setGroupId}
          options={options}
          error={fieldError?.field === "group" ? fieldError.message : undefined}
        />
        <SelectField
          label={t("roleInGroup")}
          value={role}
          onChange={(value) => setRole(value as MemberRole)}
          options={MEMBER_ROLES.filter((item) => item === "Member" || !heldRoles(targetRoster).has(item)).map((item) => ({
            value: item,
            label: t(`roles.${item}`),
          }))}
          error={fieldError?.field === "role" ? fieldError.message : undefined}
        />
        <DateField
          label={t("transferDate")}
          value={transferDate}
          onChange={setTransferDate}
          min={row?.joinDate ?? undefined}
          max={todayYmd()}
          error={fieldError?.field === "date" ? fieldError.message : undefined}
        />
        <TextAreaField
          label={t("reason")}
          value={reason}
          maxLength={200}
          onChange={setReason}
          placeholder={t("reasonPlaceholder")}
          rows={3}
        />
        {roleName !== "Member" ? (
          <p className="text-amber-800">{t("willLoseRole", { group: group?.groupName ?? "", role: t(`roles.${roleName}`) })}</p>
        ) : null}
        {active - 1 < MIN_GROUP_MEMBERS ? (
          <p className="text-amber-800">
            {t("willDropBelow", { group: group?.groupName ?? "", count: Math.max(0, active - 1), minimum: MIN_GROUP_MEMBERS })}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

export function EditMembershipModal({
  open,
  group,
  row,
  roster,
  onClose,
  onSaved,
}: {
  open: boolean;
  group: Group | null;
  row: GroupMembership | null;
  roster: GroupMembership[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const t = useTranslations("onboarding.groupMemberMapping");
  const [role, setRole] = useState<MemberRole>("Member");
  const [joinDate, setJoinDate] = useState("");
  const [swap, setSwap] = useState<GroupMembership | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !row || !group) return;
    setRole(normalizeRole(row.memberRole));
    setJoinDate(row.joinDate ?? todayYmd());
    setError("");
    setSwap(null);
  }, [open, row, group]);

  const taken = row ? heldRoles(roster, row.memberId) : new Set<MemberRole>();

  async function save(nextRole: MemberRole, holder: GroupMembership | null) {
    if (!row) return;
    setSaving(true);
    setError("");
    try {
      if (holder) {
        await editMembership({ memGroupId: holder.memGroupId, memberRole: "Member" });
      }
      const input: Parameters<typeof editMembership>[0] = { memGroupId: row.memGroupId };
      if (nextRole !== normalizeRole(row.memberRole) || holder) input.memberRole = nextRole;
      if (joinDate && joinDate !== row.joinDate) input.joinDate = joinDate;
      const saved = await editMembership(input);
      onSaved(saved.message);
      onClose();
    } catch (caught) {
      setError(isMemberGroupClientError(caught) ? caught.message : t("requestFailed"));
    } finally {
      setSaving(false);
    }
  }

  function submit() {
    if (!row) return;
    const holder = roster.find(
      (item) => item.isActive && item.memberId !== row.memberId && normalizeRole(item.memberRole) === role && role !== "Member",
    );
    if (holder) {
      setSwap(holder);
      return;
    }
    void save(role, null);
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={t("editTitle", { name: row?.memberName ?? "" })}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="button" icon={Save} loading={saving} onClick={submit}>
              {t("save")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">{t("role")}</span>
            <Select
              aria-label={t("role")}
              value={role}
              onChange={(value) => setRole(value as MemberRole)}
              options={MEMBER_ROLES.filter((item) => item === "Member" || item === role || !taken.has(item)).map(
                (item) => ({ value: item, label: t(`roles.${item}`) }),
              )}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">{t("joinDate")}</span>
            <DatePicker value={joinDate} onChange={setJoinDate} max={todayYmd()} aria-label={t("joinDate")} />
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </div>
      </Modal>
      <ConfirmDialog
        open={swap != null}
        onClose={() => setSwap(null)}
        title={t("swapTitle")}
        description={t("swapBody", {
          holder: swap?.memberName ?? "",
          role: t(`roles.${role}`),
          name: row?.memberName ?? "",
        })}
        confirmLabel={t("save")}
        variant="warning"
        onConfirm={() => save(role, swap)}
      />
    </>
  );
}

export function ExitMemberModal({
  open,
  group,
  row,
  onClose,
  onSaved,
  onWarning,
}: {
  open: boolean;
  group: Group | null;
  row: GroupMembership | null;
  onClose: () => void;
  onSaved: (message: string) => void;
  onWarning: (message: string) => void;
}) {
  const t = useTranslations("onboarding.groupMemberMapping");
  const [reason, setReason] = useState("");
  const [exitDate, setExitDate] = useState(todayYmd());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const roleName = row ? normalizeRole(row.memberRole) : "Member";
  const active = group?.activeMembers ?? 0;

  useEffect(() => {
    if (!open) return;
    setReason("");
    setExitDate(todayYmd());
    setError("");
  }, [open]);

  async function submit() {
    if (!row) return;
    if (!reason.trim()) {
      setError(t("reasonRequired"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const saved = await exitMember({ memberId: row.memberId, reason: reason.trim(), exitDate });
      onSaved(saved.message);
      onClose();
    } catch (caught) {
      if (isMemberGroupClientError(caught) && caught.warning) {
        onWarning(caught.message);
        onClose();
        return;
      }
      setError(isMemberGroupClientError(caught) ? caught.message : t("requestFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("removeTitle", { name: row?.memberName ?? "", group: group?.groupName ?? "" })}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="button" variant="danger" icon={UserMinus} loading={saving} onClick={() => void submit()}>
            {t("remove")}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <label className="block">
          <span className="mb-1 block font-medium text-slate-700">{t("reason")}</span>
          <textarea autoComplete="off"
            value={reason}
            maxLength={200}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t("reasonPlaceholder")}
            className="input min-h-20 w-full"
          />
          {error ? <span className="mt-1 block text-danger">{error}</span> : null}
        </label>
        <label className="block">
          <span className="mb-1 block font-medium text-slate-700">{t("exitDate")}</span>
          <DatePicker
            value={exitDate}
            onChange={setExitDate}
            min={row?.joinDate ?? undefined}
            max={todayYmd()}
            aria-label={t("exitDate")}
          />
        </label>
        {roleName !== "Member" ? (
          <p className="text-amber-800">{t("willLoseRole", { group: group?.groupName ?? "", role: t(`roles.${roleName}`) })}</p>
        ) : null}
        {active - 1 < MIN_GROUP_MEMBERS ? (
          <p className="text-amber-800">
            {t("willDropBelow", { group: group?.groupName ?? "", count: Math.max(0, active - 1), minimum: MIN_GROUP_MEMBERS })}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

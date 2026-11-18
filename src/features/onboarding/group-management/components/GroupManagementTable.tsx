"use client";

import { useMemo, useState, useEffect, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  Eye,
  FileCheck2,
  MoreVertical,
  Pencil,
  Power,
  ShieldAlert,
  XCircle,
  CheckCircle,
  Ban,
  CircleCheck,
  Plus,
} from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import type { Group, GroupStatus, GroupListResult } from "../types/group.types";

export type GroupManagementTableProps = {
  items: Group[];
  meta: GroupListResult["meta"] | null;
  page: number;
  pageSize: number;
  loading: boolean;
  error: boolean;
  errorMessage?: string;
  hasFiltersApplied: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onView: (group: Group) => void;
  onEdit: (group: Group) => void;
  onOpenKyc: (group: Group) => void;
  onRequestStatusChange: (group: Group, nextStatus: GroupStatus) => void;
  headerActions?: ReactNode;
  onResetFilters?: () => void;
  onCreateNew?: () => void;
};

export function GroupManagementTable({
  items,
  meta,
  page,
  pageSize,
  loading,
  error,
  errorMessage,
  hasFiltersApplied,
  onRetry,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onOpenKyc,
  onRequestStatusChange,
  headerActions,
  onResetFilters,
  onCreateNew,
}: GroupManagementTableProps) {
  const tKyc = useTranslations("onboarding.groupKyc");
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Close popup menu when clicking outside
  useEffect(() => {
    if (activeMenuId == null) return;
    function handleOutside(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target?.closest("[data-row-menu]")) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [activeMenuId]);

  const columns = useMemo<DataTableColumn<Group>[]>(
    () => [
      {
        id: "code",
        header: "CODE",
        cell: (row) => (
          <div className="flex flex-col">
            <span className="inline-block w-fit rounded-full bg-blue-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-blue-700">
              {row.groupCode}
            </span>
            {row.refCode ? (
              <span className="mt-0.5 text-[11px] text-muted">
                Ref {row.refCode}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        id: "groupName",
        header: "GROUP NAME",
        cell: (row) => (
          <button
            type="button"
            className="cursor-pointer text-left font-medium text-slate-800 transition hover:text-brand hover:underline"
            onClick={() => onView(row)}
          >
            {row.groupName}
          </button>
        ),
      },
      {
        id: "type",
        header: "TYPE",
        cell: (row) => {
          const isShg = row.groupTypeCd === 1;
          return (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                isShg
                  ? "bg-violet-50 text-violet-700"
                  : "bg-cyan-50 text-cyan-700"
              }`}
            >
              {row.groupTypeDesc || (isShg ? "SHG" : "JLG")}
            </span>
          );
        },
      },
      {
        id: "branchCenter",
        header: "BRANCH / CENTER",
        cell: (row) => (
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-800">
              {row.branchName}
            </span>
            <span className="text-[11px] text-muted">
              {row.centerName ? row.centerName : "—"}
            </span>
          </div>
        ),
      },
      {
        id: "members",
        header: "MEMBERS",
        cell: (row) => {
          const active = row.activeMembers;
          const declared = row.memberNo ?? 0;
          const ratio = declared > 0 ? (active / declared) * 100 : 0;
          const percent = Math.min(100, Math.max(0, ratio));

          const isOver = declared > 0 && active > declared;
          const isBelowMin = active < 4;

          const textColor = isOver
            ? "text-rose-600 font-semibold"
            : isBelowMin
              ? "text-amber-700 font-medium"
              : "text-slate-700";

          const barColor = isOver
            ? "bg-rose-500"
            : isBelowMin
              ? "bg-amber-500"
              : "bg-brand";

          return (
            <div className="min-w-24 max-w-32">
              <div className={`text-xs ${textColor}`}>
                <span>{active}</span>
                <span className="text-muted"> / {row.memberNo ?? "—"}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        id: "meeting",
        header: "MEETING",
        cell: (row) => {
          const hasTime = row.meetingDayDesc || row.meetingTime;
          return (
            <div className="flex flex-col">
              <span className="text-xs text-slate-800">
                {hasTime
                  ? `${row.meetingDayDesc ?? ""} ${row.meetingTime ?? ""}`.trim()
                  : "—"}
              </span>
              {row.meetingFrequencyDesc ? (
                <span className="text-[11px] text-muted">
                  {row.meetingFrequencyDesc}
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "fo",
        header: "FIELD OFFICER",
        cell: (row) => (
          <span className="text-xs text-slate-700">{row.foName || "—"}</span>
        ),
      },
      {
        id: "status",
        header: "STATUS",
        cell: (row) => {
          const tone =
            row.statusCd === 1
              ? "success"
              : row.statusCd === 2
                ? "neutral"
                : row.statusCd === 3
                  ? "amber"
                  : "danger";

          return (
            <Badge tone={tone} caps>
              {row.statusDesc}
            </Badge>
          );
        },
      },
    ],
    [onView],
  );

  return (
    <DataTable<Group>
      title="Group Directory"
      description="Operational customer groups with branch, center, member and meeting details"
      actions={headerActions}
      data={items}
      columns={columns}
      getRowKey={(row) => String(row.groupId)}
      loading={loading}
      error={error && !items.length}
      errorMessage={errorMessage}
      onRetry={onRetry}
      emptyTitle={hasFiltersApplied ? "No groups found" : "No groups yet"}
      emptyMessage={
        hasFiltersApplied
          ? "No groups match the current filters. Try adjusting your search criteria or reset filters."
          : "Create your first group to get started."
      }
      minWidth="980px"
      minHeight="480px"
      className="min-h-[480px] flex flex-col justify-between"
      caption="Group directory table"
      emptyAction={
        hasFiltersApplied && onResetFilters ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onResetFilters}
          >
            Reset filters
          </Button>
        ) : onCreateNew ? (
          <Button
            type="button"
            size="sm"
            icon={Plus}
            onClick={onCreateNew}
          >
            + New Group
          </Button>
        ) : undefined
      }
      rowActions={{
        header: "ACTIONS",
        render: (row) => {
          const isMenuOpen = activeMenuId === row.groupId;
          const isClosed = row.statusCd === 4;

          return (
            <div className="relative inline-flex items-center gap-1.5" data-row-menu>
              {/* View */}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                icon={Eye}
                tooltip="View"
                onClick={() => onView(row)}
              />

              {/* Edit (hidden for closed) */}
              {!isClosed ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={Pencil}
                  tooltip="Edit"
                  onClick={() => onEdit(row)}
                />
              ) : null}

              <Button
                type="button"
                size="sm"
                variant="secondary"
                icon={FileCheck2}
                tooltip={tKyc("open")}
                aria-label={tKyc("open")}
                onClick={() => onOpenKyc(row)}
              />

              {/* Quick toggle status button (matching Branch Directory Ban/CircleCheck) */}
              <Button
                type="button"
                size="sm"
                variant={row.statusCd === 1 ? "warning" : "success"}
                icon={row.statusCd === 1 ? Ban : CircleCheck}
                tooltip={row.statusCd === 1 ? "Deactivate" : "Activate"}
                onClick={() =>
                  onRequestStatusChange(row, row.statusCd === 1 ? 2 : 1)
                }
              />

              {/* More options menu for Suspend / Close */}
              {!isClosed ? (
                <div className="relative">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    icon={MoreVertical}
                    tooltip="More actions"
                    aria-label="More actions"
                    onClick={() =>
                      setActiveMenuId(isMenuOpen ? null : row.groupId)
                    }
                  />

                  {isMenuOpen ? (
                    <div className="absolute right-0 top-full z-30 mt-1 min-w-[9.5rem] rounded-xl border border-border bg-surface p-1 shadow-lg animate-in fade-in zoom-in-95">
                      {/* Suspend */}
                      {row.statusCd !== 3 ? (
                        <button
                          type="button"
                          className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                          onClick={() => {
                            setActiveMenuId(null);
                            onRequestStatusChange(row, 3);
                          }}
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                          Suspend
                        </button>
                      ) : null}

                      {/* Close */}
                      {row.activeMembers > 0 ? (
                        <Tooltip label="Remove all members first" side="top">
                          <button
                            type="button"
                            disabled
                            className="flex w-full cursor-not-allowed items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-300 opacity-60"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Close
                          </button>
                        </Tooltip>
                      ) : (
                        <button
                          type="button"
                          className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                          onClick={() => {
                            setActiveMenuId(null);
                            onRequestStatusChange(row, 4);
                          }}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Close
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        },
      }}
      pagination={{
        page,
        pageSize,
        total: meta?.total ?? items.length,
        totalPages: meta?.lastPage,
        pageSizeOptions: [10, 20, 50, 100],
        onPageChange,
        onPageSizeChange,
      }}
    />
  );
}

"use client";

import { useMemo, useState, useEffect, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  Eye,
  MoreVertical,
  Pencil,
  ShieldAlert,
  Ban,
  Plus,
  CircleCheck,
  UserX,
  XCircle,
  FileCheck2,
  MapPin,
} from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Member, MemberStatus, MemberListResult } from "../types/member.types";

export type MemberRegistrationTableProps = {
  items: Member[];
  meta: MemberListResult["meta"] | null;
  page: number;
  pageSize: number;
  loading: boolean;
  error: boolean;
  errorMessage?: string;
  hasFiltersApplied: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onView: (member: Member) => void;
  onEdit: (member: Member) => void;
  onOpenKyc: (member: Member) => void;
  onOpenLocation: (member: Member) => void;
  onRequestStatusChange: (member: Member, nextStatus: MemberStatus) => void;
  /** Full row menu, or only the KYC action. */
  actionMode?: "full" | "kyc";
  title?: ReactNode;
  headerActions?: ReactNode;
  onResetFilters?: () => void;
  onCreateNew?: () => void;
};

export function MemberRegistrationTable({
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
  onOpenLocation,
  onRequestStatusChange,
  actionMode = "full",
  title,
  headerActions,
  onResetFilters,
  onCreateNew,
}: MemberRegistrationTableProps) {
  const tKyc = useTranslations("onboarding.memberKyc");
  const tLocation = useTranslations("onboarding.memberLocation");
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

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

  const columns = useMemo<DataTableColumn<Member>[]>(
    () => [
      {
        id: "code",
        header: "MEMBER CODE",
        cell: (row) => (
          <span className="inline-block w-fit rounded-full bg-blue-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-blue-700">
            {row.memberCode}
          </span>
        ),
      },
      {
        id: "refCode",
        header: "REF CODE",
        cell: (row) =>
          row.refCode ? (
            <span className="whitespace-nowrap font-mono text-xs font-medium text-slate-700">
              {row.refCode}
            </span>
          ) : (
            <span className="text-xs text-muted-soft">—</span>
          ),
      },
      {
        id: "memberName",
        header: "MEMBER NAME",
        cell: (row) => (
          <div className="flex flex-col">
            {actionMode === "kyc" ? (
              <span className="font-medium text-slate-800">{row.memberName}</span>
            ) : (
              <button
                type="button"
                className="cursor-pointer text-left font-medium text-slate-800 transition hover:text-brand hover:underline"
                onClick={() => onView(row)}
              >
                {row.memberName}
              </button>
            )}
            <span className="text-[11px] text-muted">
              {row.age ? `${row.age} yrs` : ""}
              {row.age && row.genderDesc ? " • " : ""}
              {row.genderDesc ?? ""}
            </span>
          </div>
        ),
      },
      {
        id: "branchCenter",
        header: "BRANCH / CENTER",
        cell: (row) => (
          <div className="flex flex-col">
            <span className="font-medium text-slate-700">{row.branchName}</span>
            {row.centerName ? (
              <span className="text-[11px] text-muted">{row.centerName}</span>
            ) : (
              <span className="text-[11px] text-muted-soft">No center</span>
            )}
          </div>
        ),
      },
      {
        id: "group",
        header: "GROUP / ROLE",
        cell: (row) => (
          <div className="flex flex-col">
            {row.groupName ? (
              <>
                <span className="font-medium text-slate-700">{row.groupName}</span>
                {row.memberRole ? (
                  <span className="text-[11px] font-semibold text-brand">
                    {row.memberRole}
                  </span>
                ) : null}
              </>
            ) : (
              <span className="text-xs text-muted-soft">No group</span>
            )}
          </div>
        ),
      },
      {
        id: "contact",
        header: "CONTACT / PAN",
        cell: (row) => (
          <div className="flex flex-col font-mono text-xs">
            <span className="text-slate-700">{row.mobileNo}</span>
            {row.panNo ? (
              <span className="text-[11px] text-muted">{row.panNo}</span>
            ) : null}
          </div>
        ),
      },
      {
        id: "kyc",
        header: "KYC",
        cell: (row) => {
          const verified = row.kycVerifiedCount || 0;
          const total = row.kycCount || 0;
          const isComplete = total > 0 && verified === total;
          return (
            <div className="flex items-center gap-1.5 text-xs">
              <FileCheck2
                className={`h-4 w-4 ${
                  isComplete
                    ? "text-emerald-500"
                    : verified > 0
                      ? "text-blue-500"
                      : "text-slate-300"
                }`}
              />
              <span
                className={`font-mono font-medium ${
                  isComplete
                    ? "text-emerald-700"
                    : verified > 0
                      ? "text-blue-700"
                      : "text-slate-400"
                }`}
              >
                {verified}/{total}
              </span>
            </div>
          );
        },
      },
      {
        id: "status",
        header: "STATUS",
        cell: (row) => {
          let tone: "success" | "warning" | "danger" | "neutral" = "neutral";
          if (row.statusCd === 1) tone = "success";
          else if (row.statusCd === 2) tone = "warning";
          else if (row.statusCd === 3) tone = "danger";
          else if (row.statusCd === 4) tone = "neutral";
          else if (row.statusCd === 5) tone = "neutral";

          return (
            <Badge tone={tone}>
              <span className="capitalize">{row.statusDesc || "Unknown"}</span>
            </Badge>
          );
        },
      },
    ],
    [actionMode, onView],
  );

  return (
    <DataTable
      title={title ?? "Member Directory"}
      actions={headerActions}
      columns={columns}
      data={items}
      getRowKey={(row) => String(row.memberId)}
      loading={loading}
      error={error && items.length === 0}
      errorMessage={errorMessage || "Failed to load members"}
      onRetry={onRetry}
      minHeight="480px"
      pagination={
        meta
          ? {
              page,
              pageSize,
              total: meta.total,
              totalPages: meta.lastPage,
              pageSizeOptions: [10, 25, 50, 100],
              onPageChange,
              onPageSizeChange,
            }
          : undefined
      }
      emptyTitle={hasFiltersApplied ? "No matching members found" : "No members registered yet"}
      emptyMessage={
        hasFiltersApplied
          ? "Try adjusting your search query or filter options."
          : "Get started by registering a new member for onboarding."
      }
      emptyAction={
        hasFiltersApplied && onResetFilters ? (
          <Button type="button" size="sm" variant="secondary" onClick={onResetFilters}>
            Reset filters
          </Button>
        ) : onCreateNew ? (
          <Button type="button" size="sm" icon={Plus} onClick={onCreateNew}>
            New Member
          </Button>
        ) : undefined
      }
      rowActions={{
        header: "ACTIONS",
        render: (row) => {
          if (actionMode === "kyc") {
            return (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                icon={FileCheck2}
                tooltip={tKyc("open")}
                aria-label={tKyc("open")}
                onClick={() => onOpenKyc(row)}
              />
            );
          }

          const canEdit = row.statusCd !== 4 && row.statusCd !== 5;
          const isMenuOpen = activeMenuId === row.memberId;

          return (
            <div className="relative inline-flex items-center gap-1.5" data-row-menu>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                icon={Eye}
                tooltip="View"
                onClick={() => onView(row)}
              />
              {canEdit ? (
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
              <Button
                type="button"
                size="sm"
                variant="secondary"
                icon={MapPin}
                tooltip={tLocation("open")}
                aria-label={tLocation("open")}
                onClick={() => onOpenLocation(row)}
              />
              <Button
                type="button"
                size="sm"
                variant={row.statusCd === 1 ? "warning" : "success"}
                icon={row.statusCd === 1 ? Ban : CircleCheck}
                tooltip={row.statusCd === 1 ? "Deactivate" : "Activate"}
                onClick={() => onRequestStatusChange(row, row.statusCd === 1 ? 2 : 1)}
              />
              <div className="relative">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  icon={MoreVertical}
                  tooltip="More actions"
                  aria-label="More actions"
                  onClick={() => setActiveMenuId(isMenuOpen ? null : row.memberId)}
                />
                {isMenuOpen ? (
                  <div className="absolute right-0 top-full z-30 mt-1 min-w-[9.5rem] rounded-xl border border-border bg-surface p-1 shadow-lg">
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
                    {row.statusCd !== 4 ? (
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
                    ) : null}
                    {row.statusCd !== 5 ? (
                      <button
                        type="button"
                        className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        onClick={() => {
                          setActiveMenuId(null);
                          onRequestStatusChange(row, 5);
                        }}
                      >
                        <UserX className="h-3.5 w-3.5" />
                        Deceased
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          );
        },
      }}
    />
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Pencil,
  X,
  ExternalLink,
  Users,
  Building2,
  CreditCard,
  MapPin,
  FileText,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { Link } from "@/i18n/navigation";
import type { Group, GroupStatus } from "../types/group.types";

export type GroupManagementDrawerProps = {
  group: Group | null;
  onClose: () => void;
  onEdit: (group: Group) => void;
  onRequestStatusChange: (group: Group, nextStatus: GroupStatus) => void;
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return "—";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  if (isNaN(hour)) return timeStr;
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m || "00"} ${ampm}`;
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function maskAccountNumber(acc: string | null | undefined): string {
  if (!acc) return "—";
  if (acc.length <= 4) return acc;
  const last4 = acc.slice(-4);
  const maskedLength = acc.length - 4;
  return "•".repeat(Math.min(8, maskedLength)) + " " + last4;
}

export function GroupManagementDrawer({
  group,
  onClose,
  onEdit,
  onRequestStatusChange,
}: GroupManagementDrawerProps) {
  const [revealAccount, setRevealAccount] = useState(false);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!group) return null;

  const isClosed = group.statusCd === 4;
  const isShg = group.groupTypeCd === 1;

  // Address parts
  const addressParts = [
    group.villageName,
    group.gpName ? `GP: ${group.gpName}` : null,
    group.blockName ? `Block: ${group.blockName}` : null,
    group.districtName,
    group.stateName,
    group.pinCode ? `PIN: ${group.pinCode}` : null,
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div
        className="fixed inset-y-0 right-0 flex max-w-full pl-10"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <aside className="w-screen max-w-md bg-surface shadow-2xl transition-all sm:max-w-lg lg:max-w-[480px]">
          <div className="flex h-full flex-col divide-y divide-border bg-surface">
            {/* Drawer Header */}
            <div className="bg-surface-muted/30 px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={isShg ? "violet" : "info"} caps={false}>
                      {group.groupTypeDesc || (isShg ? "SHG" : "JLG")}
                    </Badge>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold ${
                        group.statusCd === 1
                          ? "text-emerald-700"
                          : group.statusCd === 2
                            ? "text-slate-600"
                            : group.statusCd === 3
                              ? "text-amber-700"
                              : "text-rose-700"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          group.statusCd === 1
                            ? "bg-emerald-500"
                            : group.statusCd === 2
                              ? "bg-slate-400"
                              : group.statusCd === 3
                                ? "bg-amber-500"
                                : "bg-rose-500"
                        }`}
                      />
                      {group.statusDesc}
                    </span>
                  </div>
                  <h2 className="mt-2 truncate text-lg font-bold text-slate-900 sm:text-xl">
                    {group.groupName}
                  </h2>
                  <p className="mt-0.5 font-mono text-xs text-muted">
                    Code {group.groupCode}
                    {group.refCode ? ` · Ref ${group.refCode}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {!isClosed ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={Pencil}
                      onClick={() => onEdit(group)}
                    >
                      Edit
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={X}
                    aria-label="Close drawer"
                    onClick={onClose}
                  />
                </div>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
              {/* Section 1: Basic */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b border-border/70 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <Building2 className="h-3.5 w-3.5 text-brand" />
                  Basic Details
                </div>
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-muted">Branch</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">
                      {group.branchName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Center / Kendra</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">
                      {group.centerName ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Formation Date</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">
                      {formatDate(group.formationDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Registration No.</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">
                      {group.registrationNo ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Registration Date</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">
                      {formatDate(group.registrationDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Group Gender</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">
                      {group.groupGenderDesc ?? "—"}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted">Field Officer</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">
                      {group.foName ? (
                        <span>
                          {group.foName}
                          {group.foCode ? ` (${group.foCode})` : ""}
                        </span>
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* Section 2: Members & Office Bearers */}
              <section className="space-y-3">
                <div className="flex items-center justify-between border-b border-border/70 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <Users className="h-3.5 w-3.5 text-brand" />
                    Members & Leadership
                  </div>
                  <Link
                    href={`/onboarding/group-member-mapping?groupId=${group.groupId}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                  >
                    Manage members <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div className="col-span-2 rounded-xl border border-border/70 bg-surface-muted/40 p-3">
                    <div className="flex items-center justify-between">
                      <dt className="text-muted">Member Count</dt>
                      <dd className="font-semibold text-slate-800">
                        {group.activeMembers} / {group.memberNo ?? "—"}
                      </dd>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full ${
                          group.activeMembers < 4
                            ? "bg-amber-500"
                            : group.memberNo &&
                                group.activeMembers > group.memberNo
                              ? "bg-rose-500"
                              : "bg-brand"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            group.memberNo
                              ? (group.activeMembers / group.memberNo) * 100
                              : 0,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <dt className="text-muted">President</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">
                      {group.presidentName
                        ? `${group.presidentName}${group.presidentMemberId ? ` (ID: ${group.presidentMemberId})` : ""}`
                        : group.presidentMemberId
                          ? `Member ID: ${group.presidentMemberId}`
                          : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Secretary</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">
                      {group.secretaryName
                        ? `${group.secretaryName}${group.secretaryMemberId ? ` (ID: ${group.secretaryMemberId})` : ""}`
                        : group.secretaryMemberId
                          ? `Member ID: ${group.secretaryMemberId}`
                          : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Treasurer</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">
                      {group.treasurerName
                        ? `${group.treasurerName}${group.treasurerMemberId ? ` (ID: ${group.treasurerMemberId})` : ""}`
                        : group.treasurerMemberId
                          ? `Member ID: ${group.treasurerMemberId}`
                          : "—"}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* Section 3: Meeting */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b border-border/70 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <Clock className="h-3.5 w-3.5 text-brand" />
                  Meeting Details
                </div>
                <dl className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <dt className="text-muted">Frequency</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">
                      {group.meetingFrequencyDesc ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Meeting Day</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">
                      {group.meetingDayDesc ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Meeting Time</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">
                      {formatTime(group.meetingTime)}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* Section 4: Address */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b border-border/70 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <MapPin className="h-3.5 w-3.5 text-brand" />
                  Address
                </div>
                <p className="rounded-xl border border-border/70 bg-surface-muted/30 p-3 text-xs leading-relaxed text-slate-800">
                  {addressParts.length > 0
                    ? addressParts.join(", ")
                    : "No address recorded."}
                </p>
              </section>

              {/* Section 5: Bank Details */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b border-border/70 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <CreditCard className="h-3.5 w-3.5 text-brand" />
                  Bank Details
                </div>
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-muted">Bank Name</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">
                      {group.bankName ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Bank Branch</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">
                      {group.bankBranch ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="flex items-center justify-between text-muted">
                      <span>Account Number</span>
                      {group.bankAccountNo ? (
                        <button
                          type="button"
                          className="cursor-pointer text-muted-soft hover:text-brand"
                          onClick={() => setRevealAccount(!revealAccount)}
                          title={revealAccount ? "Mask" : "Reveal"}
                        >
                          {revealAccount ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </button>
                      ) : null}
                    </dt>
                    <dd className="mt-0.5 font-mono font-medium text-slate-800">
                      {revealAccount
                        ? group.bankAccountNo ?? "—"
                        : maskAccountNumber(group.bankAccountNo)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">IFSC Code</dt>
                    <dd className="mt-0.5 font-mono font-medium text-slate-800">
                      {group.ifscCode ?? "—"}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* Section 6: Other */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b border-border/70 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <FileText className="h-3.5 w-3.5 text-brand" />
                  Financial & Operations
                </div>
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-muted">Savings Amount</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">
                      {formatCurrency(group.savingsAmount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Internal Lending</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">
                      {group.internalLending ? "Yes" : "No"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Grade</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">
                      {group.grade ? `${group.grade}` : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Grade Date</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">
                      {formatDate(group.gradeDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Admission Fees</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">
                      {formatCurrency(group.admFees)}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted">Remarks</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">
                      {group.remarks || "—"}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* Section 7: Audit Footer */}
              <div className="border-t border-border pt-3 text-[11px] text-muted">
                <div>
                  Created: {formatDate(group.createdAt)}
                  {group.createdBy ? ` by User #${group.createdBy}` : ""}
                </div>
                {group.updatedAt ? (
                  <div>
                    Last updated: {formatDate(group.updatedAt)}
                    {group.updatedBy ? ` by User #${group.updatedBy}` : ""}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-muted/30 px-5 py-3 sm:px-6">
              <div className="flex flex-wrap gap-2">
                {group.statusCd !== 1 ? (
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => onRequestStatusChange(group, 1)}
                  >
                    {isClosed ? "Re-open" : "Activate"}
                  </Button>
                ) : null}

                {group.statusCd === 1 ? (
                  <Button
                    size="sm"
                    variant="warning"
                    onClick={() => onRequestStatusChange(group, 2)}
                  >
                    Deactivate
                  </Button>
                ) : null}

                {group.statusCd !== 3 && !isClosed ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                    onClick={() => onRequestStatusChange(group, 3)}
                  >
                    Suspend
                  </Button>
                ) : null}

                {!isClosed ? (
                  group.activeMembers > 0 ? (
                    <Tooltip label="Remove all members first" side="top">
                      <Button size="sm" variant="danger" disabled>
                        Close
                      </Button>
                    </Tooltip>
                  ) : (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => onRequestStatusChange(group, 4)}
                    >
                      Close
                    </Button>
                  )
                ) : null}
              </div>

              {!isClosed ? (
                <Button
                  size="sm"
                  variant="primary"
                  icon={Pencil}
                  onClick={() => onEdit(group)}
                >
                  Edit Group
                </Button>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

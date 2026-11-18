"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Eye,
  EyeOff,
  Pencil,
  X,
  User,
  Building2,
  CreditCard,
  Phone,
  Briefcase,
  Users,
  FileCheck2,
  Clock,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Member, MemberStatus } from "../types/member.types";

export type MemberRegistrationDrawerProps = {
  member: Member | null;
  onClose: () => void;
  onEdit: (member: Member) => void;
  onRequestStatusChange: (member: Member, nextStatus: MemberStatus) => void;
  onOpenLocation: (member: Member) => void;
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
  return `${"•".repeat(Math.min(8, acc.length - 4))} ${last4}`;
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: typeof User;
  children: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border/70 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
      <Icon className="h-3.5 w-3.5 text-brand" />
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  mono = false,
  wide = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <dt className="text-muted">{label}</dt>
      <dd className={`mt-0.5 font-medium text-slate-800 ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

export function MemberRegistrationDrawer({
  member,
  onClose,
  onEdit,
  onRequestStatusChange,
  onOpenLocation,
}: MemberRegistrationDrawerProps) {
  const tLocation = useTranslations("onboarding.memberLocation");
  const tNominee = useTranslations("onboarding.memberNominees");
  const tFee = useTranslations("onboarding.memberAdmissionFee");
  const [revealAccount, setRevealAccount] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!member) return null;

  const canEdit = member.statusCd !== 4 && member.statusCd !== 5;
  const kycComplete = member.kycCount > 0 && member.kycVerifiedCount === member.kycCount;
  const kycPartial = member.kycVerifiedCount > 0 && !kycComplete;
  const statusTone =
    member.statusCd === 1
      ? "success"
      : member.statusCd === 2
        ? "neutral"
        : member.statusCd === 3
          ? "amber"
          : "danger";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs">
      <div
        className="fixed inset-y-0 right-0 flex h-full max-w-full ps-10"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <aside className="flex h-full w-screen max-w-md flex-col bg-surface shadow-2xl sm:max-w-lg lg:max-w-[480px]">
          <div className="flex h-full flex-col divide-y divide-border bg-surface">
            <div className="bg-surface-muted/30 px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={statusTone} caps={false}>
                      {member.statusDesc || "Active"}
                    </Badge>
                    <span className="font-mono text-xs text-muted">
                      {member.refCode || `Code ${member.memberCode}`}
                    </span>
                  </div>
                  <h2 className="mt-2 truncate text-lg font-bold text-slate-900 sm:text-xl">
                    {member.memberName}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">
                    {member.age ? `${member.age} yrs` : ""}
                    {member.age && member.genderDesc ? " · " : ""}
                    {member.genderDesc ?? ""}
                    {member.maritalStatusDesc ? ` · ${member.maritalStatusDesc}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={MapPin}
                    onClick={() => onOpenLocation(member)}
                  >
                    {tLocation("open")}
                  </Button>
                  {canEdit ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={Pencil}
                      onClick={() => onEdit(member)}
                    >
                      Edit
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={X}
                    aria-label="Close"
                    tooltip="Close"
                    onClick={onClose}
                  />
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="flex items-center justify-between rounded-xl border border-border bg-surface-muted/40 p-3">
                <div className="flex items-center gap-2.5">
                  <FileCheck2
                    className={`h-5 w-5 ${
                      kycComplete
                        ? "text-emerald-600"
                        : kycPartial
                          ? "text-blue-600"
                          : "text-slate-400"
                    }`}
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-800">KYC Documents</div>
                    <div className="text-[11px] text-muted">
                      {member.kycVerifiedCount} of {member.kycCount} documents verified
                    </div>
                  </div>
                </div>
                <Badge tone={kycComplete ? "success" : kycPartial ? "info" : "neutral"} caps={false}>
                  {kycComplete ? "Verified" : kycPartial ? "Partial" : "Pending"}
                </Badge>
              </div>

              <section className="space-y-3">
                <SectionTitle icon={User}>Personal & Family Details</SectionTitle>
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <Field
                    label="Date of Birth"
                    value={`${formatDate(member.dateOfBirth)}${member.age ? ` (${member.age} yrs)` : ""}`}
                  />
                  <Field label="Gender" value={member.genderDesc || "—"} />
                  <Field label="Father's Name" value={member.fatherName || "—"} />
                  <Field label="Mother's Name" value={member.motherName || "—"} />
                  <Field label="Spouse Name" value={member.spouseName || "—"} />
                  <Field label="Marital Status" value={member.maritalStatusDesc || "—"} />
                  <Field label="Religion" value={member.religionDesc || "—"} />
                  <Field label="Caste" value={member.casteDesc || "—"} />
                </dl>
              </section>

              <section className="space-y-3">
                <SectionTitle icon={Phone}>Contact & Identification</SectionTitle>
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <Field label="Primary Mobile" value={member.mobileNo || "—"} mono />
                  <Field label="Alternate Mobile" value={member.alternateMobileNo || "—"} mono />
                  <Field label="Email ID" value={member.emailId || "—"} wide />
                  <Field label="PAN Number" value={member.panNo || "—"} mono />
                  <Field label="Joining Date" value={formatDate(member.joiningDate)} />
                </dl>
              </section>

              <section className="space-y-3">
                <SectionTitle icon={Building2}>Branch & Group Assignment</SectionTitle>
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <Field
                    label="Branch"
                    value={
                      member.branchCode
                        ? `${member.branchName} (${member.branchCode})`
                        : member.branchName
                    }
                  />
                  <Field label="Center" value={member.centerName || "Not assigned"} />
                  <Field label="Active Group" value={member.groupName || "Not in any group"} />
                  <Field
                    label="Role in Group"
                    value={member.memberRole || (member.groupName ? "Member" : "—")}
                  />
                  <Field
                    label="Field Officer"
                    value={
                      member.foName
                        ? member.foCode
                          ? `${member.foName} (${member.foCode})`
                          : member.foName
                        : "—"
                    }
                    wide
                  />
                </dl>
              </section>

              <section className="space-y-3">
                <SectionTitle icon={Briefcase}>Financial Details</SectionTitle>
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <Field label="Occupation" value={member.occupationDetails || "—"} wide />
                  <Field label="Monthly Income" value={formatCurrency(member.monthlyIncome)} mono />
                  <Field label="Monthly Expense" value={formatCurrency(member.monthlyExpense)} mono />
                  <Field label="Admission Fees" value={formatCurrency(member.admFees)} mono />
                  {member.admFeeVoucherNo ? (
                    <Field label={tFee("voucherNo")} value={member.admFeeVoucherNo} mono />
                  ) : null}
                </dl>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <CreditCard className="h-3.5 w-3.5 text-brand" />
                    Bank Account
                  </div>
                  {member.bankAccountNo ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      icon={revealAccount ? EyeOff : Eye}
                      onClick={() => setRevealAccount((current) => !current)}
                    >
                      {revealAccount ? "Hide" : "Reveal"}
                    </Button>
                  ) : null}
                </div>
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <Field label="Bank Name" value={member.bankName || "—"} />
                  <Field label="Branch" value={member.bankBranch || "—"} />
                  <Field
                    label="Account Number"
                    value={
                      member.bankAccountNo
                        ? revealAccount
                          ? member.bankAccountNo
                          : maskAccountNumber(member.bankAccountNo)
                        : "—"
                    }
                    mono
                  />
                  <Field label="IFSC Code" value={member.ifscCode || "—"} mono />
                </dl>
              </section>

              <section className="space-y-3">
                <SectionTitle icon={Users}>Nominee Details</SectionTitle>
                {member.nominees.length > 1 ? (
                  <ul className="space-y-3">
                    {member.nominees.map((nominee, index) => (
                      <li
                        key={nominee.nomineeId ?? index}
                        className="rounded-lg border border-border/70 p-3"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-slate-700">
                          <span>{tNominee("title", { number: index + 1 })}</span>
                          {nominee.sharePercent != null ? (
                            <Badge tone="info">
                              {tNominee("shareValue", { share: nominee.sharePercent / 100 })}
                            </Badge>
                          ) : null}
                        </div>
                        <dl className="grid grid-cols-2 gap-3 text-xs">
                          <Field label={tNominee("name")} value={nominee.name} />
                          <Field label={tNominee("relation")} value={nominee.relationDesc || "—"} />
                          <Field label={tNominee("dob")} value={formatDate(nominee.dob)} />
                          <Field label={tNominee("mobile")} value={nominee.mobile || "—"} mono />
                        </dl>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <dl className="grid grid-cols-2 gap-3 text-xs">
                    <Field label="Nominee Name" value={member.nomineeName || "—"} />
                    <Field label="Relationship" value={member.nomineeRelation || "—"} />
                    <Field label="Date of Birth" value={formatDate(member.nomineeDob)} />
                    <Field label="Mobile Number" value={member.nomineeMobile || "—"} mono />
                  </dl>
                )}
              </section>

              <div className="border-t border-border pt-3 text-[11px] text-muted">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  <span>
                    Created: {formatDate(member.createdAt)}
                    {member.createdBy ? ` by User #${member.createdBy}` : ""}
                  </span>
                </div>
                {member.updatedAt ? (
                  <div className="mt-1 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    <span>
                      Last updated: {formatDate(member.updatedAt)}
                      {member.updatedBy ? ` by User #${member.updatedBy}` : ""}
                    </span>
                  </div>
                ) : null}
                {member.remarks ? (
                  <p className="mt-2 text-slate-600">{member.remarks}</p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-muted/30 px-5 py-3 sm:px-6">
              <div className="flex flex-wrap gap-2">
                {member.statusCd !== 1 ? (
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => onRequestStatusChange(member, 1)}
                  >
                    Activate
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="warning"
                    onClick={() => onRequestStatusChange(member, 2)}
                  >
                    Deactivate
                  </Button>
                )}
                {member.statusCd !== 3 && member.statusCd !== 4 && member.statusCd !== 5 ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onRequestStatusChange(member, 3)}
                  >
                    Suspend
                  </Button>
                ) : null}
                {member.statusCd !== 4 ? (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => onRequestStatusChange(member, 4)}
                  >
                    Close
                  </Button>
                ) : null}
                {member.statusCd !== 5 ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onRequestStatusChange(member, 5)}
                  >
                    Deceased
                  </Button>
                ) : null}
              </div>
              {canEdit ? (
                <Button size="sm" variant="primary" icon={Pencil} onClick={() => onEdit(member)}>
                  Edit Profile
                </Button>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

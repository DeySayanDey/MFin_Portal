"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  FileCheck2,
  FileText,
  History,
  Lock,
  Plus,
  Save,
  Scale,
  Shield,
  Trash2,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SelectField, TextField } from "@/components/ui/Form";
import { Alert } from "@/components/ui/Alert";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import {
  APPL_STATUS_REJECTED,
  applStatusKey,
} from "../los-application.constants";
import {
  fetchLoanApplicationDetail,
  fetchLoanApplicationTimeline,
  fetchLoanEligibility,
  saveCharge,
  saveDepositFreeze,
  saveGuarantor,
  saveMortgage,
  saveProject,
} from "../services/los-client";
import type {
  LoanApplicationCharge,
  LoanApplicationDepositFreeze,
  LoanApplicationDetail,
  LoanApplicationGuarantor,
  LoanApplicationMortgage,
  LoanApplicationProject,
  LoanApplicationTimelineEvent,
  LoanEligibilityResult,
} from "../types/los.types";

type LosApplicationDrawerProps = {
  applicationId: number | null;
  open: boolean;
  initialTab?: DrawerTab;
  onClose: () => void;
  onApplicationUpdated?: () => void;
};

type DrawerTab =
  | "overview"
  | "charges"
  | "guarantors"
  | "collateral"
  | "project"
  | "freezes"
  | "timeline"
  | "eligibility";

export function LosApplicationDrawer({
  applicationId,
  open,
  initialTab = "overview",
  onClose,
  onApplicationUpdated,
}: LosApplicationDrawerProps) {
  const format = useFormatter();
  const t = useTranslations("los.applications");
  const [tab, setTab] = useState<DrawerTab>("overview");
  const [detail, setDetail] = useState<LoanApplicationDetail | null>(null);
  const [timeline, setTimeline] = useState<LoanApplicationTimelineEvent[]>([]);
  const [eligibility, setEligibility] = useState<LoanEligibilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useToastText();
  const [actionError, setActionError] = useToastText();

  // Child record modals
  const [chargeModalOpen, setChargeModalOpen] = useState(false);
  const [chargeForm, setChargeForm] = useState({ chargeId: "", chargeAmount: "", waivedAmount: "", waiverReason: "" });

  const [guarantorModalOpen, setGuarantorModalOpen] = useState(false);
  const [guarantorForm, setGuarantorForm] = useState({ guarantorId: "", relationship: "", guaranteeAmount: "", consentDate: "", docPath: "" });

  const [mortgageModalOpen, setMortgageModalOpen] = useState(false);
  const [mortgageForm, setMortgageForm] = useState({ collateralTypeCd: "4", description: "", marketValue: "", ownershipTypeCd: "1", executionDate: "" });

  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [freezeForm, setFreezeForm] = useState({ depositAccountId: "", freezeTypeCd: "2", freezeAmount: "" });

  const [submittingChild, setSubmittingChild] = useState(false);
  const [childError, setChildError] = useToastText();

  const money = (val: number | null | undefined) => {
    if (val == null) return "—";
    return format.number(val, { style: "currency", currency: "INR" });
  };

  const loadData = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLoanApplicationDetail(id);
      setDetail(data);
      // Fetch timeline and eligibility in background
      fetchLoanApplicationTimeline(id).then(setTimeline).catch(() => {});
      fetchLoanEligibility(id).then(setEligibility).catch(() => {});
    } catch (err: any) {
      setError(err?.message || "Failed to load application details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && applicationId) {
      setTab(initialTab);
      setActionSuccess(null);
      void loadData(applicationId);
    } else {
      setDetail(null);
      setTimeline([]);
      setEligibility(null);
    }
  }, [open, applicationId, initialTab]);

  if (!open || !applicationId) return null;

  const getStageTone = (stage: string): BadgeTone => {
    if (stage === "disbursed") return "success";
    if (stage === "sanctioned") return "info";
    if (stage === "approval" || stage === "assessment") return "warning";
    if (stage === "field_verification") return "violet";
    if (stage === "rejected") return "danger";
    return "neutral";
  };

  const isReadOnly =
    detail?.appl_status_cd === APPL_STATUS_REJECTED || detail?.stage === "rejected";

  const applStatusLabel = (() => {
    if (!detail) return t("dash");
    const key = applStatusKey(detail.appl_status_cd);
    return (
      detail.appl_status?.trim() ||
      (key ? t(`applStatus.${key}`) : t("dash"))
    );
  })();

  const handleAddCharge = async () => {
    if (!detail) return;
    setSubmittingChild(true);
    setChildError(null);
    try {
      await saveCharge({
        application_id: detail.application_id,
        charge_id: Number(chargeForm.chargeId),
        charge_amount: chargeForm.chargeAmount ? Number(chargeForm.chargeAmount) : undefined,
        waived_amount: chargeForm.waivedAmount ? Number(chargeForm.waivedAmount) : undefined,
        waiver_reason: chargeForm.waiverReason || undefined,
      });
      setChargeModalOpen(false);
      setActionSuccess("Charge saved successfully");
      void loadData(detail.application_id);
      onApplicationUpdated?.();
    } catch (err: any) {
      setChildError(err?.message || "Failed to add charge");
    } finally {
      setSubmittingChild(false);
    }
  };

  const handleDeleteCharge = async (chargeId: number) => {
    if (!detail || !window.confirm("Are you sure you want to remove this charge?")) return;
    try {
      await saveCharge({ loan_charge_id: chargeId, tr_status_cd: 5 }, "status");
      setActionSuccess("Charge removed");
      void loadData(detail.application_id);
      onApplicationUpdated?.();
    } catch (err: any) {
      setActionError(err?.message || "Failed to remove charge");
    }
  };

  const handleAddGuarantor = async () => {
    if (!detail) return;
    setSubmittingChild(true);
    setChildError(null);
    try {
      await saveGuarantor({
        application_id: detail.application_id,
        guarantor_id: Number(guarantorForm.guarantorId),
        relationship_with_borrower: guarantorForm.relationship || undefined,
        guarantee_amount: guarantorForm.guaranteeAmount ? Number(guarantorForm.guaranteeAmount) : 0,
        consent_date: guarantorForm.consentDate || undefined,
        consent_document_path: guarantorForm.docPath || undefined,
      });
      setGuarantorModalOpen(false);
      setActionSuccess("Guarantor attached successfully");
      void loadData(detail.application_id);
      onApplicationUpdated?.();
    } catch (err: any) {
      setChildError(err?.message || "Failed to attach guarantor");
    } finally {
      setSubmittingChild(false);
    }
  };

  const handleReleaseGuarantor = async (guarantorId: number) => {
    if (!detail) return;
    const remarks = window.prompt("Enter remarks for releasing this guarantor:");
    if (!remarks) return;
    try {
      await saveGuarantor({ loan_guarantor_id: guarantorId, remarks }, "status");
      setActionSuccess("Guarantor released");
      void loadData(detail.application_id);
      onApplicationUpdated?.();
    } catch (err: any) {
      setActionError(err?.message || "Failed to release guarantor");
    }
  };

  const handleAddMortgage = async () => {
    if (!detail) return;
    setSubmittingChild(true);
    setChildError(null);
    try {
      await saveMortgage({
        application_id: detail.application_id,
        collateral_type_cd: Number(mortgageForm.collateralTypeCd),
        mortgage_description: mortgageForm.description,
        ownership_type_cd: Number(mortgageForm.ownershipTypeCd),
        market_value: mortgageForm.marketValue ? Number(mortgageForm.marketValue) : undefined,
        mortgage_execution_date: mortgageForm.executionDate || undefined,
      });
      setMortgageModalOpen(false);
      setActionSuccess("Collateral asset recorded");
      void loadData(detail.application_id);
      onApplicationUpdated?.();
    } catch (err: any) {
      setChildError(err?.message || "Failed to record mortgage");
    } finally {
      setSubmittingChild(false);
    }
  };

  const handleReleaseMortgage = async (mortgageId: number) => {
    if (!detail) return;
    const reason = window.prompt("Enter release reason:");
    if (!reason) return;
    try {
      await saveMortgage({ mortgage_id: mortgageId, release_reason: reason }, "status");
      setActionSuccess("Collateral released");
      void loadData(detail.application_id);
      onApplicationUpdated?.();
    } catch (err: any) {
      setActionError(err?.message || "Failed to release collateral");
    }
  };

  const handleAddDepositFreeze = async () => {
    if (!detail) return;
    setSubmittingChild(true);
    setChildError(null);
    try {
      await saveDepositFreeze({
        application_id: detail.application_id,
        deposit_account_id: Number(freezeForm.depositAccountId),
        freeze_type_cd: Number(freezeForm.freezeTypeCd),
        freeze_amount: Number(freezeForm.freezeAmount),
      });
      setFreezeModalOpen(false);
      setActionSuccess("Deposit lien freeze created");
      void loadData(detail.application_id);
      onApplicationUpdated?.();
    } catch (err: any) {
      setChildError(err?.message || "Failed to freeze deposit");
    } finally {
      setSubmittingChild(false);
    }
  };

  const handleReleaseDepositFreeze = async (freezeId: number) => {
    if (!detail) return;
    const reason = window.prompt("Enter release reason for deposit freeze:");
    if (!reason) return;
    try {
      await saveDepositFreeze({ freeze_id: freezeId, release_reason: reason, force: true }, "status");
      setActionSuccess("Deposit lien released");
      void loadData(detail.application_id);
      onApplicationUpdated?.();
    } catch (err: any) {
      setActionError(err?.message || "Failed to release freeze");
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-4xl flex-col bg-white shadow-2xl transition-all">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight">
                {detail?.application_no || `Application #${applicationId}`}
              </h2>
              {detail && (
                <Badge tone={getStageTone(detail.stage)} caps>
                  {detail.stage.replace("_", " ")}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {detail ? `${detail.member_name} (${detail.member_ref_code}) · ${detail.branch_name}` : "Loading..."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 px-6">
        {[
          { id: "overview", label: "Overview", icon: FileText },
          { id: "charges", label: `Charges (${detail?.charges?.length ?? 0})`, icon: Coins },
          { id: "guarantors", label: `Guarantors (${detail?.guarantors?.length ?? 0})`, icon: UserCheck },
          { id: "collateral", label: `Collateral (${detail?.mortgages?.length ?? 0})`, icon: Shield },
          { id: "project", label: "Project", icon: Scale },
          { id: "freezes", label: `Deposit Lien (${detail?.deposit_freezes?.length ?? 0})`, icon: Lock },
          { id: "timeline", label: "Timeline", icon: History },
          { id: "eligibility", label: "Eligibility & FOIR", icon: CheckCircle2 },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as DrawerTab)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors ${
                active
                  ? "border-teal-600 text-teal-700 bg-white"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <PageToast message={actionSuccess} />
        <PageToast message={actionError} tone="error" />
        <PageToast message={childError} tone="error" />
        {error && (
          <Alert tone="error" className="mb-4">
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
          </div>
        ) : !detail ? (
          <div className="text-center text-slate-500 py-12">No record loaded</div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {tab === "overview" && (
              <div className="space-y-6">
                {/* Financial Summary KPI Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Applied Amount</span>
                    <p className="mt-1 text-base font-bold text-slate-900">{money(detail.appl_amount)}</p>
                    <span className="text-[11px] text-slate-500">{detail.appl_tenure} Mo · {detail.repay_duration}</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Sanctioned</span>
                    <p className="mt-1 text-base font-bold text-teal-700">{money(detail.sanctioned_amount)}</p>
                    <span className="text-[11px] text-slate-500">
                      {t("columns.status")}: {applStatusLabel}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Disbursed</span>
                    <p className="mt-1 text-base font-bold text-indigo-700">{money(detail.disbursed_amount)}</p>
                    <span className="text-[11px] text-slate-500">Outstanding: {money(detail.principal_outstanding)}</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Charges Total</span>
                    <p className="mt-1 text-base font-bold text-amber-700">{money(detail.charges_total)}</p>
                    <span className="text-[11px] text-slate-500">Pending: {money(detail.charges_pending)}</span>
                  </div>
                </div>

                {/* Core Attributes */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Borrower Information</h3>
                    <dl className="space-y-2.5 text-xs">
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <dt className="text-slate-500">Borrower Name</dt>
                        <dd className="font-semibold text-slate-900">{detail.member_name}</dd>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <dt className="text-slate-500">Ref Code</dt>
                        <dd className="font-semibold text-slate-900">{detail.member_ref_code}</dd>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <dt className="text-slate-500">Mobile No</dt>
                        <dd className="font-semibold text-slate-900">{detail.mobile_no || "—"}</dd>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <dt className="text-slate-500">Customer Type</dt>
                        <dd className="font-semibold text-slate-900">{detail.cust_type}</dd>
                      </div>
                      {detail.joint1_name && (
                        <div className="flex justify-between border-b border-slate-100 pb-1.5">
                          <dt className="text-slate-500">Joint Applicant 1</dt>
                          <dd className="font-semibold text-slate-900">{detail.joint1_name}</dd>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Loan Cycle</dt>
                        <dd className="font-semibold text-slate-900">{detail.loan_cycle}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Loan Scheme & Operational</h3>
                    <dl className="space-y-2.5 text-xs">
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <dt className="text-slate-500">Scheme</dt>
                        <dd className="font-semibold text-slate-900">{detail.scheme_name} ({detail.scheme_code})</dd>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <dt className="text-slate-500">Branch</dt>
                        <dd className="font-semibold text-slate-900">{detail.branch_name} ({detail.branch_code})</dd>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <dt className="text-slate-500">Field Officer</dt>
                        <dd className="font-semibold text-slate-900">{detail.fo_name || "Unassigned"}</dd>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <dt className="text-slate-500">Application Date</dt>
                        <dd className="font-semibold text-slate-900">{detail.application_date}</dd>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <dt className="text-slate-500">Current Owner</dt>
                        <dd className="font-semibold text-slate-900">{detail.current_owner}</dd>
                      </div>
                      {detail.loan_account_no && (
                        <div className="flex justify-between">
                          <dt className="text-slate-500">Loan Account No</dt>
                          <dd className="font-semibold text-teal-700">{detail.loan_account_no}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                {/* Group Members (if JLG / Group) */}
                {detail.cust_type_cd === 1 && detail.members && detail.members.length > 0 && (
                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        JLG Group Members ({detail.members.length})
                      </h3>
                      <span className="text-xs text-slate-500">
                        Total Sum: {money(detail.members.reduce((s, m) => s + m.requested_amount, 0))}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="p-2">Member</th>
                            <th className="p-2">Role</th>
                            <th className="p-2">Purpose</th>
                            <th className="p-2 text-right">Requested</th>
                            <th className="p-2 text-right">Income</th>
                            <th className="p-2 text-right">Obligation</th>
                            <th className="p-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detail.members.map((m) => (
                            <tr key={m.customer_id} className="hover:bg-slate-50">
                              <td className="p-2 font-medium text-slate-900">
                                {m.member_name} <span className="text-slate-400">({m.ref_code})</span>
                              </td>
                              <td className="p-2 text-slate-600">{m.member_role || "Member"}</td>
                              <td className="p-2 text-slate-600">{m.loan_purpose || "—"}</td>
                              <td className="p-2 text-right font-semibold text-slate-900">{money(m.requested_amount)}</td>
                              <td className="p-2 text-right text-slate-600">{money(m.monthly_income)}</td>
                              <td className="p-2 text-right text-slate-600">{money(m.existing_loan_obligation)}</td>
                              <td className="p-2 text-center">
                                <Badge tone="info">{m.appl_status || "Active"}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CHARGES TAB */}
            {tab === "charges" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Application Stage Charges</h3>
                    <p className="text-xs text-slate-500">Attached scheme fees and upfront deductions</p>
                  </div>
                  {!isReadOnly && (
                    <Button
                      type="button"
                      size="sm"
                      icon={Plus}
                      onClick={() => {
                        setChargeForm({ chargeId: "", chargeAmount: "", waivedAmount: "", waiverReason: "" });
                        setChildError(null);
                        setChargeModalOpen(true);
                      }}
                    >
                      Add Extra Charge
                    </Button>
                  )}
                </div>

                {detail.charges.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                    No charges attached to this application.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="p-3">Charge Name</th>
                          <th className="p-3">Timing</th>
                          <th className="p-3 text-right">Charge Amount</th>
                          <th className="p-3 text-right">Tax</th>
                          <th className="p-3 text-right">Waived</th>
                          <th className="p-3 text-right font-semibold">Net Payable</th>
                          <th className="p-3 text-center">Status</th>
                          {!isReadOnly && <th className="p-3 text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {detail.charges.map((c) => (
                          <tr key={c.loan_charge_id} className="hover:bg-slate-50">
                            <td className="p-3 font-semibold text-slate-900">
                              {c.charge_name}
                              {c.waiver_reason && (
                                <p className="text-[10px] text-amber-700 italic">Waiver: {c.waiver_reason}</p>
                              )}
                            </td>
                            <td className="p-3 text-slate-600">{c.deduct_during}</td>
                            <td className="p-3 text-right text-slate-700">{money(c.charge_amount)}</td>
                            <td className="p-3 text-right text-slate-500">{money(c.tax_amount)}</td>
                            <td className="p-3 text-right text-amber-700 font-medium">
                              {c.waived_amount > 0 ? `-${money(c.waived_amount)}` : "0"}
                            </td>
                            <td className="p-3 text-right font-bold text-slate-900">{money(c.net_amount)}</td>
                            <td className="p-3 text-center">
                              <Badge tone={c.tr_status_cd === 2 ? "success" : "warning"}>
                                {c.tr_status}
                              </Badge>
                            </td>
                            {!isReadOnly && (
                              <td className="p-3 text-right">
                                {c.tr_status_cd === 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCharge(c.loan_charge_id)}
                                    className="text-red-500 hover:text-red-700"
                                    title="Delete pending charge"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* GUARANTORS TAB */}
            {tab === "guarantors" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Loan Guarantors</h3>
                    <p className="text-xs text-slate-500">Active member guarantees backing this application</p>
                  </div>
                  {!isReadOnly && (
                    <Button
                      type="button"
                      size="sm"
                      icon={Plus}
                      onClick={() => {
                        setGuarantorForm({ guarantorId: "", relationship: "", guaranteeAmount: "", consentDate: "", docPath: "" });
                        setChildError(null);
                        setGuarantorModalOpen(true);
                      }}
                    >
                      Attach Guarantor
                    </Button>
                  )}
                </div>

                {detail.guarantors.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                    No guarantors attached yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {detail.guarantors.map((g) => (
                      <div key={g.loan_guarantor_id} className="rounded-xl border border-slate-200 p-4 shadow-sm bg-white">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">{g.guarantor_name}</h4>
                            <p className="text-xs text-slate-500">{g.ref_code} · {g.relationship_with_borrower || "Guarantor"}</p>
                          </div>
                          <Badge tone={g.release_date ? "neutral" : "success"}>
                            {g.release_date ? "Released" : "Active"}
                          </Badge>
                        </div>
                        <div className="mt-3 space-y-1 text-xs">
                          <p><span className="text-slate-500">Guarantee Amount:</span> <span className="font-semibold text-slate-900">{money(g.guarantee_amount)}</span></p>
                          <p><span className="text-slate-500">Mobile:</span> {g.mobile_no || "—"}</p>
                          <p><span className="text-slate-500">Consent Date:</span> {g.consent_date ? g.consent_date.slice(0, 10) : "—"}</p>
                          {g.consent_document_url && (
                            <p className="mt-2">
                              <a
                                href={g.consent_document_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-semibold text-teal-600 hover:underline"
                              >
                                View Consent Document
                              </a>
                            </p>
                          )}
                        </div>
                        {!isReadOnly && !g.release_date && (
                          <div className="mt-3 border-t border-slate-100 pt-3 text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => handleReleaseGuarantor(g.loan_guarantor_id)}
                            >
                              Release Guarantor
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* COLLATERAL & MORTGAGES TAB */}
            {tab === "collateral" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Mortgage & Collateral Assets</h3>
                    <p className="text-xs text-slate-500">Jewellery, property, certificates, or assets pledged</p>
                  </div>
                  {!isReadOnly && (
                    <Button
                      type="button"
                      size="sm"
                      icon={Plus}
                      onClick={() => {
                        setMortgageForm({ collateralTypeCd: "4", description: "", marketValue: "", ownershipTypeCd: "1", executionDate: "" });
                        setChildError(null);
                        setMortgageModalOpen(true);
                      }}
                    >
                      Add Collateral
                    </Button>
                  )}
                </div>

                {detail.mortgages.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                    No collateral or mortgages registered.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {detail.mortgages.map((m) => (
                      <div key={m.mortgage_id} className="rounded-xl border border-slate-200 p-4 shadow-sm bg-white">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-teal-600 tracking-wider uppercase">{m.mortgage_no}</span>
                            <h4 className="font-bold text-sm text-slate-900">{m.mortgage_description}</h4>
                          </div>
                          <Badge tone={m.release_date ? "neutral" : "info"}>
                            {m.release_date ? "Released" : m.collateral_type}
                          </Badge>
                        </div>
                        <div className="mt-3 space-y-1 text-xs">
                          <p><span className="text-slate-500">Market Value:</span> <span className="font-semibold text-slate-900">{money(m.market_value)}</span></p>
                          <p><span className="text-slate-500">Ownership:</span> {m.ownership_type || "Self"}</p>
                          <p><span className="text-slate-500">Execution Date:</span> {m.mortgage_execution_date || "—"}</p>
                          {m.release_reason && (
                            <p className="text-slate-500 italic">Reason: {m.release_reason}</p>
                          )}
                        </div>
                        {!isReadOnly && !m.release_date && (
                          <div className="mt-3 border-t border-slate-100 pt-3 text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => handleReleaseMortgage(m.mortgage_id)}
                            >
                              Release Asset
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PROJECT TAB */}
            {tab === "project" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Project / Business Activity</h3>
                    <p className="text-xs text-slate-500">Details of the enterprise funded by this loan</p>
                  </div>
                </div>

                {!detail.project ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                    No enterprise or project profile recorded for this application.
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 p-5 bg-white space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <h4 className="text-base font-bold text-slate-900">{detail.project.project_name}</h4>
                      <p className="text-xs text-slate-500">
                        Category: {detail.project.project_category || "General"} · Activity: {detail.project.business_activity || "—"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <span className="text-slate-500 text-[11px]">Total Project Cost</span>
                        <p className="font-bold text-slate-900 text-sm mt-1">{money(detail.project.total_project_cost)}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <span className="text-slate-500 text-[11px]">Applicant Contribution</span>
                        <p className="font-bold text-slate-900 text-sm mt-1">{money(detail.project.applicant_contribution)}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <span className="text-slate-500 text-[11px]">Proposed Loan</span>
                        <p className="font-bold text-teal-700 text-sm mt-1">{money(detail.project.proposed_loan_amount)}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <span className="text-slate-500 text-[11px]">Expected Monthly Net Income</span>
                        <p className="font-bold text-indigo-700 text-sm mt-1">{money(detail.project.expected_monthly_net_income)}</p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600">
                      <p><span className="font-medium text-slate-900">Address:</span> {detail.project.project_address || "—"}</p>
                      {detail.project.latitude && detail.project.longitude && (
                        <p className="mt-1"><span className="font-medium text-slate-900">Coordinates:</span> {detail.project.latitude}, {detail.project.longitude}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DEPOSIT FREEZES (LIEN) TAB */}
            {tab === "freezes" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Deposit Account Liens</h3>
                    <p className="text-xs text-slate-500">Hold on savings / term deposit balances as collateral</p>
                  </div>
                  {!isReadOnly && (
                    <Button
                      type="button"
                      size="sm"
                      icon={Plus}
                      onClick={() => {
                        setFreezeForm({ depositAccountId: "", freezeTypeCd: "2", freezeAmount: "" });
                        setChildError(null);
                        setFreezeModalOpen(true);
                      }}
                    >
                      Mark Lien
                    </Button>
                  )}
                </div>

                {detail.deposit_freezes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                    No active deposit liens.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {detail.deposit_freezes.map((f) => (
                      <div key={f.freeze_id} className="rounded-xl border border-slate-200 p-4 shadow-sm bg-white">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase">{f.freeze_reference_no}</span>
                            <h4 className="font-bold text-sm text-slate-900">A/c: {f.deposit_account_no}</h4>
                            <p className="text-xs text-slate-500">{f.deposit_type} · {f.holder_name}</p>
                          </div>
                          <Badge tone={f.release_date ? "neutral" : "warning"}>
                            {f.release_date ? "Released" : f.freeze_type}
                          </Badge>
                        </div>
                        <div className="mt-3 space-y-1 text-xs">
                          <p><span className="text-slate-500">Frozen Lien Amount:</span> <span className="font-bold text-slate-900">{money(f.freeze_amount)}</span></p>
                          <p><span className="text-slate-500">Available Balance:</span> {money(f.available_balance)}</p>
                          <p><span className="text-slate-500">Date Marked:</span> {f.freeze_date ? f.freeze_date.slice(0, 10) : "—"}</p>
                          {f.release_reason && (
                            <p className="text-slate-500 italic">Release reason: {f.release_reason}</p>
                          )}
                        </div>
                        {!isReadOnly && !f.release_date && (
                          <div className="mt-3 border-t border-slate-100 pt-3 text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => handleReleaseDepositFreeze(f.freeze_id)}
                            >
                              Release Lien
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TIMELINE TAB */}
            {tab === "timeline" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Application History & Timeline</h3>
                  <p className="text-xs text-slate-500">Chronological lifecycle of events and inspections</p>
                </div>

                {timeline.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                    No timeline records available yet.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-teal-500/30 pl-6 ml-4 space-y-6">
                    {timeline.map((evt) => (
                      <div key={evt.seq} className="relative">
                        <span className="absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-white text-[10px] font-bold">
                          {evt.seq}
                        </span>
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                              {evt.stage.replace("_", " ")}
                            </span>
                            <span className="text-xs text-slate-400">{evt.date}</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-600">By: <span className="font-semibold text-slate-800">{evt.by}</span></p>
                          {evt.result && (
                            <p className="mt-1 text-xs font-semibold text-teal-700">Result: {evt.result}</p>
                          )}
                          {evt.amount && (
                            <p className="mt-1 text-xs text-slate-800">Amount: <span className="font-bold">{money(evt.amount)}</span></p>
                          )}
                          {evt.ref_no && (
                            <p className="text-xs text-slate-500">Reference: {evt.ref_no}</p>
                          )}
                          {evt.remarks && (
                            <p className="mt-2 text-xs italic text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                              &ldquo;{evt.remarks}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ELIGIBILITY & FOIR TAB */}
            {tab === "eligibility" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Credit Assessment & Eligibility</h3>
                  <p className="text-xs text-slate-500">System evaluation of mandatory credit rules and FOIR</p>
                </div>

                {!eligibility ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                    Evaluating eligibility parameters...
                  </div>
                ) : (
                  <>
                    {/* FOIR & Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">FOIR Percentage</span>
                        <p className={`mt-1 text-xl font-black ${eligibility.foir_percent > 50 ? "text-red-600" : "text-teal-700"}`}>
                          {eligibility.foir_percent.toFixed(2)}%
                        </p>
                        <span className="text-[10px] text-slate-500">Threshold: ≤ 50%</span>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Max Eligible Amount</span>
                        <p className="mt-1 text-lg font-bold text-slate-900">{money(eligibility.max_eligible_amount)}</p>
                        <span className="text-[10px] text-slate-500">At applied duration</span>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Monthly Income</span>
                        <p className="mt-1 text-base font-bold text-slate-900">{money(eligibility.monthly_income)}</p>
                        <span className="text-[10px] text-slate-500">Obligations: {money(eligibility.existing_obligation)}</span>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Proposed Installment</span>
                        <p className="mt-1 text-base font-bold text-slate-900">{money(eligibility.proposed_monthly_installment)}</p>
                        <span className="text-[10px] text-slate-500">RoI: {eligibility.interest_rate}%</span>
                      </div>
                    </div>

                    {/* Overall status banner */}
                    <div
                      className={`flex items-center gap-3 rounded-xl border p-4 ${
                        eligibility.all_mandatory_passed
                          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                          : "border-red-200 bg-red-50 text-red-900"
                      }`}
                    >
                      {eligibility.all_mandatory_passed ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <h4 className="font-bold text-xs">
                          {eligibility.all_mandatory_passed
                            ? "All Mandatory Eligibility Rules Passed"
                            : "Mandatory Eligibility Rule Failed"}
                        </h4>
                        <p className="text-xs text-slate-600">
                          {eligibility.not_evaluated_count > 0
                            ? `${eligibility.not_evaluated_count} non-mandatory rules could not be evaluated due to missing applicant data.`
                            : "All parameters successfully verified against active scheme criteria."}
                        </p>
                      </div>
                    </div>

                    {/* Rules Table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="p-3">Applicant / Member</th>
                            <th className="p-3">Parameter</th>
                            <th className="p-3">Rule Definition</th>
                            <th className="p-3">Actual Value</th>
                            <th className="p-3 text-center">Type</th>
                            <th className="p-3 text-center">Result</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {eligibility.checks.map((chk, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-3 font-medium text-slate-900">{chk.member_name}</td>
                              <td className="p-3 font-semibold text-slate-800">{chk.parameter_name}</td>
                              <td className="p-3 text-slate-600">{chk.rule}</td>
                              <td className="p-3 font-mono text-slate-900">{chk.actual_value}</td>
                              <td className="p-3 text-center">
                                <Badge tone={chk.is_mandatory ? "warning" : "neutral"}>
                                  {chk.is_mandatory ? "Mandatory" : "Optional"}
                                </Badge>
                              </td>
                              <td className="p-3 text-center">
                                {chk.passed === true ? (
                                  <Badge tone="success">Passed</Badge>
                                ) : chk.passed === false ? (
                                  <Badge tone="danger">Failed</Badge>
                                ) : (
                                  <Badge tone="neutral">Not Evaluated</Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL: ADD EXTRA CHARGE */}
      <Modal
        open={chargeModalOpen}
        title="Add Application Charge"
        size="md"
        onClose={() => setChargeModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setChargeModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCharge} icon={Save} disabled={submittingChild || !chargeForm.chargeId}>
              {submittingChild ? "Saving..." : "Save Charge"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <TextField
            label="Charge ID / Master Code"
            value={chargeForm.chargeId}
            required
            placeholder="e.g. 3"
            onChange={(v) => setChargeForm((f) => ({ ...f, chargeId: v }))}
          />
          <TextField
            label="Custom Amount (optional)"
            value={chargeForm.chargeAmount}
            placeholder="Default from master rate"
            restrict="decimal"
            onChange={(v) => setChargeForm((f) => ({ ...f, chargeAmount: v }))}
          />
          <TextField
            label="Waived Amount (optional)"
            value={chargeForm.waivedAmount}
            placeholder="Amount to waive"
            restrict="decimal"
            onChange={(v) => setChargeForm((f) => ({ ...f, waivedAmount: v }))}
          />
          <TextField
            label="Waiver Reason (if waived)"
            value={chargeForm.waiverReason}
            placeholder="Reason for discount or waiver"
            onChange={(v) => setChargeForm((f) => ({ ...f, waiverReason: v }))}
          />
        </div>
      </Modal>

      {/* MODAL: ATTACH GUARANTOR */}
      <Modal
        open={guarantorModalOpen}
        title="Attach Guarantor"
        size="md"
        onClose={() => setGuarantorModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setGuarantorModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddGuarantor} icon={UserCheck} disabled={submittingChild || !guarantorForm.guarantorId}>
              {submittingChild ? "Attaching..." : "Attach Guarantor"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <TextField
            label="Guarantor Member ID"
            value={guarantorForm.guarantorId}
            required
            placeholder="Member ID (active customer)"
            onChange={(v) => setGuarantorForm((f) => ({ ...f, guarantorId: v }))}
          />
          <TextField
            label="Relationship with Borrower"
            value={guarantorForm.relationship}
            placeholder="e.g. Neighbor, Relative"
            onChange={(v) => setGuarantorForm((f) => ({ ...f, relationship: v }))}
          />
          <TextField
            label="Guarantee Amount"
            value={guarantorForm.guaranteeAmount}
            placeholder="Amount guaranteed"
            restrict="decimal"
            onChange={(v) => setGuarantorForm((f) => ({ ...f, guaranteeAmount: v }))}
          />
          <TextField
            label="Consent Date"
            type="date"
            value={guarantorForm.consentDate}
            onChange={(v) => setGuarantorForm((f) => ({ ...f, consentDate: v }))}
          />
          <TextField
            label="Consent Document Path (optional)"
            value={guarantorForm.docPath}
            placeholder="e.g. loan/guarantor/consent.pdf"
            onChange={(v) => setGuarantorForm((f) => ({ ...f, docPath: v }))}
          />
        </div>
      </Modal>

      {/* MODAL: ADD MORTGAGE / COLLATERAL */}
      <Modal
        open={mortgageModalOpen}
        title="Add Collateral Asset"
        size="md"
        onClose={() => setMortgageModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setMortgageModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMortgage} icon={Save} disabled={submittingChild || !mortgageForm.description}>
              {submittingChild ? "Saving..." : "Save Asset"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <SelectField
            label="Collateral Type"
            value={mortgageForm.collateralTypeCd}
            options={[
              { value: "1", label: "Property / Land" },
              { value: "2", label: "Vehicle" },
              { value: "3", label: "Fixed Deposit" },
              { value: "4", label: "Jewellery / Gold" },
              { value: "5", label: "Livestock / Cattle" },
              { value: "6", label: "Other Assets" },
            ]}
            onChange={(v) => setMortgageForm((f) => ({ ...f, collateralTypeCd: v }))}
          />
          <TextField
            label="Asset Description"
            value={mortgageForm.description}
            required
            placeholder="e.g. Gold chain 20g 22K"
            onChange={(v) => setMortgageForm((f) => ({ ...f, description: v }))}
          />
          <TextField
            label="Assessed Market Value"
            value={mortgageForm.marketValue}
            restrict="decimal"
            placeholder="Current valuation in INR"
            onChange={(v) => setMortgageForm((f) => ({ ...f, marketValue: v }))}
          />
          <TextField
            label="Execution Date"
            type="date"
            value={mortgageForm.executionDate}
            onChange={(v) => setMortgageForm((f) => ({ ...f, executionDate: v }))}
          />
        </div>
      </Modal>

      {/* MODAL: MARK DEPOSIT LIEN FREEZE */}
      <Modal
        open={freezeModalOpen}
        title="Mark Deposit Lien Freeze"
        size="md"
        onClose={() => setFreezeModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setFreezeModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddDepositFreeze} icon={Lock} disabled={submittingChild || !freezeForm.depositAccountId || !freezeForm.freezeAmount}>
              {submittingChild ? "Creating..." : "Mark Lien"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <TextField
            label="Deposit Account ID"
            value={freezeForm.depositAccountId}
            required
            placeholder="e.g. 17"
            onChange={(v) => setFreezeForm((f) => ({ ...f, depositAccountId: v }))}
          />
          <SelectField
            label="Freeze Type"
            value={freezeForm.freezeTypeCd}
            options={[
              { value: "1", label: "Full (Entire balance)" },
              { value: "2", label: "Partial (Specified amount)" },
            ]}
            onChange={(v) => setFreezeForm((f) => ({ ...f, freezeTypeCd: v }))}
          />
          <TextField
            label="Freeze Amount"
            value={freezeForm.freezeAmount}
            required
            restrict="decimal"
            placeholder="Amount to hold in INR"
            onChange={(v) => setFreezeForm((f) => ({ ...f, freezeAmount: v }))}
          />
        </div>
      </Modal>
    </div>
  );
}

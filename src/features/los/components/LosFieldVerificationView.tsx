"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle, MapPin, Plus, RotateCw, ShieldCheck, UserCheck, XCircle } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { ModulePageShell } from "@/components/shared/ModulePageShell";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SelectField, TextField } from "@/components/ui/Form";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { loanModulePage } from "@/features/loan/loan-screen.data";
import { fetchLoanInspections, isLosClientError, saveLoanInspection } from "../services/los-client";
import { fetchStaffList } from "@/features/master/staff/services/staff-client";
import { fetchBranchList } from "@/features/master/branch/services/branch-client";
import type { LoanInspectionRow } from "../types/los.types";

function resultTone(cd: number | undefined): BadgeTone {
  if (cd === 1) return "success"; // Positive
  if (cd === 2) return "danger"; // Negative
  if (cd === 3) return "warning"; // Re-Inspection
  return "neutral";
}

export function LosFieldVerificationView() {
  const t = useTranslations("loanModule.screens.fieldVerification");
  const tModule = useTranslations("loanModule");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");
  const [rows, setRows] = useState<LoanInspectionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Visit Record Modal
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);
  const [editingInspection, setEditingInspection] = useState<LoanInspectionRow | null>(null);
  const [inspectAppId, setInspectAppId] = useState("");
  const [inspectionDate, setInspectionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [foId, setFoId] = useState("");
  const [allVerified, setAllVerified] = useState(true);
  const [recommendedAmount, setRecommendedAmount] = useState("");
  const [inspectionResultCd, setInspectionResultCd] = useState("1"); // 1 Positive
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [photoPath, setPhotoPath] = useState("");

  const [staffOptions, setStaffOptions] = useState<{ value: string; label: string }[]>([]);
  const [branchOptions, setBranchOptions] = useState<{ value: string; label: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useToastText();
  const [toastMessage, setToastMessage] = useToastText();

  const pageMeta = useMemo(
    () => loanModulePage("/los/field-verification", "loanModule.screens.fieldVerification"),
    [],
  );

  useEffect(() => {
    fetchBranchList({ page: 1, perPage: 100, isActive: 1 })
      .then((res) => setBranchOptions(res.items.map((b) => ({ value: String(b.branchId), label: b.branchName }))))
      .catch(() => {});

    fetchStaffList({ page: 1, perPage: 100, status: 1 })
      .then((res) => setStaffOptions(res.items.map((s) => ({ value: String(s.staffId), label: `${s.fullName} (${s.employeeCode})` }))))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await fetchLoanInspections({
        page,
        per_page: pageSize,
        pending_only: activeTab === "pending",
        branch_id: branchFilter ? Number(branchFilter) : undefined,
        inspection_result_cd: resultFilter ? Number(resultFilter) : undefined,
        keyword: appliedSearch || undefined,
      });
      const items = Array.isArray(result?.items) ? result.items : [];
      setRows(items);
      setTotal(result?.total ?? items.length);
    } catch (err: unknown) {
      setLoadError(
        isLosClientError(err)
          ? err.message
          : err instanceof Error
            ? err.message
            : tModule("loadError"),
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, appliedSearch, branchFilter, page, pageSize, resultFilter, tModule]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setAppliedSearch(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  const money = (val: number | null | undefined) => {
    if (val == null) return "—";
    return format.number(val, { style: "currency", currency: "INR" });
  };

  const openAddModal = (app?: LoanInspectionRow) => {
    setEditingInspection(null);
    setInspectAppId(app ? String(app.loan_application_id) : "");
    setInspectionDate(new Date().toISOString().slice(0, 10));
    setFoId(app?.fo_id ? String(app.fo_id) : "");
    setAllVerified(true);
    setRecommendedAmount(app ? String(app.appl_amount) : "");
    setInspectionResultCd("1");
    setInspectionNotes("");
    setLatitude("");
    setLongitude("");
    setPhotoPath("");
    setFormError(null);
    setInspectionModalOpen(true);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
      },
      (err) => {
        alert(`Location access denied or unavailable: ${err.message}`);
      },
    );
  };

  const handleSaveInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const appId = Number(inspectAppId);
    if (!appId || appId <= 0) {
      setFormError("Application ID is required");
      return;
    }

    if (!foId) {
      setFormError("Field Officer is required");
      return;
    }

    setSubmitting(true);
    try {
      await saveLoanInspection({
        loan_application_id: appId,
        inspection_date: inspectionDate,
        fo_id: Number(foId),
        all_verified: allVerified,
        recommended_amount: recommendedAmount ? Number(recommendedAmount) : undefined,
        inspection_result_cd: Number(inspectionResultCd),
        inspection_notes: inspectionNotes || undefined,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        photo_path: photoPath || undefined,
      });

      setInspectionModalOpen(false);
      setToastMessage("Field verification recorded successfully");
      void load();
    } catch (err: unknown) {
      setFormError(
        isLosClientError(err)
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to save verification",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo<DataTableColumn<LoanInspectionRow>[]>(
    () => [
      {
        id: "application_no",
        header: t("columns.appNo"),
        cell: (row) => (
          <span className="font-bold text-slate-900 block">{row.application_no}</span>
        ),
      },
      {
        id: "borrower",
        header: "Borrower / Group",
        cell: (row) => (
          <div>
            <span className="font-semibold text-slate-900 block">{row.member_name}</span>
            <span className="text-[11px] text-slate-500">{row.scheme_name} · {row.branch_name}</span>
          </div>
        ),
      },
      {
        id: "appl_amount",
        header: "Requested",
        align: "end",
        cell: (row) => (
          <span className="font-bold text-slate-900 block">{money(row.appl_amount)}</span>
        ),
      },
      {
        id: "inspection_date",
        header: t("columns.inspectionDate"),
        cell: (row) => (
          <span className="text-slate-700">{row.inspection_date || "—"}</span>
        ),
      },
      {
        id: "fo_name",
        header: t("columns.officer"),
        cell: (row) => (
          <span className="font-medium text-slate-800">{row.fo_name || "Unassigned"}</span>
        ),
      },
      {
        id: "result",
        header: t("columns.result"),
        cell: (row) => (
          <div>
            {row.inspection_result_cd ? (
              <Badge tone={resultTone(row.inspection_result_cd)} caps>
                {row.inspection_result || "Verified"}
              </Badge>
            ) : (
              <Badge tone="warning">Pending Inspection</Badge>
            )}
            {row.recommended_amount != null && (
              <span className="text-[11px] font-semibold text-slate-700 block mt-0.5">
                Rec: {money(row.recommended_amount)}
              </span>
            )}
          </div>
        ),
      },
    ],
    [format, t],
  );

  return (
    <ModulePageShell page={pageMeta}>
      <PageToast message={toastMessage} />

      {/* TABS HEADER: PENDING VS COMPLETED */}
      <div className="flex border-b border-slate-200 bg-white px-2 mb-2 rounded-t-xl">
        <button
          type="button"
          onClick={() => {
            setActiveTab("pending");
            setPage(1);
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors ${
            activeTab === "pending"
              ? "border-teal-600 text-teal-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          Pending Field Verification
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("completed");
            setPage(1);
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors ${
            activeTab === "completed"
              ? "border-teal-600 text-teal-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Verified / All History
        </button>
      </div>

      <FilterPanel
        onReset={() => {
          setSearch("");
          setBranchFilter("");
          setResultFilter("");
          setAppliedSearch("");
          setPage(1);
        }}
      >
        <div className="min-w-[12rem] sm:max-w-[18rem]">
          <TextField
            label="Search Verification"
            value={search}
            placeholder="Application no, borrower..."
            onChange={setSearch}
          />
        </div>
        <div className="min-w-[10rem] sm:max-w-[14rem]">
          <SelectField
            label="Branch"
            value={branchFilter}
            options={branchOptions}
            placeholder="All Branches"
            onChange={setBranchFilter}
          />
        </div>
        {activeTab === "completed" && (
          <div className="min-w-[10rem] sm:max-w-[14rem]">
            <SelectField
              label="Inspection Result"
              value={resultFilter}
              options={[
                { value: "", label: "All Results" },
                { value: "1", label: "1 Positive (Verified)" },
                { value: "2", label: "2 Negative (Mismatch)" },
                { value: "3", label: "3 Re-Inspection" },
              ]}
              onChange={setResultFilter}
            />
          </div>
        )}
      </FilterPanel>

      <DataTable
        title={activeTab === "pending" ? "Pending Field Verifications" : "Field Verification History"}
        description="Verify house visit, physical stock/assets, GPS location and recommend sanction amount"
        actions={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              icon={RotateCw}
              onClick={() => void load()}
            >
              Refresh
            </Button>
            <Button
              type="button"
              icon={Plus}
              onClick={() => openAddModal()}
            >
              Record Visit
            </Button>
          </div>
        }
        data={rows}
        columns={columns}
        getRowKey={(row) => String(row.inspection_id || row.loan_application_id)}
        loading={loading}
        error={loadError != null}
        errorMessage={loadError ?? undefined}
        onRetry={() => void load()}
        emptyTitle="No Verifications"
        emptyMessage="No pending verifications found."
        minWidth="840px"
        pagination={{
          page,
          pageSize,
          total,
          pageSizeOptions: [20, 50, 100],
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
          },
        }}
        rowActions={{
          header: "Visit",
          render: (row) => (
            <Button
              type="button"
              size="sm"
              icon={UserCheck}
              onClick={() => openAddModal(row)}
            >
              {row.inspection_id ? "Re-Inspect" : "Inspect"}
            </Button>
          ),
        }}
      />

      {/* RECORD VISIT MODAL */}
      <Modal
        open={inspectionModalOpen}
        title="Record Field Verification Visit"
        size="lg"
        onClose={() => setInspectionModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setInspectionModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveInspection} icon={ShieldCheck} disabled={submitting}>
              {submitting ? "Saving..." : "Submit Verification"}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveInspection} className="space-y-4">
          <PageToast message={formError} tone="error" />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField
              label="Loan Application ID"
              value={inspectAppId}
              required
              placeholder="e.g. 13"
              onChange={setInspectAppId}
            />
            <TextField
              label="Visit / Inspection Date"
              type="date"
              value={inspectionDate}
              required
              onChange={setInspectionDate}
            />
            <SelectField
              label="Field Officer"
              value={foId}
              required
              options={staffOptions}
              placeholder="Select Officer"
              onChange={setFoId}
            />
            <SelectField
              label="Inspection Result"
              value={inspectionResultCd}
              required
              options={[
                { value: "1", label: "1 Positive (Verified & Recommended)" },
                { value: "2", label: "2 Negative (Mismatch / Rejected)" },
                { value: "3", label: "3 Re-Inspection Required" },
              ]}
              onChange={setInspectionResultCd}
            />
            <TextField
              label="Recommended Amount"
              value={recommendedAmount}
              restrict="decimal"
              placeholder="Recommended loan amount"
              onChange={setRecommendedAmount}
            />
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="all_verified"
                checked={allVerified}
                onChange={(e) => setAllVerified(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="all_verified" className="text-xs font-semibold text-slate-800">
                All Documents & Assets Physically Verified
              </label>
            </div>
          </div>

          {/* GPS Coordinates */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-teal-600" />
                Visit GPS Geolocation
              </span>
              <Button type="button" size="sm" variant="secondary" onClick={handleGetCurrentLocation}>
                Capture Device GPS
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Latitude"
                value={latitude}
                placeholder="e.g. 22.5726"
                onChange={setLatitude}
              />
              <TextField
                label="Longitude"
                value={longitude}
                placeholder="e.g. 88.3639"
                onChange={setLongitude}
              />
            </div>
          </div>

          <TextField
            label="Visit Photo Path / Storage URL"
            value={photoPath}
            placeholder="e.g. loan/inspection/20261028_visit.jpg"
            onChange={setPhotoPath}
          />

          <TextField
            label="Field Officer Notes & Observations"
            value={inspectionNotes}
            placeholder="House, family members, business stock observed..."
            onChange={setInspectionNotes}
          />
        </form>
      </Modal>
    </ModulePageShell>
  );
}

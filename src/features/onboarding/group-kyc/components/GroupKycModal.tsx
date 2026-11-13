"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import {
  AlertCircle,
  Check,
  FileText,
  Pencil,
  Plus,
  Power,
  PowerOff,
  RotateCcw,
  Save,
  X,
} from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DateField, SelectField, TextField } from "@/components/ui/Form";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/toast";
import { endpoints } from "@/lib/api/endpoints";
import { fetchApplOptions } from "@/features/master/appl-options/services/appl-options-client";
import type { Group } from "@/features/onboarding/group-management/types/group.types";
import { KycImageField } from "@/features/onboarding/member-kyc/components/KycImageField";
import { todayYmd } from "@/features/onboarding/member-kyc/lib/kyc-rules";
import {
  GROUP_DOC_TYPES,
  GROUP_KYC_NO_MAX,
  OPT_GROUP_DOC_TYPE,
  OPT_GROUP_DOC_TYPE_NAME,
  groupKycNumberError,
  normalizeGroupKycNo,
  type GroupDocType,
} from "../lib/group-kyc-rules";
import {
  changeGroupKycStatus,
  fetchGroupKyc,
  isGroupKycClientError,
  saveGroupKyc,
  verifyGroupKyc,
} from "../services/group-kyc-client";
import type { GroupKycDocument, KycVerifyStatus } from "../types/group-kyc.types";

const GROUP_CLOSED = 4;

type FormState = {
  groupKycId?: number;
  docTypeCd: string;
  kycNo: string;
  issueDate: string;
  expiryDate: string;
  photoPath: string;
  backPhotoPath: string;
};

const emptyForm = (): FormState => ({
  docTypeCd: "",
  kycNo: "",
  issueDate: "",
  expiryDate: "",
  photoPath: "",
  backPhotoPath: "",
});

function isDocType(value: number): value is GroupDocType {
  return (GROUP_DOC_TYPES as readonly number[]).includes(value);
}

export function GroupKycModal({
  group,
  onClose,
}: {
  group: Group | null;
  onClose: () => void;
}) {
  const t = useTranslations("onboarding.groupKyc");
  const format = useFormatter();
  const open = group != null;
  const [items, setItems] = useState<GroupKycDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [types, setTypes] = useState<{ value: string; label: string }[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [fieldError, setFieldError] = useState("");
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [decision, setDecision] = useState<{ document: GroupKycDocument; status: KycVerifyStatus } | null>(
    null,
  );
  const [remarks, setRemarks] = useState("");
  const locked = group?.statusCd === GROUP_CLOSED;

  useEffect(() => {
    if (!open) return;
    setForm(null);
    setFieldError("");
    fetchApplOptions(OPT_GROUP_DOC_TYPE)
      .catch(() => [])
      .then((options) => {
        const mapped = options
          .filter(
            (option) =>
              option.optGroup === OPT_GROUP_DOC_TYPE_NAME && option.isActive && isDocType(option.optCode),
          )
          .map((option) => ({ value: String(option.optCode), label: option.optDescription }));
        setTypes(
          mapped.length > 0
            ? mapped
            : GROUP_DOC_TYPES.map((code) => ({ value: String(code), label: t(`docTypes.${code}`) })),
        );
      });
  }, [open, t]);

  useEffect(() => {
    if (!group) return;
    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    fetchGroupKyc({ groupId: group.groupId, page: 1, perPage: 50 }, controller.signal)
      .then((result) => setItems(result.items))
      .catch((caught) => {
        if (controller.signal.aborted) return;
        setItems([]);
        setLoadError(isGroupKycClientError(caught) ? caught.message : t("loadError"));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [group, reloadKey, t]);

  function saved(message: string) {
    if (message) showToast(message, "success");
    setForm(null);
    setDecision(null);
    setRemarks("");
    setFieldError("");
    setReloadKey((value) => value + 1);
  }

  function validate(next: FormState): string | null {
    const type = Number(next.docTypeCd);
    if (!type) return t("typeRequired");
    const numberError = groupKycNumberError(type, next.kycNo);
    if (numberError === "required") return t("numberRequired");
    if (numberError === "format") return t("numberFormat");
    const today = todayYmd();
    if (next.issueDate && next.issueDate > today) return t("issueFuture");
    if (next.issueDate && group?.formationDate && next.issueDate < group.formationDate.slice(0, 10)) {
      return t("issueBeforeFormation");
    }
    if (next.expiryDate && next.issueDate && next.expiryDate <= next.issueDate) return t("expiryAfterIssue");
    if (next.expiryDate && next.expiryDate < today) return t("expiryPast");
    return null;
  }

  async function submitForm() {
    if (!group || !form) return;
    const error = validate(form);
    if (error) {
      setFieldError(error);
      return;
    }
    const type = Number(form.docTypeCd);
    setSaving(true);
    setFieldError("");
    try {
      const result = await saveGroupKyc({
        groupKycId: form.groupKycId,
        groupId: group.groupId,
        docTypeCd: type,
        kycNo: normalizeGroupKycNo(type, form.kycNo),
        issueDate: form.issueDate || null,
        expiryDate: form.expiryDate || null,
        photoPath: form.photoPath || null,
        backPhotoPath: form.backPhotoPath || null,
      });
      saved(result.message || t("saved"));
    } catch (caught) {
      setFieldError(isGroupKycClientError(caught) ? caught.message : t("requestFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function submitDecision() {
    if (!decision) return;
    if (decision.status !== 1 && !remarks.trim()) {
      setFieldError(t("reasonRequired"));
      return;
    }
    setSaving(true);
    setFieldError("");
    try {
      const result = await verifyGroupKyc({
        groupKycId: decision.document.groupKycId,
        verifyStatus: decision.status,
        remarks: remarks.trim() || undefined,
      });
      saved(result.message);
    } catch (caught) {
      setFieldError(isGroupKycClientError(caught) ? caught.message : t("requestFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(document: GroupKycDocument) {
    try {
      const result = await changeGroupKycStatus({
        groupKycId: document.groupKycId,
        isActive: !document.isActive,
      });
      saved(result.message);
    } catch (caught) {
      showToast(isGroupKycClientError(caught) ? caught.message : t("requestFailed"), "error");
    }
  }

  function formatDate(value: string | null) {
    if (!value) return "—";
    const parsed = new Date(`${value.slice(0, 10)}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? value : format.dateTime(parsed, { dateStyle: "medium" });
  }

  function docTypeLabel(document: GroupKycDocument) {
    if (document.docTypeDesc) return document.docTypeDesc;
    return isDocType(document.docTypeCd) ? t(`docTypes.${document.docTypeCd}`) : "—";
  }

  function numberHint(docTypeCd: string) {
    const code = Number(docTypeCd);
    return isDocType(code) ? t(`numberHint.${code}`) : undefined;
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        size="lg"
        title={t("title", { name: group?.groupName ?? "" })}
        subtitle={group ? String(group.groupCode) : undefined}
        confirmOnSave={false}
        footer={
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("close")}
          </Button>
        }
      >
        <div className="space-y-4">
          {locked ? <p className="text-sm text-amber-800">{t("groupLocked")}</p> : null}
          <div className="flex justify-end">
            <Button
              type="button"
              icon={Plus}
              disabled={locked}
              onClick={() => {
                setForm(emptyForm());
                setFieldError("");
              }}
            >
              {t("addDocument")}
            </Button>
          </div>

          {form && group ? (
            <div className="space-y-3 rounded-xl border border-border p-3">
              <p className="text-sm font-semibold text-slate-900">
                {form.groupKycId ? t("editDocument") : t("addDocument")}
              </p>
              <SelectField
                label={t("documentType")}
                required
                placeholder={t("documentType")}
                searchable={false}
                value={form.docTypeCd}
                onChange={(value) => setForm({ ...form, docTypeCd: value })}
                options={types}
              />
              <TextField
                label={t("documentNumber")}
                required
                maxLength={GROUP_KYC_NO_MAX}
                value={form.kycNo}
                onChange={(value) => setForm({ ...form, kycNo: value })}
                placeholder={numberHint(form.docTypeCd) ?? t("documentNumber")}
                hint={numberHint(form.docTypeCd)}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <DateField
                  label={t("issueDate")}
                  value={form.issueDate}
                  onChange={(value) => setForm({ ...form, issueDate: value })}
                  max={todayYmd()}
                  min={group.formationDate?.slice(0, 10) || undefined}
                />
                <DateField
                  label={t("expiryDate")}
                  value={form.expiryDate}
                  onChange={(value) => setForm({ ...form, expiryDate: value })}
                  min={form.issueDate || todayYmd()}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <KycImageField
                  label={t("frontImage")}
                  memberId={group.groupId}
                  ownerField="group_id"
                  fileUrl={endpoints.bff.groupKycFile}
                  value={form.photoPath}
                  onChange={(path) => setForm({ ...form, photoPath: path })}
                />
                <KycImageField
                  label={t("backImage")}
                  memberId={group.groupId}
                  ownerField="group_id"
                  fileUrl={endpoints.bff.groupKycFile}
                  value={form.backPhotoPath}
                  onChange={(path) => setForm({ ...form, backPhotoPath: path })}
                />
              </div>
              {fieldError && !decision ? (
                <p className="flex items-start gap-1.5 text-sm text-danger" role="alert">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{fieldError}</span>
                </p>
              ) : null}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setForm(null)}>
                  {t("cancel")}
                </Button>
                <Button type="button" icon={Save} loading={saving} onClick={() => void submitForm()}>
                  {t("save")}
                </Button>
              </div>
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full" />
              ))}
            </div>
          ) : null}
          {!loading && loadError ? (
            <p className="flex items-start gap-1.5 text-sm text-danger" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{loadError}</span>
            </p>
          ) : null}
          {!loading && !loadError && items.length === 0 ? (
            <EmptyState
              className="rounded-xl border border-dashed border-border"
              icon={<FileText className="h-5 w-5" aria-hidden="true" />}
              title={t("empty")}
              message={t("emptyHint")}
            />
          ) : null}
          <ul className="space-y-2">
            {items.map((document) => {
              const tone: BadgeTone = !document.isActive
                ? "neutral"
                : document.verifyStatus === 1
                  ? "success"
                  : document.verifyStatus === 2
                    ? "danger"
                    : "amber";
              const statusLabel = !document.isActive
                ? t("inactive")
                : document.verifyStatus === 1
                  ? t("verified")
                  : document.verifyStatus === 2
                    ? t("rejected")
                    : t("pending");
              const canEdit = document.isActive && document.verifyStatus !== 1 && !locked;
              return (
                <li key={document.groupKycId} className="rounded-xl border border-border p-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{docTypeLabel(document)}</p>
                      <p className="mt-1 break-all font-mono text-slate-700">{document.kycNo}</p>
                      <p className="mt-1 text-muted">
                        {t("dates", {
                          issued: formatDate(document.issueDate),
                          expires: formatDate(document.expiryDate),
                        })}
                        {document.isExpired ? ` · ${t("expired")}` : ""}
                      </p>
                      {document.verifiedByName && document.verifyStatus !== 0 ? (
                        <p className="mt-1 text-xs text-muted">
                          {t("decidedBy", {
                            name: document.verifiedByName,
                            date: formatDate(document.verifiedAt),
                          })}
                        </p>
                      ) : null}
                      {document.verifyRemarks ? (
                        <p className="mt-1 text-amber-800">{document.verifyRemarks}</p>
                      ) : null}
                    </div>
                    <Badge tone={tone}>{statusLabel}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {canEdit ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        icon={Pencil}
                        onClick={() => {
                          setFieldError("");
                          setForm({
                            groupKycId: document.groupKycId,
                            docTypeCd: String(document.docTypeCd),
                            kycNo: document.kycNo,
                            issueDate: document.issueDate?.slice(0, 10) ?? "",
                            expiryDate: document.expiryDate?.slice(0, 10) ?? "",
                            photoPath: document.photoPath ?? "",
                            backPhotoPath: document.backPhotoPath ?? "",
                          });
                        }}
                      >
                        {t("edit")}
                      </Button>
                    ) : null}
                    {document.isActive && document.verifyStatus === 0 && !locked && !document.isExpired ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="success"
                        icon={Check}
                        onClick={() => {
                          setDecision({ document, status: 1 });
                          setRemarks("");
                          setFieldError("");
                        }}
                      >
                        {t("verify")}
                      </Button>
                    ) : null}
                    {document.isActive && document.verifyStatus !== 2 && !locked ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        icon={X}
                        onClick={() => {
                          setDecision({ document, status: 2 });
                          setRemarks("");
                          setFieldError("");
                        }}
                      >
                        {t("reject")}
                      </Button>
                    ) : null}
                    {document.isActive && document.verifyStatus !== 0 && !locked ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="amber"
                        icon={RotateCcw}
                        onClick={() => {
                          setDecision({ document, status: 0 });
                          setRemarks("");
                          setFieldError("");
                        }}
                      >
                        {t("reopen")}
                      </Button>
                    ) : null}
                    {!locked ? (
                      <Button
                        type="button"
                        size="sm"
                        variant={document.isActive ? "warning" : "success"}
                        icon={document.isActive ? PowerOff : Power}
                        onClick={() => void toggleActive(document)}
                      >
                        {document.isActive ? t("deactivate") : t("activate")}
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </Modal>

      <ConfirmDialog
        open={decision != null}
        onClose={() => setDecision(null)}
        variant={decision?.status === 2 ? "danger" : decision?.status === 1 ? "success" : "warning"}
        title={decision?.status === 1 ? t("verify") : decision?.status === 2 ? t("reject") : t("reopen")}
        description={decision?.status === 1 ? t("verifyHint") : t("reasonHint")}
        confirmLabel={t("save")}
        loading={saving}
        onConfirm={submitDecision}
      >
        {decision && decision.status !== 1 ? (
          <label className="mt-3 block text-sm">
            <span className="mb-1 block font-medium text-slate-700">{t("reason")}</span>
            <textarea autoComplete="off"
              value={remarks}
              maxLength={200}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder={t("reasonPlaceholder")}
              className="input min-h-20 w-full"
            />
          </label>
        ) : null}
        {decision && fieldError ? (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-danger" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{fieldError}</span>
          </p>
        ) : null}
      </ConfirmDialog>
    </>
  );
}

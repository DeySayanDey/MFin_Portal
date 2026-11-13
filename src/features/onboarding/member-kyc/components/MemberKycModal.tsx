"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, Check, Eye, EyeOff, FileText, Pencil, Plus, Power, PowerOff, RotateCcw, Save, X } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DateField, SelectField, TextField } from "@/components/ui/Form";
import { KycImageField } from "@/features/onboarding/member-kyc/components/KycImageField";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { showToast } from "@/components/ui/toast";
import { fetchApplOptions } from "@/features/master/appl-options/services/appl-options-client";
import type { Member } from "@/features/onboarding/member-registration/types/member.types";
import {
  addMemberKyc,
  changeMemberKycStatus,
  editMemberKyc,
  fetchMemberKyc,
  isMemberKycClientError,
  verifyMemberKyc,
} from "@/features/onboarding/member-kyc/services/member-kyc-client";
import type { KycVerifyStatus, MemberKycDocument } from "@/features/onboarding/member-kyc/types/member-kyc.types";
import { EXPIRY_REQUIRED_TYPES, kycNumberError, normalizeKycNo, todayYmd } from "@/features/onboarding/member-kyc/lib/kyc-rules";

type FormState = {
  memberKycId?: number;
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

export function MemberKycModal({
  member,
  open,
  onClose,
}: {
  member: Member | null;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("onboarding.memberKyc");
  const locale = useLocale();
  const [items, setItems] = useState<MemberKycDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<{ value: string; label: string; id: string }[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [fieldError, setFieldError] = useState("");
  const [saving, setSaving] = useState(false);
  const [revealed, setRevealed] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [decision, setDecision] = useState<{ document: MemberKycDocument; status: KycVerifyStatus } | null>(null);
  const [remarks, setRemarks] = useState("");
  const locked = member?.statusCd === 4 || member?.statusCd === 5;

  useEffect(() => {
    if (!open) return;
    setForm(null);
    setFieldError("");
    setRevealed(null);
    fetchApplOptions(33)
      .then((options) =>
        setTypes(
          options
            .filter((option) => option.optGroup === "Document Type" && option.isActive)
            .map((option) => ({
              value: String(option.optCode),
              label: option.optDescription,
              id: String(option.optionId),
            })),
        ),
      )
      .catch(() => setTypes([]));
  }, [open]);

  useEffect(() => {
    if (!open || !member) return;
    const controller = new AbortController();
    setLoading(true);
    fetchMemberKyc({ memberId: member.memberId, page: 1, perPage: 50 }, controller.signal)
      .then((result) => setItems(result.items))
      .catch(() => {
        if (!controller.signal.aborted) setItems([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [open, member, reloadKey]);

  function saved(message: string) {
    if (message) showToast(message, "success");
    setForm(null);
    setDecision(null);
    setRemarks("");
    setReloadKey((value) => value + 1);
  }

  function validate(next: FormState): string | null {
    const type = Number(next.docTypeCd);
    if (!type) return t("typeRequired");
    const numberError = kycNumberError(type, next.kycNo);
    if (numberError === "required") return t("numberRequired");
    if (numberError === "format") return t("numberFormat");
    const today = todayYmd();
    if (next.issueDate && next.issueDate > today) return t("issueFuture");
    if (next.issueDate && member?.dateOfBirth && next.issueDate < member.dateOfBirth) return t("issueBeforeBirth");
    if (EXPIRY_REQUIRED_TYPES.has(type) && !next.expiryDate) return t("expiryRequired");
    if (next.expiryDate && next.issueDate && next.expiryDate <= next.issueDate) return t("expiryAfterIssue");
    if (next.expiryDate && next.expiryDate < today) return t("expiryPast");
    if (next.photoPath.length > 300 || next.backPhotoPath.length > 300) return t("pathTooLong");
    return null;
  }

  async function submitForm() {
    if (!member || !form) return;
    const error = validate(form);
    if (error) {
      setFieldError(error);
      return;
    }
    const type = Number(form.docTypeCd);
    const kycNo = normalizeKycNo(type, form.kycNo);
    setSaving(true);
    setFieldError("");
    try {
      if (form.memberKycId) {
        const result = await editMemberKyc({
          memberKycId: form.memberKycId,
          docTypeCd: type,
          kycNo,
          issueDate: form.issueDate || null,
          expiryDate: form.expiryDate || null,
          photoPath: form.photoPath || null,
          backPhotoPath: form.backPhotoPath || null,
        });
        saved(result.message);
      } else {
        const result = await addMemberKyc({
          memberId: member.memberId,
          documents: [
            {
              docTypeCd: type,
              kycNo,
              issueDate: form.issueDate || undefined,
              expiryDate: form.expiryDate || undefined,
              photoPath: form.photoPath || undefined,
              backPhotoPath: form.backPhotoPath || undefined,
            },
          ],
        });
        saved(result.message);
      }
    } catch (caught) {
      setFieldError(isMemberKycClientError(caught) ? caught.message : t("requestFailed"));
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
      const result = await verifyMemberKyc({
        memberKycId: decision.document.memberKycId,
        verifyStatus: decision.status,
        remarks: remarks.trim() || undefined,
      });
      saved(result.message);
    } catch (caught) {
      setFieldError(isMemberKycClientError(caught) ? caught.message : t("requestFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(document: MemberKycDocument) {
    try {
      const result = await changeMemberKycStatus({
        memberKycId: document.memberKycId,
        isActive: !document.isActive,
      });
      saved(result.message);
    } catch (caught) {
      showToast(isMemberKycClientError(caught) ? caught.message : t("requestFailed"), "error");
    }
  }

  const dateFormat = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" });
  function formatDate(value: string | null) {
    if (!value) return "—";
    const parsed = new Date(`${value.slice(0, 10)}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? value : dateFormat.format(parsed);
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        size="lg"
        title={t("title", { name: member?.memberName ?? "" })}
        subtitle={member?.refCode ?? undefined}
        footer={
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("close")}
          </Button>
        }
      >
        <div className="space-y-4">
          {locked ? <p className="text-sm text-amber-800">{t("memberLocked")}</p> : null}
          <div className="flex justify-end">
            <Button type="button" icon={Plus} disabled={locked} onClick={() => { setForm(emptyForm()); setFieldError(""); }}>
              {t("addDocument")}
            </Button>
          </div>

          {form && member ? (
            <div className="space-y-3 rounded-xl border border-border p-3">
              <p className="text-sm font-semibold text-slate-900">{form.memberKycId ? t("editDocument") : t("addDocument")}</p>
              <SelectField
                label={t("documentType")}
                required
                placeholder={t("documentType")}
                searchable={false}
                value={form.docTypeCd}
                onChange={(value) => setForm({ ...form, docTypeCd: value })}
                options={types}
                error={fieldError && !form.docTypeCd ? fieldError : undefined}
              />
              <TextField
                label={t("documentNumber")}
                required
                value={form.kycNo}
                onChange={(value) => setForm({ ...form, kycNo: value })}
                placeholder={form.docTypeCd ? t(`numberHint.${form.docTypeCd}` as "numberHint.1") : t("documentNumber")}
                hint={form.docTypeCd ? t(`numberHint.${form.docTypeCd}` as "numberHint.1") : undefined}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <DateField
                  label={t("issueDate")}
                  value={form.issueDate}
                  onChange={(value) => setForm({ ...form, issueDate: value })}
                  max={todayYmd()}
                  min={member.dateOfBirth || undefined}
                />
                <DateField
                  label={t("expiryDate")}
                  required={form.docTypeCd === "4" || form.docTypeCd === "5"}
                  value={form.expiryDate}
                  onChange={(value) => setForm({ ...form, expiryDate: value })}
                  min={form.issueDate || todayYmd()}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <KycImageField
                  label={t("frontImage")}
                  memberId={member.memberId}
                  value={form.photoPath}
                  onChange={(path) => setForm({ ...form, photoPath: path })}
                />
                <KycImageField
                  label={t("backImage")}
                  memberId={member.memberId}
                  value={form.backPhotoPath}
                  onChange={(path) => setForm({ ...form, backPhotoPath: path })}
                />
              </div>
              {fieldError ? (
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
          {!loading && items.length === 0 ? (
            <EmptyState
              className="rounded-xl border border-dashed border-border"
              icon={<FileText className="h-5 w-5" aria-hidden="true" />}
              title={t("empty")}
              message={t("emptyHint")}
            />
          ) : null}
          <ul className="space-y-2">
            {items.map((document) => {
              const tone =
                !document.isActive ? "neutral" : document.verifyStatus === 1 ? "success" : document.verifyStatus === 2 ? "danger" : "amber";
              const statusLabel = !document.isActive
                ? t("inactive")
                : document.verifyStatus === 1
                  ? t("verified")
                  : document.verifyStatus === 2
                    ? t("rejected")
                    : t("pending");
              const canEdit = document.isActive && document.verifyStatus !== 1 && !locked;
              return (
                <li key={document.memberKycId} className="rounded-xl border border-border p-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{document.docTypeDesc}</p>
                      <p className="mt-1 font-mono text-slate-700">
                        {revealed === document.memberKycId ? document.kycNo : document.kycNoMasked || document.kycNo}
                      </p>
                      <p className="mt-1 text-muted">
                        {t("issued")} {formatDate(document.issueDate)} · {t("expires")} {formatDate(document.expiryDate)}
                        {document.isExpired ? ` · ${t("expired")}` : ""}
                      </p>
                      {document.verifyRemarks ? <p className="mt-1 text-amber-800">{document.verifyRemarks}</p> : null}
                    </div>
                    <Badge tone={tone}>{statusLabel}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      icon={revealed === document.memberKycId ? EyeOff : Eye}
                      onClick={() => setRevealed(revealed === document.memberKycId ? null : document.memberKycId)}
                    >
                      {revealed === document.memberKycId ? t("hideNumber") : t("showNumber")}
                    </Button>
                    {canEdit ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        icon={Pencil}
                        onClick={() => {
                          setFieldError("");
                          setForm({
                            memberKycId: document.memberKycId,
                            docTypeCd: String(document.docTypeCd),
                            kycNo: document.kycNo,
                            issueDate: document.issueDate ?? "",
                            expiryDate: document.expiryDate ?? "",
                            photoPath: document.photoPath ?? "",
                            backPhotoPath: document.backPhotoPath ?? "",
                          });
                        }}
                      >
                        {t("edit")}
                      </Button>
                    ) : null}
                    {document.isActive && document.verifyStatus === 0 && !locked && !document.isExpired ? (
                      <Button type="button" size="sm" variant="success" icon={Check} onClick={() => { setDecision({ document, status: 1 }); setRemarks(""); setFieldError(""); }}>
                        {t("verify")}
                      </Button>
                    ) : null}
                    {document.isActive && document.verifyStatus !== 2 && !locked ? (
                      <Button type="button" size="sm" variant="danger" icon={X} onClick={() => { setDecision({ document, status: 2 }); setRemarks(""); setFieldError(""); }}>
                        {t("reject")}
                      </Button>
                    ) : null}
                    {document.isActive && document.verifyStatus !== 0 && !locked ? (
                      <Button type="button" size="sm" variant="warning" icon={RotateCcw} onClick={() => { setDecision({ document, status: 0 }); setRemarks(""); setFieldError(""); }}>
                        {t("reopen")}
                      </Button>
                    ) : null}
                    {!locked ? (
                      <Button type="button" size="sm" variant="secondary" icon={document.isActive ? PowerOff : Power} onClick={() => void toggleActive(document)}>
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
            {fieldError ? <span className="mt-1 block text-danger">{fieldError}</span> : null}
          </label>
        ) : null}
      </ConfirmDialog>
    </>
  );
}

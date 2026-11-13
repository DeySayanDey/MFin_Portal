"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Save, Send, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { KycImageField } from "@/features/onboarding/member-kyc/components/KycImageField";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetchMembers } from "@/features/onboarding/member-registration/services/member-client";
import type { Member } from "@/features/onboarding/member-registration/types/member.types";
import {
  addMemberKyc,
  editMemberKyc,
  isMemberKycClientError,
} from "@/features/onboarding/member-kyc/services/member-kyc-client";
import type { MemberKycDocument } from "@/features/onboarding/member-kyc/types/member-kyc.types";
import {
  EXPIRY_REQUIRED_TYPES,
  kycNumberError,
  normalizeKycNo,
  todayYmd,
} from "@/features/onboarding/member-kyc/lib/kyc-rules";

type DocTypeOption = { value: string; label: string; id: string };

type DraftRow = {
  key: string;
  docTypeCd: string;
  kycNo: string;
  issueDate: string;
  expiryDate: string;
  photoPath: string;
  backPhotoPath: string;
  error: string;
};

function blankRow(): DraftRow {
  return {
    key: `${Date.now()}-${Math.random()}`,
    docTypeCd: "",
    kycNo: "",
    issueDate: "",
    expiryDate: "",
    photoPath: "",
    backPhotoPath: "",
    error: "",
  };
}

export function MemberPickerModal({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (member: Member) => void;
}) {
  const t = useTranslations("onboarding.customerKyc");
  const [keyword, setKeyword] = useState("");
  const [items, setItems] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const handle = window.setTimeout(() => {
      setLoading(true);
      fetchMembers({ keyword: keyword.trim() || undefined, statusCd: 1, page: 1, perPage: 10 }, controller.signal)
        .then((result) => setItems(result.items))
        .catch(() => {
          if (!controller.signal.aborted) setItems([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 400);
    return () => {
      controller.abort();
      window.clearTimeout(handle);
    };
  }, [open, keyword]);

  return (
    <Modal open={open} onClose={onClose} title={t("pickMember")} subtitle={t("pickMemberHint")}>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">{t("search")}</span>
        <input autoComplete="off"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="input w-full"
        />
      </label>
      <ul className="mt-3 space-y-2">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)
          : null}
        {!loading && items.length === 0 ? <li className="text-sm text-muted">{t("noMembers")}</li> : null}
        {items.map((member) => (
          <li key={member.memberId}>
            <button
              type="button"
              className="flex w-full flex-col rounded-lg border border-border px-3 py-2 text-start text-sm hover:bg-slate-50"
              onClick={() => onPick(member)}
            >
              <span className="font-medium text-slate-900">{member.memberName}</span>
              <span className="text-muted">{member.refCode} · {member.branchName}</span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

export function CaptureDocumentsModal({
  open,
  member,
  existing,
  types,
  onClose,
  onSaved,
}: {
  open: boolean;
  member: Member | null;
  existing: MemberKycDocument[];
  types: DocTypeOption[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const t = useTranslations("onboarding.customerKyc");
  const [rows, setRows] = useState<DraftRow[]>([blankRow()]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!open) return;
    setRows([blankRow()]);
    setFormError("");
  }, [open]);

  const taken = new Set(
    existing.filter((item) => item.isActive && item.verifyStatus !== 2 && item.docTypeCd !== 6).map((item) => String(item.docTypeCd)),
  );

  function validateRow(row: DraftRow): string {
    const type = Number(row.docTypeCd);
    if (!type) return t("typeRequired");
    const numberError = kycNumberError(type, row.kycNo);
    if (numberError) return t("numberFormat");
    const today = todayYmd();
    if (row.issueDate && (row.issueDate > today || (member?.dateOfBirth && row.issueDate < member.dateOfBirth))) {
      return t("issueInvalid");
    }
    if (EXPIRY_REQUIRED_TYPES.has(type) && !row.expiryDate) return t("expiryRequired");
    if (row.expiryDate && row.expiryDate < today) return t("expiryPast");
    if (row.expiryDate && row.issueDate && row.expiryDate <= row.issueDate) return t("expiryAfterIssue");
    return "";
  }

  async function save() {
    if (!member) return;
    const next = rows.map((row) => ({ ...row, error: validateRow(row) }));
    setRows(next);
    if (next.some((row) => row.error)) return;
    setSaving(true);
    setFormError("");
    try {
      const result = await addMemberKyc({
        memberId: member.memberId,
        documents: next.map((row) => ({
          docTypeCd: Number(row.docTypeCd),
          kycNo: normalizeKycNo(Number(row.docTypeCd), row.kycNo),
          issueDate: row.issueDate || undefined,
          expiryDate: row.expiryDate || undefined,
          photoPath: row.photoPath || undefined,
          backPhotoPath: row.backPhotoPath || undefined,
        })),
      });
      onSaved(result.message);
      onClose();
    } catch (caught) {
      const message = isMemberKycClientError(caught) ? caught.message : t("requestFailed");
      const match = /document\s+(\d+)/i.exec(message);
      if (match) {
        const index = Number(match[1]) - 1;
        setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, error: message } : row)));
      } else {
        setFormError(message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={t("addTitle", { name: member?.memberName ?? "" })}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="button" icon={Save} loading={saving} onClick={() => void save()}>
            {t("saveAll")}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {formError ? <p className="text-sm text-danger">{formError}</p> : null}
        {rows.map((row, index) => {
          const chosen = new Set(rows.filter((item) => item.key !== row.key).map((item) => item.docTypeCd));
          return (
            <fieldset key={row.key} className={`space-y-3 rounded-xl border p-3 ${row.error ? "border-danger" : "border-border"}`}>
              <div className="flex items-center justify-between">
                <legend className="text-sm font-semibold text-slate-900">{t("documentN", { count: index + 1 })}</legend>
                {rows.length > 1 ? (
                  <Button type="button" size="sm" variant="ghost" icon={Trash2} aria-label={t("removeRow")} onClick={() => setRows(rows.filter((item) => item.key !== row.key))} />
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  aria-label={t("documentType")}
                  placeholder={t("documentType")}
                  searchable={false}
                  clearable={false}
                  value={row.docTypeCd}
                  onChange={(value) => setRows(rows.map((item) => (item.key === row.key ? { ...item, docTypeCd: value } : item)))}
                  options={types.filter((type) => type.value === "6" || type.value === row.docTypeCd || (!taken.has(type.value) && !chosen.has(type.value)))}
                />
                <input autoComplete="off"
                  value={row.kycNo}
                  onChange={(event) => setRows(rows.map((item) => (item.key === row.key ? { ...item, kycNo: event.target.value } : item)))}
                  placeholder={row.docTypeCd ? t(`numberHint.${row.docTypeCd}` as "numberHint.1") : t("documentNumber")}
                  aria-label={t("documentNumber")}
                  className="input w-full"
                />
                <DatePicker value={row.issueDate} onChange={(value) => setRows(rows.map((item) => (item.key === row.key ? { ...item, issueDate: value } : item)))} max={todayYmd()} min={member?.dateOfBirth || undefined} aria-label={t("issueDate")} />
                <DatePicker value={row.expiryDate} onChange={(value) => setRows(rows.map((item) => (item.key === row.key ? { ...item, expiryDate: value } : item)))} min={row.issueDate || todayYmd()} aria-label={t("expiryDate")} />
                {member ? (
                  <>
                    <KycImageField label={t("frontPath")} memberId={member.memberId} value={row.photoPath} onChange={(path) => setRows(rows.map((item) => (item.key === row.key ? { ...item, photoPath: path } : item)))} />
                    <KycImageField label={t("backPath")} memberId={member.memberId} value={row.backPhotoPath} onChange={(path) => setRows(rows.map((item) => (item.key === row.key ? { ...item, backPhotoPath: path } : item)))} />
                  </>
                ) : null}
              </div>
              {row.error ? <p className="text-sm text-danger">{row.error}</p> : null}
            </fieldset>
          );
        })}
        <Button type="button" variant="secondary" icon={Plus} disabled={rows.length >= 10} onClick={() => setRows([...rows, blankRow()])}>
          {t("addAnother")}
        </Button>
      </div>
    </Modal>
  );
}

export function EditDocumentModal({
  document,
  member,
  types,
  onClose,
  onSaved,
}: {
  document: MemberKycDocument | null;
  member: Member | null;
  types: DocTypeOption[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const t = useTranslations("onboarding.customerKyc");
  const [row, setRow] = useState<DraftRow>(blankRow());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!document) return;
    setRow({
      key: String(document.memberKycId),
      docTypeCd: String(document.docTypeCd),
      kycNo: document.kycNo,
      issueDate: document.issueDate ?? "",
      expiryDate: document.expiryDate ?? "",
      photoPath: document.photoPath ?? "",
      backPhotoPath: document.backPhotoPath ?? "",
      error: "",
    });
  }, [document]);

  async function save() {
    if (!document) return;
    const type = Number(row.docTypeCd);
    const numberError = kycNumberError(type, row.kycNo);
    if (!type || numberError) {
      setRow({ ...row, error: t("numberFormat") });
      return;
    }
    setSaving(true);
    try {
      const result = await editMemberKyc({
        memberKycId: document.memberKycId,
        docTypeCd: type,
        kycNo: normalizeKycNo(type, row.kycNo),
        issueDate: row.issueDate || null,
        expiryDate: row.expiryDate || null,
        photoPath: row.photoPath || null,
        backPhotoPath: row.backPhotoPath || null,
      });
      onSaved(result.message);
      onClose();
    } catch (caught) {
      setRow({ ...row, error: isMemberKycClientError(caught) ? caught.message : t("requestFailed") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={document != null}
      onClose={onClose}
      title={document?.verifyStatus === 2 ? t("resubmit") : t("editDocument")}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>{t("cancel")}</Button>
          <Button type="button" icon={document?.verifyStatus === 2 ? Send : Save} loading={saving} onClick={() => void save()}>{document?.verifyStatus === 2 ? t("resubmit") : t("save")}</Button>
        </>
      }
    >
      {document?.verifyStatus === 2 && document.verifyRemarks ? (
        <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{document.verifyRemarks}</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Select aria-label={t("documentType")} searchable={false} clearable={false} value={row.docTypeCd} onChange={(value) => setRow({ ...row, docTypeCd: value })} options={types} />
        <input autoComplete="off" value={row.kycNo} onChange={(event) => setRow({ ...row, kycNo: event.target.value })} placeholder={t("documentNumber")} aria-label={t("documentNumber")} className="input w-full" />
        <DatePicker value={row.issueDate} onChange={(value) => setRow({ ...row, issueDate: value })} max={todayYmd()} min={member?.dateOfBirth || undefined} aria-label={t("issueDate")} />
        <DatePicker value={row.expiryDate} onChange={(value) => setRow({ ...row, expiryDate: value })} min={row.issueDate || todayYmd()} aria-label={t("expiryDate")} />
        {member ? (
          <>
            <KycImageField label={t("frontPath")} memberId={member.memberId} value={row.photoPath} onChange={(path) => setRow({ ...row, photoPath: path })} />
            <KycImageField label={t("backPath")} memberId={member.memberId} value={row.backPhotoPath} onChange={(path) => setRow({ ...row, backPhotoPath: path })} />
          </>
        ) : null}
      </div>
      {row.error ? <p className="mt-2 text-sm text-danger">{row.error}</p> : null}
    </Modal>
  );
}

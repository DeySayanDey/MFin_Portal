"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { ImagePlus, Upload, Users } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Alert } from "@/components/ui/Alert";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/Form";
import { Modal } from "@/components/ui/Modal";
import {
  CUST_TYPE_GROUP,
  SAVINGS_DEPOSIT_TYPE,
} from "@/features/deposits/savings/deposit-account.constants";
import {
  addDepositSignatories,
  editDepositSignatory,
  fetchDepositAccounts,
  fetchDepositSignatories,
  fetchGroupSignatoryMembers,
  isDepositAccountClientError,
} from "@/features/deposits/savings/services/deposit-account-client";
import type {
  DepositAccount,
  DepositSignatory,
  PaginationMeta,
  SignatoryCandidate,
} from "@/features/deposits/savings/types/deposit-account.types";
import { endpoints } from "@/lib/api/endpoints";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png"]);

function statusTone(statusCd: number): BadgeTone {
  if (statusCd === 1) return "success";
  if (statusCd === 7) return "warning";
  if (statusCd === 4) return "danger";
  if (statusCd === 5 || statusCd === 6) return "amber";
  return "neutral";
}

function storedImageUrl(path: string): string {
  if (!path.startsWith("specimen/")) return "";
  return `${endpoints.bff.depositSignatoryFile}?path=${encodeURIComponent(path)}`;
}

export function SpecimenSignatoryPanel() {
  const t = useTranslations("deposits.specimenUpdate");
  const tSavings = useTranslations("deposits.savings");
  const format = useFormatter();
  const [items, setItems] = useState<DepositAccount[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);
  const [target, setTarget] = useState<DepositAccount | null>(null);
  const [notice, setNotice] = useToastText();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(false);
      setErrorMessage(undefined);
      try {
        const result = await fetchDepositAccounts({
          page,
          perPage: pageSize,
          depositTypeCd: SAVINGS_DEPOSIT_TYPE,
        });
        if (cancelled) return;
        setItems(result.items ?? []);
        setMeta(result.meta ?? null);
      } catch (err) {
        if (cancelled) return;
        setItems([]);
        setMeta(null);
        setError(true);
        setErrorMessage(
          isDepositAccountClientError(err) ? err.message : t("accountsLoadError"),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, reloadKey, t]);

  const columns = useMemo<DataTableColumn<DepositAccount>[]>(() => {
    const money = (value: number | null) =>
      value == null
        ? tSavings("dash")
        : format.number(value, {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });

    return [
      {
        id: "accountNo",
        header: tSavings("columns.applNo"),
        cell: (row) => (
          <p className="font-semibold text-slate-900">
            {row.accountNo != null ? String(row.accountNo) : tSavings("dash")}
          </p>
        ),
      },
      {
        id: "holder",
        header: tSavings("columns.holder"),
        cell: (row) => (
          <div>
            <p className="inline-flex items-center gap-1.5 font-medium text-slate-800">
              {row.custIdJoint1 != null ? (
                <Users
                  className="h-3.5 w-3.5 shrink-0 text-slate-500"
                  aria-label={tSavings("columns.joint")}
                />
              ) : null}
              <span>{row.holderName || row.primaryName || tSavings("dash")}</span>
            </p>
            <p className="text-xs text-muted">
              {[row.primaryRefCode, row.custTypeDesc].filter(Boolean).join(" · ") ||
                tSavings("dash")}
            </p>
          </div>
        ),
      },
      {
        id: "scheme",
        header: tSavings("columns.scheme"),
        cell: (row) => (
          <div>
            <p className="text-slate-800">
              {[row.prodTypeDesc, row.schemeName].filter(Boolean).join(" · ") ||
                tSavings("dash")}
            </p>
            <p className="text-xs text-muted">{row.schemeCode || tSavings("dash")}</p>
          </div>
        ),
      },
      {
        id: "mode",
        header: tSavings("columns.mode"),
        cell: (row) => (
          <span className="text-slate-700">{row.opModeDesc || tSavings("dash")}</span>
        ),
      },
      {
        id: "balance",
        header: tSavings("columns.balance"),
        align: "end",
        className: "font-semibold tabular-nums text-slate-900",
        cell: (row) => money(row.currentBalance),
      },
      {
        id: "status",
        header: tSavings("columns.status"),
        cell: (row) =>
          row.isClosed ? (
            <Badge tone="neutral" caps={false}>
              {tSavings("closed")}
            </Badge>
          ) : (
            <Badge tone={statusTone(row.statusCd)} caps={false}>
              {row.statusDesc || tSavings("dash")}
            </Badge>
          ),
      },
      {
        id: "signatory",
        header: t("columns.signatory"),
        cell: (row) =>
          row.signatoryCount > 0 ? (
            <Badge tone="success" caps={false}>
              {t("flagCount", { count: row.signatoryCount })}
            </Badge>
          ) : (
            <Badge tone="warning" caps={false}>
              {t("flagMissing")}
            </Badge>
          ),
      },
    ];
  }, [format, t, tSavings]);

  return (
    <>
      <PageToast message={notice} />
      <DataTable
        title={t("signatoriesTitle")}
        description={t("tableDescription")}
        data={items}
        columns={columns}
        getRowKey={(row) => String(row.accountId)}
        getRowClassName={(row) => (row.isClosed ? "opacity-60" : undefined)}
        loading={loading}
        error={error}
        errorTitle={t("accountsLoadError")}
        errorMessage={errorMessage}
        onRetry={() => setReloadKey((key) => key + 1)}
        emptyTitle={t("emptyTitle")}
        emptyMessage={t("emptyMessage")}
        minWidth="960px"
        caption={t("signatoriesTitle")}
        rowActions={{
          header: tSavings("columns.actions"),
          render: (row) => (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Upload}
              tooltip={t("upload")}
              disabled={row.isClosed}
              onClick={() => {
                setNotice(null);
                setTarget(row);
              }}
            />
          ),
        }}
        pagination={{
          page,
          pageSize,
          total: meta?.total ?? items.length,
          totalPages: meta?.lastPage,
          pageSizeOptions: [20, 50, 100],
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
          },
        }}
      />
      <SpecimenUploadDialog
        account={target}
        onClose={() => setTarget(null)}
        onSaved={() => {
          setTarget(null);
          setNotice(t("saved"));
          setReloadKey((key) => key + 1);
        }}
      />
    </>
  );
}

function SpecimenUploadDialog({
  account,
  onClose,
  onSaved,
}: {
  account: DepositAccount | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("deposits.specimenUpdate");
  const tUi = useTranslations("ui");
  const signatureRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [signatories, setSignatories] = useState<DepositSignatory[]>([]);
  const [members, setMembers] = useState<SignatoryCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [signatoryId, setSignatoryId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [signaturePreview, setSignaturePreview] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formError, setFormError] = useToastText();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!account) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setSignatories([]);
    setMembers([]);
    setSignatoryId("");
    setMemberId("");
    setSignatureFile(null);
    setPhotoFile(null);
    setSignaturePreview((current) => {
      if (current.startsWith("blob:")) URL.revokeObjectURL(current);
      return "";
    });
    setPhotoPreview((current) => {
      if (current.startsWith("blob:")) URL.revokeObjectURL(current);
      return "";
    });
    setFormError(null);

    async function load() {
      try {
        const rows = await fetchDepositSignatories(account!.accountId);
        if (cancelled) return;
        const active = rows.filter((row) => row.isActive);
        setSignatories(active);
        if (active[0]) setSignatoryId(String(active[0].signatoryId));
        if (active.length === 0 && account!.custTypeCd === CUST_TYPE_GROUP) {
          const people = await fetchGroupSignatoryMembers(account!.custIdPrimary);
          if (cancelled) return;
          setMembers(people);
        }
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          isDepositAccountClientError(err) ? err.message : t("loadSignatoriesError"),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [account, t]);

  const selected = signatories.find((row) => String(row.signatoryId) === signatoryId) ?? null;
  const storedSignature = selected?.signFileNm.trim() ?? "";
  const storedPhoto = selected?.photoFileNm.trim() ?? "";
  const signatureImage = signaturePreview || (!signatureFile ? storedImageUrl(storedSignature) : "");
  const photoImage = photoPreview || (!photoFile ? storedImageUrl(storedPhoto) : "");

  function choose(kind: "signature" | "photo", next: File | undefined) {
    if (!next) return;
    if (!ALLOWED.has(next.type)) {
      setFormError(t("imageType"));
      return;
    }
    if (next.size > MAX_BYTES) {
      setFormError(t("imageTooLarge"));
      return;
    }
    setFormError(null);
    const previewUrl = URL.createObjectURL(next);
    if (kind === "signature") {
      setSignatureFile(next);
      setSignaturePreview((current) => {
        if (current.startsWith("blob:")) URL.revokeObjectURL(current);
        return previewUrl;
      });
      return;
    }
    setPhotoFile(next);
    setPhotoPreview((current) => {
      if (current.startsWith("blob:")) URL.revokeObjectURL(current);
      return previewUrl;
    });
  }

  async function uploadFile(next: File): Promise<string | null> {
    const body = new FormData();
    body.set("account_id", String(account?.accountId ?? ""));
    body.set("file", next);
    const response = await fetch(endpoints.bff.depositSignatoryFile, {
      method: "POST",
      body,
      credentials: "same-origin",
    });
    const payload = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      message?: string;
      data?: { path?: string };
    };
    if (!response.ok || !payload.data?.path) {
      setFormError(payload.message || t("saveError"));
      return null;
    }
    return payload.data.path;
  }

  async function save() {
    if (!account || saving) return;
    if (!signatureFile && !photoFile) {
      setFormError(t("imageRequired"));
      return;
    }
    const existingId = Number(signatoryId);
    const groupMemberId = Number(memberId);
    if (signatories.length > 0 && !(Number.isInteger(existingId) && existingId > 0)) {
      setFormError(t("memberRequired"));
      return;
    }
    if (
      signatories.length === 0 &&
      account.custTypeCd === CUST_TYPE_GROUP &&
      !(Number.isInteger(groupMemberId) && groupMemberId > 0)
    ) {
      setFormError(t("memberRequired"));
      return;
    }
    if (signatories.length === 0 && account.custTypeCd !== CUST_TYPE_GROUP && account.custIdPrimary <= 0) {
      setFormError(t("memberRequired"));
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const signPath = signatureFile ? await uploadFile(signatureFile) : undefined;
      if (signatureFile && !signPath) return;
      const photoPath = photoFile ? await uploadFile(photoFile) : undefined;
      if (photoFile && !photoPath) return;
      if (signatories.length > 0) {
        await editDepositSignatory({
          signatoryId: existingId,
          ...(signPath ? { signFileNm: signPath } : {}),
          ...(photoPath ? { photoFileNm: photoPath } : {}),
        });
      } else {
        await addDepositSignatories({
          accountId: account.accountId,
          signatories: [
            {
              custId:
                account.custTypeCd === CUST_TYPE_GROUP ? groupMemberId : account.custIdPrimary,
              ...(signPath ? { signFileNm: signPath } : {}),
              ...(photoPath ? { photoFileNm: photoPath } : {}),
            },
          ],
        });
      }
      onSaved();
    } catch (err) {
      setFormError(isDepositAccountClientError(err) ? err.message : t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  const accountLabel = account
    ? [account.fullAccountNo || (account.accountNo != null ? String(account.accountNo) : ""), account.holderName || account.primaryName]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <Modal
      open={account != null}
      onClose={onClose}
      title={t("uploadTitle")}
      subtitle={accountLabel}
      size="lg"
      confirmOnClose={signatureFile != null || photoFile != null}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            {t("cancel")}
          </Button>
          <Button type="button" icon={Upload} loading={saving} disabled={saving || loading} onClick={() => void save()}>
            {saving ? t("saving") : t("save")}
          </Button>
        </div>
      }
    >
      {loadError ? <Alert tone="error">{loadError}</Alert> : null}
      <PageToast message={formError} tone="error" />
      <div className="mt-3 flex flex-col gap-4">
        {loading ? <p className="text-sm text-muted">{tUi("loading")}</p> : null}
        {!loading && signatories.length > 1 ? (
          <SelectField
            label={t("pickMember")}
            required
            value={signatoryId}
            placeholder={t("pickMemberPlaceholder")}
            options={signatories.map((row) => ({
              value: String(row.signatoryId),
              label: [row.custName, row.custRefCode].filter(Boolean).join(" · "),
            }))}
            onChange={setSignatoryId}
          />
        ) : null}
        {!loading && signatories.length === 1 && selected ? (
          <p className="text-sm text-slate-800">
            <span className="text-muted">{t("holder")}: </span>
            {[selected.custName, selected.custRefCode].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        {!loading && signatories.length === 0 && account?.custTypeCd === CUST_TYPE_GROUP ? (
          <SelectField
            label={t("pickMember")}
            required
            value={memberId}
            placeholder={t("pickMemberPlaceholder")}
            searchPlaceholder={tUi("selectSearch")}
            emptyMessage={tUi("selectEmpty")}
            options={members.map((member) => ({
              value: String(member.id),
              label: [member.name, member.refCode, member.role].filter(Boolean).join(" · "),
            }))}
            onChange={setMemberId}
          />
        ) : null}
        {!loading && signatories.length === 0 && account && account.custTypeCd !== CUST_TYPE_GROUP ? (
          <p className="text-sm text-slate-800">
            <span className="text-muted">{t("holder")}: </span>
            {account.holderName || account.primaryName}
          </p>
        ) : null}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DocumentSlot
            label={t("signature")}
            image={signatureImage}
            missing={!signatureImage && !storedSignature}
            missingLabel={t("notUploaded")}
            hint={t("uploadHint")}
            actionLabel={signatureFile || storedSignature ? t("replaceImage") : t("chooseImage")}
            inputRef={signatureRef}
            onChoose={(next) => choose("signature", next)}
          />
          <DocumentSlot
            label={t("photo")}
            image={photoImage}
            missing={!photoImage && !storedPhoto}
            missingLabel={t("notUploaded")}
            hint={t("uploadHint")}
            actionLabel={photoFile || storedPhoto ? t("replaceImage") : t("chooseImage")}
            inputRef={photoRef}
            onChoose={(next) => choose("photo", next)}
          />
        </div>
      </div>
    </Modal>
  );
}

function DocumentSlot({
  label,
  image,
  missing,
  missingLabel,
  hint,
  actionLabel,
  inputRef,
  onChoose,
}: {
  label: string;
  image: string;
  missing: boolean;
  missingLabel: string;
  hint: string;
  actionLabel: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onChoose: (file: File | undefined) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-dashed border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {missing ? (
          <Badge tone="warning" caps={false}>
            {missingLabel}
          </Badge>
        ) : null}
      </div>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- private upload served by the session route
        <img
          src={image}
          alt={label}
          className="h-36 w-full rounded-lg border border-border object-contain"
        />
      ) : (
        <div className="flex h-36 flex-col items-center justify-center gap-2 rounded-lg bg-surface-muted text-muted">
          <ImagePlus className="h-6 w-6" aria-hidden="true" />
        </div>
      )}
      <input autoComplete="off"
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="sr-only"
        onChange={(event) => {
          onChoose(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">{hint}</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={ImagePlus}
          onClick={() => inputRef.current?.click()}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}

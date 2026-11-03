"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { showToast } from "@/components/ui/toast";
import { useRouter } from "@/i18n/navigation";
import {
  fetchSettlementAccount,
  isFdSettlementClientError,
  runSettlementAction,
  saveSettlement,
} from "../services/fd-settlement-client";
import type {
  SettlementAccountDetail,
  SettlementActionInput,
  SettlementRequest,
} from "../types/fd-settlement.types";
import { SettlementDetailView } from "./SettlementDetailView";
import { RejectSettlementModal, SettlementReceiptModal } from "./SettlementModals";
import { SettlementWorkspace, type SettlementSaveRequest } from "./SettlementWorkspace";

type FdSettlementAccountViewProps = {
  accountId: number;
};

function isEditable(request: SettlementRequest | null): boolean {
  return request == null || request.status === "draft" || request.status === "rejected";
}

export function FdSettlementAccountView({ accountId }: FdSettlementAccountViewProps) {
  const t = useTranslations("deposits.fdSettlement");
  const router = useRouter();
  const [detail, setDetail] = useState<SettlementAccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<{ status: number; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useToastText();
  const [successMessage, setSuccessMessage] = useToastText();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [receipt, setReceipt] = useState<SettlementRequest | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setDetail(await fetchSettlementAccount(accountId));
    } catch (error) {
      setDetail(null);
      setLoadError(
        isFdSettlementClientError(error)
          ? { status: error.status, message: error.message }
          : { status: 500, message: t("notices.loadFailed") },
      );
    } finally {
      setLoading(false);
    }
  }, [accountId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  function leave() {
    router.push("/deposits/fd-settlement");
  }

  const account = detail?.account ?? null;
  const openRequest = detail?.openRequest ?? null;
  const settledRequest = detail?.settledRequest ?? null;

  async function save({ draft, quote, document, submit }: SettlementSaveRequest) {
    if (!account || !draft.settlementType || !draft.reason) return;
    const result = await saveSettlement(
      {
        settlementId: openRequest?.id,
        accountId: account.id,
        submit,
        settlementType: draft.settlementType,
        settlementDate: draft.settlementDate,
        reason: draft.reason,
        remarks: draft.remarks.trim(),
        paymentMode: draft.paymentMode || undefined,
        sbAccountId: draft.paymentMode === "savings" ? account.linkedAccount?.accountId : undefined,
        beneficiaryAccount: draft.beneficiaryAccount.trim(),
        beneficiaryName: draft.beneficiaryName.trim(),
        ifsc: draft.ifsc.trim(),
        chequeRef: draft.chequeRef.trim(),
        netPayable: quote?.netPayable,
        quoteId: quote?.quoteId || undefined,
      },
      document,
    );
    if (submit) {
      showToast(t("notices.submitted"));
      router.push("/deposits/fd-settlement?tab=pending");
      return;
    }
    setDetail((current) => (current ? { ...current, openRequest: result.item } : current));
    setSuccessMessage(t("notices.draftSaved"));
  }

  async function act(input: SettlementActionInput, notice: string) {
    setBusy(true);
    setActionError(null);
    try {
      const result = await runSettlementAction(input);
      setRejectOpen(false);
      setSuccessMessage(notice);
      await load();
      if (input.action === "post") setReceipt(result.item);
    } catch (error) {
      setActionError(isFdSettlementClientError(error) ? error.message : t("notices.actionFailed"));
    } finally {
      setBusy(false);
    }
  }

  const workspaceKey = isEditable(openRequest)
    ? "edit"
    : `locked-${openRequest?.id}-${openRequest?.status}`;

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <PageToast message={successMessage} />
      <PageToast message={actionError} tone="error" />
      <div className="flex min-w-0 items-start gap-2">
        <Button variant="ghost" icon={ArrowLeft} tooltip={t("actions.back")} aria-label={t("actions.back")} onClick={leave} />
        <PageHeader
          className="min-w-0 flex-1"
          title={t("title")}
          description={account?.accountNumber || t("description")}
        />
      </div>

      {loading && !detail ? <LoadingState /> : null}

      {!loading && loadError ? (
        loadError.status === 404 || loadError.status === 403 ? (
          <Alert tone="error">{t("accountMissing")}</Alert>
        ) : (
          <ErrorState message={loadError.message} onRetry={() => void load()} />
        )
      ) : null}

      {account && !account.eligible ? (
        <SettlementDetailView
          account={account}
          request={settledRequest ?? openRequest}
          onBack={leave}
          onReceipt={setReceipt}
        />
      ) : null}

      {account && account.eligible ? (
        <SettlementWorkspace
          key={workspaceKey}
          account={account}
          request={openRequest}
          busy={busy}
          onBack={leave}
          onSave={save}
          onApprove={() => {
            if (openRequest) void act({ action: "approve", settlementId: openRequest.id }, t("notices.approved"));
          }}
          onReject={() => {
            setActionError(null);
            setRejectOpen(true);
          }}
          onPost={() => {
            if (openRequest) void act({ action: "post", settlementId: openRequest.id }, t("notices.posted"));
          }}
          onReceipt={() => setReceipt(settledRequest ?? openRequest)}
        />
      ) : null}

      <RejectSettlementModal
        open={rejectOpen && openRequest != null}
        busy={busy}
        onClose={() => setRejectOpen(false)}
        onConfirm={(reason) => {
          if (openRequest) {
            void act({ action: "reject", settlementId: openRequest.id, reason }, t("notices.rejected"));
          }
        }}
      />

      <SettlementReceiptModal request={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}

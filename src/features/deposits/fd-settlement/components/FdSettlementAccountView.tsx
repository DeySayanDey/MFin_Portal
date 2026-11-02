"use client";

import { useSyncExternalStore, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Form";
import { Modal } from "@/components/ui/Modal";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { showToast } from "@/components/ui/toast";
import { useRouter } from "@/i18n/navigation";
import { parseYmd } from "@/features/deposits/savings/deposit-account.rules";
import { SAMPLE_DEPOSITS } from "../data/fd-settlement.sample";
import {
  getServerSettlementRequests,
  getSettlementRequests,
  patchSettlementRequest,
  saveSettlementRequest,
  subscribeSettlementRequests,
} from "../data/fd-settlement.store";
import { SettlementWorkspace } from "./SettlementWorkspace";

type FdSettlementAccountViewProps = {
  accountId: string;
};

export function FdSettlementAccountView({ accountId }: FdSettlementAccountViewProps) {
  const t = useTranslations("deposits.fdSettlement");
  const format = useFormatter();
  const router = useRouter();
  const requests = useSyncExternalStore(
    subscribeSettlementRequests,
    getSettlementRequests,
    getServerSettlementRequests,
  );
  const [successMessage, setSuccessMessage] = useToastText();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const account = SAMPLE_DEPOSITS.find((row) => row.id === accountId) ?? null;
  const openRequest = requests.find((row) => row.accountId === accountId && row.status !== "settled") ?? null;
  const settledRequest = requests.find((row) => row.accountId === accountId && row.status === "settled") ?? null;

  function leave() {
    router.push("/deposits/fd-settlement");
  }

  const money = (value: number | null) =>
    value == null
      ? t("dash")
      : format.number(value, {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  const dateLabel = (value: string) => {
    const parsed = parseYmd(value);
    return parsed
      ? format.dateTime(parsed, { month: "short", day: "numeric", year: "numeric" })
      : t("dash");
  };

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <PageToast message={successMessage} />
      <div className="flex min-w-0 items-start gap-2">
        <Button variant="ghost" icon={ArrowLeft} tooltip={t("actions.back")} aria-label={t("actions.back")} onClick={leave} />
        <PageHeader
          className="min-w-0 flex-1"
          title={t("title")}
          description={account?.accountNumber || t("description")}
        />
      </div>

      {!account ? <Alert tone="error">{t("accountMissing")}</Alert> : null}

      {account && !account.eligible ? (
        <div className="flex flex-col items-start gap-3">
          <Alert tone="error">{t(`restrictions.${account.restriction ?? "settled"}`)}</Alert>
          {settledRequest ? (
            <Button type="button" variant="secondary" onClick={() => setReceiptOpen(true)}>
              {t("actions.receipt")}
            </Button>
          ) : null}
        </div>
      ) : null}

      {account && account.eligible ? (
        <SettlementWorkspace
          account={account}
          request={openRequest}
          onBack={leave}
          onSaveDraft={(draft) => {
            saveSettlementRequest(account, draft, "draft");
            setSuccessMessage(t("notices.draftSaved"));
          }}
          onSubmit={(draft) => {
            saveSettlementRequest(account, draft, "pending");
            showToast(t("notices.submitted"));
            router.push("/deposits/fd-settlement?tab=pending");
          }}
          onApprove={() => {
            if (!openRequest) return;
            patchSettlementRequest(openRequest.id, "approved");
            setSuccessMessage(t("notices.approved"));
          }}
          onReject={() => {
            setRejectOpen(true);
            setRejectReason("");
            setRejectError(null);
          }}
          onPost={() => {
            if (!openRequest) return;
            patchSettlementRequest(openRequest.id, "settled", { receiptRef: `RCP-${openRequest.id}` });
            setSuccessMessage(t("notices.posted"));
            setReceiptOpen(true);
          }}
          onReceipt={() => setReceiptOpen(true)}
        />
      ) : null}

      <Modal
        open={rejectOpen && openRequest != null}
        onClose={() => setRejectOpen(false)}
        title={t("reject.title")}
        size="sm"
        confirmOnClose={false}
        confirmOnSave={false}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setRejectOpen(false)}>
              {t("actions.back")}
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                if (!rejectReason.trim() || !openRequest) {
                  setRejectError(t("validation.rejectReason"));
                  return;
                }
                patchSettlementRequest(openRequest.id, "rejected", { rejectionReason: rejectReason.trim() });
                setRejectOpen(false);
                setSuccessMessage(t("notices.rejected"));
              }}
            >
              {t("actions.reject")}
            </Button>
          </>
        }
      >
        {rejectError ? <Alert tone="error" className="mb-3">{rejectError}</Alert> : null}
        <TextAreaField label={t("reject.reason")} value={rejectReason} required onChange={setRejectReason} />
      </Modal>

      <Modal
        open={receiptOpen && (openRequest != null || settledRequest != null)}
        onClose={() => setReceiptOpen(false)}
        title={t("receipt.title")}
        subtitle={t("receipt.printed")}
        size="md"
        confirmOnClose={false}
        confirmOnSave={false}
        footer={
          <Button type="button" variant="secondary" onClick={() => setReceiptOpen(false)}>
            {t("actions.back")}
          </Button>
        }
      >
        {account && (settledRequest || openRequest) ? (
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted">{t("receipt.reference")}</span>
              <span className="font-medium">{(settledRequest ?? openRequest)?.receiptRef || t("dash")}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted">{t("review.account")}</span>
              <span className="font-medium">{account.accountNumber}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted">{t("review.customer")}</span>
              <span className="font-medium">{account.customerName}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted">{t("review.date")}</span>
              <span className="font-medium">{dateLabel((settledRequest ?? openRequest)?.settlementDate ?? "")}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted">{t("workspace.lines.net")}</span>
              <span className="font-semibold">{money((settledRequest ?? openRequest)?.netPayable ?? null)}</span>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

import { SAMPLE_REQUESTS } from "./fd-settlement.sample";
import type { SampleDeposit, SampleRequest, SettlementDraft } from "../types/fd-settlement.types";

const initialRequests: SampleRequest[] = SAMPLE_REQUESTS.map((row) => ({ ...row }));
let requests = initialRequests;
const listeners = new Set<() => void>();

export function getSettlementRequests(): SampleRequest[] {
  return requests;
}

export function getServerSettlementRequests(): SampleRequest[] {
  return initialRequests;
}

export function subscribeSettlementRequests(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function publish(next: SampleRequest[]) {
  requests = next;
  for (const listener of listeners) listener();
}

export function saveSettlementRequest(
  account: SampleDeposit,
  draft: SettlementDraft,
  status: SampleRequest["status"],
) {
  const existing = requests.find((row) => row.accountId === account.id && row.status !== "settled");
  const next: SampleRequest = {
    id: existing?.id ?? `SET-${requests.length + 1002}`,
    accountId: account.id,
    status,
    settlementType: draft.settlementType || "premature",
    settlementDate: draft.settlementDate,
    reason: draft.reason || "customer",
    remarks: draft.remarks,
    paymentMode: draft.paymentMode || "savings",
    beneficiaryAccount: draft.beneficiaryAccount,
    beneficiaryName: draft.beneficiaryName,
    ifsc: draft.ifsc,
    chequeRef: draft.chequeRef,
    documentName: draft.documentName,
    rejectionReason: "",
    receiptRef: existing?.receiptRef ?? "",
    netPayable: status === "draft" ? existing?.netPayable ?? null : account.quote.netPayable,
    quoteId: account.quote.quoteId,
  };
  publish(existing ? requests.map((row) => (row.id === existing.id ? next : row)) : [next, ...requests]);
}

export function patchSettlementRequest(
  id: string,
  status: SampleRequest["status"],
  extra?: Partial<SampleRequest>,
) {
  publish(requests.map((row) => (row.id === id ? { ...row, status, ...extra } : row)));
}

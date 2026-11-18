import { CUST_TYPE_GROUP, OP_MODE_SIGNATORY } from "./deposit-account.constants";
import type {
  DepositCustomer,
  DepositSignatory,
  DepositSignatoryAddItem,
  DepositSignatoryEditInput,
  DepositSignatorySave,
} from "./types/deposit-account.types";

export const MAX_SIGNATORIES = 10;

export type SignatoryDraft = {
  key: string;
  signatoryId: number | null;
  member: DepositCustomer | null;
  role: string;
  signFileNm: string;
  photoFileNm: string;
  savedSignFileNm: string;
  savedPhotoFileNm: string;
};

export type SignatoryIssue = {
  key: string;
  field: "member" | "signFileNm" | "photoFileNm" | "limit";
};

function draftKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `sig-${Date.now()}`;
}

export function emptySignatory(): SignatoryDraft {
  return {
    key: draftKey(),
    signatoryId: null,
    member: null,
    role: "",
    signFileNm: "",
    photoFileNm: "",
    savedSignFileNm: "",
    savedPhotoFileNm: "",
  };
}

export function draftFromSignatory(row: DepositSignatory): SignatoryDraft {
  return {
    key: `saved-${row.signatoryId}`,
    signatoryId: row.signatoryId,
    member: {
      id: row.custId,
      name: row.custName,
      refCode: row.custRefCode,
      mobile: row.custMobile,
      branchId: null,
      branchCode: "",
      branchName: "",
      foId: null,
      foCode: "",
      foName: "",
      anchorDate: null,
      dateOfBirth: null,
      kycPendingCount: 0,
    },
    role: row.signatoryRole,
    signFileNm: row.signFileNm,
    photoFileNm: row.photoFileNm,
    savedSignFileNm: row.signFileNm,
    savedPhotoFileNm: row.photoFileNm,
  };
}

export function signatoryPickerMode(
  custTypeCd: number,
  opModeCd: number,
): "holders" | "members" | "group" {
  if (custTypeCd === CUST_TYPE_GROUP) return "group";
  if (opModeCd === OP_MODE_SIGNATORY) return "members";
  return "holders";
}

export function signatoryIssues(
  drafts: SignatoryDraft[],
  holderIds: number[],
  restrictToHolders: boolean,
): SignatoryIssue[] {
  const issues: SignatoryIssue[] = [];
  if (drafts.length > MAX_SIGNATORIES) {
    issues.push({ key: drafts[0]?.key ?? "signatories", field: "limit" });
  }
  const seen = new Set<number>();
  const holders = new Set(holderIds);
  for (const draft of drafts) {
    if (!draft.member) {
      issues.push({ key: draft.key, field: "member" });
    } else if (seen.has(draft.member.id)) {
      issues.push({ key: draft.key, field: "member" });
    } else if (restrictToHolders && !holders.has(draft.member.id)) {
      issues.push({ key: draft.key, field: "member" });
    } else {
      seen.add(draft.member.id);
    }
    if (draft.signFileNm.trim().length > 75) {
      issues.push({ key: draft.key, field: "signFileNm" });
    }
    if (draft.photoFileNm.trim().length > 75) {
      issues.push({ key: draft.key, field: "photoFileNm" });
    }
  }
  return issues;
}

export function signatoryErrorTarget(
  message: string,
  added: SignatoryDraft[],
): Record<string, string> | null {
  const match = /signatory\s+(\d+)\s*:/i.exec(message);
  if (!match) return null;
  const draft = added[Number(match[1]) - 1];
  if (!draft) return { signatories: message };
  return { [`${draft.key}.member`]: message };
}

function fileOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function toSignatorySave(
  drafts: SignatoryDraft[],
  deactivateIds: number[],
): DepositSignatorySave {
  const add: DepositSignatoryAddItem[] = drafts
    .filter((draft) => draft.signatoryId == null && draft.member)
    .map((draft) => ({
      custId: draft.member!.id,
      signFileNm: fileOrNull(draft.signFileNm),
      photoFileNm: fileOrNull(draft.photoFileNm),
    }));
  const edit: DepositSignatoryEditInput[] = drafts.flatMap((draft) => {
    if (draft.signatoryId == null) return [];
    const next: DepositSignatoryEditInput = { signatoryId: draft.signatoryId };
    let changed = false;
    if (draft.signFileNm.trim() !== draft.savedSignFileNm) {
      next.signFileNm = fileOrNull(draft.signFileNm);
      changed = true;
    }
    if (draft.photoFileNm.trim() !== draft.savedPhotoFileNm) {
      next.photoFileNm = fileOrNull(draft.photoFileNm);
      changed = true;
    }
    return changed ? [next] : [];
  });
  return {
    add,
    edit,
    deactivate: deactivateIds.map((signatoryId) => ({
      signatoryId,
      isActive: false,
    })),
  };
}

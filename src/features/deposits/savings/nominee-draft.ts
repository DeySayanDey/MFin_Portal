import { ageOn, todayYmd } from "./deposit-account.rules";
import type {
  DepositCustomer,
  DepositNominee,
  DepositNomineeAddItem,
  DepositNomineeEditInput,
  DepositNomineeSave,
} from "./types/deposit-account.types";

export const OPT_RELATION = 35;
export const RELATION_SELF = 9;
export const MAX_ACTIVE_NOMINEES = 4;
export const MINOR_AGE = 18;

export type NomineeDraft = {
  key: string;
  nomineeId: number | null;
  saved: DepositNominee | null;
  linkMember: boolean;
  member: DepositCustomer | null;
  nomName: string;
  relationCd: string;
  useAgeOnly: boolean;
  birthDate: string;
  age: string;
  contactNo: string;
  address: string;
  guardianName: string;
  sharePercent: string;
};

export type NomineeField =
  | "member"
  | "nomName"
  | "relationCd"
  | "birthDate"
  | "age"
  | "guardianName"
  | "contactNo"
  | "address"
  | "sharePercent";

export type NomineeIssue = {
  key: string;
  field: NomineeField | "total" | "limit";
};

export function emptyNominee(sharePercent: string): NomineeDraft {
  return {
    key:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `nom-${Date.now()}`,
    nomineeId: null,
    saved: null,
    linkMember: false,
    member: null,
    nomName: "",
    relationCd: "",
    useAgeOnly: false,
    birthDate: "",
    age: "",
    contactNo: "",
    address: "",
    guardianName: "",
    sharePercent,
  };
}

export function nomineeAge(draft: NomineeDraft, on = todayYmd()): number | null {
  if (!draft.useAgeOnly && draft.birthDate) {
    return ageOn(draft.birthDate, on);
  }
  if (draft.age.trim() === "") return null;
  const value = Number(draft.age);
  return Number.isInteger(value) ? value : null;
}

export function allocatedShare(drafts: NomineeDraft[]): number {
  return round2(
    drafts.reduce((sum, draft) => {
      const value = Number(draft.sharePercent);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0),
  );
}

export function remainingShare(drafts: NomineeDraft[], reserved = 0): number {
  return round2(100 - reserved - allocatedShare(drafts));
}

export function nomineeIssues(
  drafts: NomineeDraft[],
  holderIds: number[],
  reservedShare: number,
  reservedCount: number,
  on = todayYmd(),
): NomineeIssue[] {
  const issues: NomineeIssue[] = [];
  if (reservedCount + drafts.length > MAX_ACTIVE_NOMINEES) {
    issues.push({ key: drafts[0]?.key ?? "nominees", field: "limit" });
  }

  const holders = new Set(holderIds);
  const seenMembers = new Set<number>();
  const seenNames = new Set<string>();

  for (const draft of drafts) {
    if (draft.linkMember) {
      if (!draft.member) issues.push({ key: draft.key, field: "member" });
      else if (holders.has(draft.member.id) || seenMembers.has(draft.member.id)) {
        issues.push({ key: draft.key, field: "member" });
      } else {
        seenMembers.add(draft.member.id);
      }
    }

    const name = draft.nomName.trim();
    if (!draft.linkMember && !name) {
      issues.push({ key: draft.key, field: "nomName" });
    } else if (name.length > 120) {
      issues.push({ key: draft.key, field: "nomName" });
    }

    const relation = Number(draft.relationCd);
    if (!draft.relationCd || relation === RELATION_SELF) {
      issues.push({ key: draft.key, field: "relationCd" });
    }

    const identity = `${name.toLowerCase()}|${draft.relationCd}`;
    if (name && draft.relationCd && seenNames.has(identity)) {
      issues.push({ key: draft.key, field: "nomName" });
    } else if (name && draft.relationCd) {
      seenNames.add(identity);
    }

    if (draft.useAgeOnly) {
      const age = nomineeAge(draft, on);
      if (age == null || age < 0 || age > 120) {
        issues.push({ key: draft.key, field: "age" });
      }
    } else if (!draft.birthDate || draft.birthDate > on) {
      issues.push({ key: draft.key, field: "birthDate" });
    }

    const age = nomineeAge(draft, on);
    if (age != null && age < MINOR_AGE && !draft.guardianName.trim()) {
      issues.push({ key: draft.key, field: "guardianName" });
    } else if (draft.guardianName.trim().length > 100) {
      issues.push({ key: draft.key, field: "guardianName" });
    }

    if (draft.contactNo && !/^\d{10}$/.test(draft.contactNo)) {
      issues.push({ key: draft.key, field: "contactNo" });
    }
    if (draft.address.trim().length > 150) {
      issues.push({ key: draft.key, field: "address" });
    }

    const share = Number(draft.sharePercent);
    if (!Number.isFinite(share) || share <= 0 || share > 100) {
      issues.push({ key: draft.key, field: "sharePercent" });
    }
  }

  if (round2(reservedShare + allocatedShare(drafts)) > 100) {
    issues.push({ key: drafts[0]?.key ?? "nominees", field: "total" });
  }

  return issues;
}

export function draftFromNominee(nominee: DepositNominee): NomineeDraft {
  const birthDate = nominee.birthDate ?? "";
  return {
    key: `saved-${nominee.nomineeId}`,
    nomineeId: nominee.nomineeId,
    saved: nominee,
    linkMember: nominee.nomCustId != null,
    member:
      nominee.nomCustId == null
        ? null
        : {
            id: nominee.nomCustId,
            name: nominee.nomName,
            refCode: nominee.nomCustRefCode,
            mobile: nominee.contactNo || null,
            branchId: null,
            branchCode: "",
            branchName: "",
            foId: null,
            foCode: "",
            foName: "",
            anchorDate: null,
            dateOfBirth: birthDate || null,
            kycPendingCount: 0,
          },
    nomName: nominee.nomName,
    relationCd: String(nominee.relationCd),
    useAgeOnly: !birthDate && nominee.age != null,
    birthDate,
    age: nominee.age != null ? String(nominee.age) : "",
    contactNo: nominee.contactNo,
    address: nominee.address,
    guardianName: nominee.guardianName,
    sharePercent: nominee.sharePercent != null ? String(nominee.sharePercent) : "",
  };
}

export function toNomineeSave(
  drafts: NomineeDraft[],
  deactivateIds: number[],
): DepositNomineeSave {
  const edit: DepositNomineeEditInput[] = [];
  for (const draft of drafts) {
    if (draft.nomineeId == null || !draft.saved) continue;
    const next = toNomineeItems([draft])[0];
    const saved = draft.saved;
    const patch: DepositNomineeEditInput = { nomineeId: draft.nomineeId };
    let changed = false;
    if ((next?.nomCustId ?? null) !== (saved.nomCustId ?? null)) {
      patch.nomCustId = next?.nomCustId ?? null;
      changed = true;
    }
    if ((next?.nomName ?? "") !== saved.nomName) {
      patch.nomName = next?.nomName ?? null;
      changed = true;
    }
    if (next && next.relationCd !== saved.relationCd) {
      patch.relationCd = next.relationCd;
      changed = true;
    }
    if ((next?.contactNo ?? "") !== saved.contactNo) {
      patch.contactNo = next?.contactNo ?? null;
      changed = true;
    }
    const nextBirth = next?.birthDate ?? null;
    if (nextBirth !== (saved.birthDate ?? null)) {
      patch.birthDate = nextBirth;
      changed = true;
    }
    if (draft.useAgeOnly && (next?.age ?? null) !== (saved.age ?? null)) {
      patch.age = next?.age ?? null;
      changed = true;
    }
    if ((next?.address ?? "") !== saved.address) {
      patch.address = next?.address ?? null;
      changed = true;
    }
    const age = nomineeAge(draft);
    const nextGuardian = age != null && age < MINOR_AGE ? (next?.guardianName ?? null) : null;
    if (nextGuardian !== (saved.guardianName || null)) {
      patch.guardianName = nextGuardian;
      changed = true;
    }
    const nextShare = next?.sharePercent ?? null;
    const savedShare = saved.sharePercent ?? null;
    if (
      nextShare !== savedShare &&
      !(nextShare != null && savedShare != null && round2(nextShare) === round2(savedShare))
    ) {
      patch.sharePercent = nextShare;
      changed = true;
    }
    if (changed) edit.push(patch);
  }

  return {
    add: toNomineeItems(drafts.filter((draft) => draft.nomineeId == null)),
    edit,
    deactivate: deactivateIds.map((nomineeId) => ({ nomineeId, isActive: false })),
  };
}

export function toNomineeItems(drafts: NomineeDraft[]): DepositNomineeAddItem[] {
  return drafts.map((draft) => {
    const age = nomineeAge(draft);
    const minor = age != null && age < MINOR_AGE;
    const item: DepositNomineeAddItem = {
      relationCd: Number(draft.relationCd),
    };
    if (draft.linkMember && draft.member) item.nomCustId = draft.member.id;
    const name = draft.nomName.trim();
    if (name) item.nomName = name;
    if (draft.contactNo) item.contactNo = draft.contactNo;
    if (!draft.useAgeOnly && draft.birthDate) item.birthDate = draft.birthDate;
    if (draft.useAgeOnly && age != null) item.age = age;
    const address = draft.address.trim();
    if (address) item.address = address;
    if (minor && draft.guardianName.trim()) {
      item.guardianName = draft.guardianName.trim();
    }
    const share = Number(draft.sharePercent);
    if (Number.isFinite(share) && share > 0) item.sharePercent = round2(share);
    return item;
  });
}

export function nomineeErrorTarget(
  message: string,
  drafts: NomineeDraft[],
): Record<string, string> | null {
  const text = message.toLowerCase();
  const aboutNominee =
    text.includes("nominee") ||
    text.includes("share") ||
    text.includes("100%") ||
    text.includes("guardian") ||
    text.includes("relation") ||
    text.includes("birth date") ||
    text.includes("contact number") ||
    text.includes("at most 4");
  if (!aboutNominee) return null;

  if (text.includes("at most 4")) return { nominees: message };

  let field = "";
  if (text.includes("share") || text.includes("100%")) field = "sharePercent";
  else if (text.includes("guardian")) field = "guardianName";
  else if (text.includes("birth date") || /\bage\b/.test(text)) field = "birthDate";
  else if (
    text.includes("holder cannot be a nominee") ||
    text.includes("already a nominee") ||
    text.includes("same name and relation")
  ) {
    field = "member";
  } else if (text.includes("relation")) field = "relationCd";
  else if (text.includes("contact number")) field = "contactNo";

  const match = /nominee\s+(\d+)/i.exec(message);
  const index = match ? Number(match[1]) - 1 : drafts.length === 1 ? 0 : -1;
  const draft = drafts[index];
  if (!draft || !field) return { nominees: message };

  const resolved =
    field === "birthDate" && draft.useAgeOnly
      ? "age"
      : field === "member" && !draft.linkMember
        ? "nomName"
        : field;
  const errors: Record<string, string> = {
    [`${draft.key}.${resolved}`]: message,
  };
  if (field === "sharePercent") errors.nominees = message;
  return errors;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

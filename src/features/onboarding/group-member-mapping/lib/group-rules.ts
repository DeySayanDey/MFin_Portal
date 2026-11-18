import {
  MAX_GROUP_MEMBERS,
  MIN_GROUP_MEMBERS,
  type MemberRole,
} from "@/features/onboarding/group-member-mapping/types/member-group.types";

export const MEMBER_ROLES: MemberRole[] = ["Member", "President", "Secretary", "Treasurer"];
export const OFFICE_ROLES: MemberRole[] = ["President", "Secretary", "Treasurer"];

export function todayYmd(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function groupCapacity(memberNo: number | null | undefined): number {
  return memberNo != null && memberNo > 0 ? memberNo : MAX_GROUP_MEMBERS;
}

export function isBelowMinimum(activeMembers: number): boolean {
  return activeMembers < MIN_GROUP_MEMBERS;
}

/** Women groups take female members (gender 2). Men groups take male members (gender 1). */
export function genderBlock(
  genderCd: number | null | undefined,
  groupGenderDesc: string | null | undefined,
): "women" | "men" | null {
  const label = (groupGenderDesc ?? "").toLowerCase();
  if (label.includes("women") || (label.includes("female") && !label.includes("male"))) {
    return genderCd === 2 ? null : "women";
  }
  if (/\bmen\b/.test(label) || (label.includes("male") && !label.includes("female"))) {
    return genderCd === 1 ? null : "men";
  }
  return null;
}

export function normalizeRole(value: string | null | undefined): MemberRole {
  const match = MEMBER_ROLES.find((role) => role.toLowerCase() === (value ?? "").trim().toLowerCase());
  return match ?? "Member";
}

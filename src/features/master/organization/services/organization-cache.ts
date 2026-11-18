import type { Organization, State } from "@/features/master/organization/types/organization.types";

const STORAGE_KEY = "mfin.org-profile.v1";
const MAX_LOGO_LENGTH = 80_000;

export type OrganizationCache = {
  organization: Organization;
  states: State[];
};

let snapshot: OrganizationCache | null | undefined;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isOrganization(value: unknown): value is Organization {
  if (typeof value !== "object" || value === null) return false;
  const org = value as Partial<Organization>;
  return typeof org.orgId === "number" && typeof org.orgDispNm === "string";
}

function isState(value: unknown): value is State {
  if (typeof value !== "object" || value === null) return false;
  const state = value as Partial<State>;
  return typeof state.stateCd === "number" && typeof state.stateName === "string";
}

export function readOrganizationCache(): OrganizationCache | null {
  if (!canUseStorage()) return null;
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "",
    ) as Partial<OrganizationCache>;
    if (!isOrganization(parsed.organization) || !Array.isArray(parsed.states)) {
      return null;
    }
    return {
      organization: parsed.organization,
      states: parsed.states.filter(isState),
    };
  } catch {
    return null;
  }
}

/** Stable snapshot for useSyncExternalStore. */
export function getOrganizationSnapshot(): OrganizationCache | null {
  if (snapshot !== undefined) return snapshot;
  snapshot = readOrganizationCache();
  return snapshot;
}

export function subscribeOrganizationCache(onStoreChange: () => void): () => void {
  if (!canUseStorage()) return () => {};
  window.addEventListener("mfin-org-cache", onStoreChange);
  return () => window.removeEventListener("mfin-org-cache", onStoreChange);
}

export function writeOrganizationCache(
  organization: Organization,
  states: State[],
): void {
  const logo = organization.orgLogo;
  const payload: OrganizationCache = {
    organization: {
      ...organization,
      orgLogo: logo && logo.length <= MAX_LOGO_LENGTH ? logo : null,
    },
    states,
  };
  snapshot = payload;
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new Event("mfin-org-cache"));
  } catch {
    // Quota or private mode. The in-memory snapshot still paints this visit.
  }
}

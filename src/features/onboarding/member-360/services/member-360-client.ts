import { endpoints } from "@/lib/api/endpoints";
import { dedupeRequest } from "@/lib/client/request-dedupe";
import type { Member360 } from "../types/member-360.types";

type Envelope<T> = { success?: boolean; message?: string; data?: T };

export type Member360ClientError = { status: number; message: string };

export function isMember360ClientError(value: unknown): value is Member360ClientError {
  return typeof value === "object" && value !== null && "status" in value && "message" in value;
}

/**
 * Loads the 360 view for a member code (or legacy numeric id).
 * Callers asking for the same code and generation share one request; bump `generation` to refetch.
 */
export function fetchMember360(code: string, generation = 0): Promise<Member360> {
  const params = new URLSearchParams({ member: code });
  return dedupeRequest(
    `member360:${params}#${generation}`,
    async () => {
      const response = await fetch(`${endpoints.bff.member360}?${params}`, {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => ({}))) as Envelope<Member360>;
      if (!response.ok || payload.success === false || payload.data == null) {
        throw {
          status: response.status || 500,
          message: payload.message || "Member could not be loaded",
        } satisfies Member360ClientError;
      }
      return payload.data;
    },
    0,
  );
}

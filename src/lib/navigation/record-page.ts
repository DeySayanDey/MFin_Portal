import "server-only";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { ApiError } from "@/lib/api/errors";
import { getSessionUser } from "@/lib/auth/session";
import { readRecordCode, type RecordRef } from "./record-code";

type Query = Record<string, string | string[] | undefined>;

type RecordPageOptions = {
  /** Code from the route segment or query string. */
  code: string | string[] | undefined;
  /** Looks the code up; `branchId` is set for non-head users so other branches stay hidden. */
  resolve: (code: string, branchId: number | undefined) => Promise<RecordRef | null>;
  /** Canonical page URL for a code, without a query string. */
  href: (code: string) => string;
  /** Query values to keep when redirecting to the canonical URL. */
  keep?: Query;
};

function toQueryString(query: Query | undefined): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item != null) params.append(key, item);
    }
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

/**
 * Turns the code in a page URL into the record id used by the screen.
 * Old id links and differently cased codes redirect to the canonical code URL.
 * Returns null when the record does not exist or is outside the caller's branch.
 */
export async function resolveRecordPage({
  code: raw,
  resolve,
  href,
  keep,
}: RecordPageOptions): Promise<number | null> {
  const code = readRecordCode(raw);
  if (!code) return null;
  const user = await getSessionUser();
  if (!user) return null;

  let found: RecordRef | null;
  try {
    found = await resolve(code, user.isHead ? undefined : user.branchId);
  } catch (error) {
    if (error instanceof ApiError && (error.isNotFound || error.isForbidden)) return null;
    throw error;
  }
  if (!found) return null;

  if (found.code !== code) {
    const target = href(found.code);
    const separator = target.includes("?") ? "&" : "?";
    const query = toQueryString(keep);
    redirect({
      href: query ? `${target}${separator}${query.slice(1)}` : target,
      locale: await getLocale(),
    });
  }
  return found.id;
}

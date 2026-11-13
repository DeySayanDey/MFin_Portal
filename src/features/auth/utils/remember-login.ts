const PREFERENCE_COOKIE = "mfin_remember_device";
const LOGIN_COOKIE = "mfin_remembered_login";
const ORG_ID_COOKIE = "mfin_remembered_org_id";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export type RememberedLogin = {
  remember: boolean;
  login: string;
  orgId: string;
};

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const row = document.cookie
    .split("; ")
    .find((part) => part.startsWith(prefix));
  if (!row) return null;
  try {
    return decodeURIComponent(row.slice(prefix.length));
  } catch {
    return null;
  }
}

function writeCookie(name: string, value: string, maxAge: number) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function clearCookie(name: string) {
  writeCookie(name, "", 0);
}

/** Saved on this browser only. Never stores a password or session token. */
export function readRememberedLogin(): RememberedLogin | null {
  const preference = readCookie(PREFERENCE_COOKIE);
  const login = (readCookie(LOGIN_COOKIE) ?? "").trim();
  const orgId = (readCookie(ORG_ID_COOKIE) ?? "").trim();
  if (preference == null && !login && !orgId) return null;
  const remember =
    preference == null ? Boolean(login || orgId) : preference === "1";
  return {
    remember,
    login: remember ? login : "",
    orgId: remember ? orgId : "",
  };
}

export function saveRememberedLogin(
  remember: boolean,
  login = "",
  orgId = "",
): void {
  if (typeof document === "undefined") return;
  writeCookie(PREFERENCE_COOKIE, remember ? "1" : "0", ONE_YEAR_SECONDS);
  const name = login.trim();
  const org = orgId.trim();
  if (remember && name) {
    writeCookie(LOGIN_COOKIE, name, ONE_YEAR_SECONDS);
  } else {
    clearCookie(LOGIN_COOKIE);
  }
  if (remember && org) {
    writeCookie(ORG_ID_COOKIE, org, ONE_YEAR_SECONDS);
  } else {
    clearCookie(ORG_ID_COOKIE);
  }
}

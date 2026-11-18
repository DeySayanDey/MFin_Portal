/** Host stored for the support project, without a scheme or path. */
export function projectDomain(value: string | null | undefined): string {
  const raw = value?.trim() ?? "";
  if (!raw) return "";

  const candidate = /^https?:\/\//i.test(raw) ? raw : raw.includes("/") ? `https://${raw}` : raw;
  const host = candidate.includes("://") ? hostnameOf(candidate) : candidate;
  return normalizeHost(host);
}

function hostnameOf(value: string): string {
  try {
    return new URL(value).hostname;
  } catch {
    return "";
  }
}

function normalizeHost(host: string): string {
  const value = host.trim().toLowerCase().replace(/\.$/, "");
  const match = /^([a-z0-9.-]+)(?::(\d{1,5}))?$/.exec(value);
  if (!match) return "";
  const hostname = match[1] ?? "";
  const port = match[2];
  if (!hostname || hostname.length > 255) return "";
  if (hostname.startsWith(".") || hostname.endsWith(".") || hostname.includes("..")) return "";
  if (port && (Number(port) < 1 || Number(port) > 65535)) return "";
  return port ? `${hostname}:${port}` : hostname;
}

/** Host (and port) of the address the portal is open on. */
export function currentRunDomain(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwarded || request.headers.get("host") || "";
  return projectDomain(host);
}

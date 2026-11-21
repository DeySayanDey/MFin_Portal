export type IfscDetails = { branch: string; address: string };

export async function fetchIfscDetails(code: string, signal: AbortSignal): Promise<IfscDetails | null> {
  const response = await fetch(`/api/master/virtual-ac-config/ifsc?code=${encodeURIComponent(code)}`, { signal });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("IFSC lookup failed");
  const body = await response.json() as { data: IfscDetails };
  return body.data;
}

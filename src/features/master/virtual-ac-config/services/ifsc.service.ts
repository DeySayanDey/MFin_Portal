import "server-only";

export const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export async function lookupIfsc(code: string) {
  const response = await fetch(`https://ifsc.razorpay.com/${encodeURIComponent(code)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("IFSC lookup unavailable");
  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null || !("BRANCH" in data) || !("ADDRESS" in data) || typeof data.BRANCH !== "string" || typeof data.ADDRESS !== "string") {
    throw new Error("Invalid IFSC lookup response");
  }
  return { branch: data.BRANCH, address: data.ADDRESS };
}

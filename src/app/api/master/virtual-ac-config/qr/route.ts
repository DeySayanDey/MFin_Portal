import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth/bff-scope";
import { getAccessToken } from "@/lib/auth/session";
import { env } from "@/lib/config/env";
import { endpoints, joinApiUrl } from "@/lib/api/endpoints";
import { toBffErrorResponse } from "@/lib/api/bff-response";

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isSafeInteger(id) || id < 1) return new NextResponse(null, { status: 400 });
    const token = await getAccessToken();
    if (!token) return new NextResponse(null, { status: 401 });
    const url = new URL(joinApiUrl(env.NEXT_PUBLIC_API_BASE_URL, endpoints.virtualBank.qr));
    url.searchParams.set("id", String(id));
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: "image/*" }, cache: "no-store", signal: AbortSignal.timeout(15000) });
    if (!response.ok) return new NextResponse(null, { status: response.status });
    const type = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!["image/png", "image/jpeg", "image/webp"].includes(type)) return new NextResponse(null, { status: 502 });
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > 2 * 1024 * 1024) return new NextResponse(null, { status: 502 });
    return new NextResponse(bytes, { headers: { "Content-Type": type, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return toBffErrorResponse(error); }
}

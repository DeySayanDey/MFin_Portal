import { NextResponse } from "next/server";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: Record<string, unknown>;
};

function labelFrom(properties: Record<string, unknown>): string {
  const parts = ["name", "street", "district", "city", "county", "state", "postcode"]
    .map((key) => properties[key])
    .filter((value): value is string => typeof value === "string" && value.trim() !== "");
  return [...new Set(parts)].join(", ");
}

function insideIndia(lat: number, lng: number) {
  return lat >= 6 && lat <= 37.6 && lng >= 68 && lng <= 97.5;
}

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (query.length < 3) {
      return NextResponse.json({ success: true, message: "Location search", data: [] });
    }
    const url = new URL("https://photon.komoot.io/api/");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "5");
    url.searchParams.set("lang", "en");
    url.searchParams.set("bbox", "68,6,97.5,37.6");
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "MFINPortal/1.0 (member-address-search)" },
      signal: request.signal,
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json({ success: true, message: "Location search", data: [] });
    }
    const payload = (await response.json()) as { features?: PhotonFeature[] };
    const data = (payload.features ?? []).flatMap((feature, index) => {
      const [lng, lat] = feature.geometry?.coordinates ?? [];
      if (lat == null || lng == null || !insideIndia(lat, lng)) return [];
      const label = labelFrom(feature.properties ?? {});
      if (!label) return [];
      return [{ id: `${lat}-${lng}-${index}`, label, latitude: lat, longitude: lng }];
    });
    return NextResponse.json({ success: true, message: "Location search", data });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

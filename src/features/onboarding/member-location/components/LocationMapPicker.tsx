"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { LocateFixed, Minus, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/Form";

const TILE = 256;
const MIN_ZOOM = 5;
const MAX_ZOOM = 18;
const INDIA = { lat: 22.6, lng: 79 };

function tileX(lng: number, zoom: number) {
  return ((lng + 180) / 360) * 2 ** zoom;
}

function tileY(lat: number, zoom: number) {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** zoom;
}

function lngFromTile(x: number, zoom: number) {
  return (x / 2 ** zoom) * 360 - 180;
}

function latFromTile(y: number, zoom: number) {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** zoom;
  return (180 / Math.PI) * Math.atan(Math.sinh(n));
}

function insideIndia(lat: number, lng: number) {
  return lat >= 6 && lat <= 37.6 && lng >= 68 && lng <= 97.5;
}

function formatCoord(value: number) {
  return value.toFixed(6);
}

function readPoint(latitude: string, longitude: string): Point | null {
  if (!latitude.trim() || !longitude.trim()) return null;
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

type Point = { lat: number; lng: number };
type SearchHit = { id: string; label: string; latitude: number; longitude: number };

async function searchPlaces(query: string, signal: AbortSignal): Promise<SearchHit[]> {
  const response = await fetch(`/api/onboarding/member-location/search?q=${encodeURIComponent(query)}`, {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
    signal,
  });
  const payload = (await response.json().catch(() => ({}))) as { data?: SearchHit[] };
  return Array.isArray(payload.data) ? payload.data : [];
}

export function LocationMapPicker({
  latitude,
  longitude,
  addressQuery = "",
  onChange,
}: {
  latitude: string;
  longitude: string;
  addressQuery?: string;
  onChange: (latitude: string, longitude: string) => void;
}) {
  const t = useTranslations("onboarding.memberLocation");
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; lat: number; lng: number; moved: boolean } | null>(null);
  const [size, setSize] = useState({ width: 640, height: 280 });
  const initial = readPoint(latitude, longitude);
  const [zoom, setZoom] = useState(initial ? 16 : 5);
  const [center, setCenter] = useState<Point>(initial ?? INDIA);
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [settledQuery, setSettledQuery] = useState("");
  const initialAddress = useRef(addressQuery);
  const savedPoint = useRef(initial != null);
  const pickedLabel = useRef("");

  const marker = readPoint(latitude, longitude);

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    const observer = new ResizeObserver(() => {
      setSize({ width: node.clientWidth, height: node.clientHeight });
    });
    observer.observe(node);
    setSize({ width: node.clientWidth, height: node.clientHeight });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    function onWheel(event: WheelEvent) {
      event.preventDefault();
      setZoom((current) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current + (event.deltaY < 0 ? 1 : -1))));
    }
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);

  function place(lat: number, lng: number, nextZoom = zoom) {
    if (!insideIndia(lat, lng)) {
      setError(t("coordinatesIndia"));
      return;
    }
    setError("");
    setCenter({ lat, lng });
    setZoom(nextZoom);
    onChange(formatCoord(lat), formatCoord(lng));
  }

  const placeRef = useRef(place);
  placeRef.current = place;

  useEffect(() => {
    const text = searchText.trim();
    if (text.length < 3 || text === pickedLabel.current) {
      setHits([]);
      setSearching(false);
      setSettledQuery("");
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearching(true);
      searchPlaces(text, controller.signal)
        .then((results) => {
          if (controller.signal.aborted) return;
          setHits(results);
          setSettledQuery(text);
        })
        .catch(() => {
          if (!controller.signal.aborted) setHits([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchText]);

  useEffect(() => {
    const text = addressQuery.trim();
    if (text.length < 8 || searchText.trim()) return;
    if (savedPoint.current && text === initialAddress.current) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchPlaces(text, controller.signal)
        .then((results) => {
          const first = results[0];
          if (!first || controller.signal.aborted) return;
          placeRef.current(first.latitude, first.longitude, 15);
        })
        .catch(() => undefined);
    }, 800);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [addressQuery, searchText]);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError(t("locationUnavailable"));
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        place(position.coords.latitude, position.coords.longitude, 16);
      },
      () => {
        setLocating(false);
        setError(t("locationDenied"));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }

  const scale = 2 ** zoom;
  const centerX = tileX(center.lng, zoom);
  const centerY = tileY(center.lat, zoom);
  const halfW = size.width / 2 / TILE;
  const halfH = size.height / 2 / TILE;
  const tiles: { key: string; src: string; left: number; top: number }[] = [];
  for (let x = Math.floor(centerX - halfW) - 1; x <= Math.ceil(centerX + halfW) + 1; x += 1) {
    for (let y = Math.floor(centerY - halfH) - 1; y <= Math.ceil(centerY + halfH) + 1; y += 1) {
      if (y < 0 || y >= scale) continue;
      const wrapped = ((x % scale) + scale) % scale;
      tiles.push({
        key: `${zoom}-${x}-${y}`,
        src: `https://tile.openstreetmap.org/${zoom}/${wrapped}/${y}.png`,
        left: (x - centerX) * TILE + size.width / 2,
        top: (y - centerY) * TILE + size.height / 2,
      });
    }
  }

  const markerLeft = marker ? (tileX(marker.lng, zoom) - centerX) * TILE + size.width / 2 : 0;
  const markerTop = marker ? (tileY(marker.lat, zoom) - centerY) * TILE + size.height / 2 : 0;

  return (
    <FormField label={t("mapLabel")} hint={t("mapHint")} error={error} className="sm:col-span-2">
      <div className="overflow-hidden rounded-xl border border-border">
        <div
          ref={frameRef}
          className="relative h-72 cursor-crosshair touch-none bg-slate-100"
          role="application"
          aria-label={t("mapLabel")}
          onPointerDown={(event) => {
            frameRef.current?.setPointerCapture(event.pointerId);
            dragRef.current = { x: event.clientX, y: event.clientY, lat: center.lat, lng: center.lng, moved: false };
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            if (!drag) return;
            const dx = event.clientX - drag.x;
            const dy = event.clientY - drag.y;
            if (Math.hypot(dx, dy) > 4) drag.moved = true;
            if (!drag.moved) return;
            setCenter({
              lat: latFromTile(tileY(drag.lat, zoom) - dy / TILE, zoom),
              lng: lngFromTile(tileX(drag.lng, zoom) - dx / TILE, zoom),
            });
          }}
          onPointerUp={(event) => {
            const drag = dragRef.current;
            dragRef.current = null;
            if (!drag || drag.moved || !frameRef.current) return;
            const rect = frameRef.current.getBoundingClientRect();
            const lat = latFromTile(centerY + (event.clientY - rect.top - size.height / 2) / TILE, zoom);
            const lng = lngFromTile(centerX + (event.clientX - rect.left - size.width / 2) / TILE, zoom);
            place(lat, lng);
          }}
        >
          {tiles.map((tile) => (
            // OpenStreetMap tiles are served directly; Next image optimization is not used.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={tile.key}
              src={tile.src}
              alt=""
              draggable={false}
              width={TILE}
              height={TILE}
              className="pointer-events-none absolute max-w-none"
              style={{ left: tile.left, top: tile.top }}
            />
          ))}
          {marker ? (
            <span
              className="pointer-events-none absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-full rounded-full border-2 border-white bg-rose-600 shadow"
              style={{ left: markerLeft, top: markerTop }}
            />
          ) : null}
          <div
            className="absolute start-2 end-14 top-2 z-20"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input autoComplete="off"
                value={searchText}
                onChange={(event) => {
                  pickedLabel.current = "";
                  setSearchText(event.target.value);
                }}
                placeholder={t("searchPlaceholder")}
                className="h-9 w-full rounded-lg border border-border bg-white ps-8 pe-3 text-sm text-slate-800 shadow-sm outline-none"
                aria-label={t("searchPlaceholder")}
              />
            </div>
            {searching ? <p className="mt-1 rounded-lg bg-white px-2 py-1 text-xs text-slate-600 shadow-sm">{t("searching")}</p> : null}
            {!searching && settledQuery === searchText.trim() && hits.length === 0 ? (
              <p className="mt-1 rounded-lg bg-white px-2 py-1 text-xs text-slate-600 shadow-sm">{t("noSearchResults")}</p>
            ) : null}
            {hits.length > 0 ? (
              <ul className="mt-1 max-h-36 overflow-auto rounded-lg border border-border bg-white shadow-sm">
                {hits.map((hit) => (
                  <li key={hit.id}>
                    <button
                      type="button"
                      className="w-full cursor-pointer px-2.5 py-1.5 text-left text-xs text-slate-800 hover:bg-slate-50"
                      onClick={() => {
                        pickedLabel.current = hit.label;
                        setSearchText(hit.label);
                        setHits([]);
                        place(hit.latitude, hit.longitude, 16);
                      }}
                    >
                      {hit.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div
            className="absolute end-2 top-2 z-20 flex flex-col gap-1"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <Button type="button" size="sm" variant="secondary" icon={Plus} aria-label={t("zoomIn")} onClick={() => setZoom((current) => Math.min(MAX_ZOOM, current + 1))} />
            <Button type="button" size="sm" variant="secondary" icon={Minus} aria-label={t("zoomOut")} onClick={() => setZoom((current) => Math.max(MIN_ZOOM, current - 1))} />
          </div>
          <div
            className="absolute inset-x-2 bottom-2 z-20 flex flex-wrap items-center gap-2"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <Button type="button" size="sm" variant="primary" icon={LocateFixed} loading={locating} onClick={useCurrentLocation}>
              {t("currentLocation")}
            </Button>
            {marker ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                icon={X}
                onClick={() => {
                  setError("");
                  onChange("", "");
                }}
              >
                {t("clearLocation")}
              </Button>
            ) : null}
            <span className="rounded-lg bg-white/95 px-2 py-1 text-xs font-medium text-slate-700 shadow-sm">
              {marker ? `${formatCoord(marker.lat)}, ${formatCoord(marker.lng)}` : t("noCoordinates")}
            </span>
          </div>
        </div>
        <p className="border-t border-border bg-surface px-3 py-1.5 text-[11px] text-muted">
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">
            {t("mapAttribution")}
          </a>
        </p>
      </div>
    </FormField>
  );
}

export function normalizePin(value: string): string {
  return value.replace(/[\s-]/g, "");
}

export function pinError(value: string): "required" | "format" | null {
  const pin = normalizePin(value);
  if (!pin) return "required";
  if (!/^[1-9]\d{5}$/.test(pin)) return "format";
  return null;
}

export function coordinateError(latitude: string, longitude: string): "together" | "india" | null {
  const latText = latitude.trim();
  const lngText = longitude.trim();
  if (!latText && !lngText) return null;
  if (!latText || !lngText) return "together";
  const lat = Number(latText);
  const lng = Number(lngText);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "india";
  if (lat < 6 || lat > 37.6 || lng < 68 || lng > 97.5) return "india";
  return null;
}

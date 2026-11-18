/**
 * English is always the stored default.
 * Show it beside the chosen language only when the two labels differ,
 * so English mode is a single name.
 */
export function menuEnglishName(
  name: string,
  nameDefault?: string | null,
): string | null {
  const localized = name.trim();
  const english = (nameDefault ?? "").trim();
  if (!english) return null;
  if (english.localeCompare(localized, undefined, { sensitivity: "accent" }) === 0) {
    return null;
  }
  return english;
}

/** One search label: localized name, plus English when it is different. */
export function menuSearchLabel(name: string, nameDefault?: string | null): string {
  const english = menuEnglishName(name, nameDefault);
  return english ? `${name} · ${english}` : name;
}

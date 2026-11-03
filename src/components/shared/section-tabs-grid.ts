/** Grid columns for section tab cards, shared by the tabs and their skeleton. */
export function sectionTabsGridClass(count: number): string {
  if (count <= 2) return "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4";
  if (count === 3) return "grid-cols-1 sm:grid-cols-3";
  if (count === 4) return "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4";
  return "grid-cols-1 sm:grid-cols-3 xl:grid-cols-5";
}

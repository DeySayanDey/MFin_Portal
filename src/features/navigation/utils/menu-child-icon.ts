import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { mainModules } from "@/lib/nav";
import type { MenuTreeChild } from "@/features/navigation/types/menu";

const icons = LucideIcons as unknown as Record<string, LucideIcon>;
const GENERIC_ICON_NAMES = new Set([
  "",
  "LayoutDashboard",
  "LayoutGrid",
  "Grid2X2",
  "Grid2x2",
  "Menu",
  "PanelsTopLeft",
]);

const LABEL_ICON_RULES: Array<{ pattern: RegExp; icon: string }> = [
  { pattern: /group member mapping|role menu matrix|menu matrix|subledger|chart of accounts|chart of a cs|account heads|main heads|account ledgers|\bcoa\b/, icon: "Network" },
  { pattern: /member 360|member profile|customer profile|user profile|\bprofile\b/, icon: "UserCircle2" },
  { pattern: /member registration|new customer|borrower kyc|kyc registry/, icon: "UserRoundPlus" },
  { pattern: /membership closure|loan closure|certificate|noc issuance|specimen update/, icon: "FileCheck2" },
  { pattern: /share subscription|share register|shareholding/, icon: "HandCoins" },
  { pattern: /group management|group register|group member report/, icon: "UsersRound" },
  { pattern: /transaction activity/, icon: "Activity" },
  { pattern: /savings transaction|teller transaction|voucher entry|journal register/, icon: "Receipt" },
  { pattern: /passbook printing/, icon: "BookMarked" },
  { pattern: /withdrawal|field wallet|wallet/, icon: "Wallet" },
  { pattern: /interest/, icon: "Banknote" },
  { pattern: /recurring deposit|maturity|overdue aging|par aging|dormant|timing|business hours|fiscal year|holiday/, icon: "Clock3" },
  { pattern: /investment renewal/, icon: "ArrowUpDown" },
  { pattern: /term deposit|fixed deposit|investment|bank loan|deposit scheme/, icon: "Landmark" },
  { pattern: /savings account|savings collection|deposit collection|savings balance|passbook/, icon: "PiggyBank" },
  { pattern: /loan application|los applications/, icon: "FileSpreadsheet" },
  { pattern: /repayment schedule|amortization schedule|demand sheet/, icon: "NotebookTabs" },
  { pattern: /verification|assessment|approval|sanction|kyc pending|audit|security|permission|role/, icon: "ShieldCheck" },
  { pattern: /disbursement|loan collection|advance collection|repayment|borrowing/, icon: "HandCoins" },
  { pattern: /agent collection/, icon: "UsersRound" },
  { pattern: /collection summary/, icon: "BarChart3" },
  { pattern: /other collection/, icon: "Receipt" },
  { pattern: /recovery|collection register|my tickets|support ticket/, icon: "ClipboardList" },
  { pattern: /transfer|contra/, icon: "ArrowLeftRight" },
  { pattern: /branch|organization|organisation|center|centre/, icon: "Building2" },
  { pattern: /cash|bank book|cash book|cash position|bank deposit/, icon: "Banknote" },
  { pattern: /ledger|passbook|day book|general ledger/, icon: "BookMarked" },
  { pattern: /trial balance|profit|balance sheet|legal|short excess|classification/, icon: "Scale" },
  { pattern: /portfolio|scorecard|summary|performance|growth|health|aging|analytics/, icon: "BarChart3" },
  { pattern: /database|seed/, icon: "Database" },
  { pattern: /password|login settings/, icon: "KeyRound" },
  { pattern: /logout/, icon: "LogOut" },
  { pattern: /series|auto number|employee transfers/, icon: "ArrowUpDown" },
  { pattern: /gateway|broadcast|messaging|sms|whatsapp/, icon: "RadioTower" },
  { pattern: /settings|setup|scheme|policy/, icon: "SlidersHorizontal" },
  { pattern: /staff|employee|directory|customer|member/, icon: "UserRound" },
  { pattern: /report|register|statement|export|detailed list/, icon: "FileSpreadsheet" },
];

function normalizeRoute(route: string | null): string {
  return (route ?? "").trim().split(/[?#]/, 1)[0]!.replace(/\/+$/, "").toLowerCase();
}

function normalizeLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const staticRouteIcons: Array<[string, LucideIcon]> = [];
for (const module of mainModules) {
  for (const child of module.children ?? []) {
    if (child.icon) staticRouteIcons.push([normalizeRoute(child.href), child.icon]);
  }
}
const STATIC_ROUTE_ICONS = new Map(staticRouteIcons);

const ROUTE_ICON_RULES: Array<{ pattern: RegExp; icon: string }> = [
  { pattern: /^\/onboarding\/group-management(?:\/|$)/, icon: "UsersRound" },
  { pattern: /^\/onboarding\/member-registration(?:\/|$)/, icon: "UserRoundPlus" },
  { pattern: /^\/onboarding\/share-subscription(?:\/|$)/, icon: "HandCoins" },
  { pattern: /^\/onboarding\/group-member-mapping(?:\/|$)/, icon: "Network" },
  { pattern: /^\/onboarding\/membership-closure(?:\/|$)/, icon: "FileCheck2" },
  { pattern: /^\/onboarding\/member-360(?:-enquiry)?(?:\/|$)/, icon: "UserCircle2" },
  { pattern: /^\/deposits\/savings-transaction(?:\/|$)/, icon: "Receipt" },
  { pattern: /^\/deposits\/savings-withdrawal(?:\/|$)/, icon: "Wallet" },
  { pattern: /^\/deposits\/interest(?:\/|$)/, icon: "Banknote" },
  { pattern: /^\/deposits\/fd-settlement(?:\/|$)/, icon: "Receipt" },
  { pattern: /^\/deposits\/charges(?:\/|$)/, icon: "HandCoins" },
  { pattern: /^\/deposits\/member-ledger(?:\/|$)/, icon: "BookMarked" },
  { pattern: /^\/deposits\/specimen-update(?:\/|$)/, icon: "FileCheck2" },
];

function iconByName(name: string | null | undefined): LucideIcon | null {
  if (!name || GENERIC_ICON_NAMES.has(name)) return null;
  return icons[name] ?? null;
}

/** Prefer a semantic route/name icon over the generic icon commonly returned by MenuTree. */
export function resolveMenuChildIcon(
  child: Pick<MenuTreeChild, "icon" | "name" | "nameDefault" | "route">,
  parentIconName: string | null,
): LucideIcon {
  const route = normalizeRoute(child.route);
  const routeIconName = ROUTE_ICON_RULES.find((rule) => rule.pattern.test(route))?.icon;
  if (routeIconName && icons[routeIconName]) return icons[routeIconName];

  const staticIcon = STATIC_ROUTE_ICONS.get(route);
  if (staticIcon) return staticIcon;

  const label = normalizeLabel(child.nameDefault || child.name);
  const labelIconName = LABEL_ICON_RULES.find((rule) => rule.pattern.test(label))?.icon;
  if (labelIconName && icons[labelIconName]) return icons[labelIconName];

  const apiIcon = iconByName(child.icon);
  if (apiIcon) return apiIcon;

  return iconByName(parentIconName) ?? icons.FileSpreadsheet;
}

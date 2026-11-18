import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MENU_BOOT_ICONS } from "@/features/navigation/utils/menu-boot-icons";

type IconAttrs = Record<string, string | number>;
type IconNode = [string, IconAttrs, IconNode[]?];

type IconWithData = LucideIcon & {
  render?: (
    props: object,
    ref: null,
  ) => { props?: { icon?: { node?: IconNode[] } } };
};

const SVG_OPEN =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';

function escapeAttr(value: string): string {
  return value.replace(/[&<>"]/g, (ch) => {
    if (ch === "&") return "&amp;";
    if (ch === "<") return "&lt;";
    if (ch === ">") return "&gt;";
    return "&quot;";
  });
}

function serialize(nodes: IconNode[]): string {
  return nodes
    .map((node) => {
      const [tag, attrs, children] = node;
      if (!/^[a-z][a-z0-9]*$/i.test(tag)) return "";
      const parts: string[] = [];
      for (const [key, value] of Object.entries(attrs ?? {})) {
        if (key === "key" || !/^[a-z][a-z0-9:-]*$/i.test(key)) continue;
        parts.push(`${key}="${escapeAttr(String(value))}"`);
      }
      const inner = Array.isArray(children) ? serialize(children) : "";
      const head = parts.length > 0 ? `${tag} ${parts.join(" ")}` : tag;
      return inner ? `<${head}>${inner}</${tag}>` : `<${head}/>`;
    })
    .join("");
}

/** SVG for a menu icon name. Empty name uses the dashboard glyph. */
export function menuIconMarkup(name: string | null | undefined): string {
  const key = name?.trim() ?? "";
  if (!key) return MENU_BOOT_ICONS[""] ?? "";
  const known = MENU_BOOT_ICONS[key];
  if (known) return known;

  const icons = LucideIcons as unknown as Record<string, IconWithData>;
  const Icon = icons[key];
  if (!Icon) return "";
  try {
    const node = Icon.render?.({}, null)?.props?.icon?.node;
    if (!node || node.length === 0) return "";
    return `${SVG_OPEN}${serialize(node)}</svg>`;
  } catch {
    return "";
  }
}

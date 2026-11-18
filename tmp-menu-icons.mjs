import fs from "fs";
import path from "path";

const names = [
  "",
  "Activity",
  "ArrowLeftRight",
  "ArrowUpDown",
  "Banknote",
  "BarChart3",
  "BookMarked",
  "BookOpen",
  "Building2",
  "ClipboardList",
  "Clock3",
  "FileSpreadsheet",
  "GitBranch",
  "HandCoins",
  "Landmark",
  "LayoutDashboard",
  "Menu",
  "Network",
  "NotebookTabs",
  "PiggyBank",
  "RadioTower",
  "Receipt",
  "Scale",
  "Shield",
  "ShieldCheck",
  "SlidersHorizontal",
  "UserCircle2",
  "UserRound",
  "UserRoundPlus",
  "UsersRound",
  "Vault",
  "Wallet",
  "Wifi",
];

function kebab(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/([a-zA-Z])(\d)/g, "$1-$2")
    .toLowerCase();
}

function ser(nodes) {
  return nodes
    .map((node) => {
      const tag = node[0];
      const attrs = node[1] || {};
      const kids = node[2];
      const parts = [];
      for (const [key, value] of Object.entries(attrs)) {
        if (key === "key") continue;
        const text = String(value).replace(/[&<>"]/g, (ch) =>
          ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch],
        );
        parts.push(`${key}="${text}"`);
      }
      const inner = Array.isArray(kids) ? ser(kids) : "";
      const head = parts.length ? `${tag} ${parts.join(" ")}` : tag;
      return inner ? `<${head}>${inner}</${tag}>` : `<${head}/>`;
    })
    .join("");
}

const dir = "node_modules/lucide-react/dist/esm/icons";

function readIcon(file, depth = 0) {
  if (depth > 4) return null;
  const src = fs.readFileSync(path.join(dir, `${file}.mjs`), "utf8");
  const reexport = src.match(/export \{ default \} from '\.\/([^']+)\.mjs'/);
  if (reexport) return readIcon(reexport[1], depth + 1);
  const match = src.match(/const __iconData = (\{[\s\S]*?\});\s*__iconData\.node;/);
  if (!match) return null;
  return Function(`return ${match[1]}`)();
}

const out = {};
for (const name of names) {
  const file = name ? kebab(name) : "layout-dashboard";
  const data = readIcon(file);
  if (!data) {
    console.error("missing", name, file);
    continue;
  }
  out[name] =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    ser(data.node) +
    "</svg>";
}
fs.writeFileSync("tmp-menu-icons.json", JSON.stringify(out));
console.log("keys", Object.keys(out).length, "bytes", fs.statSync("tmp-menu-icons.json").size);

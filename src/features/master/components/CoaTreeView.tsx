"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  FileSpreadsheet,
  GitBranch,
  Moon,
  Network,
  Pencil,
  Plus,
  Receipt,
  Scale,
  Search,
  Wallet,
} from "lucide-react";
import {
  CashBookPanel,
  DayBookPanel,
  GlStatementPanel,
  PostedVouchersPanel,
  SubLedgerPanel,
  TrialBalancePanel,
} from "@/features/master/components/CoaLedgerPanels";

type CoaLevel = 1 | 2 | 3 | 4;
type PanelId =
  | "coa"
  | "gl-statement"
  | "trial-balance"
  | "sub-ledger"
  | "vouchers"
  | "day-book"
  | "cash-book";

type CoaNode = {
  code: string;
  title: string;
  bangla: string;
  level: CoaLevel;
  nature: "Dr" | "Cr";
  balance: number;
  children?: CoaNode[];
};

const panels: {
  id: PanelId;
  title: string;
  bangla: string;
  icon: typeof Network;
}[] = [
  { id: "coa", title: "N-Level COA Tree", bangla: "খতিয়ান বৃক্ষ", icon: Network },
  {
    id: "gl-statement",
    title: "GL-Wise Statement Report",
    bangla: "খতিয়ান বিবরণী",
    icon: FileSpreadsheet,
  },
  {
    id: "trial-balance",
    title: "Hierarchical Trial Balance",
    bangla: "রওয়ামিল",
    icon: Scale,
  },
  {
    id: "sub-ledger",
    title: "Sub-Ledger Master",
    bangla: "উপ-খতিয়ান",
    icon: GitBranch,
  },
  {
    id: "vouchers",
    title: "Posted Vouchers",
    bangla: "ভাউচার তালিকা",
    icon: Receipt,
  },
  {
    id: "day-book",
    title: "Day Book",
    bangla: "দৈনিক জাবেদা",
    icon: CalendarDays,
  },
  { id: "cash-book", title: "Cash Book", bangla: "নগদান বই", icon: Wallet },
];

const coaTree: CoaNode[] = [
  {
    code: "100000",
    title: "ASSETS",
    bangla: "মোট সম্পদ",
    level: 1,
    nature: "Dr",
    balance: 871000,
    children: [
      {
        code: "110000",
        title: "Cash and Bank Liquid Balances",
        bangla: "নগদ ও ব্যাংক তরল তহবিল",
        level: 2,
        nature: "Dr",
        balance: 871000,
        children: [
          {
            code: "111000",
            title: "Branch Physical Vault Cash Head",
            bangla: "শাখা ভল্ট ক্যাশ মূল হিসাব",
            level: 3,
            nature: "Dr",
            balance: 793000,
          },
          {
            code: "111100",
            title: "Cashier Front Counter Drawer Cash",
            bangla: "ক্যাশিয়ার কাউন্টার ক্যাশ",
            level: 3,
            nature: "Dr",
            balance: 58000,
          },
          {
            code: "111200",
            title: "Field Officer Kendra Meeting Collection Safe",
            bangla: "মাঠকর্মী কেন্দ্র কালেকশন ক্যাশ",
            level: 3,
            nature: "Dr",
            balance: 20000,
          },
          {
            code: "112000",
            title: "Commercial Bank Accounts Head",
            bangla: "বাণিজ্যিক ব্যাংক হিসাব",
            level: 3,
            nature: "Dr",
            balance: 0,
          },
        ],
      },
      {
        code: "120000",
        title: "Microfinance Loan Portfolio Outstanding",
        bangla: "ক্ষুদ্রঋণ পোর্টফোলিও মূল স্থিতি",
        level: 2,
        nature: "Dr",
        balance: 0,
        children: [
          {
            code: "121100",
            title: "JLG Microfinance Loans",
            bangla: "জেএলজি মাইক্রোফাইন্যান্স ঋণ",
            level: 3,
            nature: "Dr",
            balance: 0,
          },
        ],
      },
      {
        code: "130000",
        title: "Fixed & Tangible Infrastructure Assets",
        bangla: "স্থায়ী ও অবকাঠামোগত সম্পদ",
        level: 2,
        nature: "Dr",
        balance: 0,
      },
    ],
  },
  {
    code: "200000",
    title: "LIABILITIES",
    bangla: "মোট দায়",
    level: 1,
    nature: "Cr",
    balance: 0,
    children: [
      {
        code: "210000",
        title: "Member Deposits & Payables",
        bangla: "সদস্য আমানত ও প্রদেয়",
        level: 2,
        nature: "Cr",
        balance: 0,
      },
    ],
  },
  {
    code: "300000",
    title: "EQUITY & STATUTORY RESERVES",
    bangla: "মূলধন",
    level: 1,
    nature: "Cr",
    balance: 0,
  },
  {
    code: "400000",
    title: "REVENUE & OPERATIONAL INCOME",
    bangla: "আয়",
    level: 1,
    nature: "Cr",
    balance: 0,
    children: [
      {
        code: "410000",
        title: "Interest Income",
        bangla: "সুদ আয়",
        level: 2,
        nature: "Cr",
        balance: 0,
      },
    ],
  },
  {
    code: "500000",
    title: "EXPENSES & OPERATING OVERHEADS",
    bangla: "ব্যয়",
    level: 1,
    nature: "Dr",
    balance: 0,
    children: [
      {
        code: "510000",
        title: "Provisions & Write-offs",
        bangla: "প্রভিশন ও রাইট-অফ",
        level: 2,
        nature: "Dr",
        balance: 0,
      },
    ],
  },
];

const levelTone: Record<
  CoaLevel,
  { badge: string; label: string }
> = {
  1: { badge: "border-blue-300 bg-blue-50 text-blue-700", label: "L1 Major" },
  2: {
    badge: "border-violet-300 bg-violet-50 text-violet-700",
    label: "L2 Control",
  },
  3: {
    badge: "border-emerald-300 bg-emerald-50 text-emerald-700",
    label: "L3 GL Head",
  },
  4: {
    badge: "border-amber-300 bg-amber-50 text-amber-700",
    label: "L4 Sub-Ledger",
  },
};

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function collectCodes(nodes: CoaNode[]): string[] {
  return nodes.flatMap((node) => [
    node.code,
    ...(node.children ? collectCodes(node.children) : []),
  ]);
}

function nodeMatches(node: CoaNode, query: string): boolean {
  const q = query.toLowerCase();
  if (
    node.code.toLowerCase().includes(q) ||
    node.title.toLowerCase().includes(q) ||
    node.bangla.includes(query)
  ) {
    return true;
  }
  return Boolean(node.children?.some((child) => nodeMatches(child, query)));
}

function filterTree(nodes: CoaNode[], query: string): CoaNode[] {
  if (!query.trim()) return nodes;
  return nodes
    .filter((node) => nodeMatches(node, query))
    .map((node) => ({
      ...node,
      children: node.children ? filterTree(node.children, query) : undefined,
    }));
}

export function CoaTreeView() {
  const [activePanel, setActivePanel] = useState<PanelId>("coa");
  const [query, setQuery] = useState("");
  const allCodes = useMemo(() => collectCodes(coaTree), []);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(["100000", "110000"]),
  );

  const visibleTree = useMemo(
    () => filterTree(coaTree, query),
    [query],
  );

  function toggle(code: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function expandAll() {
    setExpanded(new Set(allCodes));
  }

  function collapseAll() {
    setExpanded(new Set());
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="btn-actions justify-end">
        <button type="button" className="btn btn-secondary">
          <Moon className="h-4 w-4 text-amber-500" />
          CBS Day-End (EOD / SOD)
        </button>
        <button type="button" className="btn btn-primary">
          <Receipt className="h-4 w-4" />
          Voucher Studio
        </button>
        <button type="button" className="btn btn-secondary">
          <Pencil className="h-4 w-4" />
          Quick Journal
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-7">
        {panels.map((panel) => {
          const active = activePanel === panel.id;
          const Icon = panel.icon;
          return (
            <button
              key={panel.id}
              type="button"
              onClick={() => setActivePanel(panel.id)}
              className={`flex flex-col items-start gap-2 rounded-2xl border px-3 py-3 text-left transition ${
                active
                  ? "border-brand bg-brand text-white shadow-sm"
                  : "border-border bg-surface-muted text-slate-600 hover:border-brand/30 hover:bg-white"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${active ? "text-white" : "text-slate-500"}`}
              />
              <span className="text-xs font-semibold leading-snug">
                {panel.title}
              </span>
              <span
                className={`text-[11px] leading-snug ${
                  active ? "text-white/80" : "text-muted"
                }`}
              >
                {panel.bangla}
              </span>
            </button>
          );
        })}
      </div>

      {activePanel === "coa" ? (
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                N-Level Hierarchical Chart of Accounts (COA Tree)
              </h2>
              <p className="mt-1 text-sm text-muted">
                Group (L1) → Control (L2) → General Ledger (L3) → Sub-Ledger
                (L4) → Child Accounts (L5+)
              </p>
            </div>
            <div className="btn-actions">
              <button
                type="button"
                onClick={expandAll}
                className="btn btn-secondary btn-sm"
              >
                <ChevronsUpDown className="h-3.5 w-3.5" />
                Expand All
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="btn btn-secondary btn-sm"
              >
                <ChevronsDownUp className="h-3.5 w-3.5" />
                Collapse All
              </button>
              <button type="button" className="btn btn-primary btn-sm">
                <Plus className="h-3.5 w-3.5" />
                New Root Head
              </button>
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative block w-full lg:max-w-md">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search GL Code, Title or Bangla..."
                className="w-full rounded-full border border-border bg-surface-muted py-2.5 pr-3 pl-9 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(levelTone) as unknown as CoaLevel[]).map(
                (level) => (
                  <span
                    key={level}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${levelTone[level].badge}`}
                  >
                    {levelTone[level].label}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            {visibleTree.map((node) => (
              <CoaRow
                key={node.code}
                node={node}
                depth={0}
                expanded={expanded}
                onToggle={toggle}
              />
            ))}
          </div>
        </section>
      ) : null}

      {activePanel === "gl-statement" ? <GlStatementPanel /> : null}
      {activePanel === "trial-balance" ? <TrialBalancePanel /> : null}
      {activePanel === "sub-ledger" ? <SubLedgerPanel /> : null}
      {activePanel === "vouchers" ? <PostedVouchersPanel /> : null}
      {activePanel === "day-book" ? <DayBookPanel /> : null}
      {activePanel === "cash-book" ? <CashBookPanel /> : null}
    </div>
  );
}

function CoaRow({
  node,
  depth,
  expanded,
  onToggle,
}: {
  node: CoaNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (code: string) => void;
}) {
  const hasChildren = Boolean(node.children?.length);
  const isOpen = expanded.has(node.code);
  const tone = levelTone[node.level];

  return (
    <>
      <div
        className="flex items-center gap-2 border-b border-border/70 bg-white px-3 py-2.5 hover:bg-slate-50/80"
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        <button
          type="button"
          onClick={() => hasChildren && onToggle(node.code)}
          className={`flex h-6 w-6 items-center justify-center rounded-md ${
            hasChildren
              ? "text-slate-500 hover:bg-slate-100"
              : "cursor-default text-transparent"
          }`}
          aria-label={isOpen ? "Collapse" : "Expand"}
        >
          {hasChildren ? (
            isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
          )}
        </button>

        <span
          className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${tone.badge}`}
        >
          L{node.level}
        </span>

        <span className="font-mono text-xs font-semibold text-slate-500">
          {node.code}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-800">
            {node.title}{" "}
            <span className="font-normal text-muted">({node.bangla})</span>
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-mono text-sm font-semibold tabular-nums text-slate-800">
            ₹{formatInr(node.balance)}
          </p>
          <p className="text-[11px] font-semibold text-slate-400">
            {node.nature}
          </p>
        </div>
      </div>

      {hasChildren && isOpen
        ? node.children!.map((child) => (
            <CoaRow
              key={child.code}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))
        : null}
    </>
  );
}

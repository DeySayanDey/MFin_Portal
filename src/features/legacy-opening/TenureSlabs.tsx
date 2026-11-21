"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import { TextField } from "@/components/ui/Form";
import { Select } from "@/components/ui/Select";
import { fetchDepositSchemeSlabs } from "@/features/master/deposit-interest/services/deposit-interest-client";
import type { DepositSchemeSlab } from "@/features/master/deposit-interest/types/deposit-interest.types";
import { formatDateDMY } from "@/lib/date-format";
import type { ApplOption } from "@/features/master/appl-options";

export function TenureSlabs({ schemeId, prodTypeCd, value, unit, unitCatalog, slabId, onChange, onUnitChange, onSlabSelect }: {
  schemeId?: string;
  prodTypeCd?: number;
  value: string;
  unit: string;
  unitCatalog: ApplOption[];
  slabId: string;
  onChange: (value: string) => void;
  onUnitChange: (unit: string, label: string) => void;
  onSlabSelect: (slab: DepositSchemeSlab) => void;
}) {
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<{ above: boolean; maxHeight: number }>({ above: false, maxHeight: 240 });
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [slabs, setSlabs] = useState<DepositSchemeSlab[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [reload, setReload] = useState(0);
  const open = Boolean(schemeId) && (pinned || hovered);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const container = containerRef.current;
      const panel = panelRef.current;
      if (!container || !panel) return;
      const rect = container.getBoundingClientRect();
      const boundary = container.closest<HTMLElement>('[role="dialog"]') ?? container.closest<HTMLElement>("main");
      const boundaryRect = boundary?.getBoundingClientRect();
      const top = Math.max(0, boundaryRect?.top ?? 0);
      const bottom = Math.min(window.innerHeight, boundaryRect?.bottom ?? window.innerHeight);
      const aboveSpace = Math.max(0, rect.top - top - 8);
      const belowSpace = Math.max(0, bottom - rect.bottom - 8);
      const desired = Math.min(panel.scrollHeight, 260);
      const above = belowSpace < desired && aboveSpace > belowSpace;
      const maxHeight = Math.max(96, Math.min(260, above ? aboveSpace : belowSpace));
      setPlacement((current) => current.above === above && current.maxHeight === maxHeight ? current : { above, maxHeight });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => { window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [open, status, slabs.length]);

  useEffect(() => {
    if (!schemeId) return;
    let cancelled = false;
    async function load() {
      setStatus("loading");
      try {
        const all: DepositSchemeSlab[] = [];
        let page = 1;
        while (true) {
          const result = await fetchDepositSchemeSlabs({ schemeId: Number(schemeId), isActive: 1, page, perPage: 200 });
          all.push(...result.items.filter((item) => item.schemeId === Number(schemeId) && item.isActive));
          if (!result.meta && result.items.length === 200) throw new Error("Missing pagination information");
          if (!result.meta || page >= result.meta.lastPage || result.items.length === 0) break;
          page += 1;
        }
        if (!cancelled) { setSlabs(all); setStatus("ready"); }
      } catch {
        if (!cancelled) { setSlabs([]); setStatus("error"); }
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [schemeId, reload]);

  // RD (prod_type_cd 2) uses months (3) or years (4)
  const isRecurring = prodTypeCd === 2;
  const filteredCatalog = isRecurring
    ? unitCatalog.filter((item) => item.optCode === 3 || item.optCode === 4)
    : unitCatalog;
  const filteredSlabs = isRecurring
    ? slabs.filter((slab) => slab.termCd === 3 || slab.termCd === 4)
    : slabs;

  const unitOptions = filteredCatalog.filter((item) => filteredSlabs.length === 0 || filteredSlabs.some((slab) => slab.termCd === item.optCode) || String(item.optCode) === unit).map((item) => ({ value: String(item.optCode), label: item.optDescription }));

  const unitLimits: Record<string, number> = { "1": 120, "2": 17, "3": 120, "4": 50 };
  const tenureHint = unit && unitLimits[unit]
    ? `Max ${unitLimits[unit]} ${unitOptions.find((u) => u.value === unit)?.label?.toLowerCase() || "units"}`
    : isRecurring
    ? "RD uses months (max 120) or years (max 50)"
    : undefined;

  return (
    <div ref={containerRef} className="relative" onMouseLeave={() => setHovered(false)}>
      <TextField label="Tenure" value={value} onChange={onChange} inputMode="numeric" hint={tenureHint} required inputClassName="pe-40" trailing={<div className="flex items-center gap-1">
        <Select aria-label="Tenure unit" value={unit} onChange={(next) => onUnitChange(next, unitOptions.find((item) => item.value === next)?.label ?? "")} options={unitOptions} placeholder="Unit" disabled={!schemeId || unitOptions.length === 0} searchable={false} clearable={false} size="sm" className="w-28 border-s border-border ps-1 [&_button[aria-haspopup=listbox]]:border-0 [&_button[aria-haspopup=listbox]]:shadow-none" />
        <button type="button" disabled={!schemeId} aria-label="Show scheme tenure slabs" aria-expanded={open} aria-controls={open ? panelId : undefined} onMouseEnter={() => setHovered(true)} onClick={() => { setPinned((current) => !current); setHovered(false); }} className="rounded-md p-1.5 text-muted hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40"><Info className="h-4 w-4" aria-hidden="true" /></button>
      </div>} />
      {open && <div ref={panelRef} id={panelId} style={{ maxHeight: placement.maxHeight }} className={`absolute right-0 z-30 w-full min-w-0 overflow-y-auto rounded-xl border border-border bg-surface p-3 text-sm shadow-[var(--shadow-card)] ${placement.above ? "bottom-full mb-1" : "top-full mt-1"}`} role="region" aria-label="Scheme tenure slabs">
        <p className="mb-2 font-semibold text-foreground">Available scheme slabs</p>
        {status === "loading" || status === "idle" ? <p className="text-muted" role="status">Loading slabs...</p> : status === "error" ? <p className="text-rose-600" role="alert">Could not load slabs. <button type="button" className="underline" onClick={() => setReload((current) => current + 1)}>Try again</button></p> : slabs.length === 0 ? <p className="text-muted">No active slabs available.</p> : <ul className="max-h-48 space-y-1 overflow-y-auto">{slabs.map((slab) => <li key={slab.id}><button type="button" aria-pressed={slabId === String(slab.id)} onClick={() => { onSlabSelect(slab); setPinned(false); setHovered(false); }} className={`w-full rounded-lg px-2 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${slabId === String(slab.id) ? "bg-brand-soft text-brand-ink" : "hover:bg-surface-muted"}`}><span className="block font-medium">{slab.minDuration}–{slab.maxDuration} {slab.termDesc || `(${slab.termCd})`} · {slab.roi}%</span><span className="block text-xs text-muted">{formatDateDMY(slab.effectFrm)} – {slab.effectUpto ? formatDateDMY(slab.effectUpto) : "Open-ended"}</span></button></li>)}</ul>}
      </div>}
    </div>
  );
}

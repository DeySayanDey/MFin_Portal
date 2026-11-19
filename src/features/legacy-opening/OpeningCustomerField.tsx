"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { TextField } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetchOpeningCustomers } from "./services/opening-deposit-client";
import type { OpeningCustomer } from "./services/opening-deposit.schemas";

export function OpeningCustomerField({ label, type, value, onSelect, required = true, branchId, disabled = false }: { label: string; type: 1 | 2; value: string; onSelect: (customer: OpeningCustomer) => void; required?: boolean; branchId?: number; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [items, setItems] = useState<OpeningCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true); setError(""); setItems([]);
    fetchOpeningCustomers(type, query, page, branchId).then((result) => {
      if (!cancelled) { setItems(result.data); setTotalPages(Math.max(1, result.meta.last_page)); }
    }).catch((err: unknown) => { if (!cancelled) setError(err instanceof Error ? err.message : "Could not load customers."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, type, query, page, reload, branchId]);
  function submit(event: FormEvent) { event.preventDefault(); event.stopPropagation(); setPage(1); setQuery(search.trim()); }
  return <>
    <TextField label={label} value={value} readOnly required={required} disabled={disabled} trailing={<button type="button" disabled={disabled} onClick={() => { setSearch(""); setQuery(""); setPage(1); setOpen(true); }} aria-label={`Search ${label}`} className="rounded-md p-1.5 text-muted hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40"><Search className="h-4 w-4" /></button>} />
    <Modal open={open} onClose={() => setOpen(false)} title={type === 1 ? "Select group" : "Select customer"} size="lg" confirmOnClose={false} confirmOnSave={false} footer={<Button variant="secondary" onClick={() => setOpen(false)}>Close</Button>}>
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-end"><div className="min-w-0 flex-1"><TextField label="Search by name or code" value={search} onChange={setSearch} /></div><Button type="submit" icon={Search}>Search</Button></form>
      {loading && <div role="status" aria-label={type === 1 ? "Loading groups" : "Loading customers"} className="mt-4 space-y-2">
        {[0, 1, 2].map((row) => <div key={row} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
          <div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-4 w-36 max-w-full" /><Skeleton className="h-3 w-48 max-w-full" /></div>
          <Skeleton className="h-8 w-16 shrink-0" rounded="xl" />
        </div>)}
      </div>}
      {error && <p role="alert" className="mt-4 text-sm text-rose-600">{error} <button type="button" className="underline" onClick={() => setReload((current) => current + 1)}>Try again</button></p>}
      {!loading && !error && <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">{items.length === 0 ? <p className="text-sm text-muted">No matching customers found.</p> : items.map((item) => <div key={`${item.cust_type_cd}-${item.customer_id}`} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"><div className="min-w-0"><p className="font-medium text-foreground">{item.customer_name}</p><p className="text-xs text-muted">{item.customer_code || `#${item.customer_id}`}{item.ref_code?.trim() ? ` ? Ref: ${item.ref_code.trim()}` : ""}{item.branch_name?.trim() ? ` · ${item.branch_name.trim()}` : item.branch_id != null ? ` · Branch #${item.branch_id}` : ""}</p></div><Button size="sm" variant="secondary" onClick={() => { onSelect(item); setOpen(false); }}>Select</Button></div>)}</div>}
      <div className="mt-4 flex justify-end gap-2"><Button size="sm" variant="secondary" disabled={loading || page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button><span className="self-center text-xs text-muted">{page} / {totalPages}</span><Button size="sm" variant="secondary" disabled={loading || page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button></div>
    </Modal>
  </>;
}

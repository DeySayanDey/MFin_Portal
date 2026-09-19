"use client";

import { useMemo, useState } from "react";
import { Search, Send } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  Modal,
  modalFieldClass,
  modalSelectClass,
} from "@/components/ui/Modal";
import { messageLogs } from "@/features/hr/components/hr-data";

export function HrMessagingView() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return messageLogs;
    return messageLogs.filter(
      (row) =>
        row.recipient.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q) ||
        row.mobile.includes(q),
    );
  }, [query]);

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="flex justify-end">
        <Button icon={Send} onClick={() => setOpen(true)}>
          Compose Message
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Delivered",
            value: String(
              messageLogs.filter((row) => row.status === "Delivered").length,
            ),
            hint: "Gateway confirmed",
          },
          {
            label: "Queued",
            value: String(
              messageLogs.filter((row) => row.status === "Queued").length,
            ),
            hint: "Pending send",
          },
          {
            label: "Channels",
            value: "2",
            hint: "SMS + WhatsApp",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-border bg-surface px-4 py-4 shadow-[var(--shadow-card)]"
          >
            <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-soft uppercase">
              {item.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
            <p className="mt-1 text-xs text-muted">{item.hint}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Message Delivery Log
            </h2>
            <p className="mt-1 text-sm text-muted">
              Channel, delivery status, template category, and recipient phone
              numbers
            </p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter messages..."
              className="w-full rounded-xl border border-border bg-surface-muted py-2.5 pr-3 pl-9 text-sm outline-none focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10"
            />
          </div>
        </div>

        <div className="table-scroll">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-soft">
                <th className="pb-3 pr-3">Recipient</th>
                <th className="pb-3 pr-3">Mobile</th>
                <th className="pb-3 pr-3">Category</th>
                <th className="pb-3 pr-3">Channel</th>
                <th className="pb-3 pr-3">Preview</th>
                <th className="pb-3 pr-3">Sent At</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-t border-border/70">
                  <td className="py-3.5 pr-3 font-semibold text-slate-900">
                    {row.recipient}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-600">{row.mobile}</td>
                  <td className="py-3.5 pr-3 text-slate-700">{row.category}</td>
                  <td className="py-3.5 pr-3">
                    <Badge
                      tone={row.channel === "WhatsApp" ? "success" : "info"}
                      caps={false}
                    >
                      {row.channel}
                    </Badge>
                  </td>
                  <td className="max-w-xs py-3.5 pr-3 text-slate-600">
                    <span className="line-clamp-2">{row.preview}</span>
                  </td>
                  <td className="py-3.5 pr-3 text-slate-600">{row.sentAt}</td>
                  <td className="py-3.5">
                    <Badge
                      tone={
                        row.status === "Delivered"
                          ? "success"
                          : row.status === "Queued"
                            ? "warning"
                            : "danger"
                      }
                      caps={false}
                    >
                      {row.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ComposeMessageModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function ComposeMessageModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Compose Broadcast Message"
      subtitle="Send real-time transaction receipts, reminder alerts, or custom notices"
      footer={
        <>
          <Button variant="soft" onClick={onClose}>
            Cancel
          </Button>
          <Button icon={Send} onClick={onClose}>
            Send Message
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Template Category" required>
          <select className={modalSelectClass} defaultValue="EMI Collection Receipt">
            <option>EMI Collection Receipt</option>
            <option>Overdue EMI Reminder</option>
            <option>Kendra Meeting Reminder</option>
            <option>Legal Default Warning</option>
            <option>Custom Notice</option>
          </select>
        </FormField>
        <FormField label="Channel" required>
          <select className={modalSelectClass} defaultValue="WhatsApp">
            <option>WhatsApp</option>
            <option>SMS</option>
            <option>Both</option>
          </select>
        </FormField>
        <FormField label="Recipient / Group" required>
          <select className={modalSelectClass} defaultValue="Sunita Ramesh Kamble">
            <option>Sunita Ramesh Kamble</option>
            <option>Meena More</option>
            <option>All Active Borrowers — Karveer</option>
            <option>Delinquent DPD ≥ 30</option>
          </select>
        </FormField>
        <FormField label="Message Body">
          <textarea
            rows={4}
            defaultValue="Dear Sunita Kamble, EMI of ₹3,788 for LN-2026-00001 received. Thank you! - eZiMicro"
            className={modalFieldClass}
          />
        </FormField>
      </div>
    </Modal>
  );
}

"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Cloud,
  Download,
  Lock,
  Radio,
  RefreshCw,
  Save,
  Search,
  Shield,
  Smartphone,
  Upload,
  Wifi,
} from "lucide-react";

type SyncMode = "intranet" | "cloud" | "hotspot";

const networks = [
  { ssid: "eZiMicro-Branch-WB01", security: "WPA3", band: "5GHz", quality: 96 },
  { ssid: "Shyambazar-Kendra-AP", security: "WPA2", band: "2.4GHz", quality: 78 },
  { ssid: "FieldHotspot-FO002", security: "WPA2", band: "2.4GHz", quality: 55 },
  { ssid: "VaultSync-5G", security: "WPA3", band: "5GHz", quality: 88 },
  { ssid: "Guest-Branch-WiFi", security: "WPA2", band: "5GHz", quality: 70 },
];

const offlineRoster = [
  {
    group: "Maa Sarada Swanirbhar Dal",
    loan: "LN-2026-00001",
    member: "Supriya Mondal",
    due: "₹3,017.49",
  },
  {
    group: "Maa Sarada Swanirbhar Dal",
    loan: "LN-2026-00002",
    member: "Mousumi Ghosh",
    due: "₹3,071.56",
  },
  {
    group: "Maa Sarada Swanirbhar Dal",
    loan: "LN-2026-00003",
    member: "Aparna Sen",
    due: "₹2,980.00",
  },
];

const pendingQueue = [
  {
    id: "OUT-0912-001",
    type: "EMI Receipt",
    detail: "RCPT-20260912-0001 · LN-2026-00001",
    amount: "₹3,017.49",
  },
  {
    id: "OUT-0912-002",
    type: "Attendance Punch",
    detail: "EMP-002 · Gandhinagar Kendra 01",
    amount: "—",
  },
  {
    id: "OUT-0912-003",
    type: "EMI Receipt",
    detail: "RCPT-20260912-0002 · LN-2026-00002",
    amount: "₹3,071.56",
  },
];

export function WifiSyncView() {
  const [mode, setMode] = useState<SyncMode>("intranet");
  const [encrypt, setEncrypt] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedBorrower, setSelectedBorrower] = useState(
    offlineRoster[0]?.loan ?? "",
  );
  const [dayOpenDone, setDayOpenDone] = useState(false);
  const [dayClosePending, setDayClosePending] = useState(true);

  const filteredNetworks = useMemo(() => {
    const q = query.toLowerCase();
    return networks.filter(
      (item) =>
        item.ssid.toLowerCase().includes(q) ||
        item.security.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          Wi-Fi Sync Master & Offline Data Hub
        </h1>
        <p className="mt-1 text-sm text-muted">
          Perform morning Day Open to download Kendra manifests, then return to
          branch and commit evening Day Close
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <StatusCard
          title="Day Session Status"
          badge={dayOpenDone ? "Day Open Complete" : "Ready for Day Open Sync"}
          badgeTone={
            dayOpenDone
              ? "bg-emerald-50 text-emerald-700"
              : "bg-blue-50 text-blue-700"
          }
          body="Morning sync downloads Kendra meeting rosters and EMI demand sheets to the field device."
          icon={<Download className="h-5 w-5" />}
        />
        <StatusCard
          title="Shyambazar Kendra Cluster"
          badge="Wi-Fi Hub Online"
          badgeTone="bg-emerald-50 text-emerald-700"
          body="Branch intranet access point for dual-custody vault hand-in and offline queue upload."
          icon={<Wifi className="h-5 w-5" />}
        />
        <StatusCard
          title="Offline Queue"
          badge={
            dayClosePending ? "Awaiting Day Close Sync" : "Day Close Synced"
          }
          badgeTone={
            dayClosePending
              ? "bg-amber-50 text-amber-800"
              : "bg-emerald-50 text-emerald-700"
          }
          body="Evening Day Close commits field collections, attendance, and receipts to CBS."
          icon={<Upload className="h-5 w-5" />}
        />
      </div>

      <div className="btn-actions justify-start">
        <button
          type="button"
          onClick={() => {
            setDayOpenDone(true);
            setDayClosePending(true);
          }}
          className="btn btn-primary"
        >
          <Download className="h-4 w-4" />
          Morning Day Open
        </button>
        <button
          type="button"
          onClick={() => setDayClosePending(false)}
          className="btn btn-secondary"
        >
          <Upload className="h-4 w-4" />
          Evening Day Close
        </button>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <h2 className="text-base font-semibold text-slate-900">
          Sync Mode · ওয়াই-ফাই সেটআপ, নিরাপত্তা এবং মোবাইল ডিভাইস প্রভিশনিং
        </h2>
        <p className="mt-1 text-sm text-muted">
          Choose how field devices exchange data with the branch CBS node
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <ModeCard
            active={mode === "intranet"}
            onClick={() => setMode("intranet")}
            icon={<Wifi className="h-5 w-5" />}
            title="Branch Intranet Sync"
            body="Direct intranet sync at branch. Works without internet."
          />
          <ModeCard
            active={mode === "cloud"}
            onClick={() => setMode("cloud")}
            icon={<Cloud className="h-5 w-5" />}
            title="Central Cloud Sync"
            body="Central cloud sync via mobile internet when field is available."
          />
          <ModeCard
            active={mode === "hotspot"}
            onClick={() => setMode("hotspot")}
            icon={<Radio className="h-5 w-5" />}
            title="Mobile Hotspot Bridge"
            body="Mobile-to-mobile hotspot bridge in remote rural pockets."
          />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Network Scan
              </h2>
              <p className="mt-1 text-sm text-muted">
                Available branch and field access points
              </p>
            </div>
            <button type="button" className="btn btn-secondary btn-sm">
              <RefreshCw className="h-3.5 w-3.5" />
              Rescan
            </button>
          </div>

          <label className="relative mb-3 block">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter networks..."
              className="w-full rounded-xl border border-border bg-surface-muted py-2 pr-3 pl-9 text-sm outline-none focus:border-blue-400 focus:bg-white"
            />
          </label>

          <div className="space-y-2">
            {filteredNetworks.map((network) => (
              <div
                key={network.ssid}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-muted/40 px-3 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-blue-600" />
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {network.ssid}
                    </p>
                  </div>
                  <p className="mt-1 flex items-center gap-2 text-xs text-muted">
                    <Lock className="h-3 w-3" />
                    {network.security} · {network.band}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  {network.quality}% quality
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={encrypt}
                onChange={(event) => setEncrypt(event.target.checked)}
                className="h-4 w-4 accent-blue-600"
              />
              Encrypt all sync data in transit
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(event) => setAutoSync(event.target.checked)}
                className="h-4 w-4 accent-blue-600"
              />
              Trigger Day Sync when device connects
            </label>
            <p className="text-xs text-muted">
              Transmitted securely — not stored in browser memory after session
              ends.
            </p>
            <div className="btn-actions">
              <button type="button" className="btn btn-secondary btn-sm">
                <Shield className="h-3.5 w-3.5" />
                Run Ping Test
              </button>
              <button type="button" className="btn btn-primary btn-sm">
                <Save className="h-3.5 w-3.5" />
                Save Sync Config
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <Smartphone className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Offline Field Collection Queue
              </h2>
              <p className="mt-1 text-sm text-muted">
                Conduct Kendra meeting & collect EMIs in zero-network areas using
                cached rosters
              </p>
            </div>
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-soft">
            Borrower Roster
          </p>
          <div className="mb-4 space-y-2">
            {offlineRoster.map((row) => (
              <button
                key={row.loan}
                type="button"
                onClick={() => setSelectedBorrower(row.loan)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition ${
                  selectedBorrower === row.loan
                    ? "border-blue-400 bg-blue-50"
                    : "border-border bg-white hover:bg-surface-muted"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {row.member}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {row.group} · {row.loan}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-emerald-700">
                  {row.due}
                </span>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-dashed border-border bg-surface-muted/50 p-3 text-sm text-muted">
            {selectedBorrower
              ? `Selected ${selectedBorrower} — record offline payment and queue for Day Close upload.`
              : "Please select a borrower from the roster list to record an offline payment."}
          </div>

          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-soft">
            Device Queue · Pending Upload
          </p>
          <div className="space-y-2">
            {pendingQueue.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {item.type}
                  </p>
                  <p className="truncate text-xs text-muted">{item.detail}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-slate-700">
                  {item.amount}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatusCard({
  title,
  badge,
  badgeTone,
  body,
  icon,
}: {
  title: string;
  badge: string;
  badgeTone: string;
  body: string;
  icon: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          {icon}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${badgeTone}`}
        >
          {badge}
        </span>
      </div>
      <h3 className="mt-3 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-muted">{body}</p>
    </article>
  );
}

function ModeCard({
  active,
  onClick,
  icon,
  title,
  body,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-blue-500 bg-blue-50 shadow-sm"
          : "border-border bg-surface-muted/40 hover:border-blue-200 hover:bg-white"
      }`}
    >
      <span
        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
          active ? "bg-blue-600 text-white" : "bg-white text-slate-600"
        }`}
      >
        {icon}
      </span>
      <h3 className="mt-3 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-muted">{body}</p>
    </button>
  );
}

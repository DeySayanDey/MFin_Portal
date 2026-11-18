"use client";

import {
  Award,
  Building2,
  Coins,
  Crosshair,
  Footprints,
  Home,
  MapPin,
  Medal,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";

type MeetingStatus = "live" | "upcoming";

type KendraMeeting = {
  name: string;
  code: string;
  status: MeetingStatus;
  address: string;
  time: string;
  geofence: string;
  targetDue: string;
  coords: string;
};

const todayMeetings: KendraMeeting[] = [
  {
    name: "Gandhinagar Kendra 01",
    code: "CEN-GN-01",
    status: "live",
    address: "Near Gram Panchayat Office, Gandhinagar",
    time: "09:30",
    geofence: "150m",
    targetDue: "₹18,876",
    coords: "16.7028° N, 74.2760° E",
  },
  {
    name: "Uchgaon Kendra 02",
    code: "CEN-UC-02",
    status: "upcoming",
    address: "Opposite Primary Health Center, Uchgaon Village",
    time: "11:00",
    geofence: "200m",
    targetDue: "₹14,500",
    coords: "16.6845° N, 74.3012° E",
  },
];

const routeMeetings: KendraMeeting[] = [
  {
    name: "Kendra #105 (Kharagpur)",
    code: "CEN-WB105",
    status: "upcoming",
    address: "Near Gram Panchayat Bhavan, Panchayat Ward 1",
    time: "09:30",
    geofence: "150m",
    targetDue: "₹14,500",
    coords: "22.3460° N, 87.2320° E",
  },
  {
    name: "Kendra #106 (Midnapore)",
    code: "CEN-WB106",
    status: "upcoming",
    address: "Beside Cooperative Bank, Station Road",
    time: "10:15",
    geofence: "180m",
    targetDue: "₹12,800",
    coords: "22.4250° N, 87.3190° E",
  },
  {
    name: "Kendra #107 (Contai)",
    code: "CEN-WB107",
    status: "upcoming",
    address: "Opposite Market Complex, Ward 4",
    time: "11:00",
    geofence: "160m",
    targetDue: "₹16,200",
    coords: "21.7780° N, 87.7510° E",
  },
  {
    name: "Kendra #108 (Tamluk)",
    code: "CEN-WB108",
    status: "upcoming",
    address: "Near Primary School Gate, Main Road",
    time: "12:00",
    geofence: "140m",
    targetDue: "₹11,450",
    coords: "22.3000° N, 87.9160° E",
  },
  {
    name: "Kendra #109 (Haldia)",
    code: "CEN-WB109",
    status: "upcoming",
    address: "Behind Community Hall, Sector 7",
    time: "13:30",
    geofence: "200m",
    targetDue: "₹15,750",
    coords: "22.0667° N, 88.0698° E",
  },
  {
    name: "Kendra #110 (Egra)",
    code: "CEN-WB110",
    status: "upcoming",
    address: "Beside Bus Stand, Junction Point",
    time: "15:00",
    geofence: "170m",
    targetDue: "₹13,900",
    coords: "21.9000° N, 87.5300° E",
  },
];

const leaderboard = [
  {
    rank: 1,
    name: "Sachin Shinde",
    empId: "EMP-FO-001",
    branch: "Karveer Rural",
    target: "₹2,00,000",
    collected: "₹1,94,500",
    efficiency: 97.25,
    commission: "₹972.50",
    badge: "Elite Performer",
    badgeTone: "elite" as const,
  },
  {
    rank: 2,
    name: "Priya Sen",
    empId: "EMP-FO-014",
    branch: "Sonarpur Hub",
    target: "₹2,00,000",
    collected: "₹1,88,200",
    efficiency: 94.1,
    commission: "₹941.00",
    badge: "Gold Performer",
    badgeTone: "gold" as const,
  },
  {
    rank: 3,
    name: "Amit Das",
    empId: "EMP-FO-022",
    branch: "Barasat East",
    target: "₹2,00,000",
    collected: "₹1,75,000",
    efficiency: 87.5,
    commission: "₹875.00",
    badge: "Silver Performer",
    badgeTone: "silver" as const,
  },
];

const leaderboardColumns: DataTableColumn<(typeof leaderboard)[number]>[] = [
  {
    id: "rank",
    header: "Rank",
    cell: (row) => (
      <span
        className={`font-bold ${
          row.rank === 1 ? "text-amber-500" : "text-slate-700"
        }`}
      >
        #{row.rank}
      </span>
    ),
  },
  {
    id: "officer",
    header: "Field Officer",
    cell: (row) => (
      <>
        <p className="font-semibold text-slate-900">{row.name}</p>
        <p className="text-xs text-muted">{row.empId}</p>
      </>
    ),
  },
  {
    id: "branch",
    header: "Branch",
    cell: (row) => row.branch,
  },
  {
    id: "target",
    header: "Target (₹)",
    cell: (row) => (
      <span className="font-mono text-[13px]">{row.target}</span>
    ),
  },
  {
    id: "collected",
    header: "Collected (₹)",
    cell: (row) => (
      <span className="font-mono text-[13px] font-semibold text-emerald-600">
        {row.collected}
      </span>
    ),
  },
  {
    id: "efficiency",
    header: "Efficiency",
    cell: (row) => (
      <span
        className={`font-semibold ${
          row.efficiency >= 95 ? "text-emerald-600" : "text-amber-600"
        }`}
      >
        {row.efficiency}%
      </span>
    ),
  },
  {
    id: "commission",
    header: "Commission Earned (₹)",
    cell: (row) => (
      <span className="font-mono text-[13px]">{row.commission}</span>
    ),
  },
  {
    id: "badge",
    header: "Badge",
    cell: (row) => <BadgePill tone={row.badgeTone} label={row.badge} />,
  },
];

export function FieldForceView() {
  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-4 text-white shadow-[var(--shadow-card)] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Footprints className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
                Sachin Shinde{" "}
                <span className="font-medium text-white/85">(Field Officer)</span>
              </h2>
              <p className="mt-1 text-sm text-white/80">
                Tier 3 — Standard · EMP-FO-001
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/90 sm:text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Karveer Rural Branch
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  45 Active Borrowers
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Home className="h-3.5 w-3.5" />
                  112 Kendra Centres
                </span>
              </div>
            </div>
          </div>

          <div className="w-full rounded-2xl bg-slate-900/55 px-4 py-3 backdrop-blur-sm sm:max-w-xs lg:w-auto">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
              Estimated Monthly Payout
            </p>
            <p className="mt-1 text-2xl font-semibold text-emerald-400 sm:text-3xl">
              ₹20,922.50
            </p>
            <p className="mt-1 text-xs text-slate-300">
              Base: ₹18,000 + Commission & Bonuses
            </p>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
          <p className="text-sm text-muted">
            Today&apos;s Target Progress{" "}
            <span className="font-semibold text-slate-900">56.5%</span>
          </p>
          <p className="mt-2 text-sm text-muted">
            ₹18,876.00 / ₹33,376.00
          </p>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-[56.5%] rounded-full bg-blue-600" />
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
          <p className="text-sm text-muted">
            Monthly Efficiency{" "}
            <span className="font-semibold text-slate-900">92.25%</span>
          </p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">
            ₹1,84,500.00
          </p>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-emerald-100">
            <div className="h-full w-[92.25%] rounded-full bg-emerald-500" />
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
          <p className="text-sm text-muted">Incentive Commission Rate</p>
          <p className="mt-2 text-xl font-semibold text-amber-500 sm:text-2xl">
            0.5% on Collections
          </p>
          <p className="mt-2 text-xs text-muted">+ ₹500 On-Time Kendra Bonus</p>
        </article>

        <article className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
          <p className="text-sm text-muted">New KYC Onboardings</p>
          <p className="mt-2 text-xl font-semibold text-violet-600 sm:text-2xl">
            15 Borrowers
          </p>
          <p className="mt-2 text-xs text-muted">₹1,500 Sourcing Incentive</p>
        </article>
      </section>

      {/* Today's route map */}
      <section>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-700 sm:text-lg">
              Today&apos;s Kendra Meeting Route Map{" "}
              <span className="font-medium text-muted">(दौरा वेळापत्रक)</span>
            </h2>
            <p className="mt-1 text-sm text-muted">
              GPS-geofenced collection schedule for the assigned field route.
            </p>
          </div>
          <span className="w-fit text-sm font-medium text-slate-600">
            2 Meetings Scheduled Today
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {todayMeetings.map((meeting) => (
            <KendraCard key={meeting.code} meeting={meeting} />
          ))}
        </div>
      </section>

      {/* Extended route grid */}
      <section>
        <div className="mb-3">
          <h2 className="text-base font-semibold text-slate-700 sm:text-lg">
            Assigned Kendra Route Board
          </h2>
          <p className="mt-1 text-sm text-muted">
            Upcoming centres on today&apos;s collection path.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {routeMeetings.map((meeting) => (
            <KendraCard key={meeting.code} meeting={meeting} />
          ))}
        </div>
      </section>

      {/* Leaderboard */}
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-600 sm:text-lg">
              Field Force Performance Leaderboard
            </h2>
            <p className="mt-1 text-sm text-muted">
              Branch & Regional ranking based on collection efficiency and
              recovery rate.
            </p>
          </div>
          <p className="text-sm font-medium text-slate-600">
            Monthly Cycle: August 2026
          </p>
        </div>

        <div className="space-y-3 md:hidden">
          {leaderboard.map((row) => (
            <article
              key={row.empId}
              className={`rounded-2xl border border-border p-3.5 ${
                row.rank === 1 ? "bg-indigo-50" : "bg-surface-muted/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className={`text-sm font-bold ${
                      row.rank === 1 ? "text-amber-500" : "text-slate-700"
                    }`}
                  >
                    #{row.rank}
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">{row.name}</p>
                  <p className="text-xs text-muted">{row.empId}</p>
                </div>
                <BadgePill tone={row.badgeTone} label={row.badge} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-white px-2.5 py-2">
                  <dt className="text-muted-soft">Branch</dt>
                  <dd className="mt-1 font-medium text-slate-800">{row.branch}</dd>
                </div>
                <div className="rounded-xl bg-white px-2.5 py-2">
                  <dt className="text-muted-soft">Target</dt>
                  <dd className="mt-1 font-medium text-slate-800">{row.target}</dd>
                </div>
                <div className="rounded-xl bg-white px-2.5 py-2">
                  <dt className="text-muted-soft">Collected</dt>
                  <dd className="mt-1 font-semibold text-emerald-600">
                    {row.collected}
                  </dd>
                </div>
                <div className="rounded-xl bg-white px-2.5 py-2">
                  <dt className="text-muted-soft">Efficiency</dt>
                  <dd
                    className={`mt-1 font-semibold ${
                      row.efficiency >= 95
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}
                  >
                    {row.efficiency}%
                  </dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-muted">
                Commission Earned:{" "}
                <span className="font-semibold text-slate-800">
                  {row.commission}
                </span>
              </p>
            </article>
          ))}
        </div>

        <DataTable
          className="hidden md:block"
          data={leaderboard}
          columns={leaderboardColumns}
          getRowKey={(row) => row.empId}
          minWidth="860px"
        />
      </section>
    </div>
  );
}

function KendraCard({ meeting }: { meeting: KendraMeeting }) {
  const live = meeting.status === "live";

  return (
    <article className="rounded-2xl bg-slate-600 p-4 text-white shadow-[var(--shadow-card)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{meeting.name}</h3>
            <span className="rounded-md bg-slate-800/70 px-2 py-0.5 text-[11px] font-medium text-slate-200">
              {meeting.code}
            </span>
          </div>
          <p className="mt-2 inline-flex items-start gap-1.5 text-sm text-slate-300">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            <span>{meeting.address}</span>
          </p>
        </div>
        <span
          className={`shrink-0 text-xs font-semibold ${
            live ? "text-emerald-400" : "text-slate-300"
          }`}
        >
          {live ? "Meeting Live" : "Upcoming"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-900/55 px-3 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">
            Meeting Time
          </p>
          <p className="mt-1 text-sm font-semibold">{meeting.time}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">
            Geofence Radius
          </p>
          <p className="mt-1 text-sm font-semibold text-emerald-400">
            {meeting.geofence}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">
            Target Due
          </p>
          <p className="mt-1 text-sm font-semibold text-amber-300">
            {meeting.targetDue}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-1.5 text-xs text-sky-300 sm:text-sm">
          <Crosshair className="h-3.5 w-3.5" />
          {meeting.coords}
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-200 transition hover:text-white"
        >
          <Coins className="h-3.5 w-3.5" />
          Collect Kendra Due
        </button>
      </div>
    </article>
  );
}

function BadgePill({
  tone,
  label,
}: {
  tone: "elite" | "gold" | "silver";
  label: string;
}) {
  const Icon = tone === "elite" ? Trophy : tone === "gold" ? Award : Medal;
  const color =
    tone === "elite"
      ? "text-amber-500"
      : tone === "gold"
        ? "text-amber-600"
        : "text-slate-500";

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${color}`}>
      {tone === "silver" ? <Star className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
}

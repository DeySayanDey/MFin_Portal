"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Search,
  UserMinus,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Alert } from "@/components/ui/Alert";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { SelectField, TextField } from "@/components/ui/Form";
import {
  CHECK_IDS,
  MEMBER_CLOSED,
  MEMBER_DEATH,
  type CheckId,
  type ClosureType,
} from "../membership-closure.constants";

type StaticState = "pass" | "block" | "warn" | "unknown";

type StaticCheck = { state: StaticState; detail: string; lines?: string[] };

type StaticMember = {
  memberId: number;
  code: string;
  name: string;
  mobile: string;
  branch: string;
  center: string;
  joined: string;
  kyc: string;
  statusCd: number;
  status: string;
  checks: Record<CheckId, StaticCheck>;
};

type ClosedRow = {
  memberId: number;
  code: string;
  name: string;
  mobile: string;
  branch: string;
  center: string;
  joined: string;
  statusCd: ClosureType;
  updated: string;
};

const CLOSURE_LABELS: Record<ClosureType, string> = {
  [MEMBER_CLOSED]: "Closed",
  [MEMBER_DEATH]: "Death",
};

const CHECK_LABELS: Record<CheckId, string> = {
  group: "Group membership",
  loans: "Loans",
  deposits: "Deposit accounts",
  shares: "Share capital",
};

const STATE_LABELS: Record<StaticState, string> = {
  pass: "Clear",
  block: "Must fix",
  warn: "Review",
  unknown: "Not checked",
};

const stateIcon: Record<StaticState, LucideIcon> = {
  pass: CheckCircle2,
  block: XCircle,
  warn: AlertTriangle,
  unknown: HelpCircle,
};

const stateIconClass: Record<StaticState, string> = {
  pass: "text-emerald-600",
  block: "text-rose-600",
  warn: "text-amber-600",
  unknown: "text-amber-600",
};

const stateTone: Record<StaticState, BadgeTone> = {
  pass: "success",
  block: "danger",
  warn: "warning",
  unknown: "warning",
};

const MEMBERS: StaticMember[] = [
  {
    memberId: 1021,
    code: "MEM-001021",
    name: "Sunita Behera",
    mobile: "9437012345",
    branch: "Bhubaneswar Main",
    center: "Patia Center",
    joined: "12-03-2022",
    kyc: "3 of 3 verified",
    statusCd: 1,
    status: "Active",
    checks: {
      group: { state: "pass", detail: "Not in any active group" },
      loans: { state: "pass", detail: "No active loans" },
      deposits: { state: "pass", detail: "No open deposit accounts" },
      shares: {
        state: "warn",
        detail: "Holds 10 shares (paid ₹1,000.00). Refund or transfer them outside this screen.",
      },
    },
  },
  {
    memberId: 1045,
    code: "MEM-001045",
    name: "Rina Mohanty",
    mobile: "9861098765",
    branch: "Cuttack",
    center: "Badambadi Center",
    joined: "05-08-2021",
    kyc: "2 of 3 verified",
    statusCd: 1,
    status: "Active",
    checks: {
      group: {
        state: "block",
        detail: "Active in Maa Tarini SHG as Leader. Remove the member from the group first.",
      },
      loans: { state: "block", detail: "1 active loan must be closed first" },
      deposits: {
        state: "block",
        detail: "2 open deposit accounts must be closed first",
        lines: [
          "SB-2021-00451 · General Savings · ₹2,350.00 · Active",
          "RD-2022-00112 · Recurring Deposit 12M · ₹6,000.00 · Active",
        ],
      },
      shares: {
        state: "warn",
        detail: "Holds 5 shares (paid ₹400.00). Refund or transfer them outside this screen.",
        lines: ["₹100.00 still unpaid"],
      },
    },
  },
  {
    memberId: 987,
    code: "MEM-000987",
    name: "Kabita Das",
    mobile: "9938011122",
    branch: "Puri",
    center: "Swargadwar Center",
    joined: "20-01-2020",
    kyc: "3 of 3 verified",
    statusCd: MEMBER_CLOSED,
    status: "Closed",
    checks: {
      group: { state: "pass", detail: "Not in any active group" },
      loans: { state: "pass", detail: "No active loans" },
      deposits: { state: "pass", detail: "No open deposit accounts" },
      shares: { state: "pass", detail: "No shares held" },
    },
  },
];

const CLOSED_ROWS: ClosedRow[] = [
  {
    memberId: 987,
    code: "MEM-000987",
    name: "Kabita Das",
    mobile: "9938011122",
    branch: "Puri",
    center: "Swargadwar Center",
    joined: "20-01-2020",
    statusCd: MEMBER_CLOSED,
    updated: "14-10-2026 11:20",
  },
  {
    memberId: 902,
    code: "MEM-000902",
    name: "Pramila Sahu",
    mobile: "9777045678",
    branch: "Bhubaneswar Main",
    center: "Saheed Nagar Center",
    joined: "02-06-2019",
    statusCd: MEMBER_CLOSED,
    updated: "02-09-2026 16:05",
  },
  {
    memberId: 875,
    code: "MEM-000875",
    name: "Gitanjali Nayak",
    mobile: "9437788990",
    branch: "Cuttack",
    center: "Badambadi Center",
    joined: "11-11-2018",
    statusCd: MEMBER_DEATH,
    updated: "21-07-2026 10:42",
  },
  {
    memberId: 851,
    code: "MEM-000851",
    name: "Sabita Pradhan",
    mobile: "9861234500",
    branch: "Puri",
    center: "Chakratirtha Center",
    joined: "08-04-2018",
    statusCd: MEMBER_CLOSED,
    updated: "30-05-2026 13:15",
  },
];

const closureOptions = [MEMBER_CLOSED, MEMBER_DEATH].map((code) => ({
  value: String(code),
  label: CLOSURE_LABELS[code],
}));

export function MembershipClosureView() {
  const [notice, setNotice] = useToastText();
  const [keyword, setKeyword] = useState("");
  const [memberId, setMemberId] = useState(String(MEMBERS[0].memberId));
  const [members, setMembers] = useState(MEMBERS);
  const member = members.find((item) => String(item.memberId) === memberId) ?? null;

  const [closureType, setClosureType] = useState(String(MEMBER_CLOSED));
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [closedRows, setClosedRows] = useState(CLOSED_ROWS);
  const [regStatus, setRegStatus] = useState(String(MEMBER_CLOSED));
  const [regKeyword, setRegKeyword] = useState("");
  const [regApplied, setRegApplied] = useState({ status: String(MEMBER_CLOSED), keyword: "" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const isDeath = Number(closureType) === MEMBER_DEATH;
  const alreadyClosed = member != null && member.statusCd >= MEMBER_CLOSED;

  const checks = useMemo(() => {
    if (!member) return null;
    const next = { ...member.checks };
    if (isDeath) {
      for (const id of CHECK_IDS) {
        if (next[id].state === "block") next[id] = { ...next[id], state: "warn" };
      }
    }
    return next;
  }, [isDeath, member]);

  const states = checks ? CHECK_IDS.map((id) => checks[id].state) : [];
  const blocked = states.includes("block");
  const needsAck = states.some((state) => state === "warn" || state === "unknown");
  const canClose = member != null && !alreadyClosed && !blocked && (!needsAck || acknowledged);

  const searchOptions = members
    .filter((item) => {
      const term = keyword.trim().toLowerCase();
      if (!term) return true;
      return [item.code, item.name, item.mobile].some((value) =>
        value.toLowerCase().includes(term),
      );
    })
    .map((item) => ({
      value: String(item.memberId),
      label: `${item.code} · ${item.name} · ${item.mobile} · ${item.status}`,
    }));

  const filteredRows = closedRows.filter((row) => {
    if (String(row.statusCd) !== regApplied.status) return false;
    const term = regApplied.keyword.toLowerCase();
    if (!term) return true;
    return [row.code, row.name, row.mobile].some((value) => value.toLowerCase().includes(term));
  });
  const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  function closeMembership() {
    if (!member) return;
    const statusCd = Number(closureType) as ClosureType;
    setMembers((current) =>
      current.map((item) =>
        item.memberId === member.memberId
          ? { ...item, statusCd, status: CLOSURE_LABELS[statusCd] }
          : item,
      ),
    );
    setClosedRows((current) => [
      {
        memberId: member.memberId,
        code: member.code,
        name: member.name,
        mobile: member.mobile,
        branch: member.branch,
        center: member.center,
        joined: member.joined,
        statusCd,
        updated: "28-10-2026 13:47",
      },
      ...current,
    ]);
    setNotice(`${member.name} is now marked ${CLOSURE_LABELS[statusCd]}`);
    setRegStatus(closureType);
    setRegApplied({ status: closureType, keyword: "" });
    setPage(1);
    setAcknowledged(false);
    setConfirmOpen(false);
  }

  const columns = useMemo<DataTableColumn<ClosedRow>[]>(
    () => [
      { id: "code", header: "Member code", cell: (row) => row.code },
      {
        id: "member",
        header: "Member",
        cell: (row) => (
          <span className="block min-w-0">
            <span className="block truncate font-medium text-slate-900">{row.name}</span>
            <span className="block truncate text-xs text-muted">{row.mobile}</span>
          </span>
        ),
      },
      {
        id: "branch",
        header: "Branch / Center",
        cell: (row) => (
          <span className="block min-w-0">
            <span className="block truncate">{row.branch}</span>
            <span className="block truncate text-xs text-muted">{row.center}</span>
          </span>
        ),
      },
      { id: "joined", header: "Joined on", cell: (row) => row.joined },
      {
        id: "status",
        header: "Status",
        cell: (row) => (
          <Badge tone={row.statusCd === MEMBER_DEATH ? "neutral" : "danger"} caps={false}>
            {CLOSURE_LABELS[row.statusCd]}
          </Badge>
        ),
      },
      { id: "updated", header: "Last updated", cell: (row) => row.updated },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Membership Closure"
        description="Check a member's open items and close the membership or record a death"
      />
      <PageToast message={notice} />

      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Find member</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <TextField
                label="Search member"
                value={keyword}
                onChange={setKeyword}
                placeholder="Member code, name or mobile"
              />
            </div>
            <Button type="button" variant="secondary" icon={Search} className="w-full sm:w-auto">
              Search
            </Button>
          </div>
          <SelectField
            label="Member"
            value={memberId}
            placeholder="Search, then select a member"
            options={searchOptions}
            onChange={(value) => {
              setMemberId(value);
              setAcknowledged(false);
              setNotice(null);
            }}
          />
        </div>

        {member ? (
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-border bg-background p-3 text-sm sm:grid-cols-4">
            {[
              ["Member code", member.code],
              ["Name", member.name],
              ["Mobile", member.mobile],
              ["Status", member.status],
              ["Branch", member.branch],
              ["Center", member.center],
              ["Joined on", member.joined],
              ["KYC", member.kyc],
            ].map(([label, value]) => (
              <p key={label}>
                <span className="block text-muted">{label}</span>
                {value}
              </p>
            ))}
          </div>
        ) : null}
      </section>

      {member && alreadyClosed ? (
        <Alert tone="info">
          This member is already {member.status}. There is nothing to close.
        </Alert>
      ) : null}

      {member && !alreadyClosed && checks ? (
        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900">Pre-closure checks</h2>
            <Button type="button" size="sm" variant="secondary">
              Check again
            </Button>
          </div>

          <ul className="divide-y divide-border rounded-xl border border-border">
            {CHECK_IDS.map((id) => {
              const view = checks[id];
              const Icon = stateIcon[view.state];
              return (
                <li key={id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start">
                  <Icon
                    className={`mt-0.5 h-5 w-5 shrink-0 ${stateIconClass[view.state]}`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-900">{CHECK_LABELS[id]}</span>
                      <Badge tone={stateTone[view.state]} caps={false}>
                        {STATE_LABELS[view.state]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{view.detail}</p>
                    {view.lines && view.lines.length > 0 ? (
                      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-muted">
                        {view.lines.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  {id === "group" && member.checks.group.state === "block" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      icon={UserMinus}
                      className="shrink-0"
                    >
                      Remove from group
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>

          {isDeath ? (
            <p className="mt-3 text-sm text-amber-800">
              For a death closure, open items do not stop the closure. Settle them with the
              nominee afterwards.
            </p>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
            <SelectField
              label="Closure type"
              value={closureType}
              required
              options={closureOptions}
              onChange={(value) => {
                setClosureType(value);
                setAcknowledged(false);
              }}
            />
          </div>

          {needsAck && !blocked ? (
            <Checkbox
              className="mt-4"
              variant="row"
              label={
                isDeath
                  ? "I have reviewed the items above; dues will be settled with the nominee"
                  : "I have reviewed the items above and settled all dues with the member"
              }
              checked={acknowledged}
              onChange={setAcknowledged}
            />
          ) : null}

          {blocked ? (
            <Alert tone="error" className="mt-4">
              Fix the items marked “Must fix” before closing this membership.
            </Alert>
          ) : null}

          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant="danger"
              icon={UserMinus}
              disabled={!canClose}
              onClick={() => setConfirmOpen(true)}
            >
              {isDeath ? "Record death" : "Close membership"}
            </Button>
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-slate-900">Closed members</h2>
        <FilterPanel
          onReset={() => {
            setRegStatus(String(MEMBER_CLOSED));
            setRegKeyword("");
            setRegApplied({ status: String(MEMBER_CLOSED), keyword: "" });
            setPage(1);
          }}
        >
          <SelectField
            label="Status"
            value={regStatus}
            options={closureOptions}
            onChange={setRegStatus}
          />
          <TextField
            label="Search"
            value={regKeyword}
            onChange={setRegKeyword}
            placeholder="Member code, name or mobile"
          />
          <Button
            type="button"
            icon={Search}
            onClick={() => {
              setRegApplied({ status: regStatus, keyword: regKeyword.trim() });
              setPage(1);
            }}
          >
            Apply
          </Button>
        </FilterPanel>
        <DataTable
          data={pageRows}
          columns={columns}
          getRowKey={(row) => String(row.memberId)}
          emptyTitle="No closed members found"
          minWidth="860px"
          pagination={{
            page,
            pageSize,
            total: filteredRows.length,
            onPageChange: setPage,
            onPageSizeChange: (size) => {
              setPageSize(size);
              setPage(1);
            },
          }}
        />
      </section>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={closeMembership}
        actionType="custom"
        variant="danger"
        icon={UserMinus}
        title={isDeath ? "Record member death?" : "Close membership?"}
        description={`The member will be marked ${
          CLOSURE_LABELS[Number(closureType) as ClosureType]
        } and can no longer open accounts or take loans.`}
        itemName={member ? `${member.name} (${member.code})` : undefined}
        itemType="Member"
        confirmLabel={isDeath ? "Record death" : "Close membership"}
        cancelLabel="Cancel"
        disableBackdropClick
      />
    </div>
  );
}

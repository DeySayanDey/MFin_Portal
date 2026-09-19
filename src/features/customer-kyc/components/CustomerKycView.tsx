"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  ClipboardList,
  FolderOpen,
  Pencil,
  Scale,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  IdCard,
} from "lucide-react";
import {
  CibilModal,
  DocLockerModal,
  OnboardModal,
  ProfileModal,
  type KycBorrower,
} from "@/features/customer-kyc/components/CustomerKycModals";

type BorrowerRow = KycBorrower;

const borrowers: BorrowerRow[] = [
  {
    id: "CUST-2026-0120",
    name: "Gita Saha",
    group: "Swanirbhar Mahila JLG #005",
    role: "Member",
    mobile: "+91 98540 13720",
    aadhaar: "XXXX-XXXX-9760",
    pan: "BQFPK1120W",
    bankStatus: "Penny Drop Verified",
    kycStatus: "ActiveBorrower",
  },
  {
    id: "CUST-2026-0119",
    name: "Anjali Chakraborty",
    group: "Swanirbhar Mahila JLG #004",
    role: "Member",
    mobile: "+91 98523 13689",
    aadhaar: "XXXX-XXXX-9687",
    pan: "BPFPK1119T",
    bankStatus: "Penny Drop Verified",
    kycStatus: "ActiveBorrower",
  },
  {
    id: "CUST-2026-0118",
    name: "Aparna Sen",
    group: "Swanirbhar Mahila JLG #003",
    role: "Member",
    mobile: "+91 98506 13658",
    aadhaar: "XXXX-XXXX-9614",
    pan: "BOFPK1118Q",
    bankStatus: "Penny Drop Verified",
    kycStatus: "ActiveBorrower",
  },
  {
    id: "CUST-2026-0117",
    name: "Mousumi Ghosh",
    group: "Swanirbhar Mahila JLG #002",
    role: "Member",
    mobile: "+91 98489 13627",
    aadhaar: "XXXX-XXXX-9541",
    pan: "BNFPK1117N",
    bankStatus: "Penny Drop Verified",
    kycStatus: "ActiveBorrower",
  },
  {
    id: "CUST-2026-0116",
    name: "Supriya Mondal",
    group: "Swanirbhar Mahila JLG #001",
    role: "Leader",
    mobile: "+91 98472 13596",
    aadhaar: "XXXX-XXXX-9468",
    pan: "BMFPK1116K",
    bankStatus: "Penny Drop Verified",
    kycStatus: "ActiveBorrower",
  },
  {
    id: "CUST-2026-0115",
    name: "Ruma More",
    group: "Swanirbhar Mahila JLG #115",
    role: "Member",
    mobile: "+91 98455 13565",
    aadhaar: "XXXX-XXXX-9395",
    pan: "BLFPK1115H",
    bankStatus: "Penny Drop Verified",
    kycStatus: "ActiveBorrower",
  },
  {
    id: "CUST-2026-0114",
    name: "Meena Patil",
    group: "Swanirbhar Mahila JLG #114",
    role: "Member",
    mobile: "+91 98438 13534",
    aadhaar: "XXXX-XXXX-9322",
    pan: "BKFPK1114E",
    bankStatus: "Penny Drop Verified",
    kycStatus: "ActiveBorrower",
  },
  {
    id: "CUST-2026-0113",
    name: "Pooja Gaikwad",
    group: "Swanirbhar Mahila JLG #113",
    role: "Member",
    mobile: "+91 98421 13503",
    aadhaar: "XXXX-XXXX-9249",
    pan: "BJFPK1113B",
    bankStatus: "Penny Drop Verified",
    kycStatus: "ActiveBorrower",
  },
  {
    id: "CUST-2026-0112",
    name: "Aarti Saha",
    group: "Swanirbhar Mahila JLG #112",
    role: "Member",
    mobile: "+91 98404 13472",
    aadhaar: "XXXX-XXXX-9176",
    pan: "BIFPK1112Y",
    bankStatus: "Penny Drop Verified",
    kycStatus: "ActiveBorrower",
  },
  {
    id: "CUST-2026-0111",
    name: "Kavita Chakraborty",
    group: "Swanirbhar Mahila JLG #111",
    role: "Member",
    mobile: "+91 98387 13441",
    aadhaar: "XXXX-XXXX-9103",
    pan: "BHFPK1111V",
    bankStatus: "Penny Drop Verified",
    kycStatus: "ActiveBorrower",
  },
  {
    id: "CUST-2026-0110",
    name: "Sunita Ramesh Kamble",
    group: "Laxmi Mahila Bachat JLG #010",
    role: "Leader",
    mobile: "+91 98370 13410",
    aadhaar: "XXXX-XXXX-9030",
    pan: "BGFPK1110S",
    bankStatus: "Penny Drop Verified",
    kycStatus: "ActiveBorrower",
  },
  {
    id: "CUST-2026-0109",
    name: "Rani Vijay Gaikwad",
    group: "Laxmi Mahila Bachat JLG #010",
    role: "Member",
    mobile: "+91 98353 13379",
    aadhaar: "XXXX-XXXX-8957",
    pan: "BFFPK1109P",
    bankStatus: "Penny Drop Verified",
    kycStatus: "ActiveBorrower",
  },
  {
    id: "CUST-2026-0108",
    name: "Kakali Mondal",
    group: "Maa Tara JLG #008",
    role: "Member",
    mobile: "+91 98336 13348",
    aadhaar: "XXXX-XXXX-8884",
    pan: "BEFPK1108M",
    bankStatus: "Penny Drop Verified",
    kycStatus: "ActiveBorrower",
  },
  {
    id: "CUST-2026-0107",
    name: "Shampa Das",
    group: "Maa Tara JLG #008",
    role: "Member",
    mobile: "+91 98319 13317",
    aadhaar: "XXXX-XXXX-8811",
    pan: "BDFPK1107J",
    bankStatus: "Penny Drop Verified",
    kycStatus: "ActiveBorrower",
  },
  {
    id: "CUST-2026-0106",
    name: "Ruma Banerjee",
    group: "Maa Tara JLG #007",
    role: "Leader",
    mobile: "+91 98302 13286",
    aadhaar: "XXXX-XXXX-8738",
    pan: "BCFPK1106G",
    bankStatus: "Penny Drop Verified",
    kycStatus: "ActiveBorrower",
  },
  {
    id: "CUST-2026-0105",
    name: "Payel Chakraborty",
    group: "Maa Sarada Swanirbhar Dal #006",
    role: "Member",
    mobile: "+91 98285 13255",
    aadhaar: "XXXX-XXXX-8665",
    pan: "BBFPK1105D",
    bankStatus: "Penny Drop Verified",
    kycStatus: "ActiveBorrower",
  },
  {
    id: "CUST-2026-0104",
    name: "Sushmita Roy",
    group: "Maa Sarada Swanirbhar Dal #006",
    role: "Member",
    mobile: "+91 98268 13224",
    aadhaar: "XXXX-XXXX-8592",
    pan: "BAFPK1104A",
    bankStatus: "Penny Drop Verified",
    kycStatus: "ActiveBorrower",
  },
  {
    id: "CUST-2026-0103",
    name: "Aparna Sardar",
    group: "Maa Tara JLG #003",
    role: "Member",
    mobile: "+91 98251 13193",
    aadhaar: "XXXX-XXXX-8519",
    pan: "AZFPK1103X",
    bankStatus: "Penny Drop Verified",
    kycStatus: "ActiveBorrower",
  },
  {
    id: "CUST-2026-0102",
    name: "Kakali Mallick",
    group: "Maa Tara JLG #002",
    role: "Member",
    mobile: "+91 98234 13162",
    aadhaar: "XXXX-XXXX-8446",
    pan: "AYFPK1102U",
    bankStatus: "Penny Drop Verified",
    kycStatus: "Under Review",
  },
  {
    id: "CUST-2026-0101",
    name: "Nandita Ghosh",
    group: "Maa Tara JLG #001",
    role: "Leader",
    mobile: "+91 98217 13131",
    aadhaar: "XXXX-XXXX-8373",
    pan: "AXFPK1101R",
    bankStatus: "Penny Drop Verified",
    kycStatus: "ActiveBorrower",
  },
];

const metrics = [
  {
    label: "Total Members",
    value: "20",
    tone: "text-slate-900",
    iconWrap: "bg-violet-50 text-violet-600",
    icon: Users,
  },
  {
    label: "Active JLGs",
    value: "117 Groups",
    tone: "text-blue-600",
    iconWrap: "bg-blue-50 text-blue-600",
    icon: Users,
  },
  {
    label: "Penny Drop Verified",
    value: "100%",
    tone: "text-emerald-600",
    iconWrap: "bg-emerald-50 text-emerald-600",
    icon: Building2,
  },
  {
    label: "RBI FOIR Compliant",
    value: "100% (≤ 50%)",
    tone: "text-amber-600",
    iconWrap: "bg-amber-50 text-amber-600",
    icon: Scale,
  },
] as const;

type ModalKind = "profile" | "cibil" | "docs" | "onboard" | null;

export function CustomerKycView() {
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<ModalKind>(null);
  const [active, setActive] = useState<BorrowerRow | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return borrowers;
    return borrowers.filter(
      (row) =>
        row.id.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.group.toLowerCase().includes(q) ||
        row.mobile.toLowerCase().includes(q) ||
        row.pan.toLowerCase().includes(q) ||
        row.aadhaar.toLowerCase().includes(q),
    );
  }, [query]);

  function openBorrowerModal(
    kind: Exclude<ModalKind, "onboard" | null>,
    row: BorrowerRow,
  ) {
    setActive(row);
    setModal(kind);
  }

  function closeModal() {
    setModal(null);
    setActive(null);
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="btn-actions justify-end">
        <button
          type="button"
          onClick={() => setModal("onboard")}
          className="btn inline-flex items-center gap-2 border border-transparent bg-violet-600 px-4 py-2.5 text-white hover:bg-violet-700"
        >
          <ClipboardList className="h-4 w-4" />
          5-Section Deep Onboarding
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setModal("onboard")}
        >
          <UserPlus className="h-4 w-4" />
          Onboard New Member
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${metric.iconWrap}`}
              >
                <metric.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-soft">
                  {metric.label}
                </p>
                <p
                  className={`mt-1.5 text-xl font-semibold tracking-tight ${metric.tone}`}
                >
                  {metric.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Registered Group Members & Borrowers
            </h2>
            <p className="mt-1 text-sm text-muted">
              UIDAI tokenized KYC profiles, group roles, verified bank accounts,
              and bureau status
            </p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter records..."
              className="w-full rounded-xl border border-border bg-surface-muted py-2.5 pr-3 pl-9 text-sm outline-none focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10"
            />
          </div>
        </div>

        <div className="table-scroll">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-soft">
                <th className="pb-3 pr-3">Member ID</th>
                <th className="pb-3 pr-3">Member / Borrower Name</th>
                <th className="pb-3 pr-3">Group & Role</th>
                <th className="pb-3 pr-3">Contact</th>
                <th className="pb-3 pr-3">Identity (Masked)</th>
                <th className="pb-3 pr-3">Bank Status</th>
                <th className="pb-3 pr-3">KYC Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-t border-border/70">
                  <td className="py-3.5 pr-3">
                    <button
                      type="button"
                      onClick={() => openBorrowerModal("profile", row)}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      {row.id}
                    </button>
                  </td>
                  <td className="py-3.5 pr-3 font-medium text-slate-900">
                    {row.name}
                  </td>
                  <td className="py-3.5 pr-3">
                    <p className="font-medium text-slate-800">{row.group}</p>
                    <p className="text-xs text-muted">({row.role})</p>
                  </td>
                  <td className="py-3.5 pr-3 text-slate-700">{row.mobile}</td>
                  <td className="py-3.5 pr-3">
                    <p className="font-medium text-slate-800">{row.aadhaar}</p>
                    <p className="text-xs text-muted">(PAN: {row.pan})</p>
                  </td>
                  <td className="py-3.5 pr-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        row.bankStatus === "Penny Drop Verified"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {row.bankStatus}
                    </span>
                  </td>
                  <td className="py-3.5 pr-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        row.kycStatus === "ActiveBorrower"
                          ? "bg-brand-soft text-brand-ink"
                          : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {row.kycStatus}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <ActionButton
                        label="View Profile"
                        tone="blue"
                        icon={IdCard}
                        onClick={() => openBorrowerModal("profile", row)}
                      />
                      <ActionButton
                        label="CIBIL Check"
                        tone="violet"
                        icon={Scale}
                        onClick={() => openBorrowerModal("cibil", row)}
                      />
                      <ActionButton
                        label="Doc Locker"
                        tone="amber"
                        icon={FolderOpen}
                        onClick={() => openBorrowerModal("docs", row)}
                      />
                      <ActionButton
                        label="Edit"
                        tone="slate"
                        icon={Pencil}
                        onClick={() => openBorrowerModal("profile", row)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted">
          <p>
            Showing {filtered.length} of {borrowers.length} total
          </p>
          <p>UIDAI tokenized · NPCI Penny-Drop · RBI FOIR guarded</p>
        </div>
      </section>

      {modal === "profile" && active ? (
        <ProfileModal borrower={active} onClose={closeModal} />
      ) : null}
      {modal === "cibil" && active ? (
        <CibilModal borrower={active} onClose={closeModal} />
      ) : null}
      {modal === "docs" && active ? (
        <DocLockerModal borrower={active} onClose={closeModal} />
      ) : null}
      {modal === "onboard" ? <OnboardModal onClose={closeModal} /> : null}
    </div>
  );
}

function ActionButton({
  label,
  tone,
  icon: Icon,
  onClick,
}: {
  label: string;
  tone: "blue" | "violet" | "amber" | "slate";
  icon: typeof IdCard;
  onClick: () => void;
}) {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
    violet: "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100",
    amber: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
    slate: "border-border bg-surface-muted text-slate-600 hover:bg-white",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition ${tones[tone]}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

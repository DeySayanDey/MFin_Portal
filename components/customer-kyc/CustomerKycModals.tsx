"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  FileText,
  HeartPulse,
  IdCard,
  Info,
  MapPin,
  Upload,
  User,
  UserRound,
  Users,
  Vault,
  X,
  Zap,
  Scale,
} from "lucide-react";

export type KycBorrower = {
  id: string;
  name: string;
  group: string;
  role: string;
  mobile: string;
  aadhaar: string;
  pan: string;
  bankStatus: "Penny Drop Verified" | "Pending";
  kycStatus: "ActiveBorrower" | "Under Review";
};

const fieldClass =
  "w-full rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm outline-none focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10";

function ModalFrame({
  children,
  onClose,
  wide = false,
}: {
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-3 sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        className={`max-h-[92vh] w-full overflow-y-auto rounded-2xl border border-border bg-surface shadow-xl ${
          wide ? "max-w-4xl" : "max-w-2xl"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-1.5 text-muted hover:bg-surface-muted hover:text-slate-800"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ProfileModal({
  borrower,
  onClose,
}: {
  borrower: KycBorrower;
  onClose: () => void;
}) {
  return (
    <ModalFrame onClose={onClose}>
      <ModalHeader
        title={borrower.name}
        subtitle={`Member ID: ${borrower.id} • ${borrower.group} (${borrower.role})`}
        onClose={onClose}
      />
      <div className="space-y-4 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 rounded-2xl bg-slate-900 px-4 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold">{borrower.name}</p>
            <p className="mt-1 text-sm text-white/70">
              Agriculture / Dairy • Panchayat Ward 1, Kharagpur
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Penny Drop OK
          </span>
        </div>

        <div className="grid gap-4 rounded-2xl border border-border bg-white p-4 sm:grid-cols-2">
          <Detail label="Spouse / Father" value="Tapas Saha (Husband)" />
          <Detail label="Mobile Number" value={borrower.mobile} accent />
          <Detail label="Masked Aadhaar Token" value={borrower.aadhaar} accent />
          <Detail label="PAN Number" value={borrower.pan} />
          <Detail
            label="Bank Account"
            value="State Bank of India"
            hint="30001184520 (IFSC: SBIN0001120)"
          />
          <Detail label="Nominee (Insurance)" value="Tapas Saha (Spouse)" />
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Scale className="h-4 w-4 text-emerald-700" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-900">
              RBI Harmonized Microfinance Assessment
            </h3>
          </div>
          <ul className="space-y-2.5 text-sm">
            <MetricRow label="Gross Monthly Household Income" value="₹27,000.00" />
            <MetricRow label="Annual Household Income" value="₹3,24,000.00" />
            <MetricRow
              label="Monthly Household Expenses"
              value="₹14,500.00"
              danger
            />
            <MetricRow label="Net Disposable Monthly Surplus" value="₹12,500.00" />
            <MetricRow
              label="Max Permitted EMI (RBI 50% FOIR)"
              value="₹13,500.00"
            />
          </ul>
        </div>

        <div className="btn-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close Profile
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}

export function CibilModal({
  borrower,
  onClose,
}: {
  borrower: KycBorrower;
  onClose: () => void;
}) {
  return (
    <ModalFrame onClose={onClose}>
      <ModalHeader
        title="CIBIL & CRIF High Mark Credit Bureau Verification"
        subtitle="Real-time automated credit history pull, score analysis, and risk grade"
        onClose={onClose}
      />
      <div className="space-y-4 px-5 py-4 sm:px-6">
        <div className="overflow-hidden rounded-2xl bg-slate-900 text-white">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                CRIF High Mark / TransUnion CIBIL
              </p>
              <p className="mt-2 text-sm text-white/75">PAN: {borrower.pan}</p>
              <p className="mt-1 text-xs text-white/55">As of Sep 12, 2026</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-5 py-4 text-center backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">
                CIBIL Score
              </p>
              <p className="mt-1 text-4xl font-semibold text-emerald-400">684</p>
              <span className="mt-2 inline-flex rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                Fair
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Active Loan Accounts" value="1" />
          <StatCard label="Closed Accounts" value="2" />
          <StatCard label="Overdue / Default" value="0" />
        </div>

        <div className="space-y-2.5 rounded-2xl border border-border bg-white p-4 text-sm">
          <MetricRow label="Total Sanctioned Credit History" value="₹75,000.00" />
          <MetricRow
            label="Current Outstanding Across MFIs/Banks"
            value="₹28,500.00"
          />
          <MetricRow label="Recent Bureau Inquiries (6 Months)" value="1 inquiry" />
          <div className="flex items-center justify-between gap-3 border-t border-border pt-2.5">
            <span className="text-muted">Credit Risk Grading</span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              Moderate Risk (Tier 3)
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-semibold">
            Underwriting Recommendation: APPROVED_FOR_SANCTION
          </p>
          <p className="mt-1 text-emerald-800/90">
            Borrower has a healthy repayment track record with 684 score.
            Eligible for standard microfinance interest tier.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary w-full justify-center py-3"
          onClick={onClose}
        >
          Close Bureau Report
        </button>
      </div>
    </ModalFrame>
  );
}

export function DocLockerModal({
  borrower,
  onClose,
}: {
  borrower: KycBorrower;
  onClose: () => void;
}) {
  const docs = [
    {
      title: "Aadhaar Card (Front & Back)",
      category: "Proof of Identity",
      uploaded: "12-Aug-2026",
      verifiedBy: "Branch KYC Officer",
    },
    {
      title: "Digital Ration Card (Food & Supplies)",
      category: "Proof of Address",
      uploaded: "12-Aug-2026",
      verifiedBy: "Branch KYC Officer",
    },
    {
      title: "SBI Bank Passbook Front Page",
      category: "Bank Verification",
      uploaded: "14-Aug-2026",
      verifiedBy: "Penny Drop Gateway",
    },
    {
      title: "Gram Panchayat Residential Certificate",
      category: "Address Proof",
      uploaded: "15-Aug-2026",
      verifiedBy: "Field Officer Subhashish",
    },
  ];

  return (
    <ModalFrame onClose={onClose} wide>
      <ModalHeader
        title={`Member Digital Document Locker: ${borrower.name}`}
        subtitle="Secure repository for KYC identity proofs, ration cards, bank passbooks, and land records."
        onClose={onClose}
      />
      <div className="space-y-4 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 rounded-2xl bg-slate-900 px-4 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-400">
              Member KYC Dossier
            </p>
            <p className="mt-1 text-sm">ID: {borrower.id}</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-400"
          >
            <Upload className="h-4 w-4" />
            Upload New Document
          </button>
        </div>

        <div className="table-scroll overflow-hidden rounded-2xl border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-surface-muted text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-soft">
              <tr>
                <th className="px-4 py-3">Document Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3">Verified By</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr key={doc.title} className="border-t border-border">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 font-medium text-slate-900">
                      <FileText className="h-4 w-4 text-rose-500" />
                      {doc.title}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{doc.category}</td>
                  <td className="px-4 py-3 text-slate-700">{doc.uploaded}</td>
                  <td className="px-4 py-3 text-slate-700">{doc.verifiedBy}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white">
                      VERIFIED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="btn-actions">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close Locker
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}

const onboardSteps = [
  { id: 0, label: "1. Affiliation", icon: Users },
  { id: 1, label: "2. Personal Details", icon: User },
  { id: 2, label: "3. Address & Contact", icon: MapPin },
  { id: 3, label: "4. KYC Vault", icon: Vault },
  { id: 4, label: "5. Bank & Penny Drop", icon: Building2 },
] as const;

export function OnboardModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [bankPhase, setBankPhase] = useState<0 | 1 | 2>(0);
  const [income, setIncome] = useState({
    applicant: 14000,
    spouse: 16000,
    other: 0,
    food: 8000,
    utilities: 2500,
    education: 3000,
    mfiEmi: 2000,
    informal: 0,
  });

  const grossMonthly = income.applicant + income.spouse + income.other;
  const totalExpenses =
    income.food +
    income.utilities +
    income.education +
    income.mfiEmi +
    income.informal;
  const monthlySurplus = grossMonthly - totalExpenses;
  const maxEmi = Math.round(grossMonthly * 0.5);
  const exceedsLimit = monthlySurplus > maxEmi;

  function goNext() {
    if (step < 4) {
      setStep((prev) => prev + 1);
      return;
    }
    if (bankPhase < 2) setBankPhase((prev) => (prev + 1) as 0 | 1 | 2);
  }

  function goPrevious() {
    if (step === 4 && bankPhase > 0) {
      setBankPhase((prev) => (prev - 1) as 0 | 1 | 2);
      return;
    }
    if (step > 0) {
      setStep((prev) => prev - 1);
      if (step === 4) setBankPhase(0);
    }
  }

  const atLast = step === 4 && bankPhase === 2;

  return (
    <ModalFrame onClose={onClose} wide>
      <ModalHeader
        title="Onboard New Group Member / Borrower"
        subtitle="Complete personal demographics, group affiliation, KYC documentation, bank account, guarantor, nominee, and RBI assessment"
        onClose={onClose}
      />
      <div className="space-y-4 px-5 py-4 sm:px-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {onboardSteps.map((item) => {
            const active = step === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setStep(item.id);
                  if (item.id !== 4) setBankPhase(0);
                }}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition ${
                  active
                    ? "bg-blue-600 text-white"
                    : "border border-border bg-surface-muted text-slate-600 hover:bg-white"
                }`}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="leading-snug">{item.label}</span>
              </button>
            );
          })}
        </div>

        {step === 0 ? (
          <>
            <InfoBanner text="Link borrower to a specific Kendra Centre and Joint Liability Group (JLG) for meeting schedules & collections." />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Kendra Centre *">
                <select className={fieldClass} defaultValue="Gandhinagar Kendra 01 (CEN-GN-01)">
                  <option>Gandhinagar Kendra 01 (CEN-GN-01)</option>
                  <option>Uchgaon Kendra 02 (CEN-UC-02)</option>
                  <option>Sonarpur Kendra 01 (CEN-SP-01)</option>
                </select>
              </Field>
              <Field label="Joint Liability Group (JLG) *">
                <select
                  className={fieldClass}
                  defaultValue="Laxmi Mahila Bachat JLG (JLG-GN01-G1)"
                >
                  <option>Laxmi Mahila Bachat JLG (JLG-GN01-G1)</option>
                  <option>Swanirbhar Mahila JLG (JLG-GN01-G2)</option>
                  <option>Maa Tara JLG (JLG-SP01-G1)</option>
                </select>
              </Field>
              <Field label="Role in Group *">
                <select className={fieldClass} defaultValue="General Member">
                  <option>General Member</option>
                  <option>Group Leader</option>
                  <option>Treasurer</option>
                </select>
              </Field>
              <Field label="Customer / Member Code">
                <input
                  className={`${fieldClass} bg-slate-100`}
                  readOnly
                  value="Auto-generated upon save (e.g. CUST-2026-0006)"
                />
              </Field>
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="First Name *">
              <input className={fieldClass} placeholder="e.g. Sunita" />
            </Field>
            <Field label="Middle Name">
              <input className={fieldClass} placeholder="e.g. Ramesh" />
            </Field>
            <Field label="Last Name *">
              <input className={fieldClass} placeholder="e.g. Kamble" />
            </Field>
            <Field label="Spouse / Father Name *">
              <input className={fieldClass} placeholder="e.g. Ramesh Kamble" />
            </Field>
            <Field label="Relationship">
              <select className={fieldClass} defaultValue="Husband">
                <option>Husband</option>
                <option>Father</option>
                <option>Guardian</option>
              </select>
            </Field>
            <Field label="Gender">
              <select className={fieldClass} defaultValue="Female">
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="Date of Birth">
              <input className={fieldClass} type="date" defaultValue="1990-05-15" />
            </Field>
            <Field label="Marital Status">
              <select className={fieldClass} defaultValue="Married">
                <option>Married</option>
                <option>Single</option>
                <option>Widow</option>
              </select>
            </Field>
            <Field label="Primary Occupation / Trade">
              <select className={fieldClass} defaultValue="Agriculture & Dairy Farming">
                <option>Agriculture & Dairy Farming</option>
                <option>Petty Trade</option>
                <option>Handicrafts</option>
              </select>
            </Field>
            <Field label="Religion">
              <select className={fieldClass} defaultValue="Hindu">
                <option>Hindu</option>
                <option>Muslim</option>
                <option>Christian</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="Social Category">
              <select className={fieldClass} defaultValue="OBC (Other Backward Class)">
                <option>OBC (Other Backward Class)</option>
                <option>SC</option>
                <option>ST</option>
                <option>General</option>
              </select>
            </Field>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Mobile Number *">
              <input className={fieldClass} defaultValue="+91 98220 11223" />
            </Field>
            <Field label="Alternate / WhatsApp Number">
              <input className={fieldClass} defaultValue="+91 98220 99887" />
            </Field>
            <Field label="Email Address (Optional)">
              <input className={fieldClass} defaultValue="borrower@example.com" />
            </Field>
            <Field label="House No. / Street Address *">
              <input
                className={fieldClass}
                placeholder="e.g. House No. 45, Gaothan, Near Maruti Temple"
              />
            </Field>
            <Field label="Village / City *">
              <input className={fieldClass} defaultValue="Gandhinagar" />
            </Field>
            <Field label="District *">
              <input className={fieldClass} defaultValue="Kolhapur" />
            </Field>
            <Field label="State *">
              <input className={fieldClass} defaultValue="Maharashtra" />
            </Field>
            <Field label="PIN Code *">
              <input className={fieldClass} defaultValue="416119" />
            </Field>
          </div>
        ) : null}

        {step === 3 ? (
          <>
            <InfoBanner text="UIDAI Compliant: Aadhaar numbers are stored tokenized with masked 4-digit previews." />
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Aadhaar Card (Last 4 Digits / Full) *">
                <input className={fieldClass} placeholder="e.g. 8921" />
              </Field>
              <Field label="PAN Card Number / Form 60">
                <input className={fieldClass} placeholder="ABCDE1234F" />
              </Field>
              <Field label="Voter ID / Ration Card">
                <input className={fieldClass} placeholder="MH/04/123/456789" />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <DocCard icon={IdCard} title="Aadhaar Front/Back" status="Attached" />
              <DocCard icon={FileText} title="PAN Document" status="Verified" />
              <DocCard icon={Camera} title="Geo-Tagged House Photo" status="GPS Linked" />
            </div>
          </>
        ) : null}

        {step === 4 && bankPhase === 0 ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Bank Name *">
                <select className={fieldClass} defaultValue="State Bank of India">
                  <option>State Bank of India</option>
                  <option>Bank of Baroda</option>
                  <option>HDFC Bank</option>
                </select>
              </Field>
              <Field label="Branch Name *">
                <input className={fieldClass} defaultValue="Gandhinagar Branch" />
              </Field>
              <Field label="Bank Account Number *">
                <input className={fieldClass} defaultValue="38290192831" />
              </Field>
              <Field label="Bank IFSC Code *">
                <input className={fieldClass} defaultValue="SBIN0001234" />
              </Field>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Zap className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-emerald-900">
                    NPCI IMPS Penny Drop Account Verification (₹1.00 Credit Test)
                  </p>
                  <p className="mt-1 text-xs text-emerald-800/80">
                    Direct API verification ensures DBT disbursals never fail due
                    to incorrect account numbers.
                  </p>
                </div>
              </div>
              <button type="button" className="btn btn-primary shrink-0">
                <Zap className="h-4 w-4" />
                Verify Now
              </button>
            </div>
          </>
        ) : null}

        {step === 4 && bankPhase === 1 ? (
          <div className="space-y-4">
            <section className="rounded-2xl border border-border bg-surface-muted/40 p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <UserRound className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-900">
                  Co-Applicant / Guarantor Details
                </h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Guarantor Name *">
                  <input className={fieldClass} placeholder="e.g. Ramesh Kamble" />
                </Field>
                <Field label="Relationship *">
                  <select className={fieldClass} defaultValue="Husband">
                    <option>Husband</option>
                    <option>Father</option>
                    <option>Brother</option>
                    <option>Sister</option>
                    <option>Guardian</option>
                  </select>
                </Field>
                <Field label="Mobile Number">
                  <input className={fieldClass} placeholder="+91 98220 99887" />
                </Field>
                <Field label="Aadhaar / PAN">
                  <input className={fieldClass} placeholder="XXXX-XXXX-1122" />
                </Field>
                <Field label="Occupation">
                  <input className={fieldClass} placeholder="Farming / Daily Wage" />
                </Field>
                <Field label="Monthly Income (₹)">
                  <input
                    type="number"
                    className={fieldClass}
                    placeholder="15000"
                    defaultValue={15000}
                  />
                </Field>
              </div>
            </section>

            <section className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                  <HeartPulse className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-rose-800">
                  Nominee for Micro-Insurance Policy Coverage
                </h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Nominee Name *">
                  <input className={fieldClass} placeholder="e.g. Ramesh Kamble" />
                </Field>
                <Field label="Relationship *">
                  <select className={fieldClass} defaultValue="Husband">
                    <option>Husband</option>
                    <option>Wife</option>
                    <option>Son</option>
                    <option>Daughter</option>
                    <option>Father</option>
                    <option>Mother</option>
                  </select>
                </Field>
                <Field label="Nominee DOB / Age">
                  <input
                    type="date"
                    className={fieldClass}
                    defaultValue="1987-03-20"
                  />
                </Field>
              </div>
            </section>
          </div>
        ) : null}

        {step === 4 && bankPhase === 2 ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Applicant Monthly Income (₹)">
                <input
                  type="number"
                  className={fieldClass}
                  value={income.applicant}
                  onChange={(event) =>
                    setIncome((prev) => ({
                      ...prev,
                      applicant: Number(event.target.value) || 0,
                    }))
                  }
                />
              </Field>
              <Field label="Spouse Monthly Income (₹)">
                <input
                  type="number"
                  className={fieldClass}
                  value={income.spouse}
                  onChange={(event) =>
                    setIncome((prev) => ({
                      ...prev,
                      spouse: Number(event.target.value) || 0,
                    }))
                  }
                />
              </Field>
              <Field label="Other Family Income (₹)">
                <input
                  type="number"
                  className={fieldClass}
                  value={income.other}
                  onChange={(event) =>
                    setIncome((prev) => ({
                      ...prev,
                      other: Number(event.target.value) || 0,
                    }))
                  }
                />
              </Field>
              <Field label="Monthly Food & Grocery (₹)">
                <input
                  type="number"
                  className={fieldClass}
                  value={income.food}
                  onChange={(event) =>
                    setIncome((prev) => ({
                      ...prev,
                      food: Number(event.target.value) || 0,
                    }))
                  }
                />
              </Field>
              <Field label="Utilities, Rent & Medical (₹)">
                <input
                  type="number"
                  className={fieldClass}
                  value={income.utilities}
                  onChange={(event) =>
                    setIncome((prev) => ({
                      ...prev,
                      utilities: Number(event.target.value) || 0,
                    }))
                  }
                />
              </Field>
              <Field label="Education & Other (₹)">
                <input
                  type="number"
                  className={fieldClass}
                  value={income.education}
                  onChange={(event) =>
                    setIncome((prev) => ({
                      ...prev,
                      education: Number(event.target.value) || 0,
                    }))
                  }
                />
              </Field>
              <Field label="Existing MFI / Bank Loan EMIs (₹)">
                <input
                  type="number"
                  className={fieldClass}
                  value={income.mfiEmi}
                  onChange={(event) =>
                    setIncome((prev) => ({
                      ...prev,
                      mfiEmi: Number(event.target.value) || 0,
                    }))
                  }
                />
              </Field>
              <Field label="Informal Debt Repayments (₹)">
                <input
                  type="number"
                  className={fieldClass}
                  value={income.informal}
                  onChange={(event) =>
                    setIncome((prev) => ({
                      ...prev,
                      informal: Number(event.target.value) || 0,
                    }))
                  }
                />
              </Field>
            </div>

            <div className="rounded-2xl bg-slate-900 px-4 py-4 text-white sm:px-5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-400">
                  RBI Harmonized Microfinance Assessment
                </p>
                <span
                  className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                    exceedsLimit
                      ? "bg-rose-500/20 text-rose-300"
                      : "bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {exceedsLimit
                    ? "Exceeds Microfinance Limit"
                    : "Within FOIR Limit"}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/50">
                    Gross Monthly
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    ₹{grossMonthly.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/50">
                    Annual Income
                  </p>
                  <p className="mt-1 text-lg font-semibold text-emerald-400">
                    ₹{(grossMonthly * 12).toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/50">
                    Monthly Surplus
                  </p>
                  <p className="mt-1 text-lg font-semibold text-sky-300">
                    ₹{monthlySurplus.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/50">
                    Max Permitted EMI (50% FOIR)
                  </p>
                  <p className="mt-1 text-lg font-semibold text-amber-300">
                    ₹{maxEmi.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={step === 0 && bankPhase === 0}
              onClick={goPrevious}
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>
            {!atLast ? (
              <button type="button" className="btn btn-secondary" onClick={goNext}>
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}
            <button type="button" className="btn btn-primary" onClick={onClose}>
              <Check className="h-4 w-4" />
              Save & Onboard Member
            </button>
          </div>
        </div>
      </div>
    </ModalFrame>
  );
}

function Detail({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p
        className={`mt-1 text-sm font-semibold ${
          accent ? "text-blue-600" : "text-slate-900"
        }`}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function MetricRow({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span
        className={`font-semibold ${danger ? "text-rose-600" : "text-slate-900"}`}
      >
        {value}
      </span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-soft">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function InfoBanner({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-3 text-sm text-blue-800">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{text}</p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function DocCard({
  icon: Icon,
  title,
  status,
}: {
  icon: typeof FileText;
  title: string;
  status: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted/70 p-4">
      <Icon className="h-5 w-5 text-slate-500" />
      <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>
      <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
        {status}
      </span>
    </div>
  );
}

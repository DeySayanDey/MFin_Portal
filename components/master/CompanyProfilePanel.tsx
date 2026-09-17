"use client";

import { useState } from "react";
import { Languages, Save } from "lucide-react";

export function CompanyProfilePanel() {
  const [language, setLanguage] = useState<"en" | "bn">("en");
  const [form, setForm] = useState({
    displayName: "eZiMicro Financial Services Ltd",
    legalName: "eZiMicro Microfinance Foundation (Section 8 / NBFC-MFI)",
    cin: "U65999MH2026PTC109876",
    rbi: "B-13.02045",
    gstin: "27AAACE1234F1Z5",
    pan: "AAACE1234F",
    tan: "PNEA12345B",
    financialYear: "2026-2027",
    registeredAddress:
      "619, Ground Floor, Naskarhat Tagore Park, Kolkata, West Bengal 700039",
    headOffice:
      "Priority Solutions Campus, Bhimpur, Tarakeswar, Hooghly, West Bengal 712410",
    email: "support@ezimicro.in",
    phone: "+91 231 265 4321",
    website: "https://ezimicro.in",
  });

  function updateField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Corporate & Statutory Identity
            </h2>
            <p className="mt-1 text-sm text-muted">
              Official legal entity name, corporate identification number
              (CIN), and RBI registration
            </p>
          </div>
          <span className="w-fit rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-ink">
            Section 8 / NBFC-MFI
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <TextField
            label="Company Display Name *"
            value={form.displayName}
            onChange={(value) => updateField("displayName", value)}
          />
          <TextField
            label="Legal Entity Registered Name *"
            value={form.legalName}
            onChange={(value) => updateField("legalName", value)}
          />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <TextField
            label="CIN / Registration No *"
            value={form.cin}
            onChange={(value) => updateField("cin", value)}
          />
          <TextField
            label="RBI Reg. Certificate No *"
            value={form.rbi}
            onChange={(value) => updateField("rbi", value)}
          />
          <TextField
            label="GSTIN No *"
            value={form.gstin}
            onChange={(value) => updateField("gstin", value)}
          />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <TextField
            label="PAN Number *"
            value={form.pan}
            onChange={(value) => updateField("pan", value)}
          />
          <TextField
            label="TAN Number"
            value={form.tan}
            onChange={(value) => updateField("tan", value)}
          />
          <TextField
            label="Active Financial Year"
            value={form.financialYear}
            onChange={(value) => updateField("financialYear", value)}
          />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <TextArea
            label="Official Registered Address *"
            value={form.registeredAddress}
            onChange={(value) => updateField("registeredAddress", value)}
          />
          <TextArea
            label="Head Office Address"
            value={form.headOffice}
            onChange={(value) => updateField("headOffice", value)}
          />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <TextField
            label="Support Email"
            value={form.email}
            onChange={(value) => updateField("email", value)}
          />
          <TextField
            label="Helpline Phone"
            value={form.phone}
            onChange={(value) => updateField("phone", value)}
          />
          <TextField
            label="Official Website URL"
            value={form.website}
            onChange={(value) => updateField("website", value)}
          />
        </div>
      </section>

      <div className="btn-actions">
        <button type="button" className="btn btn-primary">
          <Save className="h-4 w-4" />
          Save Company Profile
        </button>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
              <Languages className="h-4 w-4 text-blue-600" />
              Language & Multi-lingual Display{" "}
              <span className="font-medium text-muted">
                (বহুভাষিক কনফিগারেশন)
              </span>
            </h2>
            <p className="mt-1 text-sm text-muted">
              Configure default interface language and vernacular display
              preferences.
            </p>
          </div>
          <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            EN · English (Default)
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={`rounded-2xl border p-4 text-left transition ${
              language === "en"
                ? "border-blue-500 bg-blue-50"
                : "border-border bg-surface-muted/40 hover:border-blue-200"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">
                1. English (Default)
              </p>
              <span
                className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border ${
                  language === "en"
                    ? "border-blue-600 bg-blue-600"
                    : "border-slate-300 bg-white"
                }`}
              >
                {language === "en" ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                ) : null}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted">
              Standard English Interface for operations, reports, and admin
              workflows.
            </p>
            <span className="mt-3 inline-flex rounded-full border border-blue-300 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
              Default System Mode
            </span>
          </button>

          <button
            type="button"
            onClick={() => setLanguage("bn")}
            className={`rounded-2xl border p-4 text-left transition ${
              language === "bn"
                ? "border-blue-500 bg-blue-50"
                : "border-border bg-surface-muted/40 hover:border-blue-200"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">
                2. বাংলা সংস্করণ (Bengali)
              </p>
              <span
                className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border ${
                  language === "bn"
                    ? "border-blue-600 bg-blue-600"
                    : "border-slate-300 bg-white"
                }`}
              >
                {language === "bn" ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                ) : null}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted">
              মাঠ পর্যায়ের সংগ্রহ, কেন্দ্র মিটিং এবং সদস্য পোর্টালের জন্য বাংলা
              ইন্টারফেস।
            </p>
            <span className="mt-3 inline-flex rounded-full border border-emerald-300 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              Vernacular Activated
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </span>
      <textarea
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

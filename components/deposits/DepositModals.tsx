"use client";

import { useState } from "react";
import {
  Banknote,
  CheckCircle2,
  Minus,
  Plus,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  Modal,
  modalFieldClass,
  modalSelectClass,
} from "@/components/ui/Modal";
import {
  formatInr,
  type DepositAccount,
} from "@/components/deposits/deposits-data";

const quickAmounts = [500, 1000, 1500, 2000, 5000, 10000];
const payModes = [
  { id: "cash", label: "Cash", hotkey: "1" },
  { id: "cheque", label: "Cheque / DD", hotkey: "2" },
  { id: "neft", label: "NEFT / IMPS", hotkey: "3" },
  { id: "transfer", label: "A/c Transfer", hotkey: "4" },
  { id: "upi", label: "UPI Dynamic", hotkey: "5" },
];

type TxnModalProps = {
  open: boolean;
  onClose: () => void;
  account: DepositAccount | null;
  kind: "deposit" | "withdrawal";
};

export function DepositTxnModal({
  open,
  onClose,
  account,
  kind,
}: TxnModalProps) {
  const [amount, setAmount] = useState(500);
  const [mode, setMode] = useState("cash");

  if (!account) return null;

  const isDeposit = kind === "deposit";

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={
        isDeposit
          ? "Deposit (Cash Inward - সঞ্চয় জমা)"
          : "Withdrawal (Cash Outward - সঞ্চয় উত্তোলন)"
      }
      subtitle={`Member: ${account.member} • Balance: ${formatInr(account.balance)}`}
      footer={
        <>
          <Button variant="soft" onClick={onClose}>
            Close
          </Button>
          <Button
            variant={isDeposit ? "success" : "warning"}
            icon={isDeposit ? Plus : Minus}
            onClick={onClose}
          >
            Submit
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">
            Quick Amount
          </p>
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAmount(value)}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  amount === value
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {formatInr(value, 0)}
              </button>
            ))}
          </div>
        </div>

        <FormField label="Transaction Amount (₹)">
          <input
            type="number"
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
            className={modalFieldClass}
          />
        </FormField>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">
            Payment Mode · Hotkeys 1–5
          </p>
          <div className="grid gap-2 sm:grid-cols-5">
            {payModes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={`rounded-xl border px-2.5 py-3 text-center transition ${
                  mode === item.id
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span className="block text-[10px] font-bold text-slate-400">
                  [{item.hotkey}]
                </span>
                <span className="mt-1 block text-xs font-semibold">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {mode === "cash" ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-sm font-semibold text-slate-800">
              Note Count Verification
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Enter note count to verify physical cash against transaction
              amount
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {[500, 200, 100, 50, 20, 10].map((note) => (
                <label key={note} className="text-center text-xs">
                  <span className="mb-1 block font-semibold text-slate-600">
                    ₹{note}
                  </span>
                  <input
                    type="number"
                    defaultValue={note === 500 ? (isDeposit ? 1 : 1) : 0}
                    min={0}
                    className={`${modalFieldClass} px-2 py-1.5 text-center`}
                  />
                </label>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

type ShareCertProps = {
  open: boolean;
  onClose: () => void;
  account: DepositAccount | null;
};

export function ShareCertificateModal({
  open,
  onClose,
  account,
}: ShareCertProps) {
  if (!account) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="সীমিত শেয়ার সনদ · Member Share Certificate"
      subtitle="Member share certificates, voting equity, distinctive share numbering, and ownership ledger"
      footer={
        <>
          <Button variant="soft" onClick={onClose}>
            Close
          </Button>
          <Button icon={Send} onClick={onClose}>
            Print Certificate
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm leading-6 text-slate-700">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-500">
            Govt. Reg No: COOP-WB/2026/8942 | Share Face Value: ₹100 Each
          </p>
          <p className="mt-3">
            This is to certify that{" "}
            <strong>{account.member}</strong> (Member ID: {account.memberId}),
            resident of Sonarpur Kendra #01, is the registered holder of{" "}
            <strong>20</strong> shares of Face Value ₹100.00 each (Distinctive
            Nos: 001 – 020), fully paid-up in the capital of the Society.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <p>
              <span className="text-slate-500">Certificate No:</span>{" "}
              <strong>SHC-2026-001</strong>
            </p>
            <p>
              <span className="text-slate-500">Total Capital Paid:</span>{" "}
              <strong>₹2,000.00</strong>
            </p>
            <p>
              <span className="text-slate-500">Issue Date:</span>{" "}
              <strong>{account.openedOn}</strong>
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

type OpenAccountProps = {
  open: boolean;
  onClose: () => void;
  product: "Savings" | "RD" | "FD";
};

export function OpenDepositAccountModal({
  open,
  onClose,
  product,
}: OpenAccountProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={`Open ${product} Account`}
      subtitle="Map member to Bachat Gat / JLG and configure rate, tenure, and installment"
      footer={
        <>
          <Button variant="soft" onClick={onClose}>
            Cancel
          </Button>
          <Button icon={CheckCircle2} onClick={onClose}>
            Create Account
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Select Member" required>
          <select className={modalSelectClass} defaultValue="Sunita Ramesh Kamble">
            <option>Sunita Ramesh Kamble (CUST-2026-0001)</option>
            <option>Gita Saha (CUST-2026-0120)</option>
            <option>Rani Vijay Gaikwad (CUST-2026-0002)</option>
          </select>
        </FormField>
        <FormField label="JLG / Bachat Gat Group" required>
          <select className={modalSelectClass} defaultValue="Laxmi Mahila Bachat JLG">
            <option>Laxmi Mahila Bachat JLG</option>
            <option>Swanirbhar Mahila JLG #005</option>
            <option>Pragati Self-Help JLG</option>
          </select>
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Interest Rate (% p.a.)">
            <input
              type="number"
              step="0.1"
              defaultValue={product === "FD" ? 8.25 : product === "RD" ? 7.5 : 6.5}
              className={modalFieldClass}
            />
          </FormField>
          {product === "Savings" ? (
            <FormField label="Opening Deposit (₹)">
              <input type="number" defaultValue={500} className={modalFieldClass} />
            </FormField>
          ) : (
            <FormField label={product === "RD" ? "Monthly Installment (₹)" : "Principal (₹)"}>
              <input
                type="number"
                defaultValue={product === "RD" ? 1000 : 25000}
                className={modalFieldClass}
              />
            </FormField>
          )}
        </div>
        {product !== "Savings" ? (
          <FormField label="Tenure (Months)">
            <input type="number" defaultValue={12} className={modalFieldClass} />
          </FormField>
        ) : null}
      </div>
    </Modal>
  );
}

type InterestRunProps = {
  open: boolean;
  onClose: () => void;
  accountCount: number;
  totalInterest: number;
};

export function InterestPostingModal({
  open,
  onClose,
  accountCount,
  totalInterest,
}: InterestRunProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Post Monthly Interest Accrual"
      subtitle="Credits interest to member deposit ledgers and GL 421000 Interest Payable"
      footer={
        <>
          <Button variant="soft" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="success" icon={Banknote} onClick={onClose}>
            Confirm Posting
          </Button>
        </>
      }
    >
      <div className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
        <p className="text-sm text-emerald-900">
          Accrual period: <strong>01 Sep 2026 – 30 Sep 2026</strong>
        </p>
        <p className="text-sm text-emerald-900">
          Accounts in batch: <strong>{accountCount}</strong>
        </p>
        <p className="text-lg font-bold text-emerald-800">
          Total Interest: {formatInr(totalInterest)}
        </p>
      </div>
    </Modal>
  );
}

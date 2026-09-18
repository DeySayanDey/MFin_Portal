"use client";

import {
  CheckCircle2,
  HandCoins,
  Receipt,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

export type CollectionMember = {
  loanId: string;
  name: string;
  group: string;
  memberNo: string;
  principalDue: number;
  interestDue: number;
  totalDue: number;
  paid?: boolean;
};

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);
}

type UpiModalProps = {
  open: boolean;
  onClose: () => void;
  member: CollectionMember | null;
};

export function UpiPayModal({ open, onClose, member }: UpiModalProps) {
  if (!member) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Pay EMI via UPI QR"
      subtitle="Scan with PhonePe, Google Pay, Paytm, or BHIM to pay EMI instantly"
      footer={
        <Button variant="soft" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4 text-center">
        <div>
          <p className="text-base font-semibold text-slate-900">{member.name}</p>
          <p className="mt-0.5 text-sm text-slate-500">
            {member.loanId} · Due {formatInr(member.totalDue)}
          </p>
        </div>

        <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div
            className="h-full w-full rounded-lg"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg,#0f172a 0 2px,transparent 2px 6px), repeating-linear-gradient(90deg,#0f172a 0 2px,transparent 2px 6px)",
              backgroundSize: "100% 100%",
              opacity: 0.85,
            }}
            aria-hidden
          />
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Instant credit to Loan Account & General Ledger
        </div>

        <p className="text-sm font-medium text-slate-600">
          UPI ID:{" "}
          <span className="font-semibold text-blue-600">EZIMICRO@ICICI</span>
        </p>
      </div>
    </Modal>
  );
}

type ReceiptModalProps = {
  open: boolean;
  onClose: () => void;
  member: CollectionMember | null;
};

export function EmiReceiptModal({ open, onClose, member }: ReceiptModalProps) {
  if (!member) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="EMI Collection Receipt"
      subtitle="Thermal / PDF receipt for vault-credited Kendra meeting collection"
      footer={
        <>
          <Button variant="soft" onClick={onClose}>
            Close
          </Button>
          <Button icon={Receipt} onClick={onClose}>
            Print Receipt
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold tracking-wide text-slate-900 uppercase">
                Karveer Rural Branch (BR01)
              </p>
              <p className="mt-1 text-xs text-slate-500">
                RBI NBFC-MFI: B-13.02045
              </p>
            </div>
            <Badge tone="success">Vault Credited</Badge>
          </div>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <p>
              <span className="text-slate-500">Receipt No:</span>{" "}
              <span className="font-semibold text-slate-900">RCPT-209301</span>
            </p>
            <p>
              <span className="text-slate-500">Date/Time:</span>{" "}
              <span className="font-semibold text-slate-900">
                12/9/2026 09:45 AM
              </span>
            </p>
            <p>
              <span className="text-slate-500">Kendra:</span>{" "}
              <span className="font-semibold text-slate-900">
                Howrah Uluberia #002
              </span>
            </p>
            <p>
              <span className="text-slate-500">Collected By:</span>{" "}
              <span className="font-semibold text-slate-900">
                Sachin Shinde (FO)
              </span>
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Borrower</p>
          <p className="mt-0.5 text-base font-semibold text-slate-900">
            {member.name}
          </p>
          <p className="text-sm text-slate-500">
            {member.loanId} · {member.group} · {member.memberNo}
          </p>

          <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Principal Paid</span>
              <span className="font-semibold text-slate-900">
                {formatInr(member.principalDue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Interest Paid</span>
              <span className="font-semibold text-slate-900">
                {formatInr(member.interestDue)}
              </span>
            </div>
            <div className="flex justify-between rounded-lg bg-emerald-50 px-3 py-2 font-semibold text-emerald-800">
              <span>Total Collected</span>
              <span>{formatInr(member.totalDue)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-3 text-sm text-blue-800">
          <Smartphone className="h-4 w-4 shrink-0" />
          Mode: Kendra Meeting Cash · GL posted to Collection Control A/c
        </div>
      </div>
    </Modal>
  );
}

type AttendanceModalProps = {
  open: boolean;
  onClose: () => void;
  members: CollectionMember[];
};

export function MarkAttendanceModal({
  open,
  onClose,
  members,
}: AttendanceModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Mark Kendra Meeting Attendance"
      subtitle="Weekly attendance for EMI collection meeting — required before cash/UPI posting"
      footer={
        <>
          <Button variant="soft" onClick={onClose}>
            Cancel
          </Button>
          <Button icon={CheckCircle2} onClick={onClose}>
            Save Attendance
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        {members.map((member) => (
          <label
            key={member.loanId}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3"
          >
            <span>
              <span className="block text-sm font-semibold text-slate-900">
                {member.name}
              </span>
              <span className="text-xs text-slate-500">
                {member.loanId} · {member.memberNo}
              </span>
            </span>
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30"
            />
          </label>
        ))}
      </div>
    </Modal>
  );
}

type CashCollectModalProps = {
  open: boolean;
  onClose: () => void;
  member: CollectionMember | null;
  onConfirm: () => void;
};

export function CashCollectModal({
  open,
  onClose,
  member,
  onConfirm,
}: CashCollectModalProps) {
  if (!member) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Collect EMI Cash"
      subtitle="Post cash receipt against scheduled installment and credit field wallet"
      footer={
        <>
          <Button variant="soft" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="success"
            icon={HandCoins}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Confirm Cash Collection
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          Collecting from{" "}
          <span className="font-semibold text-slate-900">{member.name}</span> for{" "}
          <span className="font-semibold text-slate-900">{member.loanId}</span>
        </p>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">Amount Due</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {formatInr(member.totalDue)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Principal {formatInr(member.principalDue)} + Interest{" "}
            {formatInr(member.interestDue)}
          </p>
        </div>
      </div>
    </Modal>
  );
}

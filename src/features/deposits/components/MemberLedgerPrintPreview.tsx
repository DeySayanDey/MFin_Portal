"use client";

import { useMemo, useRef, useState } from "react";
import { Printer } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import {
  PRINT_PAGE_TOKEN,
  PRINT_PAGES_TOKEN,
  PrintFrame,
  type PrintFrameHandle,
} from "@/components/shared/PrintFrame";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { parseYmd } from "@/features/deposits/savings/deposit-account.rules";
import {
  STATUS_PENDING,
  TRANS_MODES,
  TRANS_WITHDRAWAL,
  type TransMode,
} from "@/features/deposits/savings-transaction/savings-transaction.constants";
import type { SavingsTransaction } from "@/features/deposits/savings-transaction/types/savings-transaction.types";
import {
  MEMBER_LEDGER_PRINT_ROW_LIMIT,
  type MemberLedgerPrintReport,
} from "./useMemberLedgerPrint";

type MemberLedgerPrintPreviewProps = {
  report: MemberLedgerPrintReport;
  onClose: () => void;
};

const CELL = "border border-border px-3 py-2 align-top";
const NUMERIC_CELL = `${CELL} text-end tabular-nums`;

function compareRows(left: SavingsTransaction, right: SavingsTransaction) {
  const byDate = left.transDate.localeCompare(right.transDate);
  return byDate !== 0 ? byDate : left.transId - right.transId;
}

export function MemberLedgerPrintPreview({ report, onClose }: MemberLedgerPrintPreviewProps) {
  const t = useTranslations("deposits.memberLedger");
  const tTxn = useTranslations("deposits.savingsTransaction");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const frameRef = useRef<PrintFrameHandle>(null);
  const [ready, setReady] = useState(false);
  const rows = useMemo(() => {
    const next = [...report.rows].sort(compareRows);
    return report.sort === "asc" ? next : next.reverse();
  }, [report.rows, report.sort]);

  const money = (value: number | null | undefined) =>
    value == null
      ? t("dash")
      : format.number(value, {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  const dateLabel = (value: string) => {
    const parsed = parseYmd(value);
    return parsed
      ? format.dateTime(parsed, { month: "short", day: "numeric", year: "numeric" })
      : t("dash");
  };

  const accountNumber =
    report.account.fullAccountNo ||
    (report.account.accountNo != null ? String(report.account.accountNo) : report.account.applNo);
  const holderName = report.account.holderName || report.account.primaryName || t("dash");
  const periodFrom = report.fromDate ? dateLabel(report.fromDate) : t("print.allDates");
  const periodTo = report.toDate ? dateLabel(report.toDate) : t("print.allDates");

  function typeLabel(row: SavingsTransaction) {
    return row.transTypeDesc ||
      (row.transTypeCd === TRANS_WITHDRAWAL ? tTxn("types.2") : tTxn("types.1"));
  }

  function modeLabel(row: SavingsTransaction) {
    return row.transModeDesc ||
      (TRANS_MODES.includes(row.transMode as TransMode)
        ? tTxn(`modes.${row.transMode as TransMode}`)
        : row.transMode || t("dash"));
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={tTxn("print.previewTitle")}
      subtitle={tTxn("print.previewSubtitle")}
      size="xl"
      confirmOnClose={false}
      confirmOnSave={false}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            icon={Printer}
            loading={!ready}
            disabled={!ready}
            onClick={() => frameRef.current?.print()}
          >
            {tTxn("print.button")}
          </Button>
        </>
      }
    >
      <PrintFrame
        ref={frameRef}
        title={t("print.title")}
        orientation="landscape"
        pageLabel={tTxn("print.pageOf", { page: PRINT_PAGE_TOKEN, pages: PRINT_PAGES_TOKEN })}
        className="block h-[70dvh] w-full rounded-[var(--radius-control)] border border-border bg-surface"
        onReady={() => setReady(true)}
        onAfterPrint={onClose}
      >
        <main className="bg-surface p-8 text-xs leading-relaxed text-foreground print:p-0">
          <header className="flex items-start justify-between gap-8 border-b-2 border-brand pb-5">
            <div className="min-w-0 space-y-1">
              <p className="text-base font-semibold">{tCommon("appName")}</p>
              <p className="text-muted">{t("accountTitle", { account: accountNumber, holder: holderName })}</p>
            </div>
            <div className="min-w-0 space-y-1 text-end">
              <h1 className="text-lg font-semibold text-brand-ink">{t("print.title")}</h1>
              <p className="text-muted">
                {tTxn("print.generatedOn", {
                  date: format.dateTime(report.generatedAt, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }),
                })}
              </p>
            </div>
          </header>

          <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 lg:grid-cols-4">
            {[
              { label: t("print.account"), value: accountNumber },
              { label: t("print.holder"), value: holderName },
              {
                label: t("print.scheme"),
                value: [report.account.schemeCode, report.account.schemeName].filter(Boolean).join(" · ") || t("dash"),
              },
              { label: t("print.currentBalance"), value: money(report.account.currentBalance) },
              { label: t("print.period"), value: t("print.dateRange", { from: periodFrom, to: periodTo }) },
              { label: t("print.transactions"), value: t("print.transactionCount", { count: report.rows.length }) },
            ].map((item) => (
              <div key={item.label} className="min-w-0">
                <dt className="text-muted">{item.label}</dt>
                <dd className="break-words font-medium">{item.value}</dd>
              </div>
            ))}
          </dl>

          <table className="mt-6 w-full border-collapse">
            <thead className="bg-surface-muted">
              <tr>
                <th className={`${NUMERIC_CELL} font-semibold`}>{tTxn("print.serial")}</th>
                <th className={`${CELL} text-start font-semibold`}>{tTxn("table.transNo")}</th>
                <th className={`${CELL} text-start font-semibold`}>{tTxn("table.account")}</th>
                <th className={`${CELL} text-start font-semibold`}>{tTxn("table.type")}</th>
                <th className={`${CELL} text-start font-semibold`}>{tTxn("table.mode")}</th>
                <th className={`${NUMERIC_CELL} font-semibold`}>{tTxn("table.amount")}</th>
                <th className={`${NUMERIC_CELL} font-semibold`}>{tTxn("table.balance")}</th>
                <th className={`${CELL} text-start font-semibold`}>{tTxn("table.status")}</th>
                <th className={`${CELL} text-start font-semibold`}>{tTxn("table.date")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className={`${CELL} py-8 text-center text-muted`}>
                    {tTxn("table.empty")}
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={row.transId} className="break-inside-avoid">
                    <td className={NUMERIC_CELL}>{format.number(index + 1)}</td>
                    <td className={CELL}>{row.transNo || String(row.transId)}</td>
                    <td className={CELL}>
                      <span className="block font-medium">{row.holderName || row.applNo || t("dash")}</span>
                      <span className="block text-muted">{row.schemeCode || row.schemeName || t("dash")}</span>
                    </td>
                    <td className={CELL}>{typeLabel(row)}</td>
                    <td className={CELL}>{modeLabel(row)}</td>
                    <td className={NUMERIC_CELL}>{money(row.transAmount)}</td>
                    <td className={NUMERIC_CELL}>
                      {row.statusCd === STATUS_PENDING ? tTxn("form.sentForApproval") : money(row.balanceAfter)}
                    </td>
                    <td className={CELL}>{row.statusDesc || t("dash")}</td>
                    <td className={`${CELL} whitespace-nowrap`}>{dateLabel(row.transDate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {report.truncated ? (
            <p className="mt-4 font-medium text-danger">
              {tTxn("print.truncated", { count: MEMBER_LEDGER_PRINT_ROW_LIMIT })}
            </p>
          ) : null}
          <p className="mt-4 text-center text-muted">{tTxn("print.endOfReport")}</p>
        </main>
      </PrintFrame>
    </Modal>
  );
}

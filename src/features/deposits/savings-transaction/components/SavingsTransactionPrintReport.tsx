"use client";

import { useRef, useState } from "react";
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
import type {
  SavingsTransactionReport,
  SavingsTransactionReportContext,
} from "../types/savings-transaction.types";
import { PRINT_ROW_LIMIT } from "./useSavingsTransactionPrint";
import { useSavingsTransactionLabels } from "./useSavingsTransactionLabels";

type SavingsTransactionPrintReportProps = {
  report: SavingsTransactionReport;
  context: SavingsTransactionReportContext;
  onClose: () => void;
};

const CELL = "border border-border px-3 py-2 align-top";
const NUMERIC_CELL = `${CELL} text-end tabular-nums`;

export function SavingsTransactionPrintReport({
  report,
  context,
  onClose,
}: SavingsTransactionPrintReportProps) {
  const t = useTranslations("deposits.savingsTransaction");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const labels = useSavingsTransactionLabels();
  const frameRef = useRef<PrintFrameHandle>(null);
  const [ready, setReady] = useState(false);

  const branch = context.branchCode
    ? t("print.branch", { branch: context.branchName || "—", code: context.branchCode })
    : t("print.branchOnly", { branch: context.branchName || "—" });

  return (
    <Modal
      open
      onClose={onClose}
      title={t("print.previewTitle")}
      subtitle={t("print.previewSubtitle")}
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
            {t("print.button")}
          </Button>
        </>
      }
    >
      <PrintFrame
        ref={frameRef}
        title={t("print.title")}
        pageLabel={t("print.pageOf", { page: PRINT_PAGE_TOKEN, pages: PRINT_PAGES_TOKEN })}
        className="block h-[70dvh] w-full rounded-[var(--radius-control)] border border-border bg-surface"
        onReady={() => setReady(true)}
        onAfterPrint={onClose}
      >
        <main className="bg-surface p-8 text-xs leading-relaxed text-foreground print:p-0">
          <header className="flex items-start justify-between gap-8 border-b-2 border-brand pb-5">
            <div className="min-w-0 space-y-1">
              <p className="text-base font-semibold">{context.orgName || tCommon("appName")}</p>
              <p className="text-muted">{branch}</p>
            </div>
            <div className="min-w-0 space-y-1 text-end">
              <h1 className="text-lg font-semibold text-brand-ink">{t("print.title")}</h1>
              <p className="text-muted">
                {t("print.generatedOn", {
                  date: format.dateTime(report.generatedAt, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }),
                })}
              </p>
              {context.printedBy ? (
                <p className="text-muted">{t("print.printedBy", { name: context.printedBy })}</p>
              ) : null}
            </div>
          </header>

          <table className="mt-6 w-full border-collapse">
            <thead className="bg-surface-muted">
              <tr>
                <th className={`${CELL} text-start font-semibold`}>{t("print.serial")}</th>
                <th className={`${CELL} text-start font-semibold`}>{t("table.transNo")}</th>
                <th className={`${CELL} text-start font-semibold`}>{t("table.date")}</th>
                <th className={`${CELL} text-start font-semibold`}>{t("table.member")}</th>
                <th className={`${CELL} text-start font-semibold`}>{t("table.account")}</th>
                <th className={`${CELL} text-start font-semibold`}>{t("form.branch")}</th>
                <th className={`${CELL} text-start font-semibold`}>{t("table.type")}</th>
                <th className={`${CELL} text-start font-semibold`}>{t("table.mode")}</th>
                <th className={`${NUMERIC_CELL} font-semibold`}>{t("table.amount")}</th>
                <th className={`${NUMERIC_CELL} font-semibold`}>{t("table.balance")}</th>
                <th className={`${CELL} text-start font-semibold`}>{t("table.status")}</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className={`${CELL} py-8 text-center text-muted`}>
                    {t("table.empty")}
                  </td>
                </tr>
              ) : (
                report.rows.map((row, index) => (
                  <tr key={row.transId} className="break-inside-avoid">
                    <td className={NUMERIC_CELL}>{format.number(index + 1)}</td>
                    <td className={CELL}>{row.transNo || String(row.transId)}</td>
                    <td className={`${CELL} whitespace-nowrap`}>{labels.date(row)}</td>
                    <td className={CELL}>
                      <span className="block font-medium">{row.memberName || "—"}</span>
                      {row.memberRefCode ? (
                        <span className="block text-muted">{row.memberRefCode}</span>
                      ) : null}
                    </td>
                    <td className={`${CELL} whitespace-nowrap tabular-nums`}>
                      {labels.account(row)}
                    </td>
                    <td className={CELL}>{row.branchName || "—"}</td>
                    <td className={CELL}>{labels.type(row)}</td>
                    <td className={CELL}>{labels.mode(row)}</td>
                    <td className={NUMERIC_CELL}>{labels.money(row.transAmount)}</td>
                    <td className={NUMERIC_CELL}>{labels.balance(row)}</td>
                    <td className={CELL}>{labels.status(row)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
  
          {report.truncated ? (
            <p className="mt-4 font-medium text-danger">
              {t("print.truncated", { count: PRINT_ROW_LIMIT })}
            </p>
          ) : null}
          <p className="mt-4 text-center text-muted">{t("print.endOfReport")}</p>
  
          <footer className="mt-20 grid grid-cols-3 gap-12 break-inside-avoid">
            {(["preparedBy", "checkedBy", "authorisedBy"] as const).map((key) => (
              <p key={key} className="border-t border-border-strong pt-2 text-center text-muted">
                {t(`print.signatures.${key}`)}
              </p>
            ))}
          </footer>
        </main>
      </PrintFrame>
    </Modal>
  );
}

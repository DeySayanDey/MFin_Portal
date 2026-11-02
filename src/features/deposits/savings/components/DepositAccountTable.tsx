"use client";

import { useMemo, type ReactNode } from "react";
import { Ban, Eye, Pencil, Power, PowerOff, SlidersHorizontal, Users } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
<<<<<<< Updated upstream
import { parseYmd, todayYmd } from "../deposit-account.rules";
import type {
  DepositAccount,
  PaginationMeta,
} from "../types/deposit-account.types";
=======
import { CUST_TYPE_GROUP, STATUS_ACTIVE } from "../deposit-account.constants";
import { depositStatusTone, parseYmd } from "../deposit-account.rules";
import type { DepositAccount, PaginationMeta } from "../types/deposit-account.types";
>>>>>>> Stashed changes

type DepositAccountTableProps = {
  items: DepositAccount[];
  meta: PaginationMeta | null;
  page: number;
  pageSize: number;
  loading: boolean;
  error: boolean;
  errorMessage?: string;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onView: (row: DepositAccount) => void;
  onEdit: (row: DepositAccount) => void;
  onToggle: (row: DepositAccount) => void;
  onStatus: (row: DepositAccount) => void;
  onCloseAccount: (row: DepositAccount) => void;
  onOpen: () => void;
  variant?: "savings" | "term";
  headerActions?: ReactNode;
};

export function DepositAccountTable({
  items,
  meta,
  page,
  pageSize,
  loading,
  error,
  errorMessage,
  onRetry,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onToggle,
  onStatus,
  onCloseAccount,
  onOpen,
  variant = "savings",
  headerActions,
}: DepositAccountTableProps) {
  const t = useTranslations(variant === "term" ? "deposits.term" : "deposits.savings");
  const format = useFormatter();

  const columns = useMemo<DataTableColumn<DepositAccount>[]>(() => {
    const money = (value: number | null | undefined) =>
      value == null
        ? t("dash")
        : format.number(value, {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });

    const statusColumn: DataTableColumn<DepositAccount> = {
      id: "status",
      header: t("columns.status"),
      cell: (row) =>
        row.isClosed ? (
          <div>
            <Badge tone="neutral" caps={false}>
              {t("closed")}
            </Badge>
            {row.closingDate ? (
              <p className="mt-1 text-xs text-muted">
                {t("closedOn", {
                  date: format.dateTime(
                    parseYmd(row.closingDate) ?? new Date(row.closingDate),
                    {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    },
                  ),
                })}
              </p>
            ) : null}
          </div>
        ) : (
          <Badge tone={statusTone(row.statusCd)} caps={false}>
            {row.statusDesc || t("dash")}
          </Badge>
        ),
    };

    if (variant === "term") {
      return [
        {
          id: "accountNo",
          header: t("columns.account"),
          cell: (row) => (
            <div>
              <p className="font-semibold text-slate-900">
                {row.fullAccountNo || (row.accountNo != null ? String(row.accountNo) : t("dash"))}
              </p>
              <p className="text-xs text-muted">{row.applNo || t("dash")}</p>
            </div>
          ),
        },
        {
          id: "holder",
          header: t("columns.holder"),
          cell: (row) => (
            <div>
              <p className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                {row.custIdJoint1 != null ? (
                  <Users
                    className="h-3.5 w-3.5 shrink-0 text-slate-500"
                    aria-label={t("columns.joint")}
                  />
                ) : null}
                <span>{row.holderName || row.primaryName || t("dash")}</span>
              </p>
              <p className="text-xs text-muted">
                {[row.primaryRefCode, row.custTypeDesc].filter(Boolean).join(" · ") || t("dash")}
              </p>
            </div>
          ),
        },
        {
          id: "scheme",
          header: t("columns.scheme"),
          cell: (row) => (
            <div>
              <p className="text-slate-800">{row.schemeName || t("dash")}</p>
              <p className="text-xs text-muted">
                {t("columns.schemeMeta", {
                  product: row.prodTypeDesc || t("dash"),
                  roi:
                    (row.td?.roi ?? row.sbRoi ?? row.schemeRoiPercent) == null
                      ? t("dash")
                      : t("roiPercent", {
                          value: format.number(
                            row.td?.roi ?? row.sbRoi ?? row.schemeRoiPercent ?? 0,
                            { maximumFractionDigits: 2 },
                          ),
                        }),
                })}
              </p>
            </div>
          ),
        },
        {
          id: "amount",
          header: t("columns.amount"),
          cell: (row) => {
            const amount = row.td?.instAmount;
            const count = row.td?.instNo;
            const paid = row.td?.currentBalance ?? row.currentBalance;
            return (
              <div>
                <p className="font-semibold tabular-nums text-slate-900">
                  {amount == null
                    ? t("dash")
                    : count != null && count > 1
                      ? t("columns.amountTimes", { amount: money(amount), count })
                      : money(amount)}
                </p>
                <p className="text-xs text-muted">
                  {t("columns.paid", { amount: money(paid) })}
                </p>
              </div>
            );
          },
        },
        {
          id: "maturity",
          header: t("columns.maturity"),
          cell: (row) => {
            const maturityDate = row.td?.maturityDate;
            const matured =
              !row.isClosed && maturityDate != null && maturityDate < todayYmd();
            return (
              <div>
                <p className="text-slate-800">
                  {maturityDate
                    ? format.dateTime(parseYmd(maturityDate) ?? new Date(maturityDate), {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : t("dash")}
                </p>
                <p className="text-xs text-muted">{money(row.td?.maturityAmount)}</p>
                {matured ? (
                  <p className="mt-1 text-xs font-medium text-amber-700">{t("matured")}</p>
                ) : null}
              </div>
            );
          },
        },
        statusColumn,
      ];
    }

    return [
      {
        id: "accountNo",
<<<<<<< Updated upstream
        header: t("columns.applNo"),
        cell: (row) => (
          <div>
            <p className="font-semibold text-slate-900">
              {row.accountNo != null ? String(row.accountNo) : t("dash")}
            </p>
            {/* <p className="text-xs text-muted">
              {row.applNo
                ? `${row.applNo} · ${row.depositTypeDesc || t("dash")}`
                : (row.depositTypeDesc || t("dash"))}
            </p> */}
=======
        header: t("columns.accountNo"),
        cell: (row) => (
          <div>
            <p className="font-semibold text-slate-900">
              {row.fullAccountNo || t("columns.notOpened")}
            </p>
            <p className="text-xs text-muted">{row.applNo || t("dash")}</p>
>>>>>>> Stashed changes
          </div>
        ),
      },
      {
        id: "holder",
        header: t("columns.holder"),
        cell: (row) => (
          <div>
            <p className="inline-flex items-center gap-1.5 font-medium text-slate-800">
              {row.custIdJoint1 != null ? (
                <Users
                  className="h-3.5 w-3.5 shrink-0 text-slate-500"
                  aria-label={t("columns.joint")}
                />
              ) : null}
              <span>{row.holderName || row.primaryName || t("dash")}</span>
            </p>
            <p className="text-xs text-muted">
<<<<<<< Updated upstream
              {[
                row.primaryRefCode,
                row.custTypeDesc || t("dash"),
                row.custTypeCd === 1 && row.memberCount != null
                  ? String(row.memberCount)
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
=======
              {row.custTypeCd === CUST_TYPE_GROUP
                ? t("columns.groupMeta", {
                    ref: row.primaryRefCode || t("dash"),
                    customerType: row.custTypeDesc || t("dash"),
                    count: row.memberCount,
                  })
                : t("columns.holderMeta", {
                    ref: row.primaryRefCode || t("dash"),
                    customerType: row.custTypeDesc || t("dash"),
                  })}
>>>>>>> Stashed changes
            </p>
          </div>
        ),
      },
      {
        id: "scheme",
<<<<<<< Updated upstream
        header: t("columns.scheme"),
        cell: (row) => (
          <div>
            <p className="text-slate-800">
              {[row.prodTypeDesc, row.schemeName].filter(Boolean).join(" · ") || t("dash")}
            </p>
            <p className="text-xs text-muted">
              {t("columns.schemeMeta", {
                code: row.schemeCode || t("dash"),
                roi:
                  row.schemeRoiPercent == null
                    ? t("dash")
                    : t("roiPercent", {
                        value: format.number(row.schemeRoiPercent, {
                          maximumFractionDigits: 2,
=======
        header: t("columns.productScheme"),
        cell: (row) => {
          const roi = row.sbRoi ?? row.schemeRoiPercent;
          return (
            <div>
              <p className="text-slate-800">
                {t("columns.productLine", {
                  product: row.prodTypeDesc || t("dash"),
                  scheme: row.schemeName || t("dash"),
                })}
              </p>
              <p className="text-xs text-muted">
                {t("columns.schemeMeta", {
                  code: row.schemeCode || t("dash"),
                  roi:
                    roi == null
                      ? t("dash")
                      : t("roiPercent", {
                          value: format.number(roi, { maximumFractionDigits: 2 }),
>>>>>>> Stashed changes
                        }),
                })}
              </p>
            </div>
          );
        },
      },
      {
        id: "balance",
        header: t("columns.balance"),
        align: "end",
        className: "font-semibold tabular-nums text-slate-900",
        cell: (row) =>
          row.currentBalance == null
            ? t("dash")
            : format.number(row.currentBalance, {
                style: "currency",
                currency: "INR",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
      },
<<<<<<< Updated upstream
      statusColumn,
    ];
  }, [format, t, variant]);
=======
      {
        id: "status",
        header: t("columns.status"),
        cell: (row) =>
          row.isClosed ? (
            <div>
              <Badge tone="neutral" caps={false}>
                {t("closed")}
              </Badge>
              {row.closingDate ? (
                <p className="mt-1 text-xs text-muted">
                  {t("closedOn", {
                    date: format.dateTime(parseYmd(row.closingDate) ?? new Date(row.closingDate), {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    }),
                  })}
                </p>
              ) : null}
            </div>
          ) : (
            <Badge tone={depositStatusTone(row.statusCd)} caps={false}>
              {row.statusDesc || t("dash")}
            </Badge>
          ),
      },
    ],
    [format, t],
  );
>>>>>>> Stashed changes

  return (
    <DataTable
      title={t("tableCaption")}
      description={t("description")}
      actions={headerActions}
      data={items}
      columns={columns}
      getRowKey={(row) => String(row.accountId)}
      getRowClassName={(row) => (row.isClosed ? "opacity-60" : undefined)}
      loading={loading}
      error={error}
      errorTitle={t("loadErrorTitle")}
      errorMessage={errorMessage}
      onRetry={onRetry}
      emptyTitle={t("emptyTitle")}
      emptyMessage={t("emptyMessage")}
      emptyAction={
        variant === "term" ? undefined : (
        <Button type="button" onClick={onOpen}>
          {t("openAccount")}
        </Button>
        )
      }
      minWidth="960px"
      caption={t("tableCaption")}
      rowActions={{
        header: t("columns.actions"),
<<<<<<< Updated upstream
        render: (row) => (
          <div className="inline-flex items-center gap-1.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Eye}
              tooltip={t("actions.view")}
              onClick={() => onView(row)}
            />
            {row.isClosed ? null : (
              <>
                {variant === "savings" ? (
=======
        render: (row) => {
          const active = row.statusCd === STATUS_ACTIVE;
          return (
            <div className="inline-flex items-center gap-1.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={Eye}
                tooltip={t("actions.view")}
                onClick={() => onView(row)}
              />
              {row.isClosed ? null : (
                <>
>>>>>>> Stashed changes
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={Pencil}
                    tooltip={t("actions.edit")}
                    onClick={() => onEdit(row)}
                  />
<<<<<<< Updated upstream
                ) : null}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={SlidersHorizontal}
                  tooltip={t("actions.changeStatus")}
                  onClick={() => onStatus(row)}
                />
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  icon={Ban}
                  tooltip={t("actions.close")}
                  onClick={() => onCloseAccount(row)}
                />
              </>
            )}
          </div>
        ),
=======
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={active ? PowerOff : Power}
                    tooltip={active ? t("actions.deactivate") : t("actions.activate")}
                    onClick={() => onToggle(row)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={SlidersHorizontal}
                    tooltip={t("actions.changeStatus")}
                    onClick={() => onStatus(row)}
                  />
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    icon={Ban}
                    tooltip={t("actions.close")}
                    onClick={() => onCloseAccount(row)}
                  />
                </>
              )}
            </div>
          );
        },
>>>>>>> Stashed changes
      }}
      pagination={{
        page,
        pageSize,
        total: meta?.total ?? items.length,
        totalPages: meta?.lastPage,
        pageSizeOptions: [20, 50, 100, 200],
        onPageChange,
        onPageSizeChange,
      }}
    />
  );
}

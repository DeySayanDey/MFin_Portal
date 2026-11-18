"use client";

import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { AuditLog } from "@/features/security/audit-log/types/audit-log.types";

type AuditLogDetailProps = {
  open: boolean;
  row: AuditLog | null;
  onClose: () => void;
};

function formatJson(value: unknown): string {
  if (value == null) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function AuditLogDetail({ open, row, onClose }: AuditLogDetailProps) {
  const t = useTranslations("security.auditLog");
  const tCommon = useTranslations("common");
  const emptyLabel = t("emptyValue");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("detailTitle")}
      size="lg"
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          {tCommon("close")}
        </Button>
      }
    >
      {row ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info" caps>
              {row.actionName}
            </Badge>
            <span className="font-mono text-xs text-muted">{row.createdAt}</span>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            <DetailItem
              label={t("fields.auditId")}
              value={String(row.auditId)}
              emptyLabel={emptyLabel}
            />
            <DetailItem
              label={t("fields.userId")}
              value={row.userId != null ? String(row.userId) : ""}
              emptyLabel={emptyLabel}
            />
            <DetailItem
              label={t("fields.menu")}
              value={row.menuName ?? ""}
              emptyLabel={emptyLabel}
            />
            <DetailItem
              label={t("fields.table")}
              value={row.tableName ?? ""}
              emptyLabel={emptyLabel}
            />
            <DetailItem
              label={t("fields.recordId")}
              value={row.recordId != null ? String(row.recordId) : ""}
              emptyLabel={emptyLabel}
            />
            <DetailItem
              label={t("fields.ip")}
              value={row.ipAddress ?? ""}
              emptyLabel={emptyLabel}
            />
          </dl>

          <DetailItem
            label={t("fields.userAgent")}
            value={row.userAgent ?? ""}
            emptyLabel={emptyLabel}
          />

          <JsonBlock
            label={t("fields.oldValues")}
            value={formatJson(row.oldValues)}
            emptyLabel={emptyLabel}
          />
          <JsonBlock
            label={t("fields.newValues")}
            value={formatJson(row.newValues)}
            emptyLabel={emptyLabel}
          />
        </div>
      ) : null}
    </Modal>
  );
}

function DetailItem({
  label,
  value,
  emptyLabel,
}: {
  label: string;
  value: string;
  emptyLabel: string;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-600">{label}</dt>
      <dd className="mt-1 break-all text-sm text-slate-800">
        {value || emptyLabel}
      </dd>
    </div>
  );
}

function JsonBlock({
  label,
  value,
  emptyLabel,
}: {
  label: string;
  value: string;
  emptyLabel: string;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-slate-600">{label}</p>
      <pre className="max-h-56 overflow-auto rounded-xl border border-border bg-surface-muted p-3 font-mono text-xs text-slate-700 whitespace-pre-wrap">
        {value || emptyLabel}
      </pre>
    </div>
  );
}

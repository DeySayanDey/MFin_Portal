"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Building2, KeyRound, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { Configuration } from "../services/virtual-account.types";

export function VirtualAccountDetails({ record, bankName, purposeName, onClose }: { record: Configuration; bankName: string; purposeName: string; onClose: () => void }) {
  const t = useTranslations("virtualAccountConfig");
  const common = useTranslations("common");
  const [preview, setPreview] = useState<string | null>(null);
  const [qrFailed, setQrFailed] = useState(false);
  useEffect(() => {
    if (!record.hasQrImage) return;
    const controller = new AbortController();
    let url: string | null = null;
    fetch(`/api/master/virtual-ac-config/qr?id=${record.id}`, { signal: controller.signal, cache: "no-store" })
      .then((response) => { if (!response.ok) throw new Error("QR unavailable"); return response.blob(); })
      .then((blob) => { if (!controller.signal.aborted) { url = URL.createObjectURL(blob); setPreview(url); } })
      .catch(() => { if (!controller.signal.aborted) setQrFailed(true); });
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [record.id, record.hasQrImage]);

  const accountFields = [
    [t("configName"), record.configName], [t("purpose"), purposeName],
    [t("maxAmount"), record.maxAmount],
    [t("branchCode"), record.branchCode], [t("ifsCode"), record.ifscCode],
    [t("accountNumber"), record.accountNo ? `••••${record.accountNo.slice(-4)}` : ""],
    [t("cifNumber"), record.cifNo], [t("iblTender"), record.tenderId], [t("upiId"), record.upiId],
  ];
  const integrationFields = [
    [t("makerId"), record.makerId], [t("checkerId"), record.checkerId], [t("clientId"), record.clientId],
    [t("secretId"), record.hasSecretId ? "••••••••" : ""],
    [t("hexKey"), record.hasHexKey ? "••••••••" : ""], [t("hexIvKey"), record.hasHexIvKey ? "••••••••" : ""],
  ];
  const details = (items: string[][]) => <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map(([label, value]) => <div key={label} className="min-w-0 rounded-xl border border-border bg-surface p-3"><dt className="text-xs font-semibold text-muted">{label}</dt><dd className="mt-1 break-all text-sm font-medium text-slate-900">{value || "—"}</dd></div>)}</dl>;

  return <Modal open onClose={onClose} title={t("viewConfiguration")} subtitle={t("configurationsHint")} size="lg" className="h-[min(80dvh,720px)]" confirmOnClose={false} footer={<Button variant="secondary" onClick={onClose}>{common("close")}</Button>}>
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-brand-soft/40 p-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand"><Building2 className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-muted">{t("bank")} · {t("virtualId")} {record.id}</p><p className="mt-0.5 truncate text-base font-semibold text-slate-900">{bankName}</p></div>
        <Badge tone={record.isActive ? "success" : "neutral"}>{t(record.isActive ? "active" : "inactive")}</Badge>
      </div>
      <section className="space-y-3"><h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Building2 className="h-4 w-4 text-brand" />{t("accountDetails")}</h3>{details(accountFields)}</section>
      <section className="space-y-3"><h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><KeyRound className="h-4 w-4 text-brand" />{t("integrationDetails")}</h3>{details(integrationFields)}</section>
      <section className="space-y-3"><h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><QrCode className="h-4 w-4 text-brand" />{t("qrUpload")}</h3><div className="rounded-xl border border-border p-3">{preview ? <img src={preview} alt={t("qrPreview")} className="h-28 w-28 rounded-lg border border-border object-contain" /> : <p className="text-sm text-muted">{!record.hasQrImage ? t("noQr") : qrFailed ? t("qrLoadError") : common("loading")}</p>}</div></section>
    </div>
  </Modal>;
}

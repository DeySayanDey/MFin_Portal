"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Upload, X } from "lucide-react";
import { FormField } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";

const ALLOWED = new Set(["image/jpeg", "image/png", "application/pdf"]);
const MAX_BYTES = 2 * 1024 * 1024;

export function KycImageField({
  label,
  memberId,
  value,
  onChange,
  fileUrl = "/api/onboarding/member-kyc/file",
  ownerField = "member_id",
}: {
  label: string;
  memberId: number;
  value: string;
  onChange: (path: string) => void;
  fileUrl?: string;
  /** Form field the upload route reads the owner id from. */
  ownerField?: "member_id" | "group_id";
}) {
  const t = useTranslations("onboarding.memberKyc");
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");

  async function choose(file: File | undefined) {
    if (!file) return;
    if (!ALLOWED.has(file.type)) {
      setError(t("imageType"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t("imageTooLarge"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.set(ownerField, String(memberId));
      body.set("file", file);
      const response = await fetch(fileUrl, {
        method: "POST",
        body,
        credentials: "same-origin",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
        data?: { path?: string };
      };
      if (!response.ok || !payload.data?.path) {
        setError(payload.message || t("requestFailed"));
        return;
      }
      if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
      setPreview(file.type === "application/pdf" ? "" : URL.createObjectURL(file));
      onChange(payload.data.path);
    } catch {
      setError(t("requestFailed"));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const stored = value ? `${fileUrl}?path=${encodeURIComponent(value)}` : "";
  const image = preview || (value && !value.endsWith(".pdf") ? stored : "");

  return (
    <FormField label={label} error={error} hint={t("imageHint")}>
      <input autoComplete="off"
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className="sr-only"
        onChange={(event) => void choose(event.target.files?.[0])}
      />
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- private upload served by the session route
        <img src={image} alt={label} className="mb-2 h-28 w-full rounded-lg border border-border object-contain" />
      ) : null}
      {value.endsWith(".pdf") ? <p className="mb-2 text-xs text-muted">{t("pdfReady")}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" icon={Upload} loading={busy} onClick={() => inputRef.current?.click()}>
          {value ? t("replaceImage") : t("uploadImage")}
        </Button>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={X}
            onClick={() => {
              if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
              setPreview("");
              onChange("");
            }}
          >
            {t("removeImage")}
          </Button>
        ) : null}
      </div>
    </FormField>
  );
}

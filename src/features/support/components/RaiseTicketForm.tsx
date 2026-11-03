"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { ImagePlus, Send, X } from "lucide-react";
import { PageToast } from "@/components/ui/PageToast";
import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Form";
import { Modal } from "@/components/ui/Modal";
import { raiseTicketFormSchema } from "@/features/support/schemas/support-ticket.schema";
import type { RaiseTicketFormInput } from "@/features/support/types/support-ticket.types";
import {
  TICKET_IMAGE_MIMES,
  TICKET_PRIORITIES,
  TICKET_SCREENSHOT_MAX_BYTES,
  TICKET_SCREENSHOT_MAX_COUNT,
  type TicketImageMime,
  type TicketPriority,
  type TicketScreenshotInput,
} from "@/features/support/types/support-ticket.types";

type DraftShot = TicketScreenshotInput & {
  id: string;
  name: string;
  previewUrl: string;
};

const ACCEPT = TICKET_IMAGE_MIMES.join(",");
const FORM_ID = "raise-ticket-form";

type RaiseTicketFormProps = {
  open: boolean;
  saving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (input: RaiseTicketFormInput) => Promise<void> | void;
};

function normalizeMime(file: File): TicketImageMime | null {
  const raw = file.type === "image/jpg" ? "image/jpeg" : file.type;
  if ((TICKET_IMAGE_MIMES as readonly string[]).includes(raw)) {
    return raw as TicketImageMime;
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return null;
}

function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function RaiseTicketForm({
  open,
  saving,
  errorMessage,
  onClose,
  onSubmit,
}: RaiseTicketFormProps) {
  const t = useTranslations("support.raiseTicket");
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
  const [shots, setShots] = useState<DraftShot[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const shotsRef = useRef(shots);
  shotsRef.current = shots;

  useEffect(() => {
    if (open) return;
    for (const shot of shotsRef.current) URL.revokeObjectURL(shot.previewUrl);
  }, [open]);

  useEffect(() => {
    return () => {
      for (const shot of shotsRef.current) URL.revokeObjectURL(shot.previewUrl);
    };
  }, []);

  function errorText(code: string | undefined, field: string): string | undefined {
    if (!code) return undefined;
    if (field === "subject") return t("errors.subject");
    if (field === "description") return t("errors.description");
    if (field === "priority") return t("errors.priority");
    if (code === "type") return t("errors.screenshotType");
    if (code === "size") return t("errors.screenshotSize");
    if (code === "count") return t("errors.screenshots");
    return t("errors.screenshots");
  }

  async function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (selected.length === 0) return;

    const room = TICKET_SCREENSHOT_MAX_COUNT - shots.length;
    if (room <= 0) {
      setFieldErrors((prev) => ({
        ...prev,
        screenshots: t("errors.screenshots"),
      }));
      return;
    }

    const next: DraftShot[] = [];
    let fileError: string | undefined;
    for (const file of selected.slice(0, room)) {
      const mime = normalizeMime(file);
      if (!mime) {
        fileError = t("errors.screenshotType");
        continue;
      }
      if (file.size > TICKET_SCREENSHOT_MAX_BYTES) {
        fileError = t("errors.screenshotSize");
        continue;
      }
      const data = await readBase64(file);
      next.push({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name.trim() || "screenshot.png",
        mime,
        data,
        previewUrl: URL.createObjectURL(file),
      });
    }
    if (selected.length > room) {
      fileError = t("errors.screenshots");
    }

    setShots((prev) => [...prev, ...next].slice(0, TICKET_SCREENSHOT_MAX_COUNT));
    setFieldErrors((prev) => ({
      ...prev,
      screenshots: fileError ?? "",
    }));
  }

  function removeShot(id: string) {
    setShots((prev) => {
      const shot = prev.find((item) => item.id === id);
      if (shot) URL.revokeObjectURL(shot.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      subject,
      description,
      priority,
      screenshots: shots.map((shot) => ({
        name: shot.name,
        data: shot.data,
        mime: shot.mime,
      })),
    };
    const parsed = raiseTicketFormSchema.safeParse(payload);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const next: Record<string, string> = {};
      for (const [key, messages] of Object.entries(flat.fieldErrors)) {
        const code = messages?.[0];
        const text = errorText(code, key);
        if (text) next[key.startsWith("screenshots") ? "screenshots" : key] = text;
      }
      if (!next.screenshots) {
        const shotIssue = parsed.error.issues.find((issue) =>
          issue.path.includes("screenshots"),
        );
        if (shotIssue) {
          next.screenshots =
            errorText(shotIssue.message, "screenshots") ?? t("errors.screenshots");
        }
      }
      setFieldErrors(next);
      return;
    }
    void onSubmit(parsed.data);
  }

  const priorityOptions = TICKET_PRIORITIES.map((value) => ({
    value,
    label: t(`priority.${value}`),
  }));

  return (
    <Modal
      open={open}
      title={t("title")}
      subtitle={t("description")}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" disabled={saving} onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            icon={Send}
            loading={saving}
            disabled={saving}
          >
            {saving ? t("saving") : t("save")}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} className="grid grid-cols-1 gap-4" onSubmit={handleSubmit}>
        <PageToast message={errorMessage ?? null} tone="error" />
        <TextField
          label={t("fields.subject")}
          value={subject}
          required
          maxLength={255}
          placeholder={t("placeholders.subject")}
          hint={t("hints.subject", { count: subject.length })}
          error={fieldErrors.subject || undefined}
          onChange={setSubject}
        />
        <TextAreaField
          label={t("fields.description")}
          value={description}
          required
          rows={6}
          maxLength={4000}
          hint={t("hints.description", { count: description.length })}
          error={fieldErrors.description || undefined}
          onChange={setDescription}
        />
        <SelectField
          label={t("fields.priority")}
          value={priority}
          options={priorityOptions}
          searchable={false}
          hint={t("hints.priority")}
          error={fieldErrors.priority || undefined}
          onChange={(value) => setPriority(value as TicketPriority)}
        />

        <div>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor={inputId} className="text-xs font-semibold text-foreground">
              {t("fields.screenshots")}
            </label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={ImagePlus}
              disabled={saving || shots.length >= TICKET_SCREENSHOT_MAX_COUNT}
              onClick={() => fileRef.current?.click()}
            >
              {t("addScreenshots")}
            </Button>
          </div>
          <input
            ref={fileRef}
            id={inputId}
            type="file"
            accept={ACCEPT}
            multiple
            className="sr-only"
            onChange={(event) => void addFiles(event)}
          />
          <p className="text-xs text-muted">{t("hints.screenshots")}</p>
          {fieldErrors.screenshots ? (
            <p className="mt-1 text-xs text-rose-600" role="alert">
              {fieldErrors.screenshots}
            </p>
          ) : null}
          {shots.length > 0 ? (
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {shots.map((shot) => (
                <li
                  key={shot.id}
                  className="relative overflow-hidden rounded-xl border border-border bg-surface-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- local screenshot preview */}
                  <img
                    src={shot.previewUrl}
                    alt={shot.name}
                    className="h-28 w-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute end-1.5 top-1.5 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-foreground shadow-sm hover:bg-surface-muted"
                    aria-label={t("removeScreenshot", { name: shot.name })}
                    onClick={() => removeShot(shot.id)}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </form>
    </Modal>
  );
}

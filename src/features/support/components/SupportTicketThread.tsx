"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ImagePlus, Send, X } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { Button } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Form";
import { ticketReplySchema } from "@/features/support/schemas/support-ticket.schema";
import {
  fetchSupportTicketMessages,
  isSupportTicketClientError,
  replySupportTicket,
} from "@/features/support/services/support-ticket-client";
import {
  TICKET_IMAGE_MIMES,
  TICKET_SCREENSHOT_MAX_BYTES,
  TICKET_SCREENSHOT_MAX_COUNT,
  type SupportTicketMessage,
  type TicketImageMime,
  type TicketScreenshotInput,
} from "@/features/support/types/support-ticket.types";

type DraftShot = TicketScreenshotInput & {
  id: string;
  previewUrl: string;
};

const ACCEPT = TICKET_IMAGE_MIMES.join(",");

type SupportTicketThreadProps = {
  ticketNumber: string;
  closed: boolean;
  reloadKey?: number;
};

function formatWhen(value: string | null, locale: string): string {
  if (!value) return "";
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

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

export function SupportTicketThread({
  ticketNumber,
  closed,
  reloadKey = 0,
}: SupportTicketThreadProps) {
  const t = useTranslations("support.raiseTicket");
  const tErrors = useTranslations("errors");
  const tErrorsRef = useRef(tErrors);
  tErrorsRef.current = tErrors;
  const locale = useLocale();
  const fileRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const [messages, setMessages] = useState<SupportTicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [shots, setShots] = useState<DraftShot[]>([]);
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useToastText();
  const shotsRef = useRef(shots);
  shotsRef.current = shots;

  useEffect(() => {
    return () => {
      for (const shot of shotsRef.current) URL.revokeObjectURL(shot.previewUrl);
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrorMessage(null);
    void fetchSupportTicketMessages(ticketNumber)
      .then((rows) => {
        if (active) setMessages(rows);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setMessages([]);
        setErrorMessage(
          isSupportTicketClientError(loadError) ? loadError.message : tErrorsRef.current("generic"),
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [ticketNumber, reloadKey]);

  async function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    const room = TICKET_SCREENSHOT_MAX_COUNT - shots.length;
    if (room <= 0) {
      setReplyError(t("errors.screenshots"));
      return;
    }
    const next: DraftShot[] = [];
    for (const file of selected.slice(0, room)) {
      const mime = normalizeMime(file);
      if (!mime || file.size > TICKET_SCREENSHOT_MAX_BYTES) {
        setReplyError(!mime ? t("errors.screenshotType") : t("errors.screenshotSize"));
        continue;
      }
      const data = await readBase64(file);
      next.push({
        id: `${file.name}-${file.size}-${next.length}`,
        name: file.name,
        data,
        mime,
        previewUrl: URL.createObjectURL(file),
      });
    }
    setShots((current) => [...current, ...next]);
  }

  function removeShot(id: string) {
    setShots((current) => {
      const shot = current.find((item) => item.id === id);
      if (shot) URL.revokeObjectURL(shot.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  async function sendReply() {
    const parsed = ticketReplySchema.safeParse({
      message: draft,
      screenshots: shots.map(({ name, data, mime }) => ({ name, data, mime })),
    });
    if (!parsed.success) {
      setReplyError(t("errors.reply"));
      return;
    }
    setSending(true);
    setReplyError(null);
    try {
      const created = await replySupportTicket(ticketNumber, parsed.data);
      setMessages((current) => [...current, created]);
      setDraft("");
      for (const shot of shots) URL.revokeObjectURL(shot.previewUrl);
      setShots([]);
    } catch (submitError) {
      setReplyError(
        isSupportTicketClientError(submitError) ? submitError.message : tErrors("generic"),
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mt-6 border-t border-border pt-4">
      <h3 className="text-sm font-semibold text-foreground">{t("messages.title")}</h3>
      {errorMessage ? (
        <Alert tone="error" className="mt-3">
          {errorMessage}
        </Alert>
      ) : null}
      {loading ? <p className="mt-3 text-sm text-muted">{t("messages.loading")}</p> : null}
      {!loading && messages.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{t("messages.empty")}</p>
      ) : null}
      <ol className="mt-3 flex flex-col gap-3">
        {messages.map((item) => (
          <li
            key={item.id}
            className={`w-fit max-w-[75%] rounded-xl border border-border px-3 py-2 ${
              item.side === "staff" ? "self-start bg-surface-muted" : "self-end bg-surface"
            }`}
          >
            <p className="flex flex-wrap items-baseline gap-x-2 text-xs font-semibold text-foreground">
              <span>{item.authorName || t(`messages.${item.side}`)}</span>
              {item.createdAt ? (
                <span className="font-normal text-muted">{formatWhen(item.createdAt, locale)}</span>
              ) : null}
            </p>
            {item.message ? (
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">
                {item.message}
              </p>
            ) : null}
            {item.screenshots.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {item.screenshots.map((shot) => (
                  <li key={shot.url} className="overflow-hidden rounded-lg border border-border">
                    <a href={shot.url} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element -- support desk file URL */}
                      <img src={shot.url} alt={shot.name} className="h-24 w-24 object-cover" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ol>

      {closed ? (
        <p className="mt-4 text-sm text-muted">{t("messages.closed")}</p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <PageToast message={replyError} tone="error" />
          <TextAreaField
            label={t("messages.reply")}
            value={draft}
            onChange={setDraft}
            maxLength={4000}
            hint={t("messages.hint", { count: draft.length })}
            rows={3}
          />
          <input autoComplete="off"
            ref={fileRef}
            id={inputId}
            type="file"
            accept={ACCEPT}
            multiple
            className="sr-only"
            onChange={(event) => void addFiles(event)}
          />
          {shots.length > 0 ? (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {shots.map((shot) => (
                <li key={shot.id} className="relative overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
                  <img src={shot.previewUrl} alt={shot.name} className="h-20 w-full object-cover" />
                  <button
                    type="button"
                    className="absolute end-1 top-1 rounded-full bg-surface p-1 text-foreground"
                    aria-label={t("removeScreenshot", { name: shot.name })}
                    onClick={() => removeShot(shot.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              icon={ImagePlus}
              onClick={() => fileRef.current?.click()}
              disabled={sending || shots.length >= TICKET_SCREENSHOT_MAX_COUNT}
            >
              {t("addScreenshots")}
            </Button>
            <Button type="button" icon={Send} loading={sending} onClick={() => void sendReply()}>
              {sending ? t("messages.sending") : t("messages.send")}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

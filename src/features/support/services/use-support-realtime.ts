"use client";

import { useEffect, useRef, useState } from "react";
import { endpoints } from "@/lib/api/endpoints";
import {
  clipNoticeBody,
  clipNoticeTitle,
  prepareSupportNoticeSound,
  supportNoticeSoundUrl,
  type SupportNotice,
} from "@/features/support/services/support-notice";
import type { SupportRealtimeConfig } from "@/features/support/types/support-ticket.types";

const REFRESH_WAIT_MS = 300;

export type SupportRefresh = {
  tickets: boolean;
  messages: boolean;
  ticket: boolean;
  number: string;
};

const SIGNAL_TYPES = new Set(["ticket.assigned", "ticket.message", "ticket.updated"]);

type ClientSignal = {
  type: string;
  ticketId: string;
  number: string;
  title: string;
  body: string;
  refresh: Array<"tickets" | "messages" | "ticket">;
};

type EchoLike = {
  private: (channel: string) => {
    listen: (event: string, callback: (payload: unknown) => void) => void;
  };
  leave: (channel: string) => void;
  disconnect: () => void;
};

function shouldNotify(signal: Pick<ClientSignal, "type" | "title">): boolean {
  return Boolean(signal.title) || signal.type === "ticket.message" || signal.type === "ticket.assigned";
}

/**
 * Copies reload names plus the short notice title and body.
 * Message text, image URLs, and file bytes are ignored.
 */
function parseSignal(value: unknown): ClientSignal | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const type = typeof record.type === "string" && SIGNAL_TYPES.has(record.type) ? record.type : "";
  const ticketId =
    typeof record.ticketId === "string" && /^\d{1,12}$/.test(record.ticketId)
      ? record.ticketId
      : typeof record.ticketId === "number" && Number.isInteger(record.ticketId) && record.ticketId > 0
        ? String(record.ticketId)
        : "";
  const number =
    typeof record.number === "string" && /^TKT-\d{6}$/.test(record.number.trim().toUpperCase())
      ? record.number.trim().toUpperCase()
      : "";
  const title = clipNoticeTitle(record.title);
  const body = clipNoticeBody(record.body);
  const refresh: ClientSignal["refresh"] = [];
  if (Array.isArray(record.refresh)) {
    for (const item of record.refresh) {
      if (item === "tickets" || item === "messages" || item === "ticket") refresh.push(item);
    }
  }
  if (refresh.length === 0 && !shouldNotify({ type, title })) return null;
  return { type, ticketId, number, title, body, refresh };
}

async function fetchSupportRealtime(number?: string | null): Promise<SupportRealtimeConfig | null> {
  const params = new URLSearchParams();
  if (number) params.set("number", number);
  const query = params.toString();
  const response = await fetch(`${endpoints.bff.supportRealtime}${query ? `?${query}` : ""}`, {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { data?: SupportRealtimeConfig | null };
  return payload.data?.customerChannel ? payload.data : null;
}

async function createEcho(config: SupportRealtimeConfig): Promise<EchoLike> {
  const [{ default: Echo }, { default: Pusher }] = await Promise.all([
    import("laravel-echo"),
    import("pusher-js"),
  ]);
  (window as Window & { Pusher?: typeof Pusher }).Pusher = Pusher;

  const secure = config.scheme === "https";
  const port = config.port === 8094 ? 8093 : config.port;
  return new Echo({
    broadcaster: "reverb",
    key: config.key,
    wsHost: config.host,
    wsPort: port,
    wssPort: port,
    forceTLS: secure,
    enabledTransports: ["ws", "wss"],
    disableStats: true,
    authorizer: (channel: { name: string }) => ({
      authorize: (
        socketId: string,
        callback: (error: Error | null, data: { auth: string } | null) => void,
      ) => {
        void fetch(`${endpoints.bff.supportRealtime}/auth`, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            socket_id: socketId,
            channel_name: channel.name,
          }),
        })
          .then(async (response) => {
            const body = (await response.json()) as { auth?: unknown };
            if (!response.ok || typeof body.auth !== "string") {
              callback(new Error("Realtime auth failed"), null);
              return;
            }
            callback(null, { auth: body.auth });
          })
          .catch((error: unknown) => {
            callback(error instanceof Error ? error : new Error("Realtime auth failed"), null);
          });
      },
    }),
  }) as EchoLike;
}

type SharedSocket = {
  sessionKey: number;
  echo: EchoLike;
};

let sharedSocket: SharedSocket | null = null;
let sharedConnect: Promise<EchoLike | null> | null = null;
let releaseTimer: number | null = null;
const customerListeners = new Set<(payload: unknown) => void>();
let customerBound = false;

function bindCustomerChannel(echo: EchoLike, channel: string) {
  if (customerBound) return;
  customerBound = true;
  echo.private(channel).listen(".signal", (payload: unknown) => {
    for (const listener of customerListeners) listener(payload);
  });
}

/**
 * Customer ticket socket. A signal names which GET to run again.
 * Images stay on those GET calls. This page does not play a sound or open a staff inbox.
 */
export function useSupportDeskRealtime(options: {
  sessionKey: number;
  ticketNumber: string | null;
  onRefresh: (refresh: SupportRefresh) => void;
  onNotice?: (notice: SupportNotice) => void;
}) {
  const onRefreshRef = useRef(options.onRefresh);
  const onNoticeRef = useRef(options.onNotice);
  onRefreshRef.current = options.onRefresh;
  onNoticeRef.current = options.onNotice;
  const echoRef = useRef<EchoLike | null>(null);
  const handleRef = useRef<(payload: unknown) => void>(() => undefined);
  const ticketNumberRef = useRef(options.ticketNumber);
  const openTicketIdRef = useRef("");
  const ticketChannelRef = useRef("");
  ticketNumberRef.current = options.ticketNumber;
  const [ready, setReady] = useState(false);
  const { sessionKey, ticketNumber } = options;

  useEffect(() => {
    let disposed = false;
    const pending = { tickets: false, messages: false, ticket: false, number: "" };
    const notices = new Map<string, SupportNotice>();
    let timer: number | null = null;

    handleRef.current = (payload: unknown) => {
      const signal = parseSignal(payload);
      if (!signal) return;
      const openNumber = ticketNumberRef.current;
      const sameTicket =
        Boolean(openNumber) &&
        (!signal.number || signal.number === openNumber) &&
        (!signal.ticketId || !openTicketIdRef.current || signal.ticketId === openTicketIdRef.current);
      for (const section of signal.refresh) {
        if (section === "tickets") pending.tickets = true;
        if (section === "messages" && sameTicket) pending.messages = true;
        if (section === "ticket" && sameTicket) pending.ticket = true;
      }
      if (signal.number) pending.number = signal.number;
      if (shouldNotify(signal)) {
        const key = signal.number || signal.ticketId || "support";
        const previous = notices.get(key);
        notices.set(key, {
          type: signal.type,
          number: signal.number,
          ticketId: signal.ticketId,
          title: signal.title || previous?.title || "",
          body: signal.body || previous?.body || "",
          markNew: Boolean(previous?.markNew) || signal.type === "ticket.message",
        });
      }
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = null;
        const next = { ...pending };
        const queued = [...notices.values()];
        pending.tickets = false;
        pending.messages = false;
        pending.ticket = false;
        pending.number = "";
        notices.clear();
        if (next.tickets || next.messages || next.ticket) onRefreshRef.current(next);
        for (const notice of queued) onNoticeRef.current?.(notice);
      }, REFRESH_WAIT_MS);
    };

    const listener = (payload: unknown) => handleRef.current(payload);
    customerListeners.add(listener);

    async function connect() {
      if (releaseTimer !== null) {
        window.clearTimeout(releaseTimer);
        releaseTimer = null;
      }
      if (sharedSocket) {
        if (disposed) return;
        echoRef.current = sharedSocket.echo;
        setReady(true);
        return;
      }
      if (!sharedConnect) {
        sharedConnect = (async () => {
          const config = await fetchSupportRealtime();
          if (!config) return null;
          prepareSupportNoticeSound(supportNoticeSoundUrl(config));
          const echo = await createEcho(config);
          bindCustomerChannel(echo, config.customerChannel);
          sharedSocket = { sessionKey, echo };
          return echo;
        })().finally(() => {
          sharedConnect = null;
        });
      }
      const echo = await sharedConnect;
      if (!echo || disposed) return;
      echoRef.current = echo;
      setReady(true);
    }

    void connect();

    return () => {
      disposed = true;
      customerListeners.delete(listener);
      if (timer !== null) window.clearTimeout(timer);
      setReady(false);
      echoRef.current = null;
      if (customerListeners.size > 0) return;
      if (releaseTimer !== null) window.clearTimeout(releaseTimer);
      releaseTimer = window.setTimeout(() => {
        releaseTimer = null;
        if (customerListeners.size > 0) return;
        sharedSocket?.echo.disconnect();
        sharedSocket = null;
        customerBound = false;
      }, 400);
    };
  }, [sessionKey]);

  useEffect(() => {
    if (!ready || !ticketNumber) return;
    let disposed = false;

    void (async () => {
      const config = await fetchSupportRealtime(ticketNumber);
      if (disposed || !config?.ticketChannel || !echoRef.current) return;
      const channel = config.ticketChannel;
      ticketChannelRef.current = channel;
      openTicketIdRef.current = channel.startsWith("ticket.") ? channel.slice("ticket.".length) : "";
      echoRef.current.private(channel).listen(".signal", (payload) => {
        handleRef.current(payload);
      });
    })();

    return () => {
      disposed = true;
      const channel = ticketChannelRef.current;
      ticketChannelRef.current = "";
      openTicketIdRef.current = "";
      if (channel) echoRef.current?.leave(channel);
    };
  }, [ready, ticketNumber]);
}

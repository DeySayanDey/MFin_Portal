"use client";

import { useEffect } from "react";
import { showToast } from "@/components/ui/toast";

const TITLE_MAX = 120;
const BODY_MAX = 240;

export type SupportNotice = {
  type: string;
  number: string;
  ticketId: string;
  title: string;
  body: string;
  markNew: boolean;
};

/** Plain notice text. Image URLs and file bytes from the socket are dropped. */
export function noticeText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  const text = value.replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim();
  if (!text || /data:image|\/storage\//i.test(text)) return "";
  return text.slice(0, max);
}

export function clipNoticeTitle(value: unknown): string {
  return noticeText(value, TITLE_MAX);
}

export function clipNoticeBody(value: unknown): string {
  return noticeText(value, BODY_MAX);
}

let noticeAudio: HTMLAudioElement | null = null;
let soundUnlocked = false;
let noticeContext: AudioContext | null = null;

function noticeAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!noticeContext) noticeContext = new Ctor();
  return noticeContext;
}

/** In-page chime. Browsers allow this after the first click, with no remote file. */
function playNoticeChime() {
  const context = noticeAudioContext();
  if (!context) return;
  void context.resume().then(() => {
    const now = context.currentTime;
    [880, 1175].forEach((frequency, index) => {
      const tone = context.createOscillator();
      const level = context.createGain();
      const start = now + index * 0.14;
      tone.type = "sine";
      tone.frequency.value = frequency;
      level.gain.setValueAtTime(0.0001, start);
      level.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      level.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
      tone.connect(level);
      level.connect(context.destination);
      tone.start(start);
      tone.stop(start + 0.17);
    });
  }).catch(() => undefined);
}

/** Shared support notice file on the same host and port as the websocket. */
export function supportNoticeSoundUrl(config: {
  scheme: "http" | "https";
  host: string;
  port: number;
}): string {
  const port = config.port === 8094 ? 8093 : config.port;
  const omitPort =
    (config.scheme === "https" && port === 443) || (config.scheme === "http" && port === 80);
  return `${config.scheme}://${config.host}${omitPort ? "" : `:${port}`}/sounds/notice.wav`;
}

export function prepareSupportNoticeSound(url: string) {
  if (!url || noticeAudio?.src === url) return;
  const audio = new Audio(url);
  audio.preload = "auto";
  audio.volume = 1;
  noticeAudio = audio;
  if (soundUnlocked) unlockSupportNoticeSound();
}

function unlockSupportNoticeSound() {
  soundUnlocked = true;
  const context = noticeAudioContext();
  if (context) void context.resume().catch(() => undefined);
  const audio = noticeAudio;
  if (!audio) return;
  const started = audio.play();
  if (!started) return;
  void started
    .then(() => {
      audio.pause();
      audio.currentTime = 0;
    })
    .catch(() => undefined);
}

function appIcon(): string | undefined {
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"]');
  const href = link?.href?.trim() ?? "";
  if (!href || href.startsWith("data:")) return undefined;
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

/**
 * Asks for browser notification permission on the first click or tap.
 * Later signals use that choice. A visible tab never raises a system notice.
 */
export function useSupportNoticePermission() {
  useEffect(() => {
    function ask() {
      window.removeEventListener("pointerdown", ask, true);
      unlockSupportNoticeSound();
      if (typeof Notification === "undefined" || Notification.permission !== "default") return;
      void Notification.requestPermission().catch(() => undefined);
    }
    window.addEventListener("pointerdown", ask, true);
    return () => window.removeEventListener("pointerdown", ask, true);
  }, []);
}

export function presentSupportNotice(input: {
  title: string;
  body: string;
  tag: string;
  openLabel: string;
  onOpen?: () => void;
}) {
  const hidden = document.visibilityState === "hidden";
  const canNotify =
    hidden && typeof Notification !== "undefined" && Notification.permission === "granted";
  if (canNotify) {
    try {
      const popup = new Notification(input.title, {
        body: input.body || undefined,
        silent: false,
        tag: input.tag,
        icon: appIcon(),
        renotify: true,
      } as NotificationOptions);
      popup.onclick = () => {
        window.focus();
        popup.close();
        input.onOpen?.();
      };
      return;
    } catch {
      // Fall through to the in-app toast.
    }
  }
  playNoticeChime();
  showToast(input.title, "info", {
    detail: input.body || undefined,
    action: input.onOpen ? { label: input.openLabel, onClick: input.onOpen } : undefined,
  });
}

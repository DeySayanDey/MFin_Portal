"use client";

import { useSyncExternalStore } from "react";
import type { SupportNotice } from "@/features/support/services/support-notice";

export type SupportInboxItem = {
  id: string;
  number: string;
  title: string;
  body: string;
  at: number;
  unread: boolean;
};

const OPEN_EVENT = "mfin-support-open";
const MAX_ITEMS = 20;

let items: SupportInboxItem[] = [];
let queuedTicket: string | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSupportInbox(): SupportInboxItem[] {
  return useSyncExternalStore(subscribe, () => items, () => items);
}

export function supportUnreadCount(list: SupportInboxItem[]): number {
  return list.reduce((count, item) => count + (item.unread ? 1 : 0), 0);
}

export function pushSupportNotice(notice: SupportNotice) {
  const key = notice.number || notice.ticketId || `support-${Date.now()}`;
  const next: SupportInboxItem = {
    id: key,
    number: notice.number,
    title: notice.title,
    body: notice.body,
    at: Date.now(),
    unread: true,
  };
  items = [next, ...items.filter((item) => item.id !== key)].slice(0, MAX_ITEMS);
  emit();
}

/** Drops every notice for a ticket the user has opened. */
export function clearSupportNoticesForTicket(number: string) {
  const next = items.filter((item) => item.number !== number);
  if (next.length === items.length) return;
  items = next;
  emit();
}

export function markSupportNoticeRead(id: string) {
  items = items.map((item) => (item.id === id ? { ...item, unread: false } : item));
  emit();
}

export function markAllSupportNoticesRead() {
  if (!items.some((item) => item.unread)) return;
  items = items.map((item) => ({ ...item, unread: false }));
  emit();
}

export function clearSupportInbox() {
  if (items.length === 0 && queuedTicket == null) return;
  items = [];
  queuedTicket = null;
  emit();
}

export function queueOpenSupportTicket(number: string) {
  queuedTicket = number;
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<string>(OPEN_EVENT, { detail: number }));
}

export function takeQueuedSupportTicket(): string | null {
  const number = queuedTicket;
  queuedTicket = null;
  return number;
}

export function supportOpenEventName(): string {
  return OPEN_EVENT;
}

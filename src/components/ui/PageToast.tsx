"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { showToast, type ToastTone } from "@/components/ui/toast";

const MARK = "\u001f";
let toastSeq = 0;

type PageToastProps = {
  message: string | null;
  tone?: ToastTone;
};

function visibleToast(message: string): string {
  const index = message.indexOf(MARK);
  return index >= 0 ? message.slice(index + MARK.length) : message;
}

/**
 * Success text that stays unique on every save, even when the words repeat.
 * Pair with PageToast so each action gets its own toast.
 */
export function useToastText(): [
  string | null,
  (message: string | null) => void,
] {
  const [value, setValue] = useState<string | null>(null);
  const set = useCallback((message: string | null) => {
    if (!message) {
      setValue(null);
      return;
    }
    toastSeq += 1;
    setValue(`${toastSeq}${MARK}${message}`);
  }, []);
  return [value, set];
}

export type ToastNotice = { tone: ToastTone; text: string } | null;

/** Like useToastText for messages whose tone varies between success and error. */
export function useToastNotice(): [ToastNotice, (notice: ToastNotice) => void] {
  const [text, setText] = useToastText();
  const [tone, setTone] = useState<ToastTone>("success");
  const set = useCallback(
    (notice: ToastNotice) => {
      if (notice) setTone(notice.tone);
      setText(notice?.text ?? null);
    },
    [setText],
  );
  return [text ? { tone, text } : null, set];
}

/** Turns a page message into a toast. A new value always shows, including repeats. */
export function PageToast({ message, tone = "success" }: PageToastProps) {
  const seen = useRef<string | null>(null);

  useEffect(() => {
    if (!message) {
      seen.current = null;
      return;
    }
    if (seen.current === message) return;
    seen.current = message;
    showToast(visibleToast(message), tone);
  }, [message, tone]);

  return null;
}

"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import { createPortal } from "react-dom";

/** Placeholders for `pageLabel`; replaced with CSS page counters. */
export const PRINT_PAGE_TOKEN = "[[page]]";
export const PRINT_PAGES_TOKEN = "[[pages]]";

export type PrintFrameHandle = {
  print: () => void;
};

export type PrintOrientation = "landscape" | "portrait";

type PrintFrameProps = {
  title: string;
  orientation?: PrintOrientation;
  /** Footer on every printed page, such as "Page [[page]] of [[pages]]". */
  pageLabel?: string;
  children: ReactNode;
  className?: string;
  /** Called once styles, fonts and images are loaded and the content can be printed. */
  onReady?: () => void;
  /** Called once the print dialog closes. */
  onAfterPrint?: () => void;
  ref?: Ref<PrintFrameHandle>;
};

const FRAME_DOC = "<!doctype html><html><head></head><body></body></html>";
const PAGE_MARGIN = "14mm 12mm 16mm";

function cssString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\r\n]+/g, " ")}"`;
}

function pageCss(orientation: PrintOrientation, pageLabel?: string): string {
  const size = `A4 ${orientation}`;
  if (!pageLabel) return `@page { size: ${size}; margin: ${PAGE_MARGIN}; }`;
  const content = pageLabel
    .split(/(\[\[page\]\]|\[\[pages\]\])/)
    .filter(Boolean)
    .map((part) =>
      part === PRINT_PAGE_TOKEN
        ? "counter(page)"
        : part === PRINT_PAGES_TOKEN
          ? "counter(pages)"
          : cssString(part),
    )
    .join(" ");
  return `@page { size: ${size}; margin: ${PAGE_MARGIN}; @bottom-right { content: ${content}; font-size: 9pt; } }`;
}

/** Copies the app stylesheets so print content can use the same tokens and utilities. */
function copyStyles(target: Document): Promise<void>[] {
  const pending: Promise<void>[] = [];
  document.head
    .querySelectorAll<HTMLElement>('link[rel="stylesheet"], style')
    .forEach((node) => {
      const clone = target.importNode(node, true);
      if (clone.tagName === "LINK") {
        pending.push(
          new Promise((resolve) => {
            clone.addEventListener("load", () => resolve(), { once: true });
            clone.addEventListener("error", () => resolve(), { once: true });
          }),
        );
      }
      target.head.appendChild(clone);
    });
  return pending;
}

/**
 * Renders children into an iframe that doubles as a preview and as the
 * print target, always in the light theme.
 */
export function PrintFrame({
  title,
  orientation = "landscape",
  pageLabel,
  children,
  className = "",
  onReady,
  onAfterPrint,
  ref,
}: PrintFrameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const onReadyRef = useRef(onReady);
  const onAfterPrintRef = useRef(onAfterPrint);
  const [body, setBody] = useState<HTMLElement | null>(null);

  useEffect(() => {
    onReadyRef.current = onReady;
    onAfterPrintRef.current = onAfterPrint;
  }, [onReady, onAfterPrint]);

  useImperativeHandle(
    ref,
    () => ({
      print: () => {
        const win = frameRef.current?.contentWindow;
        if (!win) return;
        win.addEventListener("afterprint", () => onAfterPrintRef.current?.(), { once: true });
        win.focus();
        win.print();
      },
    }),
    [],
  );

  async function handleLoad() {
    const doc = frameRef.current?.contentDocument;
    if (!doc) return;
    const root = document.documentElement;
    doc.title = title;
    doc.documentElement.lang = root.lang;
    doc.documentElement.dir = root.dir || "ltr";
    doc.documentElement.className = Array.from(root.classList)
      .filter((name) => name !== "dark")
      .join(" ");
    doc.body.className = document.body.className;
    const page = doc.createElement("style");
    page.textContent = `${pageCss(orientation, pageLabel)} html, body { height: auto; overflow: visible; background: var(--surface); }`;
    const loads = copyStyles(doc);
    doc.head.appendChild(page);
    await Promise.all(loads);
    setBody(doc.body);
  }

  useEffect(() => {
    const doc = frameRef.current?.contentDocument;
    if (!body || !doc) return;
    let cancelled = false;
    const images = Array.from(doc.images).map((image) => image.decode().catch(() => undefined));
    void Promise.all([...images, doc.fonts.ready]).then(() => {
      if (!cancelled) onReadyRef.current?.();
    });
    return () => {
      cancelled = true;
    };
  }, [body]);

  return (
    <>
      <iframe
        ref={frameRef}
        title={title}
        srcDoc={FRAME_DOC}
        onLoad={() => void handleLoad()}
        className={className}
      />
      {body ? createPortal(children, body) : null}
    </>
  );
}

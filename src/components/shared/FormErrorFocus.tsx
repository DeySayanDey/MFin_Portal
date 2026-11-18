"use client";

import { useEffect } from "react";

/** Focus client-side field errors after a form's submit handler renders them. */
export function FormErrorFocus() {
  useEffect(() => {
    const timers = new Set<number>();

    function onSubmit(event: SubmitEvent) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      const timer = window.setTimeout(() => {
        timers.delete(timer);
        if (!form.isConnected) return;
        const field = Array.from(
          form.querySelectorAll<HTMLElement>('[aria-invalid="true"]:not([disabled])'),
        ).find((element) => element.getClientRects().length > 0);
        if (!field) return;
        field.focus({ preventScroll: true });
        field.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
      timers.add(timer);
    }

    document.addEventListener("submit", onSubmit);
    return () => {
      document.removeEventListener("submit", onSubmit);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return null;
}

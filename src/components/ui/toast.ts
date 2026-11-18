export type ToastTone = "success" | "error" | "info" | "warning";

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastOptions = {
  detail?: string;
  action?: ToastAction;
};

export type ToastItem = {
  id: number;
  message: string;
  detail?: string;
  action?: ToastAction;
  tone: ToastTone;
  leaving: boolean;
};

const listeners = new Set<() => void>();
let items: ToastItem[] = [];
let nextId = 1;

function emit() {
  for (const listener of listeners) listener();
}

export function getToasts(): ToastItem[] {
  return items;
}

export function subscribeToasts(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const TOAST_DURATION_MS = 4200;
export const TOAST_LEAVE_MS = 480;

export function dismissToast(id: number) {
  const current = items.find((item) => item.id === id);
  if (!current || current.leaving) return;
  items = items.map((item) => (item.id === id ? { ...item, leaving: true } : item));
  emit();
  window.setTimeout(() => {
    items = items.filter((item) => item.id !== id);
    emit();
  }, TOAST_LEAVE_MS);
}

export function showToast(message: string, tone: ToastTone = "success", options?: ToastOptions) {
  const id = nextId++;
  items = [
    ...items,
    {
      id,
      message,
      detail: options?.detail,
      action: options?.action,
      tone,
      leaving: false,
    },
  ];
  emit();
  window.setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
  return id;
}

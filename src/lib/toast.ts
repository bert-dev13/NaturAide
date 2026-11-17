/**
 * Imperative NaturAide notification API.
 * Backed by AppNotificationProvider — toasts float fixed and never shift page layout.
 */

export type ToastType = "success" | "error" | "warning" | "info";

export type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
  createdAt: number;
};

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** destructive = rose confirm button */
  variant?: "default" | "destructive";
};

type ToastListener = (toasts: ToastItem[]) => void;
type ConfirmRequest = ConfirmOptions & {
  id: string;
  resolve: (confirmed: boolean) => void;
};
type ConfirmListener = (request: ConfirmRequest | null) => void;

const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 2000,
  info: 3000,
  warning: 3500,
  error: 4500,
};

const MAX_TOASTS = 4;
const DEDUPE_WINDOW_MS = 1800;

let toasts: ToastItem[] = [];
const toastListeners = new Set<ToastListener>();
let confirmRequest: ConfirmRequest | null = null;
const confirmListeners = new Set<ConfirmListener>();
let idCounter = 0;

function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

function emitToasts() {
  const snapshot = [...toasts];
  toastListeners.forEach((listener) => listener(snapshot));
}

function emitConfirm() {
  confirmListeners.forEach((listener) => listener(confirmRequest));
}

export function subscribeToasts(listener: ToastListener): () => void {
  toastListeners.add(listener);
  listener([...toasts]);
  return () => {
    toastListeners.delete(listener);
  };
}

export function subscribeConfirm(listener: ConfirmListener): () => void {
  confirmListeners.add(listener);
  listener(confirmRequest);
  return () => {
    confirmListeners.delete(listener);
  };
}

export function dismissToast(id: string) {
  const next = toasts.filter((t) => t.id !== id);
  if (next.length === toasts.length) return;
  toasts = next;
  emitToasts();
}

export function clearToasts() {
  if (toasts.length === 0) return;
  toasts = [];
  emitToasts();
}

/**
 * Show a floating toast. Does not affect document flow / page layout.
 * Duplicate messages of the same type within a short window are coalesced.
 */
export function showToast(
  message: string,
  type: ToastType = "success",
  options?: { duration?: number }
) {
  const text = String(message || "").trim();
  if (!text) return;

  const now = Date.now();
  const existing = toasts.find(
    (t) =>
      t.type === type &&
      t.message === text &&
      now - t.createdAt < DEDUPE_WINDOW_MS
  );
  if (existing) {
    // Refresh position to top of stack without creating a duplicate
    toasts = [
      { ...existing, createdAt: now, duration: options?.duration ?? existing.duration },
      ...toasts.filter((t) => t.id !== existing.id),
    ].slice(0, MAX_TOASTS);
    emitToasts();
    return existing.id;
  }

  const item: ToastItem = {
    id: nextId("toast"),
    type,
    message: text,
    duration: options?.duration ?? DEFAULT_DURATION[type],
    createdAt: now,
  };
  toasts = [item, ...toasts].slice(0, MAX_TOASTS);
  emitToasts();
  return item.id;
}

export function toastSuccess(message: string, duration?: number) {
  return showToast(message, "success", duration != null ? { duration } : undefined);
}

export function toastError(message: string, duration?: number) {
  return showToast(message, "error", duration != null ? { duration } : undefined);
}

export function toastWarning(message: string, duration?: number) {
  return showToast(message, "warning", duration != null ? { duration } : undefined);
}

export function toastInfo(message: string, duration?: number) {
  return showToast(message, "info", duration != null ? { duration } : undefined);
}

/**
 * Custom confirmation modal (replaces window.confirm).
 * Resolves true on Confirm, false on Cancel / dismiss.
 */
export function confirmAction(options: ConfirmOptions | string): Promise<boolean> {
  const opts: ConfirmOptions =
    typeof options === "string" ? { message: options } : options;

  // If a confirm is already open, reject the previous one as cancelled
  if (confirmRequest) {
    confirmRequest.resolve(false);
  }

  return new Promise<boolean>((resolve) => {
    confirmRequest = {
      id: nextId("confirm"),
      title: opts.title || "Confirm action",
      message: opts.message,
      confirmLabel: opts.confirmLabel || "Confirm",
      cancelLabel: opts.cancelLabel || "Cancel",
      variant: opts.variant || "default",
      resolve: (value) => {
        confirmRequest = null;
        emitConfirm();
        resolve(value);
      },
    };
    emitConfirm();
  });
}

export function resolveConfirm(confirmed: boolean) {
  if (!confirmRequest) return;
  const req = confirmRequest;
  confirmRequest = null;
  emitConfirm();
  req.resolve(confirmed);
}

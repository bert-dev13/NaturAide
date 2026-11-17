"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
  AlertCircle,
} from "lucide-react";
import {
  subscribeToasts,
  subscribeConfirm,
  dismissToast,
  resolveConfirm,
  type ToastItem,
  type ToastType,
} from "@/lib/toast";

const TYPE_STYLES: Record<
  ToastType,
  { wrap: string; icon: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  success: {
    wrap: "border-emerald-200 bg-white text-emerald-950",
    icon: "bg-emerald-100 text-emerald-700",
    Icon: CheckCircle2,
  },
  error: {
    wrap: "border-rose-200 bg-white text-rose-950",
    icon: "bg-rose-100 text-rose-700",
    Icon: XCircle,
  },
  warning: {
    wrap: "border-amber-200 bg-white text-amber-950",
    icon: "bg-amber-100 text-amber-800",
    Icon: AlertTriangle,
  },
  info: {
    wrap: "border-sky-200 bg-white text-sky-950",
    icon: "bg-sky-100 text-sky-700",
    Icon: Info,
  },
};

function ToastCard({ toast }: { toast: ToastItem }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const styles = TYPE_STYLES[toast.type];
  const Icon = styles.Icon;

  useEffect(() => {
    const enter = requestAnimationFrame(() => setVisible(true));
    const timer = window.setTimeout(() => {
      setLeaving(true);
      window.setTimeout(() => dismissToast(toast.id), 220);
    }, Math.max(1200, toast.duration));

    return () => {
      cancelAnimationFrame(enter);
      window.clearTimeout(timer);
    };
  }, [toast.id, toast.duration]);

  const handleClose = () => {
    setLeaving(true);
    window.setTimeout(() => dismissToast(toast.id), 180);
  };

  return (
    <div
      role={toast.type === "error" || toast.type === "warning" ? "alert" : "status"}
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      className={`pointer-events-auto flex w-[min(22rem,calc(100vw-1.5rem))] items-start gap-2.5 rounded-xl border px-3 py-2.5 shadow-[0_12px_32px_-16px_rgba(15,44,32,0.45)] transition-all duration-200 ${styles.wrap} ${
        visible && !leaving
          ? "translate-y-0 opacity-100"
          : "-translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      }`}
    >
      <span
        className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${styles.icon}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className="min-w-0 flex-1 pt-0.5 text-[13px] font-medium leading-snug">
        {toast.message}
      </p>
      <button
        type="button"
        onClick={handleClose}
        className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

type ConfirmState = {
  id: string;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  resolve: (confirmed: boolean) => void;
};

function ConfirmModal({ request }: { request: ConfirmState }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") resolveConfirm(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [request.id]);

  const destructive = request.variant === "destructive";

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Dismiss confirmation"
        className="absolute inset-0 bg-[#0f2c20]/45 backdrop-blur-[2px]"
        onClick={() => resolveConfirm(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`confirm-title-${request.id}`}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
          <span
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              destructive
                ? "bg-rose-100 text-rose-700"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            <AlertCircle className="h-5 w-5" />
          </span>
          <div className="min-w-0 pt-0.5">
            <h2
              id={`confirm-title-${request.id}`}
              className="text-sm font-bold text-slate-900"
            >
              {request.title || "Confirm action"}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {request.message}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 bg-slate-50/80 px-5 py-3.5">
          <button
            type="button"
            onClick={() => resolveConfirm(false)}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            {request.cancelLabel || "Cancel"}
          </button>
          <button
            type="button"
            onClick={() => resolveConfirm(true)}
            className={`rounded-lg px-3.5 py-2 text-xs font-bold text-white transition ${
              destructive
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-emerald-700 hover:bg-emerald-800"
            }`}
          >
            {request.confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Mount once in the root layout. Renders fixed toasts + confirmation modal.
 * Never participates in normal document flow of page content.
 */
export default function AppNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  useEffect(() => {
    const unsubToast = subscribeToasts(setToasts);
    const unsubConfirm = subscribeConfirm((req) => {
      setConfirm(req as ConfirmState | null);
    });
    return () => {
      unsubToast();
      unsubConfirm();
    };
  }, []);

  return (
    <>
      {children}

      {/* Fixed toast viewport — does not affect page layout */}
      <div
        aria-live="polite"
        aria-relevant="additions text"
        className="pointer-events-none fixed inset-x-0 top-3 z-[9999] flex flex-col items-center gap-2 px-3 sm:inset-x-auto sm:right-4 sm:top-4 sm:items-end sm:px-0"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} />
        ))}
      </div>

      {confirm ? <ConfirmModal request={confirm} /> : null}
    </>
  );
}

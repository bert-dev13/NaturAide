"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, ExternalLink, X } from "lucide-react";
import { FDA_VERIFICATION_PORTAL_URL } from "@/lib/regulatory-verification";

interface VerifyOnFdaPhilippinesProps {
  registrationNumber: string;
  regulatoryAgency: string | null;
}

const VERIFY_STEPS = [
  "Copy the registration number above.",
  "Open the official FDA Verification Portal.",
  "Paste/search the registration number in the portal.",
  "Confirm that the returned product name and manufacturer match the NaturAide record.",
];

export default function VerifyOnFdaPhilippines({
  registrationNumber,
  regulatoryAgency,
}: VerifyOnFdaPhilippinesProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
      >
        <span>Verify on FDA Philippines</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </button>
      {open && (
        <FdaVerificationModal
          registrationNumber={registrationNumber}
          regulatoryAgency={regulatoryAgency}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function copyTextSync(value: string) {
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.top = "0";
  field.style.left = "0";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.focus();
  field.select();
  field.setSelectionRange(0, value.length);
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  field.remove();
  return copied;
}

async function copyText(value: string) {
  if (copyTextSync(value)) return true;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function FdaVerificationModal({
  registrationNumber,
  regulatoryAgency,
  onClose,
}: {
  registrationNumber: string;
  regulatoryAgency: string | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const [numberCopied, setNumberCopied] = useState(false);
  const [openedNotice, setOpenedNotice] = useState(false);
  const [copyError, setCopyError] = useState(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    dialog?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      const focusable = [...dialog.querySelectorAll<HTMLElement>("button, [href], [tabindex]:not([tabindex='-1'])")].filter(
        (element) => !element.hasAttribute("disabled")
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  const copyRegistrationNumber = async () => {
    const copied = await copyText(registrationNumber);
    setNumberCopied(copied);
    return copied;
  };

  const copyAndOpenPortal = () => {
    const clipboardWrite = navigator.clipboard?.writeText(registrationNumber);
    const copiedNow = copyTextSync(registrationNumber);
    window.open(FDA_VERIFICATION_PORTAL_URL, "_blank", "noopener,noreferrer");
    if (copiedNow) {
      setNumberCopied(true);
      setOpenedNotice(true);
      setCopyError(false);
      return;
    }
    if (!clipboardWrite) {
      setCopyError(true);
      return;
    }
    void clipboardWrite.then(() => {
      setNumberCopied(true);
      setOpenedNotice(true);
      setCopyError(false);
    }).catch(() => {
      setCopyError(true);
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-[#091a13]/55 p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="relative flex max-h-[85vh] w-full max-w-md flex-col overflow-y-auto rounded-3xl border border-[#dce6df] bg-[#fdfcf9] text-[#143d2b] shadow-2xl shadow-[#0f2c20]/25 outline-none"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#e2ebe4] bg-[#faf8f4] px-5 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#15803d]">NaturAide</p>
            <h2 id={titleId} className="font-heading text-xl font-extrabold tracking-tight mt-1">
              Verify with FDA Philippines
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#52796f] hover:bg-[#e7f0ea] hover:text-[#143d2b] cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-4 px-5 py-5">
          <div className="rounded-2xl border border-[#dde6df] bg-[#faf9f5] px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#78997f]">Registration Number</p>
                <p className="mt-1 break-all font-mono text-base font-bold text-teal-900">{registrationNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => void copyRegistrationNumber()}
                className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[#c5d7cb] bg-white px-3 text-xs font-bold text-[#143d2b] hover:bg-[#f3f8f4] cursor-pointer"
              >
                {numberCopied ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{numberCopied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {regulatoryAgency && (
            <div className="rounded-2xl border border-[#dde6df] bg-[#faf9f5] px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#78997f]">Regulatory Agency</p>
              <p className="mt-1 text-sm font-bold text-[#0f2c20]">{regulatoryAgency}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-bold text-[#0f2c20]">How to verify</p>
            <ol className="mt-2 space-y-1.5 text-sm leading-relaxed text-[#4a5a50]">
              {VERIFY_STEPS.map((step, index) => (
                <li key={step} className="flex gap-2">
                  <span className="font-bold text-[#15803d]">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={copyAndOpenPortal}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#0f2c20] px-4 text-sm font-bold text-white hover:bg-[#164533] cursor-pointer"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Copy Number &amp; Open FDA Portal</span>
            </button>
            {openedNotice && (
              <p className="text-center text-sm font-semibold text-emerald-800" role="status">
                Registration number copied
              </p>
            )}
            {copyError && (
              <p className="text-center text-sm font-semibold text-amber-800" role="status">
                The number could not be copied automatically. Select it above and copy it, then search in the portal.
              </p>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#c5d7cb] bg-white px-4 text-sm font-bold text-[#143d2b] hover:bg-[#f3f8f4] cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

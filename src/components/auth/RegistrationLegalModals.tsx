"use client";

import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export type RegistrationLegalNotice = "terms" | "privacy";

interface Section {
  heading: string;
  paragraphs: string[];
}

const TERMS_SECTIONS: Section[] = [
  {
    heading: "Educational and research purpose",
    paragraphs: [
      "NaturAide is an educational platform for learning about documented traditional plants, preparation methods, and published botanical research. Community accounts are for personal learning.",
      "Public registration creates a Community account only. Researcher and Reviewer access is issued separately and cannot be chosen on this form.",
    ],
  },
  {
    heading: "Not a medical diagnosis or treatment",
    paragraphs: [
      "NaturAide does not diagnose, treat, cure, or prevent any condition. Nothing on the platform is a prescription, a clinical consultation, or a substitute for care from a qualified professional.",
      "Stop using a preparation and seek local medical care if you feel unwell, if symptoms worsen, or if you need advice about a medicine you already take.",
    ],
  },
  {
    heading: "Your account",
    paragraphs: [
      "You agree to give your own name and a current email address, and to keep your password private. You are responsible for activity that happens while your session is signed in.",
      "One person should use one account. Do not share your password or create an account for someone else without their knowledge.",
    ],
  },
  {
    heading: "Acceptable use",
    paragraphs: [
      "Use NaturAide to read plant information, save guides for your own reference, and ask educational questions. Do not use the service to harm others, upload unlawful material, probe accounts that are not yours, or present NaturAide text as personalized medical advice.",
      "Do not copy NaturAide content in a way that removes its safety limits or presents it as a commercial medical claim.",
    ],
  },
  {
    heading: "Health screening limitations",
    paragraphs: [
      "After registration you complete a health screening once. That screening applies fixed safety rules. It is not a medical examination, and it does not confirm that a plant or product is safe for you.",
      "A result of Eligible to Continue only means no configured stop-rule was triggered. A result of Professional Guidance Required limits recommendation-oriented herbal guidance. Either result can be incomplete if your answers were incomplete.",
    ],
  },
  {
    heading: "Ask NaturAide limitations",
    paragraphs: [
      "Ask NaturAide is an educational assistant. It can explain documented uses, preparations, and precautions. It can be wrong, incomplete, or out of date.",
      "Do not use an assistant reply to decide a dose, to stop a prescribed medicine, or to handle an emergency. Emergencies belong with local emergency services or a clinic.",
    ],
  },
  {
    heading: "Information accuracy",
    paragraphs: [
      "Plant profiles, preparation guides, and product references are compiled from traditional knowledge and published sources. They can contain gaps, naming differences, or later corrections.",
      "NaturAide may update or remove content when safety information changes. You should check important details with a qualified professional before you act on them.",
    ],
  },
];

const PRIVACY_SECTIONS: Section[] = [
  {
    heading: "Personal information",
    paragraphs: [
      "When you create a Community account, NaturAide stores your first name, last name, email address, and a password hash. The password is hashed with bcrypt and is never stored as plain text.",
      "Your sign-in session is kept in an HTTP-only cookie. NaturAide does not use browser local storage as the source of authentication.",
    ],
  },
  {
    heading: "Health screening data",
    paragraphs: [
      "Registration does not create health-screening answers. Screening responses are saved only after you submit the screening form.",
      "Those answers are used to apply the community safety rules and to remember that you already completed screening, so the same form is not started again on a later visit.",
    ],
  },
  {
    heading: "Saved guides and activity",
    paragraphs: [
      "If you save a plant, preparation guide, or product, NaturAide stores that choice with your account so you can open it later. Recently viewed items may also be stored so the community home can show what you looked at.",
      "You can remove saved items from your account. Removing a save does not delete the public plant or product record.",
    ],
  },
  {
    heading: "Location permission for Facility Finder",
    paragraphs: [
      "Facility Finder can ask your browser for location permission so it can show nearby healthcare facilities. Location is used for that search.",
      "You can refuse the browser permission. Facility Finder still opens, and you can look for facilities without sharing your position.",
    ],
  },
  {
    heading: "How information is used",
    paragraphs: [
      "Account details are used to sign you in, apply your Community role, remember screening status, and show the guides you saved.",
      "NaturAide does not sell your account information. Existing Researcher and Reviewer accounts are not changed by Community registration.",
    ],
  },
  {
    heading: "Data security",
    paragraphs: [
      "Passwords are stored only as hashes. Session cookies are marked HTTP-only so page scripts cannot read them. Access to community features requires that session.",
      "No online service can promise perfect security. Use a unique password and sign out on a shared device.",
    ],
  },
  {
    heading: "Your rights",
    paragraphs: [
      "You can review and update your name from your community profile. You can ask NaturAide to correct account details that are wrong.",
      "You may stop using the service at any time. Signing out ends the session in this browser. A request to close an account should be sent from the email address on the account.",
    ],
  },
  {
    heading: "Consent",
    paragraphs: [
      "The registration checkbox is the consent control. Opening this notice does not, by itself, accept the Terms of Use or this Privacy Policy.",
      "If you create an account, you confirm that you have read both notices and that you agree to them.",
    ],
  },
];

const NOTICES: Record<RegistrationLegalNotice, { title: string; intro: string; sections: Section[] }> = {
  terms: {
    title: "Terms of Use",
    intro: "These terms explain what a NaturAide Community account is for, and the limits of the guidance you will see.",
    sections: TERMS_SECTIONS,
  },
  privacy: {
    title: "Privacy Policy",
    intro: "This notice explains what a Community account stores, why it is stored, and the choices you have.",
    sections: PRIVACY_SECTIONS,
  },
};

interface RegistrationLegalModalProps {
  notice: RegistrationLegalNotice | null;
  onClose: () => void;
}

export default function RegistrationLegalModal({ notice, onClose }: RegistrationLegalModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const open = notice !== null;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

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
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const documentNotice = NOTICES[notice];

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
        className="relative flex w-full max-w-xl max-h-[85vh] flex-col overflow-hidden rounded-3xl border border-[#dce6df] bg-[#fdfcf9] text-[#143d2b] shadow-2xl shadow-[#0f2c20]/25 outline-none"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#e2ebe4] bg-[#faf8f4] px-5 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#15803d]">NatureAide</p>
            <h2 id={titleId} className="font-heading text-2xl font-extrabold tracking-tight mt-1">
              {documentNotice.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#d6e3da] bg-white text-[#143d2b] hover:bg-[#f1f5f2]"
            aria-label={`Close ${documentNotice.title}`}
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <p className="text-sm leading-relaxed text-[#4a5a50]">{documentNotice.intro}</p>
          <div className="mt-5 space-y-5">
            {documentNotice.sections.map((section) => (
              <section key={section.heading}>
                <h3 className="font-heading text-base font-bold text-[#143d2b]">{section.heading}</h3>
                <div className="mt-2 space-y-2">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-relaxed text-[#4a5a50]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <footer className="border-t border-[#e2ebe4] bg-white px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 w-full rounded-full bg-[#143d2b] px-6 text-sm font-semibold text-white hover:bg-[#1b533a]"
          >
            I Understand
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}

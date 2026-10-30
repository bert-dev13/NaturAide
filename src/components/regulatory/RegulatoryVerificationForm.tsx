"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink } from "lucide-react";
import {
  FDA_VERIFICATION_PORTAL_URL,
  REGULATORY_VERIFICATION_DISCLAIMER,
  REGULATORY_VERIFICATION_METHODS,
  type RegulatoryVerificationMethod,
  type RegulatoryVerificationStatus,
} from "@/lib/regulatory-verification";

interface RegulatoryFormProduct {
  slug: string;
  name: string;
  manufacturer: string;
  regulatoryId: number | null;
  registrationNumber: string | null;
  regulatoryAgency: string | null;
  registrationStatus: string | null;
  classification: string | null;
  verificationSource: string | null;
  verificationUrl: string | null;
}

const CHECKS = [
  { key: "registrationNumberMatches", label: "Registration number matches" },
  { key: "productNameMatches", label: "Product name matches" },
  { key: "manufacturerMatches", label: "Manufacturer matches" },
  { key: "regulatoryInformationMatches", label: "Regulatory information matches the official record" },
] as const;

type CheckKey = (typeof CHECKS)[number]["key"];

function copyTextSync(value: string): boolean {
  const area = document.createElement("textarea");
  area.value = value;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  document.body.removeChild(area);
  return copied;
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <span className="block text-[11px] font-medium text-[#78997f]">{label}</span>
      <strong className="text-sm text-[#0f2c20]">{value?.trim() || "Not recorded"}</strong>
    </div>
  );
}

export default function RegulatoryVerificationForm({ product }: { product: RegulatoryFormProduct }) {
  const router = useRouter();
  const [checks, setChecks] = useState<Record<CheckKey, boolean>>({
    registrationNumberMatches: false,
    productNameMatches: false,
    manufacturerMatches: false,
    regulatoryInformationMatches: false,
  });
  const [status, setStatus] = useState<RegulatoryVerificationStatus | "">("");
  const [method, setMethod] = useState<RegulatoryVerificationMethod | "">("");
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const allConfirmed = CHECKS.every((check) => checks[check.key]);
  const registrationNumber = product.registrationNumber?.trim() || "";
  const canVerify = Boolean(product.regulatoryId) && Boolean(registrationNumber) && allConfirmed;

  const copyNumber = async () => {
    if (!registrationNumber) return;
    let ok = copyTextSync(registrationNumber);
    if (!ok) {
      try {
        await navigator.clipboard.writeText(registrationNumber);
        ok = true;
      } catch {
        ok = false;
      }
    }
    setCopied(ok);
    setCopyError(!ok);
  };

  const toggleCheck = (key: CheckKey) => {
    setChecks((current) => {
      const next = { ...current, [key]: !current[key] };
      const stillComplete = CHECKS.every((check) => next[check.key]);
      if (!stillComplete && status === "VERIFIED") setStatus("");
      return next;
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!status) {
      setError("Choose a verification status.");
      return;
    }
    if (!method) {
      setError("Choose a verification method.");
      return;
    }
    if (status === "VERIFIED" && !canVerify) {
      setError("VERIFIED is available only after every required check is confirmed.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/regulatory/products/${encodeURIComponent(product.slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, method, notes, ...checks }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "The verification could not be saved.");
        return;
      }
      setMessage(
        status === "VERIFIED"
          ? "Regulatory record marked verified. The earlier verification history was kept."
          : "Verification decision saved. The product was not marked verified."
      );
      setChecks({
        registrationNumberMatches: false,
        productNameMatches: false,
        manufacturerMatches: false,
        regulatoryInformationMatches: false,
      });
      setStatus("");
      setNotes("");
      router.refresh();
    } catch {
      setError("The verification could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-[#dde6df] bg-[#faf9f5] p-4">
        <Field label="Product Name" value={product.name} />
        <Field label="Manufacturer" value={product.manufacturer} />
        <Field label="Registration Number" value={product.registrationNumber} />
        <Field label="Regulatory Agency" value={product.regulatoryAgency} />
        <Field label="Registration Status" value={product.registrationStatus} />
        <Field label="Classification" value={product.classification} />
        <Field label="Verification Source" value={product.verificationSource} />
        <Field label="Source URL" value={product.verificationUrl} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyNumber}
          disabled={!registrationNumber}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#dde6df] bg-white px-3 py-2 text-xs font-bold text-[#0f2c20] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
          <span>Copy Registration Number</span>
        </button>
        <a
          href={FDA_VERIFICATION_PORTAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f2c20] px-3 py-2 text-xs font-bold text-white"
        >
          <span>Open FDA Verification Portal</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      {copyError && (
        <p className="text-xs text-amber-800">The number could not be copied automatically. Select it above and copy it.</p>
      )}

      <fieldset className="space-y-2" disabled={!product.regulatoryId}>
        <legend className="text-sm font-extrabold text-[#0f2c20]">Confirm against the official record</legend>
        {CHECKS.map((check) => (
          <label key={check.key} className="flex items-start gap-2 text-sm text-[#0f2c20]">
            <input
              type="checkbox"
              checked={checks[check.key]}
              onChange={() => toggleCheck(check.key)}
              className="mt-1"
            />
            <span>{check.label}</span>
          </label>
        ))}
      </fieldset>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="space-y-1 text-sm">
          <span className="font-bold text-[#0f2c20]">Verification Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as RegulatoryVerificationStatus | "")}
            className="w-full rounded-xl border border-[#dde6df] bg-white px-3 py-2"
            required
          >
            <option value="">Select a status</option>
            <option value="UNVERIFIED">Leave unverified</option>
            <option value="NEEDS_REVERIFICATION">Needs re-verification</option>
            <option value="VERIFIED" disabled={!canVerify}>
              Verified
            </option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-bold text-[#0f2c20]">Verification Method</span>
          <select
            value={method}
            onChange={(event) => setMethod(event.target.value as RegulatoryVerificationMethod | "")}
            className="w-full rounded-xl border border-[#dde6df] bg-white px-3 py-2"
            required
          >
            <option value="">Select a method</option>
            {REGULATORY_VERIFICATION_METHODS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-xs text-[#52796f]">Verified can be selected only when all four checks are confirmed and a registration number is already recorded.</p>

      <label className="block space-y-1 text-sm">
        <span className="font-bold text-[#0f2c20]">Reviewer notes (optional)</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={2000}
          rows={4}
          className="w-full rounded-xl border border-[#dde6df] bg-white px-3 py-2"
        />
      </label>

      <p className="text-xs leading-relaxed text-[#52796f]">{REGULATORY_VERIFICATION_DISCLAIMER}</p>

      {!product.regulatoryId && (
        <p className="text-sm text-amber-800">This product has no regulatory record, so it cannot be verified from this screen.</p>
      )}
      {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
      {message && <p className="text-sm font-semibold text-emerald-800">{message}</p>}

      <button
        type="submit"
        disabled={saving || !product.regulatoryId}
        className="rounded-xl bg-[#0f2c20] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save verification decision"}
      </button>
    </form>
  );
}

import React from "react";
import { ShieldAlert, HeartPulse } from "lucide-react";

interface SafetyNoticeProps {
  compact?: boolean;
}

export default function SafetyNotice({ compact = false }: SafetyNoticeProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-950 text-xs sm:text-sm">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
        <p className="leading-snug">
          <strong>Safety First:</strong> Herbal remedies may not be suitable for everyone. Always review precautions.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-200/90 text-amber-950 shadow-2xs space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <h4 className="font-heading font-extrabold text-sm sm:text-base text-amber-950">
          Herbal Safety Reminder
        </h4>
      </div>

      <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed pl-10">
        NaturAide provides educational and evidence-based information and is not intended to diagnose medical conditions, prescribe treatment, or replace professional medical care.
      </p>
    </div>
  );
}

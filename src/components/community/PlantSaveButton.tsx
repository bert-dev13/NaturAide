"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { Bookmark2DIcon } from "./CommunityIcons2D";
import { toastSuccess } from "@/lib/toast";

export default function PlantSaveButton({
  plantId,
  initialSaved = false,
  className = "",
}: {
  plantId: string;
  initialSaved?: boolean;
  className?: string;
}) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/community/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "plant", id: plantId }),
      });
      const data = await res.json();
      if (data.success) {
        setIsSaved(data.saved);
        toastSuccess(data.saved ? "Saved to My Guide" : "Removed from Saved");
      }
    } catch (err) {
      console.error("Failed to toggle save:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={handleToggle}
        disabled={loading}
        title={isSaved ? "Saved in My Guide" : "Save to My Guide"}
        aria-label={isSaved ? "Saved in My Guide" : "Save to My Guide"}
        className={
          className ||
          `inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs ${
            isSaved
              ? "bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100"
              : "bg-white text-[#2c4e3f] border border-[#dde6df] hover:border-emerald-400"
          }`
        }
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
        ) : (
          <Bookmark2DIcon size={18} isSaved={isSaved} />
        )}
        <span>{isSaved ? "Saved" : "Save Guide"}</span>
      </button>

    </div>
  );
}

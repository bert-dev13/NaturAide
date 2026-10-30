"use client";

import React, { useState } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";

export default function PlantSaveButton({
  plantId,
  initialSaved = false,
}: {
  plantId: string;
  initialSaved?: boolean;
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
      }
    } catch (err) {
      console.error("Failed to toggle save:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer ${
        isSaved
          ? "bg-[#16a34a] text-white hover:bg-[#15803d]"
          : "bg-white text-[#1e5c44] border border-[#dde6df] hover:border-[#16a34a]"
      }`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isSaved ? (
        <BookmarkCheck className="w-4 h-4" />
      ) : (
        <Bookmark className="w-4 h-4" />
      )}
      <span>{isSaved ? "Saved to My Guide" : "Save to My Herbal Guide"}</span>
    </button>
  );
}

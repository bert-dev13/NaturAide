"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "natureaide:user-profile";
export const PROFILE_UPDATED_EVENT = "natureaide:user-profile-updated";

export type ProfileNameDetail = {
  name?: string;
  firstName?: string;
  lastName?: string;
};

function buildFullName(detail: ProfileNameDetail, fallback = ""): string {
  const fromParts = `${detail.firstName || ""} ${detail.lastName || ""}`.trim();
  return (detail.name || fromParts || fallback).trim();
}

function greetingFromDetail(detail: ProfileNameDetail, fallbackFullName: string): string {
  const first = (detail.firstName || "").trim();
  if (first) {
    return first.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.)\s+/i, "").trim() || first;
  }
  const full = buildFullName(detail, fallbackFullName);
  const token = full.split(/\s+/)[0] || "";
  return token.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.)\s*/i, "").trim() || full || "Researcher";
}

/** Persist + broadcast so header, sidebar, dashboard, and other tabs stay in sync. */
export function broadcastProfileNameUpdate(detail: ProfileNameDetail) {
  const name = buildFullName(detail);
  const payload = {
    name,
    firstName: (detail.firstName || "").trim(),
    lastName: (detail.lastName || "").trim(),
    at: Date.now(),
  };

  if (typeof window === "undefined") return payload;

  window.dispatchEvent(
    new CustomEvent(PROFILE_UPDATED_EVENT, {
      detail: payload,
    })
  );

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }

  return payload;
}

/**
 * Live display name for chrome (header / sidebar / dashboard).
 * Updates immediately on profile save and across tabs.
 */
export function useLiveDisplayName(initialName = "", initialFirstName = "") {
  const [name, setName] = useState(initialName || "");
  const [firstName, setFirstName] = useState(
    initialFirstName || greetingFromDetail({ name: initialName }, initialName)
  );

  useEffect(() => {
    setName(initialName || "");
    setFirstName(initialFirstName || greetingFromDetail({ name: initialName }, initialName));
  }, [initialName, initialFirstName]);

  useEffect(() => {
    const apply = (detail: ProfileNameDetail) => {
      const full = buildFullName(detail, name);
      if (!full && !detail.firstName) return;
      if (full) setName(full);
      setFirstName(greetingFromDetail(detail, full || name));
    };

    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<ProfileNameDetail>).detail || {};
      apply(detail);
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        apply(JSON.parse(e.newValue) as ProfileNameDetail);
      } catch {
        // ignore bad payload
      }
    };

    window.addEventListener(PROFILE_UPDATED_EVENT, onCustom as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, onCustom as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, [name]);

  const initial = (name || "R").charAt(0).toUpperCase();

  return { name, firstName, initial };
}

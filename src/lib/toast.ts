// src/lib/toast.ts
// Simple toast utility used across the app. For now it logs to console.
export const showToast = (
  msg: string,
  type: "success" | "error" | "info" = "success"
) => {
  // In a real app this could trigger a UI toast component.
  console.log(`[${type.toUpperCase()}] ${msg}`);
};

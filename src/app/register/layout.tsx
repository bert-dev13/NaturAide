import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Create Account — NaturAide",
  description: "Create a NaturAide community account. Health screening is completed after registration.",
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}

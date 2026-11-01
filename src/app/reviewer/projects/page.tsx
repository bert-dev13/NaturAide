import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AllProjectsDirectoryClient from "@/components/reviewer/AllProjectsDirectoryClient";

export const instant = false;

export default async function AllProjectsDirectoryPage() {
  const session = await getSession();
  if (!session || session.role !== "REVIEWER") {
    redirect("/login");
  }

  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-500 animate-pulse">
          Loading research project directory...
        </div>
      }
    >
      <AllProjectsDirectoryClient />
    </Suspense>
  );
}


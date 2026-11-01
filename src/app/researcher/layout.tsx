import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ResearcherSidebar from "@/components/researcher/ResearcherSidebar";
import ResearcherHeader from "@/components/researcher/ResearcherHeader";

export const instant = false;

export default async function ResearcherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login?redirect=/researcher");
  }

  if (session.role !== "RESEARCHER") {
    if (session.role === "COMMUNITY") redirect("/community");
    if (session.role === "REVIEWER") redirect("/reviewer");
    redirect("/login");
  }

  return (
    <div suppressHydrationWarning className="h-screen flex flex-col lg:flex-row bg-[#faf9f5] text-[#131b17] font-sans antialiased overflow-hidden">
      {/* Desktop Sticky / Fixed Sidebar */}
      <ResearcherSidebar user={session} />

      {/* Main Area with independent smooth scroll */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <ResearcherHeader user={session} />

        <main className="flex-1 w-full max-w-none px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

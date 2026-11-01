import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ReviewerSidebar from "@/components/reviewer/ReviewerSidebar";
import ReviewerHeader from "@/components/reviewer/ReviewerHeader";
import { ReviewerProjectProvider } from "@/context/ReviewerProjectContext";

export const instant = false;

export default async function ReviewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Strict server-side authorization: only REVIEWER role
  if (!session) {
    redirect("/login");
  }

  if (session.role !== "REVIEWER") {
    if (session.role === "RESEARCHER") {
      redirect("/researcher");
    } else {
      redirect("/community");
    }
  }

  return (
    <Suspense fallback={<div className="h-screen bg-[#f8fafc]" />}>
      <ReviewerProjectProvider>
        <div suppressHydrationWarning className="h-screen flex flex-col lg:flex-row bg-[#f8fafc] text-slate-900 font-sans antialiased overflow-hidden">
          {/* Desktop Sticky Professional Sidebar */}
          <ReviewerSidebar user={session} />

          {/* Main Area with independent smooth scroll */}
          <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
            <ReviewerHeader user={session} />

            <main className="flex-1 w-full max-w-none px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </main>
          </div>
        </div>
      </ReviewerProjectProvider>
    </Suspense>
  );
}

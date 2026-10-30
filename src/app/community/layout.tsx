import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import BottomNavigation from "@/components/community/BottomNavigation";

export const instant = false;


export default async function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login?redirect=/community");
  }

  if (session.role !== "COMMUNITY") {
    if (session.role === "RESEARCHER") redirect("/researcher");
    if (session.role === "REVIEWER") redirect("/reviewer");
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#f0f4f1] flex justify-center text-[#131b17] font-sans antialiased selection:bg-emerald-200 selection:text-emerald-950">
      {/* Mobile-App Canvas Container: 375px-430px on mobile, expanding gracefully on tablet/desktop */}
      <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl min-h-screen bg-[#faf9f5] flex flex-col relative sm:border-x border-[#e2eae4] shadow-sm">
        {/* Main Application Content Area */}
        <div className="flex-1 flex flex-col pb-28">
          {children}
        </div>

        {/* Fixed Mobile Bottom Navigation */}
        <BottomNavigation />
      </div>
    </div>
  );
}

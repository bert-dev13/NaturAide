import React from "react";
import ProfileSkeleton from "@/components/community/profile/ProfileSkeleton";
import MobileAppHeader from "@/components/community/MobileAppHeader";

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen">
      <MobileAppHeader
        showBack={true}
        backHref="/community"
        title="My Profile"
        subtitle="Manage your personal preferences"
      />
      <ProfileSkeleton />
    </div>
  );
}


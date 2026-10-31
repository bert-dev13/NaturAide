"use client";

import React, { useState, useEffect } from "react";
import MobileAppHeader from "@/components/community/MobileAppHeader";
import ProfileHero from "@/components/community/profile/ProfileHero";
import ProfileActivityTiles from "@/components/community/profile/ProfileActivityTiles";
import PersonalInformationCard from "@/components/community/profile/PersonalInformationCard";
import ProfileSafetyCard from "@/components/community/profile/ProfileSafetyCard";
import ProfilePreferencesCard from "@/components/community/profile/ProfilePreferencesCard";
import AccountSecurityCard from "@/components/community/profile/AccountSecurityCard";
import SafetyGuidelinesCard from "@/components/community/profile/SafetyGuidelinesCard";
import ProfileSkeleton from "@/components/community/profile/ProfileSkeleton";

interface UserProfile {
  id?: number;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  preferredLanguage?: string;
  healthInterests?: string;
  role?: string;
  createdAt?: string | Date;
}

interface UserScreening {
  id?: number;
  evaluationResult?: string;
  severity?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [screening, setScreening] = useState<UserScreening | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  // Profile Edit State
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Change Password State
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfileData = async () => {
      try {
        const [profileRes, screeningRes, savedRes] = await Promise.allSettled([
          fetch("/api/community/profile"),
          fetch("/api/community/screening"),
          fetch("/api/community/saved"),
        ]);

        if (!isMounted) return;

        if (profileRes.status === "fulfilled" && profileRes.value.ok) {
          const data = await profileRes.value.json();
          if (data.success && data.profile) {
            setProfile(data.profile);
          }
        }

        if (screeningRes.status === "fulfilled" && screeningRes.value.ok) {
          const screeningData = await screeningRes.value.json();
          if (screeningData.success && screeningData.screening) {
            setScreening(screeningData.screening);
          }
        }

        if (savedRes.status === "fulfilled" && savedRes.value.ok) {
          const savedData = await savedRes.value.json();
          if (savedData.success) {
            const plantsCount = Array.isArray(savedData.savedPlants) ? savedData.savedPlants.length : 0;
            const productsCount = Array.isArray(savedData.savedProducts) ? savedData.savedProducts.length : 0;
            const guidesCount = Array.isArray(savedData.savedGuides) ? savedData.savedGuides.length : 0;
            setSavedCount(plantsCount + productsCount + guidesCount);
          }
        }
      } catch (err) {
        console.error("Failed to load profile data:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfileData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update Personal Details
  const handleUpdatePersonalInfo = async (dataToUpdate: {
    firstName: string;
    lastName: string;
    phone: string;
  }) => {
    setProfileFeedback(null);
    setSavingProfile(true);

    try {
      const res = await fetch("/api/community/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: dataToUpdate.firstName,
          lastName: dataToUpdate.lastName,
          phone: dataToUpdate.phone,
          preferredLanguage: profile?.preferredLanguage || "English",
          healthInterests: profile?.healthInterests || "",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile");
      }

      setProfileFeedback({ type: "success", text: "Profile details updated successfully." });
      setProfile((prev) => ({
        ...prev,
        firstName: dataToUpdate.firstName,
        lastName: dataToUpdate.lastName,
        phone: dataToUpdate.phone,
        name: `${dataToUpdate.firstName} ${dataToUpdate.lastName}`.trim() || prev?.name,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save profile.";
      setProfileFeedback({ type: "error", text: message });
      throw err;
    } finally {
      setSavingProfile(false);
    }
  };

  // Update Preferences (Language & Health Interests)
  const handleUpdatePreferences = async (prefs: {
    preferredLanguage: string;
    healthInterests: string;
  }) => {
    setSavingProfile(true);

    try {
      const res = await fetch("/api/community/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profile?.firstName || "",
          lastName: profile?.lastName || "",
          phone: profile?.phone || "",
          preferredLanguage: prefs.preferredLanguage,
          healthInterests: prefs.healthInterests,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update preferences");
      }

      setProfile((prev) => ({
        ...prev,
        preferredLanguage: prefs.preferredLanguage,
        healthInterests: prefs.healthInterests,
      }));
    } catch (err: unknown) {
      console.error("Failed to update preferences:", err);
      throw err;
    } finally {
      setSavingProfile(false);
    }
  };

  // Change Password
  const handleChangePassword = async (credentials: {
    currentPassword: string;
    newPassword: string;
  }) => {
    setPasswordFeedback(null);
    setChangingPassword(true);

    try {
      const res = await fetch("/api/community/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to change password");
      }

      setPasswordFeedback({ type: "success", text: "Password updated successfully." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to change password.";
      setPasswordFeedback({ type: "error", text: message });
      throw err;
    } finally {
      setChangingPassword(false);
    }
  };

  const displayName =
    profile?.name ||
    `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() ||
    "Community Member";

  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f5]">
      {/* Top Header */}
      <MobileAppHeader
        showBack={true}
        backHref="/community"
        title="My Profile"
        subtitle="Manage your personal preferences"
      />

      {loading ? (
        <ProfileSkeleton />
      ) : (
        <main className="flex-1 px-4 sm:px-6 py-5 sm:py-6 space-y-6 max-w-4xl mx-auto w-full pb-28">
          {/* Hero Section with mascot-profile.png */}
          <ProfileHero
            displayName={displayName}
            firstName={profile?.firstName}
            email={profile?.email}
            role={profile?.role}
            createdAt={profile?.createdAt}
          />

          {/* Quick Access Activity Tiles */}
          <ProfileActivityTiles savedCount={savedCount} />

          {/* Personal Information */}
          <PersonalInformationCard
            firstName={profile?.firstName || ""}
            lastName={profile?.lastName || ""}
            phone={profile?.phone || ""}
            email={profile?.email}
            onUpdate={handleUpdatePersonalInfo}
            feedback={profileFeedback}
            saving={savingProfile}
          />

          {/* Health Safety Screening Status */}
          <ProfileSafetyCard screening={screening} />

          {/* Preferences & Health Topics */}
          <ProfilePreferencesCard
            preferredLanguage={profile?.preferredLanguage || "English"}
            healthInterests={profile?.healthInterests || ""}
            onUpdate={handleUpdatePreferences}
            saving={savingProfile}
          />

          {/* Safety & App Info Accordion */}
          <SafetyGuidelinesCard />

          {/* Account Security & Sign Out */}
          <AccountSecurityCard
            onChangePassword={handleChangePassword}
            changing={changingPassword}
            feedback={passwordFeedback}
            setFeedback={setPasswordFeedback}
          />
        </main>
      )}
    </div>
  );
}

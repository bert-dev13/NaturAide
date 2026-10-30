"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import MobileAppHeader from "@/components/community/MobileAppHeader";
import {
  MapPin,
  Building2,
  Navigation,
  PhoneCall,
  Search,
  RefreshCw,
  AlertTriangle,
  Compass,
  Clock,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Map as MapIcon,
  Filter,
  CheckCircle2,
} from "lucide-react";
import type { FacilityMarkerData } from "@/components/community/FacilityMap";

// Dynamic import of Leaflet map to ensure 100% SSR compatibility
const FacilityMap = dynamic(() => import("@/components/community/FacilityMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 sm:h-80 rounded-3xl bg-slate-100 border border-[#dde6df] flex flex-col items-center justify-center space-y-2 animate-pulse">
      <Compass className="w-8 h-8 text-emerald-700 animate-spin" />
      <span className="text-xs font-bold text-[#52796f]">Loading interactive map...</span>
    </div>
  ),
});

type PermissionState = "prompt" | "requesting" | "granted" | "denied" | "unavailable";

export default function FacilitiesMapPage() {
  const [permissionState, setPermissionState] = useState<PermissionState>("prompt");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [centerCoordinates, setCenterCoordinates] = useState<{ lat: number; lng: number }>({
    lat: 14.5995,
    lng: 120.9842, // Default to Manila center for initial render
  });
  const [facilities, setFacilities] = useState<FacilityMarkerData[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState<boolean>(false);
  const [areaDisplayName, setAreaDisplayName] = useState<string | null>(null);
  const [manualQuery, setManualQuery] = useState<string>("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);
  const [hasQueried, setHasQueried] = useState<boolean>(false);

  const cardListRef = useRef<HTMLDivElement>(null);

  // Check if browser already granted geolocation on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "permissions" in navigator) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((permissionStatus) => {
          if (permissionStatus.state === "granted") {
            requestDeviceLocation();
          } else if (permissionStatus.state === "denied") {
            setPermissionState("denied");
          }
        })
        .catch(() => {
          // Fallback to prompt state
        });
    }
  }, []);

  // Request actual device GPS location
  const requestDeviceLocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setPermissionState("unavailable");
      return;
    }

    setPermissionState("requesting");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLocation({ lat, lng });
        setCenterCoordinates({ lat, lng });
        setPermissionState("granted");
        fetchNearbyFacilities(lat, lng);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionState("denied");
        } else {
          setPermissionState("unavailable");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Fetch real facilities from the backend API
  const fetchNearbyFacilities = async (lat?: number, lng?: number, queryText?: string) => {
    setIsLoadingFacilities(true);
    setHasQueried(true);

    try {
      const params = new URLSearchParams();
      if (lat !== undefined && lng !== undefined) {
        params.append("lat", String(lat));
        params.append("lng", String(lng));
      }
      if (queryText && queryText.trim()) {
        params.append("q", queryText.trim());
      }

      const res = await fetch(`/api/community/facilities?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setFacilities(data.facilities || []);
        if (data.emergencyContacts) {
          setEmergencyContacts(data.emergencyContacts);
        }
        if (data.center) {
          setCenterCoordinates({
            lat: data.center.latitude,
            lng: data.center.longitude,
          });
          if (data.center.areaName) {
            setAreaDisplayName(data.center.areaName);
          }
        }
      }
    } catch (err) {
      console.error("Facility fetch error:", err);
    } finally {
      setIsLoadingFacilities(false);
    }
  };

  // Handle manual area search
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;
    fetchNearbyFacilities(undefined, undefined, manualQuery.trim());
  };

  // Handle selecting a facility (from map marker or list card)
  const handleSelectFacility = (facility: FacilityMarkerData) => {
    setSelectedFacilityId(facility.id);
    // Smoothly scroll the card into view in the list
    const cardEl = document.getElementById(`facility-card-${facility.id}`);
    if (cardEl && cardListRef.current) {
      cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  // Filter facilities by category
  const filteredFacilities = facilities.filter((f) => {
    if (selectedTypeFilter === "ALL") return true;
    if (selectedTypeFilter === "HOSPITAL") {
      return f.type === "Hospital" || f.type === "Medical Center";
    }
    if (selectedTypeFilter === "HEALTH_CENTER") {
      return f.type === "Rural Health Unit / Health Center";
    }
    if (selectedTypeFilter === "CLINIC") {
      return f.type === "Clinic";
    }
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen pb-12 bg-[#faf9f5]">
      {/* Mobile App Header */}
      <MobileAppHeader
        showBack={true}
        backHref="/community/guidance"
        title="Nearby Healthcare Facilities"
        subtitle="GPS-enabled map & verified public directory"
      />

      <div className="flex-1 px-4 sm:px-6 py-4 space-y-4 max-w-2xl mx-auto w-full">
        {/* Search Bar */}
        <form onSubmit={handleManualSearch} className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-emerald-700 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              placeholder="Search City, Municipality, or Barangay..."
              className="w-full pl-10 pr-24 py-3 rounded-2xl bg-white border border-[#dde6df] text-xs sm:text-sm text-[#0f2c20] placeholder-[#78997f] focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-2xs"
            />
            <button
              type="submit"
              disabled={isLoadingFacilities}
              className="absolute right-1.5 px-3 py-1.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold transition-all cursor-pointer"
            >
              {isLoadingFacilities ? "Searching..." : "Search Area"}
            </button>
          </div>
        </form>

        {/* GEOLOCATION PERMISSION / STATUS BANNERS */}

        {/* 1. Prompt state: Explain why location is needed before asking */}
        {permissionState === "prompt" && (
          <div className="p-4 sm:p-5 rounded-3xl bg-white border-2 border-emerald-600/30 shadow-2xs space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="space-y-1">
                <h2 className="font-heading font-extrabold text-sm sm:text-base text-[#0f2c20]">
                  Find Nearest Healthcare Facility
                </h2>
                <p className="text-xs text-[#3d4a45] leading-relaxed">
                  NaturAide uses your location to help find nearby healthcare facilities. Your
                  location will only be accessed with your permission.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={requestDeviceLocation}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-emerald-200" />
                <span>Use My Current Location</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. Requesting state */}
        {permissionState === "requesting" && (
          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-center gap-3">
            <Compass className="w-5 h-5 text-teal-700 animate-spin shrink-0" />
            <p className="text-xs text-teal-900 font-medium">
              Detecting your location via GPS... Please confirm your browser location prompt.
            </p>
          </div>
        )}

        {/* 3. Denied state */}
        {permissionState === "denied" && (
          <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border border-amber-300 shadow-2xs space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-heading font-bold text-sm text-amber-950">
                  Location Access Needed
                </h3>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Location access is needed to automatically find healthcare facilities near you.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={requestDeviceLocation}
                className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
              <span className="text-xs text-amber-800">
                or use the search bar above to search your City, Municipality, or Barangay manually.
              </span>
            </div>
          </div>
        )}

        {/* 4. Unavailable state */}
        {permissionState === "unavailable" && (
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-800">Device location unavailable</p>
              <p className="text-[11px] text-slate-600">
                You can search your city, municipality, or barangay manually in the search bar.
              </p>
            </div>
            <button
              type="button"
              onClick={requestDeviceLocation}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold shrink-0 cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* 5. Granted banner */}
        {permissionState === "granted" && userLocation && (
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-bold">📍 Current Location Detected</span>
              {areaDisplayName && (
                <span className="text-emerald-700 text-[11px] truncate max-w-[180px] sm:max-w-xs">
                  ({areaDisplayName})
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={requestDeviceLocation}
              title="Refresh GPS"
              className="text-emerald-700 hover:text-emerald-900 text-[11px] font-bold flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>
        )}

        {/* INTERACTIVE MAP */}
        <div className="h-72 sm:h-84 w-full">
          <FacilityMap
            userLocation={userLocation}
            facilities={filteredFacilities}
            selectedFacilityId={selectedFacilityId}
            onSelectFacility={handleSelectFacility}
            centerCoordinates={centerCoordinates}
          />
        </div>

        {/* FILTER PILLS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setSelectedTypeFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedTypeFilter === "ALL"
                ? "bg-[#0f2c20] text-white shadow-2xs"
                : "bg-white text-[#52796f] border border-[#dde6df] hover:border-emerald-300"
            }`}
          >
            All Nearby ({facilities.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTypeFilter("HOSPITAL")}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedTypeFilter === "HOSPITAL"
                ? "bg-teal-800 text-white shadow-2xs"
                : "bg-white text-[#52796f] border border-[#dde6df] hover:border-emerald-300"
            }`}
          >
            🏥 Hospitals & Medical Centers
          </button>
          <button
            type="button"
            onClick={() => setSelectedTypeFilter("HEALTH_CENTER")}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedTypeFilter === "HEALTH_CENTER"
                ? "bg-emerald-800 text-white shadow-2xs"
                : "bg-white text-[#52796f] border border-[#dde6df] hover:border-emerald-300"
            }`}
          >
            🩺 Health Centers
          </button>
          <button
            type="button"
            onClick={() => setSelectedTypeFilter("CLINIC")}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedTypeFilter === "CLINIC"
                ? "bg-sky-800 text-white shadow-2xs"
                : "bg-white text-[#52796f] border border-[#dde6df] hover:border-emerald-300"
            }`}
          >
            ⚕️ Clinics
          </button>
        </div>

        {/* SORTED FACILITY LIST (BOTTOM SHEET / CARDS) */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-heading font-extrabold text-sm text-[#0f2c20] flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>Healthcare Facilities (Sorted Nearest First)</span>
            </h3>
            <span className="text-[11px] font-bold text-[#52796f]">
              {filteredFacilities.length} found
            </span>
          </div>

          {isLoadingFacilities ? (
            <div className="p-8 rounded-3xl bg-white border border-[#dde6df] text-center space-y-2">
              <Compass className="w-6 h-6 text-emerald-700 animate-spin mx-auto" />
              <p className="text-xs text-[#52796f]">Querying OpenStreetMap health registry...</p>
            </div>
          ) : filteredFacilities.length > 0 ? (
            <div ref={cardListRef} className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {filteredFacilities.map((facility) => {
                const isSelected = selectedFacilityId === facility.id;
                const isHospital =
                  facility.type === "Hospital" || facility.type === "Medical Center";
                const isHealthCenter = facility.type === "Rural Health Unit / Health Center";

                return (
                  <div
                    key={facility.id}
                    id={`facility-card-${facility.id}`}
                    onClick={() => handleSelectFacility(facility)}
                    className={`p-4 rounded-3xl bg-white border transition-all cursor-pointer ${
                      isSelected
                        ? "border-amber-400 ring-2 ring-amber-300 shadow-md bg-amber-50/20"
                        : "border-[#dde6df] hover:border-emerald-300 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isHospital
                                ? "bg-teal-100 text-teal-900"
                                : isHealthCenter
                                ? "bg-emerald-100 text-emerald-900"
                                : "bg-sky-100 text-sky-900"
                            }`}
                          >
                            {facility.type}
                          </span>

                          <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>{facility.distanceText}</span>
                          </span>

                          {facility.openingHours && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />
                              <span>{facility.openingHours}</span>
                            </span>
                          )}
                        </div>

                        <h4 className="font-heading font-extrabold text-sm text-[#0f2c20] leading-snug">
                          {facility.name}
                        </h4>

                        <p className="text-xs text-[#52796f] leading-relaxed line-clamp-2">
                          {facility.address}
                        </p>
                      </div>
                    </div>

                    {/* Actions: View on Map, Get Directions, Call */}
                    <div className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectFacility(facility);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0f2c20] text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <MapIcon className="w-3.5 h-3.5 text-emerald-700" />
                        <span>View on Map</span>
                      </button>

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                      >
                        <Navigation className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Get Directions</span>
                      </a>

                      {facility.phone && (
                        <a
                          href={`tel:${facility.phone.replace(/[^0-9+]/g, "")}`}
                          onClick={(e) => e.stopPropagation()}
                          className="py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : hasQueried ? (
            <div className="p-6 rounded-3xl bg-white border border-[#dde6df] text-center space-y-2">
              <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="font-heading font-bold text-sm text-[#0f2c20]">
                No registered healthcare facilities found nearby
              </h4>
              <p className="text-xs text-[#52796f] max-w-sm mx-auto leading-relaxed">
                No facilities were returned within this immediate radius from the OpenStreetMap
                health registry. Try searching a larger municipality or refer to emergency hotlines.
              </p>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-white border border-[#dde6df] text-center space-y-2">
              <Compass className="w-8 h-8 text-emerald-700 mx-auto" />
              <h4 className="font-heading font-bold text-sm text-[#0f2c20]">
                Enable location or search an area
              </h4>
              <p className="text-xs text-[#52796f] max-w-xs mx-auto">
                Tap &ldquo;Use My Current Location&rdquo; above or enter your city to display nearby
                hospitals and clinics.
              </p>
            </div>
          )}
        </div>

        {/* VERIFIED PHILIPPINE EMERGENCY HOTLINES */}
        <div className="pt-2 space-y-3">
          <div className="flex items-center gap-2 px-1 text-xs font-bold text-[#52796f] uppercase tracking-wider">
            <PhoneCall className="w-4 h-4 text-emerald-700" />
            <span>Verified Philippine Emergency Hotlines</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              {
                name: "National Emergency Hotline",
                number: "911",
                available: "24/7 Nationwide",
              },
              {
                name: "DOH Health Information",
                number: "(02) 8651-7800",
                available: "Office Hours",
              },
              {
                name: "UP-PGH Poison Center",
                number: "(02) 8524-1078",
                available: "24/7 Emergency",
              },
              {
                name: "Philippine Red Cross",
                number: "143",
                available: "24/7 Nationwide",
              },
            ].map((contact) => (
              <div
                key={contact.name}
                className="p-3 rounded-2xl bg-white border border-[#dde6df] flex items-center justify-between shadow-2xs hover:border-emerald-400 transition-all"
              >
                <div className="space-y-0.5 pr-2">
                  <h5 className="font-bold text-xs text-[#0f2c20]">{contact.name}</h5>
                  <p className="text-[10px] text-[#52796f]">{contact.available}</p>
                </div>
                <a
                  href={`tel:${contact.number.replace(/[^0-9]/g, "")}`}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs flex items-center gap-1 shadow-2xs shrink-0"
                >
                  <PhoneCall className="w-3 h-3 text-emerald-200" />
                  <span>{contact.number}</span>
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Back Link */}
        <div className="pt-2">
          <Link
            href="/community/guidance"
            className="w-full py-3 rounded-2xl bg-white border border-[#dde6df] hover:bg-[#faf9f5] text-xs font-bold text-[#0f2c20] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Back to Professional Guidance</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

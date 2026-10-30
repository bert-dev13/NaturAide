"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface FacilityMarkerData {
  id: string;
  name: string;
  type: string;
  distanceText: string;
  latitude: number;
  longitude: number;
  address: string;
  phone?: string | null;
  openingHours?: string | null;
}

interface FacilityMapProps {
  userLocation: { lat: number; lng: number } | null;
  facilities: FacilityMarkerData[];
  selectedFacilityId: string | null;
  onSelectFacility: (facility: FacilityMarkerData) => void;
  centerCoordinates: { lat: number; lng: number };
}

export default function FacilityMap({
  userLocation,
  facilities,
  selectedFacilityId,
  onSelectFacility,
  centerCoordinates,
}: FacilityMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = centerCoordinates.lat || 14.5995;
    const initialLng = centerCoordinates.lng || 120.9842;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update center when centerCoordinates changes
  useEffect(() => {
    if (!mapInstanceRef.current || !centerCoordinates) return;
    mapInstanceRef.current.setView([centerCoordinates.lat, centerCoordinates.lng], 14, {
      animate: true,
    });
  }, [centerCoordinates.lat, centerCoordinates.lng]);

  // Update User Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const userIcon = L.divIcon({
        className: "natureaide-user-marker",
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background-color: rgba(37, 99, 235, 0.25); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 22px; height: 22px; border-radius: 50%; background-color: #1d4ed8; border: 3px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: bold;">
              📍
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const marker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; padding: 2px;">
          <strong style="color: #1d4ed8;">📍 Your Current Location</strong>
          <p style="margin: 2px 0 0 0; color: #64748b; font-size: 10px;">Detected via browser GPS</p>
        </div>
      `);

      userMarkerRef.current = marker;
    }
  }, [userLocation]);

  // Update Facility Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    facilities.forEach((facility) => {
      const isSelected = selectedFacilityId === facility.id;
      const isHospital =
        facility.type === "Hospital" || facility.type === "Medical Center";
      const isHealthCenter = facility.type === "Rural Health Unit / Health Center";

      const bgColor = isHospital ? "#0f766e" : isHealthCenter ? "#047857" : "#0284c7";
      const iconEmoji = isHospital ? "🏥" : isHealthCenter ? "🩺" : "⚕️";
      const scale = isSelected ? "1.25" : "1";
      const border = isSelected ? "3px solid #f59e0b" : "2px solid #ffffff";
      const shadow = isSelected
        ? "0 0 0 4px rgba(245, 158, 11, 0.35), 0 8px 12px rgba(0,0,0,0.25)"
        : "0 3px 6px rgba(0,0,0,0.2)";

      const markerIcon = L.divIcon({
        className: `facility-pin-${facility.id}`,
        html: `
          <div style="transform: scale(${scale}); transform-origin: bottom center; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer;">
            <div style="background-color: ${bgColor}; border: ${border}; box-shadow: ${shadow}; border-radius: 12px; padding: 4px 6px; display: flex; align-items: center; gap: 3px; color: white;">
              <span style="font-size: 13px;">${iconEmoji}</span>
              <span style="font-size: 10px; font-weight: 800; white-space: nowrap; max-width: 110px; overflow: hidden; text-overflow: ellipsis;">${facility.name}</span>
            </div>
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid ${isSelected ? "#f59e0b" : bgColor}; margin: -1px auto 0 auto;"></div>
          </div>
        `,
        iconSize: [120, 36],
        iconAnchor: [60, 36],
      });

      const marker = L.marker([facility.latitude, facility.longitude], {
        icon: markerIcon,
        zIndexOffset: isSelected ? 500 : 100,
      }).addTo(map);

      marker.on("click", () => {
        onSelectFacility(facility);
      });

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; min-width: 160px;">
          <span style="display: inline-block; background-color: #f1f5f9; color: #0f172a; padding: 2px 6px; border-radius: 9999px; font-size: 9px; font-weight: 700; margin-bottom: 4px;">${facility.type}</span>
          <strong style="display: block; font-size: 12px; color: #0f2c20; line-height: 1.2;">${facility.name}</strong>
          <p style="margin: 4px 0 0 0; color: #059669; font-weight: 700; font-size: 11px;">📍 ${facility.distanceText}</p>
          <p style="margin: 2px 0 0 0; color: #64748b; font-size: 10px; line-height: 1.2;">${facility.address}</p>
        </div>
      `);

      markersRef.current[facility.id] = marker;
    });
  }, [facilities, selectedFacilityId]);

  // When selectedFacilityId changes, open popup & pan smoothly
  useEffect(() => {
    if (!selectedFacilityId || !mapInstanceRef.current) return;
    const marker = markersRef.current[selectedFacilityId];
    if (marker) {
      const latLng = marker.getLatLng();
      mapInstanceRef.current.panTo(latLng, { animate: true, duration: 0.6 });
      marker.openPopup();
    }
  }, [selectedFacilityId]);

  return (
    <div className="relative w-full h-full min-h-[320px] rounded-3xl overflow-hidden border border-[#dde6df] shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full min-h-[320px]" />
    </div>
  );
}

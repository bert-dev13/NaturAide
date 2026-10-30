import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

interface FacilityItem {
  id: string;
  name: string;
  type: "Hospital" | "Medical Center" | "Rural Health Unit / Health Center" | "Clinic" | "Healthcare Facility";
  distanceKm: number;
  distanceText: string;
  latitude: number;
  longitude: number;
  address: string;
  phone: string | null;
  openingHours: string | null;
  directionsUrl: string;
  osmId?: number;
}

const EMERGENCY_CONTACTS = [
  { name: "Philippine National Emergency Hotline", number: "911", available: "24/7 Nationwide" },
  { name: "DOH Health Information Hotline", number: "(02) 8651-7800", available: "Office Hours" },
  { name: "UP-PGH National Poison Management and Control Center", number: "(02) 8524-1078", available: "24/7 Emergency" },
  { name: "Philippine Red Cross Emergency", number: "143", available: "24/7 Nationwide" },
];

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function determineFacilityType(
  osmVal: string | undefined,
  name: string
): "Hospital" | "Medical Center" | "Rural Health Unit / Health Center" | "Clinic" | "Healthcare Facility" {
  const lowerName = name.toLowerCase();
  const lowerVal = (osmVal || "").toLowerCase();

  if (lowerName.includes("medical center") || lowerName.includes("medical centre")) {
    return "Medical Center";
  }
  if (
    lowerVal === "hospital" ||
    lowerName.includes("hospital") ||
    lowerName.includes("ospital") ||
    lowerName.includes("sanitarium")
  ) {
    return "Hospital";
  }
  if (
    lowerName.includes("rural health") ||
    lowerName.includes("rhu") ||
    lowerName.includes("barangay health") ||
    lowerName.includes("health center") ||
    lowerName.includes("lying-in")
  ) {
    return "Rural Health Unit / Health Center";
  }
  if (lowerVal === "clinic" || lowerName.includes("clinic") || lowerName.includes("polyclinic")) {
    return "Clinic";
  }
  return "Healthcare Facility";
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    const qParam = searchParams.get("q");

    let centerLat: number | null = latParam ? parseFloat(latParam) : null;
    let centerLng: number | null = lngParam ? parseFloat(lngParam) : null;
    let areaDisplayName: string | null = null;

    // Handle manual text search (City / Municipality / Barangay)
    if (qParam && qParam.trim()) {
      try {
        const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          qParam.trim()
        )}&countrycodes=ph&limit=1&addressdetails=1`;

        const nomRes = await fetch(nomUrl, {
          headers: { "User-Agent": "NatureAideHealthcareFinder/1.0" },
          signal: AbortSignal.timeout(4500),
        });

        if (nomRes.ok) {
          const nomData = await nomRes.json();
          if (Array.isArray(nomData) && nomData.length > 0) {
            centerLat = parseFloat(nomData[0].lat);
            centerLng = parseFloat(nomData[0].lon);
            areaDisplayName = nomData[0].display_name;
          }
        }
      } catch (err) {
        console.warn("Manual geocoding warning:", (err as any)?.message);
      }
    }

    // If no coordinates available yet, return emergency hotlines with empty facilities
    if (centerLat === null || centerLng === null || isNaN(centerLat) || isNaN(centerLng)) {
      return NextResponse.json({
        success: true,
        locationDetected: false,
        center: null,
        facilities: [],
        emergencyContacts: EMERGENCY_CONTACTS,
        message: "Provide GPS coordinates or search an area manually to discover nearby facilities.",
      });
    }

    // Fetch real facilities from Photon Komoot (OpenStreetMap OSM POI provider)
    const keywords = ["hospital", "medical center", "clinic", "health center"];
    const seenOsmIds = new Set<number>();
    const rawFeatures: any[] = [];

    await Promise.all(
      keywords.map(async (kw) => {
        try {
          const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
            kw
          )}&lat=${centerLat}&lon=${centerLng}&limit=20`;

          const pRes = await fetch(photonUrl, {
            headers: { "User-Agent": "NatureAideHealthcareFinder/1.0" },
            signal: AbortSignal.timeout(4500),
          });

          if (pRes.ok) {
            const data = await pRes.json();
            for (const feat of data.features || []) {
              const id = feat.properties?.osm_id;
              if (id && !seenOsmIds.has(id)) {
                seenOsmIds.add(id);
                rawFeatures.push(feat);
              }
            }
          }
        } catch {
          // Continue gracefully
        }
      })
    );

    const facilities: FacilityItem[] = [];
    for (const feat of rawFeatures) {
      const p = feat.properties;
      const coords = feat.geometry?.coordinates;
      if (!coords || !coords[0] || !coords[1] || !p?.name) continue;

      const fLng = coords[0];
      const fLat = coords[1];
      const distKm = haversineDistanceKm(centerLat!, centerLng!, fLat, fLng);

      // Filter out unreasonable distances (> 25km for city search)
      if (distKm > 25) continue;

      const facilityType = determineFacilityType(p.osm_value, p.name);

      const addrParts = [p.street, p.locality, p.district, p.city, p.state].filter(Boolean);
      const address =
        addrParts.length > 0 ? addrParts.join(", ") : "Address verified via OpenStreetMap registry";

      const phone = p.phone || p["contact:phone"] || null;
      const openingHours = p.opening_hours || null;
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${fLat},${fLng}`;

      facilities.push({
        id: String(p.osm_id),
        osmId: p.osm_id,
        name: p.name,
        type: facilityType,
        distanceKm: distKm,
        distanceText:
          distKm < 1 ? `${Math.round(distKm * 1000)} m away` : `${distKm.toFixed(1)} km away`,
        latitude: fLat,
        longitude: fLng,
        address,
        phone,
        openingHours,
        directionsUrl,
      });
    }

    // Sort nearest first
    facilities.sort((a, b) => a.distanceKm - b.distanceKm);

    return NextResponse.json({
      success: true,
      locationDetected: true,
      center: {
        latitude: centerLat,
        longitude: centerLng,
        areaName: areaDisplayName,
      },
      count: facilities.length,
      facilities,
      emergencyContacts: EMERGENCY_CONTACTS,
    });
  } catch (error) {
    console.error("Facilities API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to query healthcare facilities." },
      { status: 500 }
    );
  }
}

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";
import { calculateDistanceKm } from "@/utils/distance";
import { parseArea } from "@/utils/petsitterArea";
import { useSitters } from "@/hooks/queries/useSitters";
import { usePetsitterLocation } from "@/hooks/petsitters/usePetsitterLocation";
import { useAreaSearch } from "@/hooks/petsitters/useAreaSearch";
import { useSitterSelection } from "@/hooks/petsitters/useSitterSelection";
import LocationConsentModal from "@/components/petsitters/LocationConsentModal";
import PetsitterMapPanel from "@/components/petsitters/PetsitterMapPanel";
import PetsitterSearchBar, {
  type PetsitterFilter,
} from "@/components/petsitters/PetsitterSearchBar";
import PetsitterListPanel from "@/components/petsitters/PetsitterListPanel";

const SERVICE_TYPE_MAP: Record<string, string> = {
  walk: "산책",
  care: "방문돌봄",
  pickup: "픽업",
  foster: "위탁돌봄",
};

export default function PetsitterSearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlDistrict = searchParams.get("district") ?? "";
  const urlDong = searchParams.get("dong") ?? "";
  const urlCity = searchParams.get("city") ?? "";
  const urlSelected = searchParams.get("selected") ?? "";

  const areaLabel = [urlCity, urlDistrict, urlDong].filter(Boolean).join(" ");
  const hasAreaFilter = !!(urlDistrict || urlDong);

  const [activeFilter, setActiveFilter] = useState<PetsitterFilter>("전체");

  const { data: rawSitters = [] } = useSitters({ district: urlDistrict, dong: urlDong });

  const sitters = rawSitters.map((row) => {
    const name = row.display_name ?? "시터";
    const { city, district, neighborhood } = parseArea(row.display_area);
    const serviceTypes = (row.service_types as string[])
      .map((t) => SERVICE_TYPE_MAP[t] ?? t)
      .filter(Boolean);
    const servicePrices: Record<string, number> = {};
    for (const [rawType, price] of Object.entries(row.service_prices ?? {})) {
      servicePrices[SERVICE_TYPE_MAP[rawType] ?? rawType] = price;
    }
    return {
      id: row.id,
      name,
      initial: name.charAt(0),
      profileImage: row.profile_image ?? null,
      city,
      district,
      neighborhood,
      rating: parseFloat(String(row.rating ?? 0)),
      reviewCount: row.review_count,
      price:
        activeFilter === "전체"
          ? null
          : (servicePrices[activeFilter] ?? row.base_price ?? 0),
      services: [...new Set(serviceTypes)],
      lat: parseFloat(String(row.latitude)),
      lng: parseFloat(String(row.longitude)),
    };
  });

  const {
    basePosition,
    setBasePosition,
    baseLabel,
    setBaseLabel,
    locationLoading,
    locationError,
    showLocationModal,
    dismissLocationModal,
    requestLocation,
  } = usePetsitterLocation({ urlCity, urlDistrict, urlDong });

  const { selectedSitterId, setSelectedSitterId, registerCardRef } = useSitterSelection(
    sitters,
    urlSelected,
  );

  const {
    areaQuery,
    setAreaQuery,
    areaSuggestions,
    showSuggestions,
    areaSearchRef,
    selectAreaSuggestion,
    clearAreaFilter,
  } = useAreaSearch({
    areaLabel,
    onLocationSelected: (lat, lng, label) => {
      setBasePosition({ lat, lng });
      setBaseLabel(label);
    },
    onClear: () => setSelectedSitterId(null),
  });

  const sittersWithDistance = sitters.map((sitter) => ({
    ...sitter,
    distanceKm: calculateDistanceKm(basePosition, { lat: sitter.lat, lng: sitter.lng }),
  }));

  const filtered = sittersWithDistance
    .filter((s) => {
      const matchFilter = activeFilter === "전체" ? true : s.services.includes(activeFilter);
      const matchSearch = hasAreaFilter || areaQuery === "" || s.name.includes(areaQuery);
      return matchFilter && matchSearch;
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const listHeading = hasAreaFilter
    ? `${areaLabel} 펫시터 · ${filtered.length}명`
    : `${baseLabel} 기준 가까운 순 · ${filtered.length}명`;

  return (
    <>
      <Header />

      {showLocationModal && (
        <LocationConsentModal onDismiss={dismissLocationModal} onConfirm={requestLocation} />
      )}

      <main className="bg-orange-50 overflow-hidden h-[calc(100vh-64px)]">
        <div className="flex flex-col md:flex-row h-full">
          <PetsitterMapPanel
            markers={filtered.map(({ lat, lng, id, name, district, neighborhood, distanceKm }) => ({
              lat,
              lng,
              id,
              name,
              district,
              neighborhood,
              distanceKm,
            }))}
            center={basePosition}
            basePosition={basePosition}
            selectedMarkerId={selectedSitterId}
            onMarkerClick={setSelectedSitterId}
            locationLoading={locationLoading}
            locationError={locationError}
          />

          <div className="flex-1 md:flex-none w-full md:w-[520px] bg-white flex flex-col overflow-hidden">
            <PetsitterSearchBar
              areaQuery={areaQuery}
              onAreaQueryChange={setAreaQuery}
              areaSearchRef={areaSearchRef}
              showSuggestions={showSuggestions}
              areaSuggestions={areaSuggestions}
              onSelectSuggestion={selectAreaSuggestion}
              onClearAreaFilter={clearAreaFilter}
              onRequestLocation={requestLocation}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              hasAreaFilter={hasAreaFilter}
              areaLabel={areaLabel}
            />

            <PetsitterListPanel
              listHeading={listHeading}
              sitters={filtered}
              selectedSitterId={selectedSitterId}
              onSelectSitter={setSelectedSitterId}
              onConfirmSitter={(id) => router.push(`/petsitters/${id}`)}
              registerCardRef={registerCardRef}
              hasAreaFilter={hasAreaFilter}
              areaLabel={areaLabel}
              onClearAreaFilter={clearAreaFilter}
            />
          </div>
        </div>
      </main>
    </>
  );
}

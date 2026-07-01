import KakaoMap, { type MapMarker } from "@/components/KakaoMap";

interface PetsitterMapPanelProps {
  markers: MapMarker[];
  center: { lat: number; lng: number };
  basePosition: { lat: number; lng: number };
  selectedMarkerId: string | null;
  onMarkerClick: (id: string) => void;
  locationLoading: boolean;
  locationError: string | null;
}

export default function PetsitterMapPanel({
  markers,
  center,
  basePosition,
  selectedMarkerId,
  onMarkerClick,
  locationLoading,
  locationError,
}: PetsitterMapPanelProps) {
  return (
    <div className="h-[40vh] md:h-full md:flex-1 relative overflow-hidden">
      {locationLoading && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white px-4 py-2 rounded-full shadow text-sm text-orange-500 font-medium">
          위치 확인 중...
        </div>
      )}
      {locationError && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white px-4 py-2 rounded-full shadow text-sm text-red-500 font-medium whitespace-nowrap max-w-[90vw] text-center">
          {locationError}
        </div>
      )}
      <KakaoMap
        markers={markers}
        center={center}
        basePosition={basePosition}
        level={7}
        selectedMarkerId={selectedMarkerId}
        onMarkerClick={(id) => onMarkerClick(String(id))}
      />
    </div>
  );
}

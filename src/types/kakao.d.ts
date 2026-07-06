declare namespace kakao.maps {
  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }

  class Size {
    constructor(width: number, height: number);
  }

  class Point {
    constructor(x: number, y: number);
  }

  interface MapOptions {
    center: LatLng;
    level?: number;
  }

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(latlng: LatLng): void;
    setLevel(level: number): void;
    panTo(latlng: LatLng): void;
  }

  interface MarkerImageOptions {
    offset?: Point;
  }

  class MarkerImage {
    constructor(src: string, size: Size, options?: MarkerImageOptions);
  }

  interface MarkerOptions {
    map?: Map;
    position: LatLng;
    image?: MarkerImage;
    draggable?: boolean;
  }

  class Marker {
    constructor(options: MarkerOptions);
    getPosition(): LatLng;
    setPosition(latlng: LatLng): void;
    setMap(map: Map | null): void;
  }

  interface CustomOverlayOptions {
    position: LatLng;
    content: HTMLElement | string;
    xAnchor?: number;
    yAnchor?: number;
    zIndex?: number;
    clickable?: boolean;
  }

  class CustomOverlay {
    constructor(options: CustomOverlayOptions);
    setMap(map: Map | null): void;
    setZIndex(zIndex: number): void;
  }

  interface PolylineOptions {
    map: Map;
    path: LatLng[];
    strokeWeight?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeStyle?: string;
  }

  class Polyline {
    constructor(options: PolylineOptions);
    setMap(map: Map | null): void;
  }

  interface MapMouseEvent {
    latLng: LatLng;
  }

  namespace event {
    function addListener(
      target: object,
      type: string,
      handler: (...args: never[]) => void,
    ): void;
  }

  function load(callback: () => void): void;

  namespace services {
    type Status = "OK" | "ZERO_RESULT" | "ERROR";

    const Status: {
      OK: Status;
      ZERO_RESULT: Status;
      ERROR: Status;
    };

    interface AddressInfo {
      address_name: string;
      region_1depth_name: string;
      region_2depth_name: string;
      region_3depth_name: string;
    }

    interface RoadAddressInfo {
      address_name: string;
    }

    interface GeocoderAddressResult {
      address_name: string;
      address?: AddressInfo;
      road_address?: RoadAddressInfo | null;
      // addressSearch 응답이 방어적으로 `r.address ?? r` 형태로도 읽혀서 optional로 허용
      region_1depth_name?: string;
      region_2depth_name?: string;
      region_3depth_name?: string;
      x: string;
      y: string;
    }

    interface RegionCodeResult {
      region_type: string;
      region_1depth_name: string;
      region_2depth_name: string;
      region_3depth_name: string;
    }

    interface PlacesSearchResult {
      place_name: string;
      address_name: string;
      road_address_name: string;
      x: string;
      y: string;
    }

    class Geocoder {
      addressSearch(
        query: string,
        callback: (result: GeocoderAddressResult[], status: Status) => void,
        options?: { size?: number },
      ): void;
      coord2Address(
        lng: number,
        lat: number,
        callback: (result: GeocoderAddressResult[], status: Status) => void,
      ): void;
      coord2RegionCode(
        lng: number,
        lat: number,
        callback: (result: RegionCodeResult[], status: Status) => void,
      ): void;
    }

    class Places {
      keywordSearch(
        query: string,
        callback: (result: PlacesSearchResult[], status: Status) => void,
      ): void;
    }
  }
}

declare global {
  interface Window {
    kakao: typeof kakao;
  }
}

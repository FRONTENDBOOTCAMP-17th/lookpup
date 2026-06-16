export interface CoordResult {
  lat: number;
  lng: number;
  addressName: string;
}

export interface RegionResult {
  sido: string;
  sigungu: string;
  dong: string;
}

export function searchAddressToCoord(query: string): Promise<CoordResult | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.kakao?.maps?.services) {
      resolve(null);
      return;
    }
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.addressSearch(query, (result: any[], status: string) => {
      if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
        resolve({
          lat: parseFloat(result[0].y),
          lng: parseFloat(result[0].x),
          addressName: result[0].address_name,
        });
      } else {
        resolve(null);
      }
    });
  });
}

export function coordToRegion(lat: number, lng: number): Promise<RegionResult | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.kakao?.maps?.services) {
      resolve(null);
      return;
    }
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.coord2RegionCode(lng, lat, (result: any[], status: string) => {
      if (status !== window.kakao.maps.services.Status.OK || !result.length) {
        resolve(null);
        return;
      }
      // region_type 'H'(행정동) 우선, 없으면 첫 번째
      const region = result.find((r: any) => r.region_type === "H") ?? result[0];
      resolve({
        sido: region.region_1depth_name,
        sigungu: region.region_2depth_name,
        dong: region.region_3depth_name,
      });
    });
  });
}

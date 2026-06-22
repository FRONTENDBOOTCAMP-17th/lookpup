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

// 자동완성 드롭다운용 주소 후보
export interface AddressSuggestion {
  // 표시·저장용 주소 (도로명 우선, 없으면 지번)
  addressName: string;
  roadAddress: string | null;
  jibunAddress: string | null;
  lat: number;
  lng: number;
}

// 입력 중 부분 주소로 여러 후보를 받아오는 검색 (도로명 자동완성)
export function searchAddressList(query: string): Promise<AddressSuggestion[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.kakao?.maps?.services) {
      resolve([]);
      return;
    }
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.addressSearch(
      query,
      (result: any[], status: string) => {
        if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
          resolve(
            result.map((r) => ({
              addressName: r.road_address?.address_name ?? r.address_name,
              roadAddress: r.road_address?.address_name ?? null,
              jibunAddress: r.address?.address_name ?? r.address_name,
              lat: parseFloat(r.y),
              lng: parseFloat(r.x),
            })),
          );
        } else {
          resolve([]);
        }
      },
      { size: 10 },
    );
  });
}

// 좌표 → 주소 문자열 (도로명 우선, 없으면 지번) — 지도 클릭 시 사용
export function coordToAddress(lat: number, lng: number): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.kakao?.maps?.services) {
      resolve(null);
      return;
    }
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.coord2Address(lng, lat, (result: any[], status: string) => {
      if (status !== window.kakao.maps.services.Status.OK || !result.length) {
        resolve(null);
        return;
      }
      const road = result[0].road_address?.address_name;
      const jibun = result[0].address?.address_name;
      resolve(road ?? jibun ?? null);
    });
  });
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

// 장소명/키워드 검색 (홍대, 삼성 서울병원 등 장소명에 적합)
export function searchPlaceToCoord(query: string): Promise<CoordResult | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.kakao?.maps?.services) {
      resolve(null);
      return;
    }
    const places = new window.kakao.maps.services.Places();
    places.keywordSearch(query, (result: any[], status: string) => {
      if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
        resolve({
          lat: parseFloat(result[0].y),
          lng: parseFloat(result[0].x),
          addressName: result[0].place_name,
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

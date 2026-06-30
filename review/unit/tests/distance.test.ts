import { describe, it, expect } from "vitest";
import { calculateDistanceKm, formatDistance } from "@/utils/distance";

// 펫시터까지의 거리 계산은 지도/목록 정렬의 핵심이라, 값이 틀어지면
// "가까운 시터부터"가 깨집니다. 순수 함수라 단위테스트로 못 박기에 딱 좋습니다.
describe("calculateDistanceKm", () => {
  it("같은 좌표면 거리는 0에 가깝다", () => {
    const seoul = { lat: 37.5665, lng: 126.978 };
    expect(calculateDistanceKm(seoul, seoul)).toBeCloseTo(0, 5);
  });

  it("서울시청 ↔ 강남역은 대략 8~9km 사이다", () => {
    const cityHall = { lat: 37.5663, lng: 126.9779 };
    const gangnam = { lat: 37.4979, lng: 127.0276 };
    const d = calculateDistanceKm(cityHall, gangnam);
    expect(d).toBeGreaterThan(7);
    expect(d).toBeLessThan(10);
  });

  it("거리는 방향과 무관하게 대칭이다(A→B = B→A)", () => {
    const a = { lat: 37.4, lng: 127.1 };
    const b = { lat: 35.1, lng: 129.0 };
    expect(calculateDistanceKm(a, b)).toBeCloseTo(calculateDistanceKm(b, a), 6);
  });
});

describe("formatDistance", () => {
  it("1km 미만은 미터로 반올림해 보여준다", () => {
    expect(formatDistance(0.42)).toBe("420m");
  });

  it("1km 이상은 소수 첫째 자리 km로 보여준다", () => {
    expect(formatDistance(8.34)).toBe("8.3km");
  });
});

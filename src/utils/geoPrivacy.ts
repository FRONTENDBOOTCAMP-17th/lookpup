// 위경도를 약 100m 격자 단위로 반올림해 정확한 주소 특정을 방지한다.
// DB 유출 시에도 건물 단위 특정이 불가능하도록 저장 시점에 적용한다.
const PRECISION = 3;

export function fuzzCoordinate(value: number): number {
  return Math.round(value * 10 ** PRECISION) / 10 ** PRECISION;
}

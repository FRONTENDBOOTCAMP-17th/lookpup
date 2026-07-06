const CITY_SUFFIXES = ["특별시", "광역시", "특별자치시", "특별자치도"];
const NEIGHBORHOOD_SUFFIX = /(동|읍|면|가|리)$/;
// Keep in sync with public.coarsen_petsitter_area in Supabase (search-list RPCs
// use the SQL copy of this same rule; this file backs the detail-page route).
const APARTMENT_BUILDING_NUMBER = /^\d+(-\d+)*동$/;
// "다"/"파" excluded from the letter class: they collide with real neighborhood
// names (다동 in Jung-gu, Seoul; 파동 in Suwon/Ulsan), so a token ending in
// those syllables is treated as a real neighborhood rather than a building label.
const APARTMENT_BUILDING_LETTER = /^[가나라마바사아자차카타하]동$/;

function isCityToken(s: string) {
  return s === "서울" || CITY_SUFFIXES.some((sfx) => s.endsWith(sfx));
}

function isNeighborhoodToken(s: string) {
  return (
    NEIGHBORHOOD_SUFFIX.test(s) &&
    !APARTMENT_BUILDING_NUMBER.test(s) &&
    !APARTMENT_BUILDING_LETTER.test(s)
  );
}

export function parseArea(area: string | null) {
  if (!area) return { city: "", district: "", neighborhood: "" };
  const parts = area.replace(/,.*$/, "").trim().split(/\s+/);
  if (parts.length >= 3 && isCityToken(parts[0]) && isNeighborhoodToken(parts[2])) {
    return { city: parts[0], district: parts[1], neighborhood: parts[2] };
  }
  if (parts.length >= 2 && isCityToken(parts[0])) {
    return { city: parts[0], district: parts[1], neighborhood: "" };
  }
  return { city: "", district: parts[0] ?? "", neighborhood: parts[1] ?? "" };
}

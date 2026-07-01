const CITY_SUFFIXES = ["특별시", "광역시", "특별자치시", "특별자치도"];

function isCityToken(s: string) {
  return s === "서울" || CITY_SUFFIXES.some((sfx) => s.endsWith(sfx));
}

export function parseArea(area: string | null) {
  if (!area) return { city: "", district: "", neighborhood: "" };
  const parts = area.replace(/,.*$/, "").trim().split(/\s+/);
  if (parts.length >= 3 && isCityToken(parts[0])) {
    return { city: parts[0], district: parts[1], neighborhood: parts[2] };
  }
  if (parts.length >= 2 && isCityToken(parts[0])) {
    return { city: parts[0], district: parts[1], neighborhood: "" };
  }
  return { city: "", district: parts[0] ?? "", neighborhood: parts[1] ?? "" };
}

// 펫시터 조건을 별도 DB 컬럼 없이 requests.content 한 컬럼에 함께 저장하기 위한 헬퍼.
// 저장: content 끝에 마커 + 조건 텍스트를 덧붙임
// 조회: 상세 페이지에서 마커 기준으로 본문/조건을 다시 분리
//
// 목록 미리보기는 content 첫 줄만(line-clamp-1) 노출하므로 마커가 보이지 않음.

const CONDITIONS_MARKER = "\n\n[펫시터 조건]\n";

// 본문 + 조건을 하나의 content 문자열로 합친다.
export function mergeConditions(content: string, conditions: string): string {
  const c = conditions.trim();
  return c ? `${content.trim()}${CONDITIONS_MARKER}${c}` : content;
}

// 조건 텍스트에 문장 한 줄("- 문장")을 덧붙인다. 이미 있으면 그대로 둔다(중복 방지).
export function appendConditionLine(
  conditions: string,
  sentence: string,
): string {
  const existingLines = conditions
    .split("\n")
    .map((l) => l.replace(/^-\s*/, "").trim());
  if (existingLines.includes(sentence)) return conditions;
  const base = conditions.replace(/\n+$/, "");
  return base ? `${base}\n- ${sentence}` : `- ${sentence}`;
}

// 저장된 content를 본문과 조건으로 분리한다. 마커가 없으면 조건은 빈 문자열.
export function splitConditions(raw: string): {
  content: string;
  conditions: string;
} {
  const idx = raw.indexOf(CONDITIONS_MARKER);
  if (idx === -1) return { content: raw, conditions: "" };
  return {
    content: raw.slice(0, idx),
    conditions: raw.slice(idx + CONDITIONS_MARKER.length),
  };
}

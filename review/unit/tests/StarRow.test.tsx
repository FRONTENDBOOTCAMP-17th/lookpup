import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import StarRow from "@/components/ui/StarRow";

// 컴포넌트 테스트는 "이 props를 주면 화면에 무엇이 보이는가"를 검증합니다.
// StarRow는 항상 별 5개를 그리되 count개만 채워야 하므로 그걸 못 박습니다.
describe("StarRow", () => {
  it("항상 별 5개를 렌더링한다", () => {
    const { container } = render(<StarRow size={16} count={3} />);
    const stars = container.querySelectorAll("svg");
    expect(stars).toHaveLength(5);
  });

  it("count만큼만 채워진(amber) 별을 표시한다", () => {
    const { container } = render(<StarRow size={16} count={3} />);
    const filled = container.querySelectorAll("svg.fill-amber-400");
    expect(filled).toHaveLength(3);
  });

  it("count를 생략하면 5개 모두 채운다", () => {
    const { container } = render(<StarRow size={16} />);
    expect(container.querySelectorAll("svg.fill-amber-400")).toHaveLength(5);
  });
});

import { test, Page } from "@playwright/test";
import fs from "node:fs";

// 리뷰 전용 역할별 E2E (2026-06-25) — 반려인(owner) / 펫시터(both)
// 같은 리뷰 계정의 세션(.auth/owner.json)을 쓰고, DB의 users.role 을 외부에서 owner↔both 로 바꿔
// /myprofile 의 "보호자/펫시터 토글" 노출 차이로 역할 구분을 검증한다. ROLE 환경변수로 캡처 접미사 구분.

const DATE = "2026-06-25";
const IMG = `../images/${DATE}`;
const ROLE = process.env.ROLE ?? "owner";

test.use({ storageState: ".auth/owner.json" });
test.beforeAll(() => fs.mkdirSync(IMG, { recursive: true }));

async function snap(page: Page, name: string) {
  await page.screenshot({ path: `${IMG}/lookpup-${ROLE}-${name}.png`, fullPage: false });
}

test(`[${process.env.ROLE}] 마이페이지/펫시터 동선`, async ({ page }) => {
  await page.goto("/myprofile", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  console.log(`[${ROLE}] /myprofile → URL:`, page.url());
  // 로그인 여부 단서
  const loggedIn = !page.url().includes("/auth/login") && !page.url().includes("/login");
  console.log(`[${ROLE}] 로그인 상태로 보임:`, loggedIn);
  // 펫시터 토글/메뉴 존재 단서
  const sitterUi = await page.getByText(/펫시터|돌봄|시터/).count();
  console.log(`[${ROLE}] '펫시터/돌봄/시터' 텍스트 매칭 수:`, sitterUi);
  await snap(page, "myprofile");

  await page.goto("/myprofile/sitter-profile", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  console.log(`[${ROLE}] /myprofile/sitter-profile → URL:`, page.url());
  await snap(page, "sitter-profile");

  await page.goto("/petsitters", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await snap(page, "petsitters");
});

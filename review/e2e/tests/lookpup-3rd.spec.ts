import { test, expect } from "@playwright/test";

// 3차 리뷰 전용 E2E. dev 서버는 PORT=3104.
// 시나리오: 로그인 페이지 200(500 아님)·로그아웃 동작·펫시터 목록/지도·회원탈퇴·구인게시판.
const SHOT = "../images";

test("메인 페이지 + 펫시터 카드 프로필 링크", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SHOT}/3rd-01-home.png`, fullPage: true });
  // 메인 펫시터 카드가 /petsitters/:id 로 연결되는지 (영은 작업)
  const cardLinks = await page
    .locator('a[href^="/petsitters/"]')
    .count();
  console.log("home petsitter card links:", cardLinks);
});

test("로그인 페이지 500 아님", async ({ page }) => {
  const resp = await page.goto("/auth/login");
  console.log("login status:", resp?.status());
  expect(resp?.status()).toBeLessThan(500);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOT}/3rd-02-login.png`, fullPage: true });
});

test("펫시터 목록 + 지도 영역(도메인 미등록이면 빈화면 가능)", async ({
  page,
}) => {
  const errs: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errs.push(m.text());
  });
  await page.goto("/petsitters");
  await page.waitForTimeout(2500);
  await page.screenshot({
    path: `${SHOT}/3rd-03-petsitters.png`,
    fullPage: true,
  });
  console.log("petsitters console errors:", errs.slice(0, 6));
});

test("회원탈퇴 페이지(UI만인지 확인)", async ({ page }) => {
  await page.goto("/myprofile/settings/withdraw");
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: `${SHOT}/3rd-04-withdraw.png`,
    fullPage: true,
  });
  // 탈퇴 사유 선택 + 동의 + 탈퇴 버튼 흐름이 화면상 동작하는지
  const reason = page.getByText("이용 빈도가 낮아요");
  if (await reason.count()) {
    await reason.first().click();
  }
});

test("마이프로필 로그아웃 버튼(signOut 호출 여부는 코드/네트워크로 확인)", async ({
  page,
}) => {
  const signOutCalls: string[] = [];
  page.on("request", (req) => {
    if (req.url().includes("/auth/v1/logout")) signOutCalls.push(req.url());
  });
  await page.goto("/myprofile");
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: `${SHOT}/3rd-05-myprofile.png`,
    fullPage: true,
  });
  const logout = page.getByRole("button", { name: "로그아웃" });
  if (await logout.count()) {
    await logout.first().click();
    await page.waitForTimeout(1500);
  }
  console.log("supabase logout(signOut) network calls:", signOutCalls);
});

test("구인게시판 목록 + 글쓰기", async ({ page }) => {
  await page.goto("/board");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SHOT}/3rd-06-board.png`, fullPage: true });
  await page.goto("/board/write");
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: `${SHOT}/3rd-07-board-write.png`,
    fullPage: true,
  });
});

import { test, expect, type Page } from "@playwright/test";
import path from "node:path";

// ── 리뷰 전용 E2E (교육생이 작성한 테스트와 무관) ───────────────────────────
// 백엔드: 조의 실제 Supabase(.env.local).
// 로그인은 카카오/구글 OAuth 뿐이라(이메일 로그인 없음) 자동화에서 제외.
// 게다가 /auth/login 은 현재 "use client" 누락으로 500이라 로그인 자체가 불가.

const IMG = (name: string) => path.join(__dirname, "..", "..", "images", name);

function collectErrors(page: Page, bucket: string[]) {
  page.on("console", (m) => {
    if (m.type() === "error") bucket.push(`[console] ${m.text()}`);
  });
  page.on("pageerror", (e) => bucket.push(`[pageerror] ${e.message}`));
}

test("01 홈 렌더링", async ({ page }) => {
  const errs: string[] = [];
  collectErrors(page, errs);
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
  await page.screenshot({ path: IMG("01-home.png"), fullPage: true });
  console.log("01 errors:", errs);
});

test("02 [버그] 로그인 페이지가 500 (use client 누락)", async ({ page }) => {
  const res = await page.goto("/auth/login");
  await page.screenshot({ path: IMG("02-login-500.png"), fullPage: true });
  console.log("02 /auth/login status:", res?.status());
  expect(res?.status()).toBe(500);
});

test("03 회원가입 페이지", async ({ page }) => {
  const errs: string[] = [];
  collectErrors(page, errs);
  await page.goto("/auth/signup");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: IMG("03-signup.png"), fullPage: true });
  console.log("03 errors:", errs);
});

test("04 게시판 목록", async ({ page }) => {
  const errs: string[] = [];
  collectErrors(page, errs);
  await page.goto("/board");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: IMG("04-board.png"), fullPage: true });
  console.log("04 errors:", errs);
});

test("05 [보안] 비로그인 상태로 보호 라우트 /myprofile 접근", async ({ page }) => {
  // 루트 middleware.ts 가 없어 세션 검사/리다이렉트가 동작하지 않는다.
  const res = await page.goto("/myprofile");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: IMG("05-myprofile-no-auth.png"), fullPage: true });
  console.log("05 /myprofile status:", res?.status(), "url:", page.url());
});

test("06 비로그인 상태로 /mypets, /favorites", async ({ page }) => {
  const a = await page.goto("/mypets");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: IMG("06-mypets-no-auth.png"), fullPage: true });
  const b = await page.goto("/favorites");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: IMG("07-favorites-no-auth.png"), fullPage: true });
  console.log("06 /mypets:", a?.status(), "/favorites:", b?.status());
});

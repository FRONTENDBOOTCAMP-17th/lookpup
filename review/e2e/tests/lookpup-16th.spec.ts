import { test, expect } from "@playwright/test";
import fs from "fs";

// 16차 리뷰 스모크: 대량 리팩토링(채팅 분리, 펫시터 찾기/상세/예약 TanStack+RHF+Zod, admin) 회귀 확인.
// 인증 필요한 화면은 발급된 storageState 사용.
const DATE = "2026-07-01";
const IMG = `../images/${DATE}`;
fs.mkdirSync(IMG, { recursive: true });
const shot = (name: string) => ({ path: `${IMG}/lookpup-${name}.png`, fullPage: true });

test.use({ storageState: ".auth/lookpup.json" });

test("메인 진입", async ({ page }) => {
  const r = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(r?.status()).toBeLessThan(400);
  await page.waitForTimeout(1500);
  await page.screenshot(shot("home"));
});

test("펫시터 찾기(리팩토링: TanStack+검색 클라이언트)", async ({ page }) => {
  const r = await page.goto("/petsitters", { waitUntil: "domcontentloaded" });
  console.log("petsitters status", r?.status());
  await page.waitForTimeout(2500);
  await page.screenshot(shot("petsitters"));
  // 목록/지도 API가 살아있는지 콘솔·네트워크로 확인
});

test("채팅 페이지(리팩토링: ChatClient/Sidebar/Window 분리)", async ({ page }) => {
  const r = await page.goto("/chat", { waitUntil: "domcontentloaded" });
  console.log("chat status", r?.status());
  await page.waitForTimeout(2500);
  await page.screenshot(shot("chat"));
});

test("알림 페이지(리팩토링: 클라이언트 분리+realtime delta)", async ({ page }) => {
  const r = await page.goto("/notifications", { waitUntil: "domcontentloaded" });
  console.log("notifications status", r?.status());
  await page.waitForTimeout(2000);
  await page.screenshot(shot("notifications"));
});

test("마이프로필", async ({ page }) => {
  const r = await page.goto("/myprofile", { waitUntil: "domcontentloaded" });
  console.log("myprofile status", r?.status());
  await page.waitForTimeout(2000);
  await page.screenshot(shot("myprofile"));
});

test("게시판 목록(board)", async ({ page }) => {
  const r = await page.goto("/board", { waitUntil: "domcontentloaded" });
  console.log("board status", r?.status());
  await page.waitForTimeout(2000);
  await page.screenshot(shot("board"));
});

test("admin 대시보드(리팩토링)", async ({ page }) => {
  const r = await page.goto("/admin", { waitUntil: "domcontentloaded" });
  console.log("admin status", r?.status());
  await page.waitForTimeout(2000);
  await page.screenshot(shot("admin"));
});

test("결제 페이지 금액 URL 조작 재현(amount=1)", async ({ page }) => {
  // 15차 회귀 확인: /payment?amount=1 이 화면에 1원으로 표시되는지
  const r = await page.goto("/payment?amount=1&fee=0.05&sitterName=Test&serviceName=Test", {
    waitUntil: "domcontentloaded",
  });
  console.log("payment status", r?.status());
  await page.waitForTimeout(1500);
  await page.screenshot(shot("payment-amount1"));
});

import { test, expect, Page } from "@playwright/test";

// 리뷰 전용 데일리 E2E (2026-06-16). 봐주개(lookpup) 펫시터 매칭.
// 로그인은 OAuth(카카오/구글)만 있어 자동화 불가 → 공개 페이지 위주로 렌더만 확인.
// 주의: networkidle 금지(realtime/websocket으로 hang) → domcontentloaded + waitForTimeout.

const IMG = "../images/2026-06-17";

async function visit(page: Page, path: string) {
  const res = await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const status = res?.status() ?? 0;
  console.log(`[VISIT] ${path} -> status ${status}`);
  return status;
}

async function shot(page: Page, id: string) {
  await page.screenshot({ path: `${IMG}/lookpup-${id}.png`, fullPage: true });
}

test("L1 메인 - desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const s = await visit(page, "/");
  await shot(page, "L1-main-desktop");
  console.log(`L1 desktop status=${s}`);
});

test("L1 메인 - mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const s = await visit(page, "/");
  await shot(page, "L1-main-mobile");
  console.log(`L1 mobile status=${s}`);
});

test("L2 펫시터 찾기 목록 - desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const s = await visit(page, "/petsitters");
  await shot(page, "L2-petsitters-desktop");
  console.log(`L2 desktop status=${s}`);
});

test("L2 펫시터 찾기 목록 - mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const s = await visit(page, "/petsitters");
  await shot(page, "L2-petsitters-mobile");
  console.log(`L2 mobile status=${s}`);
});

test("L3 구인 게시판 목록", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const s = await visit(page, "/board");
  await shot(page, "L3-board");
  console.log(`L3 status=${s}`);
});

test("L4 결제 페이지", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const s = await visit(page, "/payment");
  await shot(page, "L4-payment");
  console.log(`L4 status=${s}`);
});

test("L5 로그인 페이지(OAuth 버튼 렌더)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const s = await visit(page, "/auth/login");
  await shot(page, "L5-login");
  console.log(`L5 status=${s}`);
});

test("L6a 이용약관 페이지", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const s = await visit(page, "/terms");
  await shot(page, "L6a-terms");
  console.log(`L6a status=${s}`);
});

test("L6b 개인정보 페이지", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const s = await visit(page, "/privacy");
  await shot(page, "L6b-privacy");
  console.log(`L6b status=${s}`);
});

test("L7 회원탈퇴 페이지 렌더(로그인 필요-렌더만)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const s = await visit(page, "/myprofile/settings/withdraw");
  await shot(page, "L7-withdraw");
  console.log(`L7 status=${s}`);
});

// 이번 회차 신규: 실시간 채팅 페이지 + 펫시터 지도(마커). 비로그인이면 빈/리다이렉트일 수 있음.
test("L8 채팅 페이지 렌더(/chat)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const s = await visit(page, "/chat");
  await shot(page, "L8-chat");
  console.log(`L8 status=${s}`);
});

test("L9 펫시터 지도 — 마커/오버레이 (mobile)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const s = await visit(page, "/petsitters");
  await page.waitForTimeout(2500); // 카카오맵 SDK 로드 대기
  await shot(page, "L9-petsitters-map-mobile");
  // 콘솔 에러(지도 SDK 도메인 등) 수집
  console.log(`L9 status=${s}`);
});

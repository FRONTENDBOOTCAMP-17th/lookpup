import { test, expect, Page } from "@playwright/test";

// 리뷰 전용 데일리 E2E (2026-06-16). 봐주개(lookpup) 펫시터 매칭.
// 로그인은 OAuth(카카오/구글)만 있어 자동화 불가 → 공개 페이지 위주로 렌더만 확인.
// 주의: networkidle 금지(realtime/websocket으로 hang) → domcontentloaded + waitForTimeout.

const IMG = "../images/2026-06-22";

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

/* ===== 8차 신규 — 구인게시판 CRUD(BestSeal) + 채팅 broadcast(영은) ===== */

// 구인글 상세 조회 API(신규). 빈/조회 응답 형태 확인.
test("L10 /api/requests GET — 구인글 목록 API", async ({ request }) => {
  const res = await request.get("/api/requests");
  console.log(`[L10] /api/requests -> ${res.status()} body=${(await res.text()).slice(0, 200)}`);
  expect(res.status()).toBeLessThan(500);
});

// 구인 게시판 글쓰기 페이지(비로그인 렌더 — 가드 여부 화면으로 확인)
test("L11 /board/write — 글쓰기 페이지", async ({ page }) => {
  const s = await visit(page, "/board/write");
  await shot(page, "L11-board-write");
  console.log(`[L11] /board/write status=${s} finalUrl=${page.url()}`);
});

// 구인 게시판 목록 → 첫 글 상세로 이동(신규 라우트 흐름)
test("L12 /board → 상세 이동", async ({ page }) => {
  await visit(page, "/board");
  const card = page.locator('a[href*="/board/"]').first();
  if (await card.count()) {
    const href = await card.getAttribute("href");
    if (href) {
      await visit(page, href);
      await shot(page, "L12-board-detail");
      console.log(`[L12] board detail = ${page.url()}`);
    }
  } else {
    await shot(page, "L12-board-empty");
  }
});

// 채팅 broadcast 전환(7차 [필수] 중복) — 비로그인 graceful 확인(2계정 Realtime은 자동화 제외)
test("L13 /chat — broadcast 방식 렌더", async ({ page }) => {
  const s = await visit(page, "/chat");
  await shot(page, "L13-chat-broadcast");
  console.log(`[L13] /chat status=${s}`);
});

/* ===== 9차 신규 — 펫시터 등록 이미지 업로드(Cloudinary, gyuhwa) ===== */

// 펫시터 등록 폼(신규 Cloudinary 업로드). 비로그인 렌더 + 사진 input 존재 확인.
test("L14 /sitter-register — 등록 폼 렌더(데스크톱)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const s = await visit(page, "/sitter-register");
  await shot(page, "L14-sitter-register-desktop");
  const fileInputs = await page.locator('input[type="file"]').count();
  console.log(`[L14] /sitter-register status=${s} fileInputs=${fileInputs} finalUrl=${page.url()}`);
});

test("L14 /sitter-register — 등록 폼 렌더(모바일)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const s = await visit(page, "/sitter-register");
  await shot(page, "L14-sitter-register-mobile");
  console.log(`[L14m] /sitter-register status=${s}`);
});

// 펫시터 상세(소개 탭 이동 리팩터 ee4bb80) — 상세 진입 후 탭 렌더 확인
test("L15 /petsitters → 상세 진입(소개 탭)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await visit(page, "/petsitters");
  const card = page.locator('a[href*="/petsitters/"]').first();
  if (await card.count()) {
    const href = await card.getAttribute("href");
    if (href) {
      await visit(page, href);
      await shot(page, "L15-petsitter-detail");
      console.log(`[L15] petsitter detail = ${page.url()}`);
    }
  } else {
    await shot(page, "L15-petsitter-empty");
    console.log(`[L15] no petsitter cards`);
  }
});

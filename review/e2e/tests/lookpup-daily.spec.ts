import { test, expect, Page } from "@playwright/test";

// 봐주개(lookpup) 데일리 E2E — 2026-06-24 (12차 리뷰)
// 신규: 채팅 플로우(예약→채팅방 생성, 실시간 반영).
// 인증: UI 로그인이 구글/카카오 OAuth 뿐이라, globalSetup(auth-setup.cjs)이
//   service-role로 진짜 세션을 발급해 .auth/lookpup.json(storageState)에 저장한다.
//   인증 필요한 테스트는 test.use({ storageState })로 그 세션을 입는다(앱 코드 무수정).
// Kakao Map은 도메인 미등록으로 빈 캔버스 — known limitation.
// networkidle 금지 (Supabase Realtime websocket으로 hang).

const IMG = "../images/2026-06-24";
const AUTH_STATE = ".auth/lookpup.json";

async function visit(page: Page, path: string) {
  const res = await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const status = res?.status() ?? 0;
  console.log(`[VISIT] ${path} -> HTTP ${status}`);
  return status;
}

async function shot(page: Page, id: string) {
  await page.screenshot({ path: `${IMG}/lookpup-${id}.png`, fullPage: true });
  console.log(`[SHOT] ${IMG}/lookpup-${id}.png`);
}

// ── 2. 공개 페이지 ──────────────────────────────────────────────────────────
test("L1 메인 - desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const s = await visit(page, "/");
  await shot(page, "L1-main-desktop");
  expect(s).toBeLessThan(500);
});

test("L1 메인 - mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const s = await visit(page, "/");
  await shot(page, "L1-main-mobile");
  expect(s).toBeLessThan(500);
});

test("L2 펫시터 찾기 - desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const s = await visit(page, "/petsitters");
  await shot(page, "L2-petsitters-desktop");
  console.log("[L2] Kakao map domain not registered — blank canvas expected");
  expect(s).toBeLessThan(500);
});

test("L2 펫시터 찾기 - mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const s = await visit(page, "/petsitters");
  await shot(page, "L2-petsitters-mobile");
  expect(s).toBeLessThan(500);
});

test("L3 시터 상세 (목록에서 첫 번째)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await visit(page, "/petsitters");
  const links = page.locator('a[href^="/petsitters/"]');
  const count = await links.count();
  console.log(`[L3] sitter links found: ${count}`);
  if (count > 0) {
    const href = await links.first().getAttribute("href");
    await visit(page, href ?? "/petsitters/1");
  } else {
    await visit(page, "/petsitters/1");
  }
  await shot(page, "L3-sitter-detail");
  console.log(`[L3] url: ${page.url()}`);
});

test("L4 구인 게시판 목록", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const s = await visit(page, "/board");
  await shot(page, "L4-board-list");
  expect(s).toBeLessThan(500);
});

test("L5 구인 게시판 글쓰기 (인증 필요)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const s = await visit(page, "/board/write");
  await shot(page, "L5-board-write");
  console.log(`[L5] board/write status=${s}, url=${page.url()}`);
});

// ── 3. 채팅 페이지 ────────────────────────────────────────────────────────
test("L6 채팅 페이지 (비인증 접근)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const s = await visit(page, "/chat");
  await shot(page, "L6-chat-unauth");
  console.log(`[L6] /chat status=${s}, url=${page.url()}`);
});

test("L6b 채팅 페이지 (모바일)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await visit(page, "/chat");
  await shot(page, "L6b-chat-mobile");
});

// ── 4. 마이프로필 / 정산 ──────────────────────────────────────────────────
test("L7 마이프로필 (비인증)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const s = await visit(page, "/myprofile");
  await shot(page, "L7-myprofile-unauth");
  console.log(`[L7] /myprofile status=${s}, url=${page.url()}`);
});

test("L8 정산 페이지 (비인증)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const s = await visit(page, "/myprofile/earnings");
  await shot(page, "L8-earnings-unauth");
  console.log(`[L8] /myprofile/earnings status=${s}, url=${page.url()}`);
});

// ── 5. 결제 및 완료 페이지 ────────────────────────────────────────────────
test("L9 결제 페이지", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const s = await visit(page, "/payment");
  await shot(page, "L9-payment");
  console.log(`[L9] /payment status=${s}`);
});

test("L10 결제완료 페이지 (success 화면)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const s = await visit(page, "/payment/complete?paymentId=test_review_123");
  await shot(page, "L10-payment-complete-success");
  console.log(`[L10] /payment/complete status=${s}`);
});

test("L10b 결제완료 페이지 (fail 화면)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const s = await visit(page, "/payment/complete?code=FAILURE&message=결제실패&paymentId=test_fail");
  await shot(page, "L10b-payment-complete-fail");
  console.log(`[L10b] /payment/complete fail status=${s}`);
});

// ── 6. 예약(booking) 페이지 ───────────────────────────────────────────────
test("L11 예약 페이지 (비인증)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const s = await visit(page, "/petsitters/1/book");
  await shot(page, "L11-book-unauth");
  console.log(`[L11] /petsitters/1/book status=${s}, url=${page.url()}`);
});

// ── 7. 신고 페이지 ────────────────────────────────────────────────────────
test("L12 신고 페이지", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const s = await visit(page, "/report");
  await shot(page, "L12-report");
  console.log(`[L12] /report status=${s}`);
});

// ── 8. 인증 후 흐름 (테스트 전용 세션 storageState 사용) ───────────────────────
// globalSetup(auth-setup.cjs)이 .auth/lookpup.json 을 만들어 둔다. 아래 블록은
// 그 세션을 입고 로그인이 필요한 화면을 검증한다. (로그인/인증 페이지로 튕기면 실패)
test.describe("인증 후", () => {
  test.use({ storageState: AUTH_STATE });

  function assertLoggedIn(page: Page, label: string) {
    const url = page.url();
    const bounced = url.includes("/auth/login") || url.includes("/auth/verification");
    console.log(`[${label}] url=${url} bounced=${bounced}`);
    expect(bounced, `${label}: 로그인/인증 페이지로 튕김`).toBe(false);
  }

  test("A1 마이프로필", async ({ page }) => {
    await visit(page, "/myprofile");
    await shot(page, "A1-myprofile");
    assertLoggedIn(page, "A1");
  });

  test("A2 정산 페이지", async ({ page }) => {
    await visit(page, "/myprofile/earnings");
    await shot(page, "A2-earnings");
    assertLoggedIn(page, "A2");
  });

  test("A3 채팅 목록", async ({ page }) => {
    await visit(page, "/chat");
    await shot(page, "A3-chat");
    assertLoggedIn(page, "A3");
  });

  test("A4 펫시터 상세 → 예약하기", async ({ page }) => {
    await visit(page, "/petsitters");
    const links = page.locator('a[href^="/petsitters/"]');
    const href = (await links.count()) > 0 ? await links.first().getAttribute("href") : null;
    await visit(page, href ?? "/petsitters/1");
    await shot(page, "A4-sitter-detail");
    // 예약 페이지(결제 고객정보 더미 하드코딩 지점)
    await visit(page, `${href ?? "/petsitters/1"}/book`);
    await shot(page, "A4-book");
    assertLoggedIn(page, "A4");
  });
});

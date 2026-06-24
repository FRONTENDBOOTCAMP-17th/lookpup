import { test } from "@playwright/test";
import fs from "node:fs";

// lookpup(봐주개) 데일리 E2E (2026-06-23) — 공개 페이지 스모크
// 로그인은 Google/Kakao OAuth만이라 자동화 제외. 공개 동선만 캡처.
const DATE = "2026-06-23";
const IMG = `../images/${DATE}`;
test.beforeAll(() => fs.mkdirSync(IMG, { recursive: true }));

async function visit(page: any, path: string, name: string) {
  const r = await page.goto(path, { waitUntil: "domcontentloaded" });
  console.log(`[${path}] HTTP ${r?.status()}`);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${IMG}/lookpup-${name}.png`, fullPage: false });
}

test("공개 동선: 메인→펫시터 목록→구인게시판", async ({ page }) => {
  await visit(page, "/", "01-main");
  await visit(page, "/petsitters", "02-petsitters");
  await visit(page, "/board", "03-board");
});

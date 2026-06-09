import { test } from "@playwright/test";
const SHOT = "../images";
test("메인 페이지", async ({ page }) => {
  await page.goto("/"); await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SHOT}/2nd-01-home.png`, fullPage: true });
});
test("펫시터 목록(카카오맵)", async ({ page }) => {
  const errs: string[] = [];
  page.on("console", (m) => { if (m.type()==="error") errs.push(m.text()); });
  await page.goto("/petsitters"); await page.waitForTimeout(2500);
  await page.screenshot({ path: `${SHOT}/2nd-02-petsitters-map.png`, fullPage: true });
  console.log("petsitters console errors:", errs.slice(0,5));
});
test("게시판 글쓰기", async ({ page }) => {
  await page.goto("/board/write"); await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SHOT}/2nd-03-board-write.png`, fullPage: true });
});

import { defineConfig, devices } from "@playwright/test";

// 리뷰 전용 E2E 설정. 개발 서버(포트 3300, 실제 Supabase 연결)를 사용한다.
export default defineConfig({
  testDir: "./tests",
  timeout: 40_000,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"], ["html", { outputFolder: "report", open: "never" }]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3300",
    headless: true,
    viewport: { width: 1280, height: 900 },
    screenshot: "only-on-failure",
    trace: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

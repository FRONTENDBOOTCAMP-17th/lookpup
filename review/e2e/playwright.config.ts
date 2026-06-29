import { defineConfig, devices } from "@playwright/test";

// 리뷰 전용 E2E 설정. 개발 서버(포트 3300, 실제 Supabase 연결)를 사용한다.
export default defineConfig({
  testDir: "./tests",
  // 테스트 전용 로그인: service-role 키로 진짜 Supabase 세션을 발급해
  // .auth/lookpup.json(storageState)에 저장한다. 앱 코드는 건드리지 않는다.
  // (UI 로그인이 구글/카카오 OAuth 뿐이라 자동화로는 로그인 불가하기 때문)
  globalSetup: "./auth-setup.cjs",
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
  webServer: {
    command: "PORT=3300 npm run dev",
    url: "http://localhost:3300",
    cwd: "../../",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});

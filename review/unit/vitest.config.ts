import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// 리뷰 전용 단위테스트 설정(교육생 테스트와 별개).
// 본인 프로젝트 루트에 둘 때는 APP을 "." 으로, alias "@"를 "./src" 로 바꾸면 됩니다.
const APP = resolve(__dirname, "../..");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": resolve(APP, "src") },
    // 앱과 테스트가 서로 다른 React 복사본을 쓰면 "Invalid hook call"이 납니다.
    // 이 프로젝트는 react를 따로 설치하지 않고(.npmrc: legacy-peer-deps=true)
    // 앱의 단일 React copy를 그대로 씁니다.
    dedupe: ["react", "react-dom"],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});

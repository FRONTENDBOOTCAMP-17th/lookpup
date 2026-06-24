/**
 * 리뷰 전용(테스트 한정) 로그인 셋업.
 *
 * 봐주개는 UI 로그인이 구글/카카오 OAuth 뿐이라 자동화로는 로그인할 수 없다.
 * 그래서 이 스크립트는 *앱 코드를 전혀 건드리지 않고* service-role 키로 진짜
 * Supabase 세션을 발급한 뒤, @supabase/ssr 가 실제로 쓰는 형식 그대로 쿠키를
 * 직렬화해서 Playwright storageState(.auth/lookpup.json)로 저장한다.
 * 이 쿠키를 브라우저에 심으면 로그인된 상태로 동선을 검증할 수 있다.
 *
 * service-role 키가 있어야만 동작하므로 본질적으로 테스트 전용이고,
 * review/e2e 안에만 존재한다(앱/운영에는 어떤 우회 경로도 추가하지 않는다).
 *
 * 실행: cd lookpup/review/e2e && node auth-setup.cjs
 */
const fs = require("fs");
const path = require("path");

const APP_ROOT = path.resolve(__dirname, "../..");          // lookpup/
const NM = path.join(APP_ROOT, "node_modules");
const { createClient } = require(path.join(NM, "@supabase/supabase-js"));
const { createServerClient } = require(path.join(NM, "@supabase/ssr"));

// .env.local 직접 파싱(점 포함 파일)
function loadEnv() {
  const env = {};
  const txt = fs.readFileSync(path.join(APP_ROOT, ".env.local"), "utf8");
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const TEST_EMAIL = "lookpup-review@example.com";
const TEST_PASSWORD = "Review!2026";

async function run() {
  const env = loadEnv();
  const URL = env.NEXT_PUBLIC_SUPABASE_URL;
  const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL || !ANON || !SERVICE) throw new Error("env(URL/ANON/SERVICE) 누락");

  // 1) 테스트 계정 생성(없으면). 이미 있으면 무시.
  //    (이 프로젝트는 listUsers/비밀번호 로그인이 트리거 문제로 불안정해서
  //     비밀번호 대신 admin generateLink → verifyOtp 로 세션을 받는다.)
  const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
  const created = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (created.error && !/already|exists|registered/i.test(created.error.message)) {
    throw created.error;
  }
  const authUserId = created.data?.user?.id ?? "(기존 계정)";

  // 2) 매직링크 토큰 발급(브라우저·비밀번호 불필요)
  const link = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: TEST_EMAIL,
  });
  if (link.error) throw link.error;
  const tokenHash = link.data?.properties?.hashed_token;
  if (!tokenHash) throw new Error("hashed_token 없음");
  const uid = link.data?.user?.id;
  if (!uid) throw new Error("user id 없음");

  // 2-1) public.users 프로필 행을 '본인인증 완료(is_verified=true)' 상태로 준비.
  //      (정상 흐름에선 OAuth 콜백 + 본인인증이 채우는 행. 테스트라 service-role로 직접.)
  const profile = {
    id: uid,
    email: TEST_EMAIL,
    provider: "google",
    role: "owner",
    is_verified: true,
    full_name: "리뷰테스트",
    birthdate: "1990-01-01",
    phone_number: "010-9999-0001",
    gender: "FEMALE",
  };
  const up = await admin.from("users").upsert(profile, { onConflict: "id" });
  if (up.error) console.warn("users upsert 경고:", up.error.message);

  // 3) 토큰을 세션으로 교환
  const anon = createClient(URL, ANON, { auth: { persistSession: false } });
  let verify = await anon.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
  if (verify.error) {
    verify = await anon.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
  }
  if (verify.error) throw verify.error;
  const session = verify.data.session;
  if (!session) throw new Error("세션 없음");

  // 3) @supabase/ssr 로 쿠키 직렬화(앱과 동일한 형식·청크)
  const captured = [];
  const ssr = createServerClient(URL, ANON, {
    cookies: {
      getAll: () => [],
      setAll: (cks) => captured.push(...cks),
    },
  });
  await ssr.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  if (!captured.length) throw new Error("쿠키가 직렬화되지 않음(세션 확인 필요)");

  // 4) Playwright storageState 로 변환
  const storageState = {
    cookies: captured.map((c) => ({
      name: c.name,
      value: c.value,
      domain: "localhost",
      path: "/",
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    })),
    origins: [],
  };

  const outDir = path.join(__dirname, ".auth");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "lookpup.json");
  fs.writeFileSync(outPath, JSON.stringify(storageState, null, 2));

  console.log("OK 세션 발급:", TEST_EMAIL, "auth_id=", authUserId);
  console.log("쿠키", captured.map((c) => c.name).join(", "));
  console.log("storageState →", outPath);
  return outPath;
}

// Playwright globalSetup(default export) 겸 단독 실행 모두 지원
module.exports = run;
if (require.main === module) {
  run().catch((e) => {
    console.error("FAIL", e.message || e);
    process.exit(1);
  });
}

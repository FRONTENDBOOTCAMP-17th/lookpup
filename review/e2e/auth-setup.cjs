// 리뷰 전용 테스트 로그인 (구글/카카오 OAuth 없이) — 2026-06-25 재작성
// service-role 키로 진짜 Supabase 세션을 발급해 @supabase/ssr 쿠키로 직렬화 → Playwright storageState 저장.
// 앱 코드는 전혀 건드리지 않는다(테스트 전용). EMAIL 환경변수의 계정으로 세션을 만든다.
//
// 사용: EMAIL=lookpup-review@example.com OUT=.auth/owner.json node auth-setup.cjs
const path = require("node:path");
const fs = require("node:fs");
const APP = path.resolve(__dirname, "../..");
const { createClient } = require(path.join(APP, "node_modules/@supabase/supabase-js"));
const { createServerClient } = require(path.join(APP, "node_modules/@supabase/ssr"));

function envFrom(file) {
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.replace(/\r$/, "").match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

(async () => {
  const env = envFrom(path.join(APP, ".env.local"));
  let URL = env.NEXT_PUBLIC_SUPABASE_URL;
  if (!/^https?:\/\//.test(URL)) URL = "https://" + URL;
  const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
  const EMAIL = process.env.EMAIL || "lookpup-review@example.com";
  const OUT = process.env.OUT || ".auth/session.json";

  // 1) admin 으로 magiclink 토큰 발급
  const admin = createClient(URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email: EMAIL });
  if (linkErr) throw new Error("generateLink 실패: " + linkErr.message);
  const tokenHash = link.properties.hashed_token;

  // 2) verifyOtp 로 세션 교환
  const anon = createClient(URL, ANON, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: verified, error: vErr } = await anon.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
  if (vErr) throw new Error("verifyOtp 실패: " + vErr.message);
  const session = verified.session;
  if (!session) throw new Error("세션 없음");

  // 3) @supabase/ssr 가 직접 쿠키를 직렬화하도록 (형식·청크를 라이브러리에 맡김)
  const jar = [];
  const ssr = createServerClient(URL, ANON, {
    cookies: {
      getAll: () => [],
      setAll: (cookies) => { for (const c of cookies) jar.push(c); },
    },
  });
  await ssr.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });

  // 4) Playwright storageState 로 저장
  const cookies = jar.map((c) => ({
    name: c.name,
    value: c.value,
    domain: "localhost",
    path: "/",
    expires: -1,
    httpOnly: false,
    secure: false,
    sameSite: "Lax",
  }));
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ cookies, origins: [] }, null, 2));
  console.log(`[auth-setup] ${EMAIL} → ${OUT} (쿠키 ${cookies.length}개: ${cookies.map((c) => c.name).join(", ")})`);
})().catch((e) => { console.error(e); process.exit(1); });

# lookpup(봐주개) E2E 시나리오

리뷰 전용 데일리 E2E. 로그인은 OAuth(카카오/구글)만 있어 자동화 불가.
매직링크 시도: Supabase redirect_to가 3000포트만 허용 → Playwright에서 ERR_CONNECTION_REFUSED.
실행: `cd review/e2e && npx playwright test tests/lookpup-daily.spec.ts --reporter=line`

## 시나리오 표 (living) — 2026-06-24 갱신

| ID | 시나리오 | 경로 | 뷰포트 | 최근결과 (2026-06-24) |
|----|----------|------|--------|-----------------------|
| A0 | 매직링크 인증 시도 | Supabase verify URL → `/` | desktop | FAIL — ERR_CONNECTION_REFUSED (Supabase가 3000포트로만 redirect) |
| A1 | 인증 후 채팅 목록 | `/chat` after magic link | desktop | FAIL — 동일 이유 |
| A2 | 인증 후 마이프로필 | `/myprofile` after magic link | desktop | FAIL — 동일 이유 |
| A3 | 인증 후 정산 | `/myprofile/earnings` after magic link | desktop | FAIL — 동일 이유 |
| L1 | 메인 | `/` | desktop 1280 + mobile 390 | PASS (200) |
| L2 | 펫시터 찾기 목록(+지도) | `/petsitters` | desktop 1280 + mobile 390 | PASS (200); 지도 빈화면(도메인 미등록) |
| L3 | 시터 상세 | `/petsitters/{uuid}` | desktop 1280 | PASS (200); 목록에서 20개 시터 링크 확인됨 |
| L4 | 구인 게시판 목록 | `/board` | desktop 1280 | PASS (200) |
| L5 | 구인 게시판 글쓰기 (인증 필요) | `/board/write` | desktop 1280 | PASS — 비인증 시 `/auth/login`으로 redirect |
| L6 | 채팅 페이지 | `/chat` | desktop 1280 + mobile 390 | PASS (200); 비인증 접근 시 redirect 없이 그대로 렌더됨 (확인 필요) |
| L7 | 마이프로필 | `/myprofile` | desktop 1280 | PASS — 비인증 시 `/auth/login`으로 redirect |
| L8 | 정산 페이지 | `/myprofile/earnings` | desktop 1280 | PASS (200); 비인증 접근해도 redirect 없이 렌더됨 (확인 필요) |
| L9 | 결제 페이지 | `/payment` | desktop 1280 | PASS (200) |
| L10 | 결제완료 (success) | `/payment/complete?paymentId=test` | desktop 1280 | PASS (200) |
| L10b | 결제완료 (fail) | `/payment/complete?code=FAILURE` | desktop 1280 | PASS (200) |
| L11 | 예약 페이지 (비인증) | `/petsitters/1/book` | desktop 1280 | PASS (200); 비인증 시 redirect 없이 렌더됨 (주의) |
| L12 | 신고 페이지 | `/report` | desktop 1280 | FAIL — HTTP 404 |

## 발견 요약 (2026-06-24)

- **매직링크 인증 불가**: Supabase 프로젝트 Auth 설정의 허용 redirect URL이 `http://localhost:3000`만 포함, `3300`은 없어서 Playwright가 3000포트에 연결 시도 → ERR_CONNECTION_REFUSED. 인증 후 흐름(채팅/마이프로필/정산) E2E 자동화 불가 상태.
- **빌드 실패**: `npm run build` TypeScript 오류(src/app/actions/reservations.ts:310)로 프로덕션 빌드 실패 중.
- **L12 /report 404**: 신고 페이지 라우트가 존재하지 않거나 다른 경로임.
- **L6 /chat 비인증 접근**: 비인증 상태에서도 redirect 없이 chat 페이지가 렌더됨 (서버 guard 확인 필요).
- **L8 /earnings 비인증**: 마찬가지로 redirect 없이 렌더됨. API는 401 반환하므로 빈 상태 표시.
- **L11 예약 페이지 비인증**: 예약 UI가 그대로 노출됨 (로그인 check는 결제 시점에서만 발생 추정).

## 19차 실행 결과 (2026-07-06) — 29/29 PASS

| ID | 시나리오 | 결과 |
| --- | --- | --- |
| L1~L12 · P1~P3 | 공개/정책 페이지 전수 | PASS (200). /terms 500 해결 유지 |
| A1~A7 | 인증 후 마이프로필·정산·채팅·예약·예약내역·시터편집 | PASS (튕김 없음) |
| A8 | 채팅방 진입 + 방 나가기 UI (b552772) | PASS (200) |
| A9 | 알림 목록 `/notifications` | PASS (200) |
| A10 | 보호자 프로필 설정 (사진 변경 연결 072398d) | PASS (200) |

- **라우트 회귀 0.** 이번 회차 신규 라우트는 없음(전부 기존 화면 수정). 바뀐 흐름(채팅 나가기·알림·설정)까지 포함해 전부 통과.
- **보안 3종은 코드/실측 별도 확인**(E2E 아닌 anon RPC 호출·소스 검증):
  - 1원 결제: 미해결 (payments.ts:86 클라 금액 신뢰, ChatClient:828).
  - 공개 RPC 개인정보: 미해결(실증) — anon `get_petsitters_filtered` → full_name·user_id·전체주소 HTTP 200.
  - 자기 예약: 미해결 (reservations.ts 두 함수에 시터==본인 가드 없음).
- 정산 콘솔: `["earnings"]` 쿼리 undefined 반환 경고(테스트 계정 수익 0). GoTrueClient 이중 인스턴스 경고 여전.
- eslint 69→57 err. tsc 0.

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

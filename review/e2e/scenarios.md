# lookpup(봐주개) E2E 시나리오

리뷰 전용 데일리 E2E. 로그인은 OAuth(카카오/구글)만 있어 자동화 불가 → 공개 페이지 렌더 위주.
실행: `cd review/e2e && npx playwright test tests/lookpup-daily.spec.ts --reporter=line`

## 시나리오 표 (living)

| ID | 시나리오 | 경로 | 뷰포트 | 비고 |
|----|----------|------|--------|------|
| L1 | 메인 | `/` | desktop 1280 + mobile 390 | 모바일 반응형 확인 |
| L2 | 펫시터 찾기 목록(+지도) | `/petsitters` | desktop 1280 + mobile 390 | 지도는 도메인 미등록으로 빈화면 가능 |
| L3 | 구인 게시판 목록 | `/board` | desktop 1280 | |
| L4 | 결제 페이지(standalone) | `/payment` | desktop 1280 | 예약 데이터 없이 접근 → placeholder |
| L5 | 로그인(OAuth 버튼 렌더) | `/auth/login` | desktop 1280 | 카카오/구글 |
| L6a | 이용약관 | `/terms` | desktop 1280 | 신규 추가 |
| L6b | 개인정보 | `/privacy` | desktop 1280 | 신규 추가 |
| L7 | 회원탈퇴 렌더 | `/myprofile/settings/withdraw` | desktop 1280 | 동작은 로그인 필요, 렌더만 |

## 발견 (2026-06-16)

- **전 페이지 HTTP 200, 10/10 통과.** 지난번 `/auth/login` 500(use client 누락)은 해결됨(현재 200, OAuth 버튼 정상 렌더).
- **모바일 반응형 품질 우수.** 메인(`/`) 모바일은 히어로/통계/카테고리/추천펫시터/이용방법/CTA가 한 칼럼으로 깔끔하게 정렬됨.
- **L2 펫시터 목록 좌측 지도 영역이 빈 흰화면.** Kakao Map JS 도메인(localhost) 미등록 = env 한계로 추정. 목록(8명)·필터·평점은 정상.
- **결제 페이지 정상.** 수수료 5% 계산, 약관/개인정보 링크 노출(법적 고지 양호). standalone 접근 시 펫시터명이 "펫시터 펫시터" placeholder로 나옴(예약 데이터 없이 진입한 탓).
- **회원탈퇴 페이지가 비로그인 상태에서도 풀 렌더됨.** 탈퇴 사유 라디오/동의 체크박스/비활성 버튼까지 정상. 다만 auth guard가 보이지 않음(렌더 단계) → 서버단 보호 여부 확인 필요.

## 빌드/타입 (참고)

- `npx tsc --noEmit`: `src/app/myprofile/page.tsx:272` `createClient` 미정의(import 누락) — 학생 버그.
- `.next/types/validator.ts`의 `src/app/pay/...` 에러 2건은 stale 캐시(실 경로는 `payment/`).

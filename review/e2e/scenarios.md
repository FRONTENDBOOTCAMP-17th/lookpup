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

## 7차 추가 (2026-06-17)
- L8 /chat: 비로그인 렌더 200, "채팅 목록을 불러오지 못했습니다" graceful 안내(크래시 없음).
- L9 /petsitters 지도(모바일): 목록·필터·정렬 OK, 지도 영역 빈화면(카카오 도메인 리뷰포트 미등록 한계, 코드버그 단정 안함).
- L5 /auth/login: 과거 500 → 200 회복.
- 실시간 채팅 메시지 중복([필수])은 코드확인(addMessage+realtime 양쪽 push, id가드 없음). 2계정 OAuth+Realtime 필요해 E2E 미확정.
- tsc 0(6차 빌드 [필수] 닫힘).

## 8차 추가 (2026-06-18) — 채팅 broadcast·구인게시판 CRUD
| ID | 시나리오 | 대상 | 기대 | 결과 |
|----|----------|------|------|------|
| L10 | 구인글 조회 API(신규) | `GET /api/requests` | 200 데이터 | pass(실데이터) |
| L11 | 구인 글쓰기(신규) | `/board/write` | 폼 렌더 | pass(비로그인에도 4단계 폼 노출 — 진입 가드 없음) |
| L12 | 게시판 목록→상세 | `/board`→상세 | 200 | pass |
| L13 | 채팅 broadcast(7차 [필수]) | `/chat` | 렌더, 중복 해소 | pass(수신부 sender_id 가드로 자기메시지 중복 해소) |

발견(8차):
- [해결] 채팅 메시지 중복: broadcast 전환 + if(m.sender_id===userId) return. 전송자 로컬 1회. 단일소스.
- [필수·이월] 회원탈퇴 미연결(withdraw handleDelete=setDone).
- [신규] board CRUD(BestSeal): 서버액션 인증+소유권 가드 탄탄. [제안] 쓰기 페이지 진입 가드 없음, api GET service client 우회, error.message 노출.
- tsc 0, anon RLS 빈응답(정상). 지도 빈화면=카카오 도메인 미등록 한계. 로그인 OAuth 전용→자동화 제외.

## 9차 추가 (2026-06-19) — Cloudinary 업로드·상세 소개 탭 (포트 3401)
| ID | 시나리오 | 대상 | 기대 | 결과 |
|----|----------|------|------|------|
| L14 | 펫시터 등록 폼(신규 Cloudinary) | `/sitter-register` (desktop+mobile) | 폼 렌더, file input | pass(200, fileInput=1, 비로그인 노출·가드 없음). 실업로드는 OAuth 로그인 필요라 미실측 |
| L15 | 펫시터 상세 소개 탭(리팩터 ee4bb80) | `/petsitters`→상세 | 탭·실데이터 렌더 | pass(소개/서비스/후기/위치 탭, 실데이터) |

발견(9차):
- [필수·이월 6차~] 회원탈퇴 미연결(withdraw handleDelete=setShowModal(false);setDone(true)). 4회 연속 이월.
- [필수] Cloudinary 서명 sha256(upload.ts:9) — Cloudinary 기본 sha1. 계정 설정 안 맞으면 Invalid Signature. 실업로드 확인 필요.
- [제안] sitter-register handleSubmit: 검증 전 업로드 → 고아 이미지. 폼 500/서버 1000 글자수 불일치.
- [제안] /board/write·edit 진입 가드 여전히 없음(8차 이월). edit는 if(!user) return으로 빈폼.
- [제안] 채팅 unread=postgres_changes + 본문=broadcast 두 경로(0sliverchoi). baaef16: conflict 중 broadcast 회귀했다 복원(머지 위생 신호).
- 관리자 라우트/대시보드 없음(role:admin 스키마만). 월요일 관리자 흐름 없음.
- tsc 0(7차부터 3회 연속). anon RLS 재검증은 리뷰 샌드박스 외부망 차단으로 8차 결과 갈음.

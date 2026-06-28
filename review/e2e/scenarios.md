# lookpup(봐주개) E2E 시나리오

리뷰 전용 데일리 E2E. 앱 로그인은 OAuth(카카오/구글)뿐이라, **앱 코드 무변경 테스트 전용 로그인**(`review/e2e/auth-setup.cjs` — service-role로 세션 발급)으로 로그인 후 동선을 검증한다.
실행: `cd review/e2e && npx playwright test tests/lookpup-daily.spec.ts --reporter=line`

## 역할 모델 (2026-06-25 확인)

- 역할은 `users.role` 단일 컬럼: `owner`(반려인·기본) / `both`(펫시터 겸 반려인) / `admin`. **펫시터가 되어도 `role`은 `sitter`가 아니라 `both`**.
- 판별 기준이 **이원화**: UI는 `role`(`both`/`admin`)로, 서버 권한은 **`sitters` 테이블에 본인 행이 있는지**로 게이팅(예약 수락·케어기록·지원). 둘이 어긋날 수 있어 등록 직후 토글 노출을 꼭 확인.
- **펫시터 등록**: `/sitter-register` 제출 → `is_verified=true` 필수(미인증이면 거부) → `sitters` 행 insert + `services` insert + `users.role='both'` 승격.
- **관리자 UI 없음**(미구현) — 리뷰·삭제 권한에서 `role==='admin'`만 참조. 관리자 시나리오는 넣지 않는다.
- 역할 계정 시드: 반려인(owner)은 테스트 로그인 그대로. 펫시터는 service-role로 `is_verified=true` 세팅 + `sitters`/`services` 행 + `role='both'`로 만들어 둔다.
- 펫시터의 "받은 예약 수락"엔 별도 페이지가 없고 **`/chat` 안에서** 수락/케어기록을 처리한다.

## 역할별 시나리오 (2026-06-25 재구성 — "쓰는 순서대로")

### [반려인] — 예약을 거는 쪽
| ID | 시나리오 | 단계 → 기대 |
| -- | -------- | ----------- |
| LO1 | 비로그인 메인→검색→상세 | `/` → `/petsitters` → `/petsitters/[id]`. 예약 버튼은 로그인 유도 |
| LO2 | 가입·로그인 | 테스트 로그인 → `/myprofile`, role=owner라 보호자/펫시터 토글 **안 보임** |
| LO3 | 펫 등록 | `/pet-register` → `/myprofile/mypets`에 노출 |
| LO4 | 직접 예약+결제 | `/petsitters/[id]/book` 날짜·펫·서비스 → `/payment` → `reservations.status=pending`, `/myprofile/booking-history` "대기" |
| LO5 | 구인글 작성 | `/board/write` 제출 → `/board/[id]` 노출, `requests.status=open` |
| LO6 | 예약 취소 | `/myprofile/booking-history/[id]` pending 취소 → `cancelled` |

### [펫시터] — 예약을 받는 쪽  (사전: is_verified + sitters 행 + role='both')
| ID | 시나리오 | 단계 → 기대 |
| -- | -------- | ----------- |
| LS1 | 펫시터 등록 | `/sitter-register` 3스텝 제출 → `sitters` 행 + role=both, `/myprofile`에 토글 등장. (미인증 계정 제출 시 "본인인증 후" 에러 — 네거티브) |
| LS2 | 펫시터 프로필 | `/myprofile/sitter-profile` 소개·서비스·지도 |
| LS3 | 구인글 지원 | `/board/[id]`(LO5 글) → 지원 → `applications` 생성 + 채팅방. (owner 계정으로 같은 버튼은 `/sitter-register`로 리다이렉트 — 확인) |
| LS4 | 정산 | `/myprofile/earnings` 렌더 |

### [연결 시나리오] — 반려인 → 펫시터 (한 흐름)
| ID | 시나리오 | 단계 → 기대 |
| -- | -------- | ----------- |
| LX1 | 구인 매칭 풀사이클 | (LO5 글) → (LS3 지원) → 반려인 `/chat` "확정"(`updateApplication selected` → reservations 생성 + `requests.status=matched`) → 펫시터 `/chat` 수락→진행 → 케어기록 작성(`care_records`) → 반려인 `/myprofile/booking-history/[id]` 확인 → 리뷰 |
| LX2 | 직접예약 수락 | (LO4 예약) → 펫시터 `/chat` 수락→진행→완료 → 반려인 내역 상태 반영 |

### 같이 볼 점
- `sitter-register` 페이지 자체엔 진입 가드가 없어 미로그인도 폼을 채울 수 있고 제출 시에만 막힘 — 네거티브 시나리오로.
- `/api/reservations/route.ts:74` — `role=sitter` 미지정 시 `sitter_id.in.()` 빈 IN 절 오류 가능. 받은 예약 호출 시 `role=sitter` 명시 확인.

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

## 발견 (2026-06-25) — 역할별 라이브 E2E (반려인 / 펫시터)

테스트 로그인(`auth-setup.cjs`) 재작성: service-role `generateLink(magiclink)`→`verifyOtp`로 세션 발급 → `@supabase/ssr` `createServerClient`로 쿠키 직렬화(형식·청크를 라이브러리에 위임) → `.auth/owner.json` storageState. dev 3300. `tests/lookpup-role.spec.ts`(신규). 캡처 `review/images/2026-06-25/lookpup-{owner,sitter}-*`. 리뷰계정(id 9b917e39)의 `users.role`을 owner↔both로 바꿔(sitters 행 임시 생성 후 삭제) 토글 차이 실측. **끝나고 role=owner·sitters 행 삭제로 원복 완료.**

- **[칭찬] 역할 구분(반려인/펫시터)이 화면에 또렷하다.** 같은 계정에서 role=owner면 `/myprofile` 사이드바가 바로 "내 프로필"로 시작(토글 없음), role=both면 사이드바 상단에 **`보호자 | 펫시터` 토글**이 노출됨. UI 게이팅(role 기반)이 의도대로 동작.
- **[칭찬] 테스트 로그인 정상 복구.** OAuth 전용이라 자동화 불가했던 로그인을, 앱 코드 무변경으로 세션 주입해 해결(`auth-setup.cjs`). owner·sitter 모두 `/myprofile`·`/myprofile/sitter-profile` 로그인 유지(로그인 페이지로 안 튕김).
- **[제안] 이미 펫시터인데도 `/myprofile` 하단 "펫시터로 활동하기"(추가 수입 만들기) CTA가 그대로 노출.** role=both 사용자에겐 숨기거나 "펫시터 프로필 관리"로 바꾸는 게 자연스럽다(사소한 UI 불일치).
- (참고) 펫시터의 "받은 예약 수락/케어기록"은 별도 페이지가 아니라 `/chat` 안에서 일어나므로, 매칭 풀사이클(LX1)은 두 계정·실데이터 쓰기가 필요해 이번엔 UI 게이팅까지만 확인(예약·결제 실데이터는 DB 오염 방지로 보류).
- service_role REST 접근 정상(시드·정리 가능). `auth-setup.cjs`는 전달 대상, 세션 파일 `.auth/`는 `.git/info/exclude`로 제외 확인.

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

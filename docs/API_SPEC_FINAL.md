# 봐주개 API 명세서

> Next.js App Router 기준. **실제 코드 컨벤션(`docs/API_USAGE.md`)에 따라 조회(GET)는 API Route, 생성·수정·삭제(mutation)는 Server Action으로 구현되어 있다.**
> Server Action은 URL이 없으므로, 이 문서에서는 가독성을 위해 `/api/...` 형태의 이름을 "리소스 식별용 레이블"로 계속 사용하되, 실제 호출 방식은 각 항목의 "방식"에 명시한다.
> 지도 검색(RPC)만 예외적으로 Next.js 서버를 거치지 않고 클라이언트에서 Supabase RPC를 직접 호출할 수도 있다.

---

## 목차

1. 공통 규칙
2. 인증 Auth
3. 사용자 Users
4. 반려동물 Pets
5. 펫시터 Sitters
6. 서비스 Services
7. 구인글 Requests
8. 지원 Applications
9. 예약 Reservations
10. 결제 Payments
11. PortOne 웹훅
12. 본인인증 Identity Verification
13. 후기 Reviews
14. 채팅 Chat
15. 알림 Notifications
16. 신고 Reports
17. 지도 검색 Map Search
18. 돌봄 일지 Care Records
19. 추가금 요청 Extra Charges
20. 관리자 Admin
21. 정산 · 계좌 Earnings / Bank Account
22. 파일 업로드 Upload

---

## 1. 공통 규칙

### Base URL

```txt
/api
```

(v1 프리픽스는 사용하지 않는다.)

### 인증 헤더

Supabase 세션 쿠키 자동 첨부. Next.js 미들웨어에서 처리한다.
API Route/Server Action 모두 `createClient()`(또는 `getServerUser()`)로 세션을 읽고, DB 접근은 RLS를 우회하는 `createServiceClient()`(service role)를 사용해 애플리케이션 레벨에서 권한을 검사한다.

### 응답 형식

```ts
// 성공
{ data: T }

// 에러
{ error: { code: string; message: string } }
```

Server Action은 `redirect()`를 호출하는 일부(`signOut`)를 제외하면 전부 이 형태를 그대로 반환한다. API Route는 여기에 HTTP status code가 추가된다.

### 공통 에러 코드

| code               | 설명                              |
| ------------------ | --------------------------------- |
| `VALIDATION_ERROR` | 입력값 유효성 오류                |
| `UNAUTHORIZED`     | 미로그인                          |
| `FORBIDDEN`        | 권한 없음 / 상태 전이 불가        |
| `NOT_FOUND`        | 리소스 없음                       |
| `CONFLICT`         | 중복 충돌                         |
| `INTERNAL_ERROR`   | 서버 오류                         |
| `BAD_REQUEST`      | 잘못된 요청 (일부 admin 액션)     |
| `AMOUNT_MISMATCH`  | PortOne 결제 금액 불일치          |
| `RECIPIENT_LEFT`   | 채팅 상대방이 방을 나가 전송 불가 |

### 구현 방식 구분

- `API Route`: `src/app/api/.../route.ts` — 조회(GET)만 존재. 예외: `POST /api/reservations`(얇은 래퍼), `POST /api/bank-account`, `POST /api/portone/webhook`.
- `Server Action`: `src/app/actions/*.ts` (`"use server"`) — 클라이언트 컴포넌트에서 직접 import해서 호출. 생성·수정·삭제 전부 여기 위치.

---

## 2. 인증 Auth

### GET /auth/callback

Supabase OAuth 콜백 처리. 카카오/구글 로그인 이후 호출된다. (`src/app/auth/callback/route.ts`)

- 방식: API Route
- 인증: 불필요

#### 분기 로직

1. `code`로 세션 교환 실패 → `/auth/login?error=oauth`
2. 이미 탈퇴한 유저(`deleted_at` 존재) → `/auth/restore`
3. 이미 본인인증 완료(`is_verified = true`) → `next` 쿼리 파라미터(기본 `/`)
4. 신규 유저 → `users` 테이블에 `role: "owner"`, `is_verified: false`로 INSERT 후 `/auth/verification`으로 이동
5. 기존 유저인데 미인증 → `/auth/verification`

> 본인인증이 없으면 앱의 나머지 화면에 접근할 수 없는 구조다 (신규/기존 유저 모두 `/auth/verification`으로 강제 이동).

---

### Server Action — signOut()

세션 삭제 후 `/`로 리다이렉트한다. (`src/app/actions/auth.ts`)

```ts
export async function signOut(): Promise<void>;
```

> 클라이언트에서 `supabase.auth.signOut()`을 직접 호출하는 경로도 병행 사용된다(`HeaderAuth.tsx` 등).

---

## 3. 사용자 Users

### GET /api/users/me

현재 로그인 유저 프로필 조회 (`src/app/api/users/me/route.ts`)

- 방식: API Route
- 인증: 필요

#### 응답 200

```json
{
  "data": {
    "id": "uuid",
    "email": "string",
    "full_name": "string",
    "profile_image": "string | null",
    "role": "owner | both | admin",
    "is_verified": "boolean",
    "created_at": "timestamptz",
    "has_sitter_profile": "boolean",
    "sitter_id": "uuid | null"
  }
}
```

> `has_sitter_profile`, `sitter_id`는 `sitters` 테이블 존재 여부로 매 요청마다 계산되어 추가된다.

---

### Server Action — updateProfile(profileImage)

프로필 이미지만 수정한다. (`src/app/actions/users.ts:7`)

```ts
export async function updateProfile(profileImage: string | null);
```

---

### Server Action — updateUserInfo(info)

이름/전화번호/생년월일을 수정한다. (`src/app/actions/users.ts:34`)

```ts
export async function updateUserInfo(info: {
  fullName: string;
  phoneNumber: string;
  birthdate: string | null;
});
```

---

### Server Action — deleteUser(reason?)

회원 탈퇴. 소프트 삭제 방식으로 처리한다. (`src/app/actions/users.ts:195`)

#### 비즈니스 로직

1. `status IN ('paid', 'in_progress')`인 예약이 존재하면 `FORBIDDEN` 반환
2. `deleted_at = now()`, `delete_reason`, `phone_number = null` 업데이트 (전화번호는 재가입 중복 체크를 피하기 위해 즉시 비운다)

#### 응답

```ts
{ data: { deleted_at: string } }
```

---

### Server Action — restoreUser()

탈퇴 계정 복구. (`src/app/actions/users.ts:69`)

- `deleted_at = null`, `delete_reason = null`, `is_verified = false`로 리셋 (재인증 필요)
- 탈퇴 상태가 아니면 `BAD_REQUEST`

---

### Server Action — searchUsers(query)

유저 이름 검색 (관리자/신고 대상 검색 등에서 사용). (`src/app/actions/users.ts:103`)

- `full_name ILIKE %query%`, 본인 제외, 탈퇴 계정 제외, 최대 10건

---

### Server Action — updateOwnerLocation(location) / getOwnerLocation()

보호자 위치 정보 저장/조회. (`src/app/actions/users.ts:133, 167`)

```ts
await updateOwnerLocation({ address, lat, lng, dong });
const { data } = await getOwnerLocation();
// data.lat, data.lng, data.address, data.dong
```

> 저장 시 좌표는 `fuzzCoordinate()`로 흐려서(fuzzing) 저장한다 (개인정보 보호).

---

## 4. 반려동물 Pets

### GET /api/pets

내 반려동물 목록 조회 (`src/app/api/pets/route.ts`)

- 방식: API Route
- 인증: 필요

#### 응답 200

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "animal_type": "dog | cat",
      "breed": "string | null",
      "age": "number",
      "gender": "MALE | FEMALE | MALE_NEUTERED | FEMALE_NEUTERED",
      "weight": "number",
      "image_url": "string | null",
      "caution": "string | null"
    }
  ]
}
```

> `animal_type`은 실제로 `dog | cat`만 허용된다 (`other`는 생성 시 거부됨, 아래 참고).

---

### Server Action — createPet(input)

반려동물 등록 (`src/app/actions/pets.ts:25`)

```ts
interface PetInput {
  name: string; // 1~20자
  animal_type: "dog" | "cat"; // "other"는 유효성 검사에서 거부됨
  breed?: string | null;
  age: number; // 0~240 (개월)
  gender: "MALE" | "FEMALE" | "MALE_NEUTERED" | "FEMALE_NEUTERED";
  weight: number; // 0 초과 100 이하
  image_url?: string | null;
  caution?: string | null;
}
```

#### 비즈니스 로직

- 1인 최대 10마리 제한 (soft-delete 안 된 것 기준). 초과 시 `FORBIDDEN`

---

### Server Action — updatePet(id, input) / deletePet(id)

(`src/app/actions/pets.ts:77, 135`)

- `updatePet`: 부분 수정, 본인 소유만 가능
- `deletePet`: 소프트 삭제(`deleted_at`)
  1. `reservation_items`를 통해 연결된 예약 중 `paid`/`in_progress` 상태가 있으면 `FORBIDDEN`
  2. 해당 pet이 걸린 `open` 상태 구인글은 `status = 'canceled'` 처리
  3. `deleted_at = now()`

---

## 5. 펫시터 Sitters

### GET /api/sitters

지도 검색용 펫시터 목록 (`src/app/api/sitters/route.ts`)

- 방식: API Route
- 인증: 불필요

#### Query Parameters

| 파라미터       | 타입     | 기본값 | 설명                     |
| -------------- | -------- | ------ | ------------------------ |
| `lat`          | number   | 필수   | 중심 위도                |
| `lng`          | number   | 필수   | 중심 경도                |
| `radius`       | number   | 5      | 검색 반경 km (1~30 clamp) |
| `service_type` | string[] | -      | 반복 쿼리, 최대 10개     |
| `animal_type`  | string[] | -      | 반복 쿼리, 최대 10개     |
| `price_min`    | number   | -      | 최소 가격                |
| `price_max`    | number   | -      | 최대 가격                |
| `rating_min`   | number   | -      | 최저 평점 (0~5 clamp)    |
| `page`         | number   | 1      | RPC 결과에 대한 메모리 페이지네이션 |
| `limit`        | number   | 20     | 1~50 clamp               |

#### 내부 처리

Supabase RPC `search_sitters_within(lat, lng, radius_km, service_types, animal_types, price_min, price_max, rating_min)` 호출 후, **RPC가 반환한 전체 결과를 메모리에서 `page`/`limit`로 슬라이스**한다 (RPC 자체는 페이지네이션 파라미터를 받지 않음).

#### 응답 200

```json
{ "data": { "sitters": ["SearchSitterRow"], "total": "number" } }
```

---

### GET /api/sitters/[id]

펫시터 상세 조회. `status = 'approved'`인 시터만 조회 가능 (그 외 404). (`src/app/api/sitters/[id]/route.ts`)

- 방식: API Route
- 인증: 불필요

#### 응답 200

```json
{
  "data": {
    "id": "uuid",
    "full_name": "string",
    "profile_image": "string | null",
    "title": "string | null",
    "introduction": "string | null",
    "career": "string | null",
    "available_area": "string",
    "base_price": "number",
    "rating": "number",
    "status": "approved",
    "is_verified": "boolean",
    "services": ["Service (is_active=true만)"],
    "review_count": "number"
  }
}
```

> `available_area`는 `parseArea()`로 시/구/동을 재조합해 반환한다.

---

### GET /api/sitters/[id]/availability

특정 시터의 예약된 날짜 구간 조회 (캘린더 UI용). (`src/app/api/sitters/[id]/availability/route.ts`)

- 방식: API Route
- 인증: 불필요

```json
{ "data": [{ "from": "timestamptz", "to": "timestamptz" }] }
```

`pending | accepted | paid | in_progress` 상태의 예약을 모두 포함한다.

---

### Server Action — createSitter(input)

펫시터 프로필 등록 (`src/app/actions/sitters.ts:41`)

```ts
interface SitterInput {
  title?: string | null;
  introduction: string; // 20~1000자
  career?: string | null;
  available_area: string;
  display_area?: string | null;
  latitude: number;
  longitude: number;
  base_price: number; // 0 이상
  request_type?: ("visit" | "foster" | "walk" | "pickup")[];
  available_animals?: ("small_dog" | "medium_dog" | "large_dog" | "cat")[];
  certificate_urls?: string[];
  activity_photo_urls?: string[];
  profile_photo_url?: string;
  services: { service_type: string; title: string; price: number; description?: string | null }[]; // price ≥ 1000
}
```

#### 비즈니스 로직

- `is_verified = false`면 `FORBIDDEN`
- 이미 `sitters` 프로필 존재 시 `CONFLICT`
- 서비스 insert 실패 시 방금 만든 sitter row도 롤백(delete)
- 성공 시 `users.role = 'both'`로 갱신, `profile_photo_url`이 있으면 `profile_image`도 갱신

---

### Server Action — updateSitter(id, input) / getMySitterProfile() / updateSitterProfile(input)

(`src/app/actions/sitters.ts:164, 224, 288`)

- `updateSitter`: 본인 소유만, `introduction` 재검증(20~1000자), 좌표는 재-fuzz
- `getMySitterProfile`: 마이페이지용 요약(서비스 제목 목록, 후기 수 포함)
- `updateSitterProfile`: 마이페이지 편집 화면 전용. `services[]`에 `id`가 있으면 수정, 없으면 **동일 제목의 soft-delete된 서비스가 있으면 복원, 없으면 신규 생성**. `deletedServiceIds[]`는 소프트 삭제 처리.

### Server Action — getSitterById(id) / getSitterServices(sitterId)

(`src/app/actions/sitters.ts:377, 402`) — 예약 폼 등 내부 화면에서 쓰는 경량 조회 버전. `GET /api/sitters/[id]`와 별개로 존재한다.

---

## 6. 서비스 Services

### GET /api/sitters/[id]/services

펫시터 서비스 목록 조회. 시터 상태가 `approved`가 아니면 404. `is_active = true`만 반환. (`src/app/api/sitters/[id]/services/route.ts`)

- 방식: API Route
- 인증: 불필요

```json
{
  "data": [
    {
      "id": "uuid",
      "sitter_id": "uuid",
      "title": "string",
      "service_type": "walk | care | hotel | pickup",
      "animal_type": "string | null",
      "price": "number",
      "description": "string | null",
      "is_active": "boolean"
    }
  ]
}
```

---

### Server Action — createService(input) / updateService(id, input) / deleteService(id)

(`src/app/actions/services.ts`)

- 로그인 유저의 `sitters.id`를 조회해 **호출자 자신의 서비스인지**로 권한을 검사한다 (URL에 sitter id를 넣지 않음).
- 가격은 1000원 이상이어야 함 (생성/수정 모두)
- `deleteService`: soft delete. `paid`/`in_progress` 예약이 걸려 있으면 `FORBIDDEN`
- `is_active: false`로 수정하면 `deactivated_at`이 자동 기록되고, `true`로 되돌리면 `null`로 리셋됨 (`updateSitterProfile`/트리거 레벨 동작, `API_USAGE.md` 참고)

---

## 7. 구인글 Requests

### GET /api/requests

구인글 목록 조회 (`src/app/api/requests/route.ts`)

- 방식: API Route
- 인증: `mine=true`일 때만 필요, 그 외 불필요

#### Query Parameters

| 파라미터       | 타입    | 설명                                                       |
| -------------- | ------- | ---------------------------------------------------------- |
| `mine`         | boolean | `true`면 내 구인글(지원/예약 상태 조인 포함), 로그인 필요   |
| `status`       | string  | open \| matched \| completed \| canceled                   |
| `request_type` | string  | 서비스 종류 필터                                            |
| `owner_id`     | uuid    | 특정 작성자 글만 조회 (공개 게시판 필터)                    |

#### 응답 200

```json
{ "data": ["Request row 전체 (+ mine=true면 pets/applications/reservations 조인)"] }
```

> 커서 기반 무한스크롤이 아니라 **전체 목록을 한 번에 반환**한다 (`next_cursor` 없음). 클라이언트에서 필요 시 자체 페이지네이션.

---

### GET /api/requests/[id]

구인글 상세 조회 (`src/app/api/requests/[id]/route.ts`)

- 방식: API Route
- 인증: 불필요

```json
{
  "data": {
    "...": "requests row 전체",
    "users": { "full_name": "...", "profile_image": "...", "is_verified": "...", "created_at": "..." },
    "pets": "Pet (단일 - pet_id FK, 배열 아님)",
    "applications": ["Application (+ sitters.users.full_name/profile_image)"]
  }
}
```

> 조회수 증가는 이 GET에서 일어나지 않는다. 상세 페이지 진입 시 별도로 `incrementViewCount(id)` Server Action을 호출해야 조회수가 오른다.

---

### Server Action — createRequest(input) / updateRequest(id, input) / deleteRequest(id) / incrementViewCount(id)

(`src/app/actions/requests.ts`)

```ts
interface RequestInput {
  pet_ids: string[]; // ⚠ 아래 참고
  title: string;
  content?: string | null;
  request_type: "walk" | "care" | "hotel" | "pickup" | "foster" | "other";
  start_datetime: string; // 오늘 이후
  end_datetime: string; // start 이후
  budget: number; // 1,000원 이상
  location: string;
  latitude: number;
  longitude: number;
  sitter_conditions?: ("require_badge" | "prefer_female" | "require_certificate" | "no_smoker")[];
}
```

> ⚠️ **알려진 제약**: `requests` 테이블은 `pet_id` 단일 컬럼만 가지고 있다(`request_pets` 조인 테이블 없음). `pet_ids`를 배열로 받지만 실제로는 **`pet_ids[0]`만 저장**된다 (`requests.ts:112,120,183`). 다중 반려동물 구인글은 아직 지원되지 않는다.

#### 비즈니스 로직

- `createRequest`: `pet_ids` 비어있으면 `VALIDATION_ERROR`, 좌표는 fuzz 처리 후 저장
- `updateRequest`: 작성자만, `status === 'matched'` 이후 수정 불가
- `deleteRequest`: 작성자만, `status !== 'open'`이면 `FORBIDDEN`
- `incrementViewCount`: 인증 불필요(비로그인도 조회수 반영), GET 라우트의 부수효과를 피하려고 분리됨

---

## 8. 지원 Applications

### GET /api/requests/[id]/applications

특정 구인글 지원 목록 조회 (`src/app/api/requests/[id]/applications/route.ts`)

- 방식: API Route
- 인증: 필요 (구인글 작성자 또는 해당 구인글에 지원한 본인 펫시터만, 그 외 `FORBIDDEN`)

```json
{
  "data": [
    {
      "id": "uuid",
      "sitter_id": "uuid",
      "sitter_full_name": "string",
      "sitter_profile_image": "string | null",
      "sitter_rating": "number",
      "message": "string | null",
      "proposed_price": "number | null",
      "status": "pending | selected | rejected | canceled",
      "created_at": "timestamptz"
    }
  ]
}
```

---

### Server Action — createApplication(requestId, input)

구인글 지원 (`src/app/actions/applications.ts:15`)

- 승인된(`approved`) 펫시터만 가능, 본인 구인글에는 지원 불가, `status !== 'open'`이면 `FORBIDDEN`, 중복 지원 `CONFLICT`
- 지원 성공 시 `chat_rooms`(`room_type: 'request'`)를 자동으로 찾거나 생성하고, 구인글 작성자에게 알림(`type: "application"`) 발송

---

### Server Action — updateApplication(id, { status }, overrides?)

지원 상태 변경 (`src/app/actions/applications.ts:222`)

```ts
updateApplication(
  id,
  { status: "selected" | "rejected" | "canceled" },
  overrides?: { startDatetime?; endDatetime?; totalPrice?; location? },
);
```

#### 비즈니스 로직

- `selected`: 구인글 작성자만.
  1. `requests.status === 'open'` 확인, 지원 펫시터가 `approved` 상태인지 확인
  2. `reservations` INSERT (`status: 'accepted'`, `application_id` 연결, `total_price = overrides.totalPrice ?? proposed_price ?? budget`)
  3. `pet_id`가 있으면 `reservation_items`에 1건 INSERT
  4. 채팅방 생성/재사용 후 `reservation_id` 연결
  5. `requests.status = 'matched'`
  6. 펫시터에게 알림(`type: "application_selected"`)
- `rejected`: 구인글 작성자만. 펫시터에게 알림(`type: "application_rejected"`)
- `canceled`: 지원한 펫시터만

또한 `updateApplicationByRoom(roomId, status, overrides?)`로 **채팅방 id를 통해** 동일 동작을 호출할 수 있다 (내부적으로 request_id+sitter_id → application 조회 후 `updateApplication` 위임).

### Server Action — getMySitterApplications() / getRequestDetailsForReservation(roomId)

시터 마이페이지용 지원 내역 목록, 예약 생성 화면에 표시할 구인글 요약 정보 조회.

---

## 9. 예약 Reservations

> 예약은 두 가지 경로로 생성된다: **(A) 구인글 채택 경로** (`updateApplication` selected 시 자동 생성) **(B) 직접 예약 경로** — 아래 두 흐름이 각각 존재.

### GET /api/reservations

예약 목록 조회 (`src/app/api/reservations/route.ts`)

- 방식: API Route
- 인증: 필요

#### Query Parameters

| 파라미터 | 타입          | 설명                                                                |
| -------- | ------------- | ------------------------------------------------------------------- |
| `role`   | owner\|sitter | 미지정 시 보호자+펫시터 예약 전체(OR 조건)                          |
| `status` | string        | pending \| accepted \| paid \| in_progress \| completed \| canceled |
| `cursor` | uuid          | 무한 스크롤                                                          |
| `limit`  | number        | 기본 10                                                              |

#### 응답 200

```json
{
  "data": {
    "reservations": [
      {
        "id": "uuid", "owner_id": "uuid", "sitter_id": "uuid",
        "service_id": "uuid | null", "request_id": "uuid | null", "application_id": "uuid | null",
        "start_datetime": "timestamptz", "end_datetime": "timestamptz",
        "total_price": "number", "status": "string", "memo": "string | null",
        "accepted_at": "timestamptz | null", "paid_at": "timestamptz | null",
        "completed_at": "timestamptz | null", "canceled_at": "timestamptz | null",
        "pets": ["Pet (reservation_items 조인)"]
      }
    ],
    "next_cursor": "uuid | null"
  }
}
```

---

### POST /api/reservations

직접 예약 생성 (보호자 → 펫시터). 요청 검증 후 `createReservation` Server Action에 위임하는 **얇은 REST 래퍼**다 (다른 리소스와 달리 route가 존재). (`src/app/api/reservations/route.ts:106`)

- 방식: API Route
- 인증: 필요

```json
{
  "sitter_id": "uuid",
  "service_id": "uuid",
  "pet_ids": ["uuid"],
  "start_datetime": "timestamptz (오늘 이후)",
  "end_datetime": "timestamptz (start 이후)",
  "memo": "string (≤500자) | null"
}
```

#### 비즈니스 로직 (`createReservation`, `src/app/actions/reservations.ts:50`)

- 본인 소유 pet만 예약 가능(`verifyPetOwnership`), 서비스가 요청한 시터 소유인지/활성 상태인지 검증, 본인에게 예약 불가
- `total_price = service.price` (일수 계산 없음 — B경로의 `createPetsitterReservationRequest`와 다름, 아래 참고)
- `pet_ids` 전체가 `reservation_items`에 매핑됨(이 경로는 요청과 달리 다중 pet을 실제로 저장한다)

---

### GET /api/reservations/[id]

예약 상세 조회. **보호자 전용** — 시터가 호출하면 `FORBIDDEN` (`row.owner_id !== user.id`). (`src/app/api/reservations/[id]/route.ts`)

- 방식: API Route
- 인증: 필요 (본인 예약의 보호자만)

> 시터가 자신의 예약을 조회하려면 이 라우트 대신 `getReservationById` Server Action(양쪽 역할 지원)을 사용해야 한다.

---

### Server Action — updateReservation(id, { status, cancel_reason? })

예약 상태 변경 (`src/app/actions/reservations.ts:175`)

#### 상태 전이 규칙

| 액션          | 허용 현재 상태              | 권한               |
| ------------- | --------------------------- | ------------------ |
| `accepted`    | pending                     | 펫시터             |
| `in_progress` | paid                        | 펫시터             |
| `completed`   | in_progress                 | 펫시터             |
| `canceled`    | pending \| accepted \| paid | 보호자 또는 펫시터 |

허용되지 않는 전이는 `FORBIDDEN`(`"{현재상태} 상태에서 {요청상태}로 변경할 수 없습니다."`)으로 거부된다.
`cancelReservationAndNotify(id, reason?)`는 취소 후 관련 채팅방에 취소 시스템 메시지까지 자동 삽입하는 래퍼다.

---

### 직접 예약(채팅) 흐름 — 구인글과 무관한 별도 경로

마이페이지 시터 상세에서 "예약 요청"을 보내면 시작되는, **채팅 기반** 예약 흐름. 구인글/지원 플로우와 완전히 분리되어 있다. (`src/app/actions/reservations.ts`)

| 함수 | 설명 |
| --- | --- |
| `createPetsitterReservationRequest(input)` | 보호자가 시터에게 예약 요청. `총액 = 서비스 1일 단가 × 이용일수`(KST 달력일 기준)로 계산. `chat_rooms(room_type: 'reservation_request')` 생성 + 안내 메시지 삽입. 동일 시터에게 진행 중인 요청이 있으면 `CONFLICT` |
| `acceptReservationRequest(reservationId)` | 시터가 수락. `pending → accepted`, 채팅방을 `room_type: 'direct'`로 전환, 결제 요청 메시지 자동 발송 |
| `rejectReservationRequest(reservationId)` | 시터가 거절. `status = 'canceled'` |
| `sitterStartService(reservationId)` | 시터가 서비스 시작. `accepted|paid → in_progress` |
| `ownerConfirmServiceComplete(reservationId)` | 보호자가 서비스 완료를 확인. `accepted|paid|in_progress → completed`, 채팅방에 완료 확인 메시지 |
| `updateReservationDetails(id, input)` | 일정/메모 수정 (양측 모두 가능, 완료·취소 건 제외) |
| `getReservationRequestDetails(id)` / `getReservationsByRoom(roomId)` / `getReadyReservationsForRoom(roomId)` / `getActiveReservationsForRoom(roomId)` | 채팅 화면에 예약 카드를 그리기 위한 조회 전용 함수들 |
| `getReservationStatuses(ids)` | 여러 예약 id의 상태를 한 번에 조회 |
| `getMyReservations()` / `getMySitterReservations()` / `getReservationById(id)` | 마이페이지 예약 내역(보호자/시터)과 상세 — `booking-history` 화면 전용 가공 데이터(한글 날짜/상태 라벨 등) 반환 |

---

## 10. 결제 Payments

### Server Action — createPayment(reservationId, payMethod)

결제 초기화 (`src/app/actions/payments.ts:42`)

```ts
createPayment(reservationId: string, payMethod: "CARD" | "VIRTUAL_ACCOUNT" | "TRANSFER");
```

#### 비즈니스 로직

1. `reservation.status === 'accepted'`만 허용 (그 외 `FORBIDDEN`)
2. 동일 예약에 `status='paid'` 결제가 이미 있으면 `CONFLICT`
3. 금액이 1,000원 미만이면 `VALIDATION_ERROR`
4. **`FEE_RATE = 0.05`**(5%) 적용 — `platform_fee = floor(amount * 0.05)`, `settle_amount = amount - platform_fee`
5. `payments` 테이블에 `status: 'ready'`로 INSERT, PortOne 결제 요청용 `payment_id` 생성/반환

```json
{ "data": { "payment_id": "string", "amount": "number", "order_name": "string" } }
```

---

### Server Action — cancelPayment(paymentId, reason)

결제 취소. 서비스 시작 전 전액 취소만 허용. (`src/app/actions/payments.ts:355`)

1. 본인(보호자) 확인, `status === 'paid'` 확인
2. `start_datetime <= now()`면 `FORBIDDEN`
3. PortOne 전액 취소 API 호출 → 성공 시 `payments.status='canceled'`, `reservations.status='canceled'`

```json
{ "data": { "canceled_amount": "number" } }
```

---

### Server Action — createExtraPayment(extraChargeId, payMethod?)

추가금 결제 초기화. `payMethod` 기본값 `"CARD"`. (`src/app/actions/payments.ts:131`) — 19장 참고.

### Server Action — cancelPendingPayment(paymentId) / verifyAndConfirmPayment(paymentId)

- `cancelPendingPayment`: 결제창 이탈 등으로 `ready` 상태 결제를 정리(`status='failed'`)하고, 연결된 추가금 요청이 있으면 `pending`으로 되돌린다.
- `verifyAndConfirmPayment`: 웹훅과 별개로 클라이언트에서 결제 완료 직후 서버 재확인이 필요할 때 사용. PortOne 조회 → 금액 일치 확인 → `payments/reservations` 갱신 (멱등: 이미 `paid`면 그대로 통과).

---

## 11. PortOne 웹훅

### POST /api/portone/webhook

PortOne V2 결제 이벤트 수신 (`src/app/api/portone/webhook/route.ts`)

- 방식: API Route
- 인증: `portone-webhook-id/timestamp/signature` 헤더 기반 HMAC-SHA256 서명 검증

#### 처리 이벤트

| 이벤트                   | 처리                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `Transaction.Paid`       | PortOne 재조회로 금액 검증(불일치 시 `AMOUNT_MISMATCH`) → `payments.status='paid'`, `extra_charges.status='paid'`(연결된 경우), 예약이 `accepted`였다면 `reservations.status='paid'`로, 아니면 `total_price`만 누적 갱신 |
| `Transaction.Cancelled`  | `payments.status='canceled'`, `reservations.status='canceled'`, `extra_charges.status='canceled'`           |
| `Transaction.Failed`     | `payments.status='failed'`, `extra_charges.status='rejected'`                                               |

> `extra_charges` 테이블 상태까지 이 웹훅에서 함께 갱신된다 — 19장(추가금) 참고.

---

## 12. 본인인증 Identity Verification

### Server Action — completeSignup(identityVerificationId)

**최초 가입 시** 사용. (`src/app/auth/verification/actions.ts`)

1. PortOne `GET /identity-verifications/{id}` 조회, `status !== 'VERIFIED'`면 에러
2. `verifiedCustomer`의 전화번호가 이미 가입되어 있으면(`deleted_at IS NULL` 기준) 에러
3. `users` 업데이트: `full_name`, `birthdate`, `phone_number`, `gender`, `is_verified=true`

```ts
// 반환 형식이 다른 Server Action들과 다름: { error: string } | { success: true }
```

### Server Action — verifyIdentity(identityVerificationId)

**이미 가입된 유저**가 인증을 추가/갱신할 때 사용. (`src/app/actions/identity-verification.ts:10`)

- 이미 `is_verified = true`면 재검증 없이 성공 처리
- PortOne 404 → `VERIFICATION_NOT_FOUND`
- `status !== 'VERIFIED'` → `VALIDATION_ERROR`

```json
{ "data": { "is_verified": true } }
```

> `completeSignup`과 `verifyIdentity`는 서로 다른 파일/반환 형식을 가진 별개의 함수다. 혼용하지 않도록 주의.

---

## 13. 후기 Reviews

### GET /api/sitters/[id]/reviews

펫시터 후기 목록 조회 (`src/app/api/sitters/[id]/reviews/route.ts`)

- 방식: API Route
- 인증: 불필요

```json
{
  "data": {
    "reviews": [
      {
        "id": "uuid", "owner_id": "uuid",
        "owner_full_name": "string", "owner_profile_image": "string | null",
        "rating": "number", "content": "string",
        "image_urls": ["string"], "tags": ["string"],
        "detail_ratings": { "친절함": "number", "...": "number" },
        "created_at": "timestamptz"
      }
    ],
    "average_rating": "number",
    "total": "number",
    "next_cursor": "uuid | null"
  }
}
```

> `image_urls`, `tags`, `detail_ratings` 필드가 실제로 존재한다(예전 명세엔 없었음).

---

### GET /api/reviews/myreview

내가 작성한 후기 목록 조회 (`src/app/api/reviews/myreview/route.ts`)

- 방식: API Route
- 인증: 필요

```json
{
  "data": [
    {
      "id": "uuid", "rating": "number", "content": "string",
      "image_urls": ["string"], "tags": ["string"], "detail_ratings": "object",
      "created_at": "timestamptz",
      "sitter_full_name": "string", "sitter_profile_image": "string | null"
    }
  ]
}
```

---

### Server Action — createReview(input) / deleteReview(id)

(`src/app/actions/reviews.ts`)

```ts
createReview({
  reservation_id: string;
  rating: number; // 1~5 정수
  content: string; // ≤1000자
  image_urls?: string[];
  tags?: string[];
  detail_ratings?: Record<string, number>;
});
```

#### 비즈니스 로직

1. 예약자 본인만, `reservations.status === 'completed'`만
2. `completed_at`으로부터 7일 이내
3. 이미 후기 작성 시 `CONFLICT`
4. 저장 후 해당 시터의 `sitters.rating`을 전체 후기 평균으로 재계산

`deleteReview`: 작성자 또는 `role === 'admin'`만 가능. 삭제 후 평점 재계산.

---

## 14. 채팅 Chat

Supabase Realtime(`postgres_changes` on `messages`)으로 실시간 수신하고, API Route는 초기 데이터 로드용으로만 사용한다.

### GET /api/chat/rooms

채팅방 목록 조회 (`src/app/api/chat/rooms/route.ts` → `getChatRoomsData()` 위임)

- 방식: API Route
- 인증: 필요

```json
{
  "data": [
    {
      "id": "uuid",
      "room_type": "direct | request | reservation_request",
      "owner_id": "uuid", "sitter_id": "uuid",
      "reservation_id": "uuid | null", "request_id": "uuid | null",
      "other_user_full_name": "string", "other_user_profile_image": "string | null",
      "sitter_rating": "number | null",
      "unread_count": "number",
      "request_title": "string | null", "request_status": "string | null",
      "application_status": "string | null",
      "reservation_status": "string | null", "reservation_service_title": "string | null",
      "reservation_pet_names": ["string"], "reservation_start_datetime": "timestamptz | null",
      "last_message": "string | null", "last_message_at": "timestamptz | null",
      "recipient_left": "boolean"
    }
  ]
}
```

> `room_type`에 `reservation_request`(직접 예약 요청 중 상태)가 추가로 존재한다. 나간 상대방 여부는 `owner_left`/`sitter_left` 원본 대신 `recipient_left`(내 관점에서 상대가 나갔는지)로 가공되어 내려온다.

---

### DELETE /api/chat/rooms/[id]

채팅방 나가기. (`src/app/api/chat/rooms/[id]/route.ts`)

- 방식: API Route
- 인증: 필요 (참여자만)

호출자가 owner면 `owner_left=true`, sitter면 `sitter_left=true`로 갱신. **양쪽 모두 나가면 방이 실제로 삭제**된다.

---

### GET /api/chat/rooms/[id]/messages

메시지 목록 조회(초기 로드). (`src/app/api/chat/rooms/[id]/messages/route.ts`)

- 방식: API Route
- 인증: 필요, 참여자만

```json
{ "data": { "messages": [{ "id", "sender_id", "content", "is_read", "created_at" }], "next_cursor": "uuid | null" } }
```

---

### Server Action — findOrCreateRoom(input) / findChatRoomAsSitter(ownerId, reservationId?)

(`src/app/actions/chat.ts:260, 356`)

```ts
findOrCreateRoom({
  sitter_id: string;
  room_type: "request" | "direct" | "reservation_request";
  request_id?: string | null;
  reservation_id?: string | null;
});
```

`room_type`별로 기존 방을 서로 다른 키(`request_id`+`sitter_id` / `reservation_id` / `owner_id`+`sitter_id`)로 찾고, 없으면 생성한다.

---

### Server Action — 메시지 전송 함수들

(`src/app/actions/chat.ts`) 모두 `chat_rooms.last_message`/`last_message_at`을 함께 갱신하고, 필요 시 상대방에게 알림(`type: "message"`)을 보낸다. 상대가 채팅방을 나갔으면(`isRecipientActive` false) 일부 함수는 알림을 건너뛴다.

| 함수 | 용도 |
| --- | --- |
| `sendMessage(roomId, content)` | 일반 텍스트 (최대 1000자) |
| `sendImageMessage(roomId, imageUrl)` | 이미지 |
| `sendSystemMessage(roomId, content)` | 시스템 안내 |
| `sendPaymentRequestMessage(roomId, data, reservationId?)` | 결제 요청 카드. `data.isExtra=true`면 **`extra_charges` row를 생성**(19장 참고) |
| `sendPaymentCompleteMessage(roomId, data)` | 결제 완료 카드 |
| `sendAutoPaymentRequestMessage(roomId, data)` | 시스템이 시터 명의로 자동 발송하는 결제 요청 |
| `sendApplicationSelectedMessage` / `sendApplicationRejectedMessage` | 구인글 지원 채택/거절 안내 카드 |
| `sendReservationCanceledMessage` | 예약 취소 안내 |
| `sendServiceStartMessage(roomId, reservationId)` / `sendServiceCompleteMessage(roomId, reservationId)` | 서비스 시작/완료 카드 (시터 전용) |
| `sendReservationEditMessage` / `sendReservationEditResponseMessage` | 예약 일정 수정 요청/응답 카드 |

메시지 `content`는 특수 프리픽스(`__payment_request__:`, `__image__:`, `__system__:` 등, `src/lib/chatMessagePrefixes.ts`)로 시작하는 문자열에 JSON을 붙이는 방식으로 카드형 메시지를 표현한다. 일반 텍스트는 프리픽스가 없다.

### Server Action — markRoomRead(roomId)

내가 보내지 않은 메시지를 읽음 처리. (`src/app/actions/chat.ts:1198`)

---

## 15. 알림 Notifications

### GET /api/notifications

알림 목록 조회 (`src/app/api/notifications/route.ts`)

- 방식: API Route
- 인증: 필요

```json
{
  "data": {
    "notifications": [{ "id", "type", "title", "content", "is_read", "link_url", "created_at" }],
    "unread_total": "number",
    "unread_by_type": { "message": 3, "reservation": 1 },
    "next_cursor": "uuid | null"
  }
}
```

> `unread_by_type`(타입별 안읽음 개수)이 응답에 포함된다.

### Server Action — markNotificationRead(id) / markAllNotificationsRead()

(`src/app/actions/notifications.ts`)

---

### 알림 type 값 (실제 사용 중)

`notifications.type`은 **Zod enum으로 강제되지 않는 자유 문자열**이며, 실제 코드에서 발급하는 값은 다음과 같다 (예전 명세의 `reservation_requested` / `payment_confirmed` / `review_received` / `sitter_approved` / `report_processed` 등은 현재 코드 어디에서도 발급되지 않는다):

| type                   | 발급 위치                                             | 설명                     |
| ---------------------- | ------------------------------------------------------ | ------------------------ |
| `message`              | `chat.ts` 각 send\* 함수                                | 새 메시지/카드 알림      |
| `application`          | `applications.ts` `createApplication`                   | 새 지원자 도착           |
| `application_selected` | `applications.ts` `updateApplication`                   | 지원 채택됨              |
| `application_rejected` | `applications.ts` `updateApplication`                   | 지원 거절됨              |
| `reservation`          | `reservations.ts` (예약 요청/수락/거절/완료 확인 등)   | 예약 상태 변화 일반      |
| `care_record`          | `care-records.ts` `createCareRecord`                    | 돌봄기록 등록            |

---

## 16. 신고 Reports

### Server Action — createReport(input)

(`src/app/actions/reports.ts:17`)

```ts
createReport({
  target_type: "user" | "sitter" | "request" | "service" | "reservation" | "review" | "message";
  target_id: string;
  reason: string;
  content?: string | null;
  image_urls?: string[] | null;
});
```

```json
{ "data": { "id": "uuid", "status": "pending" } }
```

### Server Action — updateReport(input) — 관리자 전용

(`src/app/actions/reports.ts:81`)

```ts
updateReport({ id: string; status: "pending"|"processing"|"completed"|"rejected"; admin_memo?: string | null });
```

`role === 'admin'`이 아니면 `FORBIDDEN`. `handled_by`, `handled_at`을 자동 기록한다.

---

## 17. 지도 검색 Map Search

`GET /api/sitters`(5장)가 이 RPC를 감싸고 있으나, 클라이언트에서 Supabase RPC를 직접 호출할 수도 있다.

### RPC: search_sitters_within

```sql
search_sitters_within(
  lat float8, lng float8, radius_km float8,
  service_types text[], animal_types text[],
  price_min int, price_max int, rating_min float8
) RETURNS TABLE (sitter_id uuid, distance_km float8, ...)
```

- PostGIS `ST_DWithin` 기반 반경 검색, 거리순 정렬
- RPC 자체는 페이지네이션을 지원하지 않는다 (필요하면 `/api/sitters`처럼 호출부에서 슬라이스)

---

## 18. 돌봄 일지 Care Records

> `care_records` 테이블 기반. 전용 API Route는 없고 전부 Server Action이다.

### Server Action — createCareRecord(payload)

(`src/app/actions/care-records.ts:14`) — 시터 전용.

```ts
createCareRecord({
  reservationId: string;
  type: string; // visit | check_in | check_out | pickup_start | pickup_done | handover | meal | walk | potty | medication | play | rest | condition | photo | memo 등
  serviceType?: string | null;
  title: string;
  statusText: string;
  content: string;
  fields: Record<string, string>;
  imageUrls: string[];
});
```

성공 시 보호자에게 `type: "care_record"` 알림 발송.

### Server Action — getCareRecordsByReservationId(reservationId) / getInProgressReservationByOwnerAndSitter(ownerId, sitterId)

권한: 해당 예약의 보호자 또는 시터만.

---

## 19. 추가금 요청 Extra Charges

> `extra_charges` 테이블 기반. **독립적인 REST 리소스가 아니라 채팅 메시지 전송의 부수효과로 생성되고, 결제 흐름에 의해서만 상태가 전이된다.** (예전 명세의 `POST /api/reservations/[id]/extra-charges`, `PATCH /api/extra-charges/[id]` 같은 별도 엔드포인트는 존재하지 않는다.)

### 상태 흐름

```
pending → approved(결제 시작) → paid(웹훅)
       → canceled (결제창 이탈 시 자동 되돌림)
       → rejected (PortOne 결제 실패 웹훅)
```

### 생성 — sendPaymentRequestMessage(roomId, { isExtra: true, amount, reason }, reservationId)

(`src/app/actions/chat.ts:649`) — 시터가 채팅에서 "추가금 요청" 카드를 보내면 그 부수효과로 `extra_charges`에 `status='pending'` row가 INSERT된다.

- 금액 1,000원 ~ 500,000원
- 요청 대상 예약이 해당 채팅방(owner/sitter)과 무관하면 `FORBIDDEN`
- 메시지 insert 실패 시 방금 만든 `extra_charges` row도 롤백

### 결제 — createExtraPayment(extraChargeId, payMethod?)

(`src/app/actions/payments.ts:131`, 10장 참고)

1. 대상 `extra_charges.status === 'pending'` 확인, 요청자(보호자) 본인 확인
2. 예약 상태가 `in_progress`/`paid`인지 확인
3. `FEE_RATE = 0.05`로 `platform_fee`/`settle_amount` 계산, `payments` INSERT
4. `extra_charges.status = 'approved'`, `payment_id` 연결

### 결제 취소/실패 시 되돌림 — cancelPendingPayment(paymentId)

결제창을 닫는 등으로 `ready` 결제를 정리할 때, 연결된 `extra_charges`를 다시 `status='pending', payment_id=null`로 되돌린다.

### 웹훅 반영 (11장)

- `Transaction.Paid` → `extra_charges.status = 'paid'`
- `Transaction.Cancelled` → `extra_charges.status = 'canceled'`
- `Transaction.Failed` → `extra_charges.status = 'rejected'`

> "보호자가 결제 없이 승인/거절만 하는" API는 존재하지 않는다 — 추가금은 결제를 시도하는 순간 `approved`가 되고, 그 결제의 성공/실패에 따라 `paid`/`rejected`가 결정된다.

---

## 20. 관리자 Admin

> 전부 Server Action(`src/app/actions/admin.ts`), `role === 'admin'`이 아니면 전부 `FORBIDDEN`(`requireAdmin()`).

| 함수 | 설명 |
| --- | --- |
| `adminSuspendUser(targetId, targetType, suspendedUntil)` | 유저/시터 계정 정지 (`users.suspended_until` 설정). `targetType`이 `sitter`면 내부적으로 `sitters.user_id`로 변환 |
| `adminUnsuspendUser(targetId, targetType)` | 정지 해제 |
| `adminDemoteUser(targetId, targetType)` | 펫시터 권한 강등 (`role: both → owner`). `both`가 아니면 `BAD_REQUEST` |
| `adminCancelRequest(requestId)` | 구인글 강제 취소 |
| `getAdminReports()` | 전체 신고 목록 (신고자 정보 조인) |
| `getAdminReservations()` | 전체 예약 목록 (최근 200건, 보호자/시터 정보 조인) |
| `adminUpdateReservationStatus(id, status, cancelReason?)` | 예약 상태 강제 변경 (일반 `updateReservation`과 별개 경로, 전이 규칙 검증 없음) |
| `getAdminSitters()` | 전체 시터 목록 |
| `adminUpdateSitterStatus(sitterId, status)` | 시터 승인/거절 상태 변경 (`pending\|approved\|rejected`) |
| `adminDeactivateService(serviceId)` | 서비스 강제 비활성화 |

---

## 21. 정산 · 계좌 Earnings / Bank Account

### GET / POST /api/bank-account

시터 정산 계좌 등록/조회 (`src/app/api/bank-account/route.ts`)

- 방식: API Route
- 인증: 필요

```json
// GET 응답
{ "data": { "id": "uuid", "bank_name": "string", "account_number": "string", "account_holder": "string" } | null }
```

```json
// POST 요청
{ "bank_name": "string", "account_number": "string", "account_holder": "string" }
```

`user_id` 기준 upsert(단일 계좌만 유지).

### GET /api/earnings

시터 정산/수익 대시보드 데이터 (`src/app/api/earnings/route.ts`)

- 방식: API Route
- 인증: 필요 (시터 프로필 없으면 `FORBIDDEN`)

`payments`(status: paid/ready, 최근 50건) + 최근 12개월 월별 합계(`settle_amount` 기준)를 `buildEarningsData()`(`src/utils/earnings.ts`)로 가공해 반환한다.

---

## 22. 파일 업로드 Upload

### Server Action — getCloudinarySignature(folder)

(`src/app/actions/upload.ts`) — 클라이언트가 Cloudinary에 직접 업로드하기 위한 서명을 발급한다 (서버는 실제 파일을 프록시하지 않음).

```ts
getCloudinarySignature(folder: string);
// → { cloudName, apiKey, timestamp, signature, folder }
```

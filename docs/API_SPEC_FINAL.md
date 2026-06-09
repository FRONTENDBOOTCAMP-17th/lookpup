# 봐주개 API 명세서

> Next.js 15 App Router 기준. Supabase 직접 호출은 클라이언트/서버 모두 가능하므로 여기서는 **Next.js API Routes** (`/api/...`) 와 **Server Actions** 로 구분하여 명세한다.

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

---

## 1. 공통 규칙

### Base URL

```txt
/api/v1
```

### 인증 헤더

Supabase 세션 쿠키 자동 첨부  
Next.js 미들웨어에서 처리한다.  
Server Actions에서는 `createServerClient()`로 세션을 읽는다.

### 응답 형식

```ts
// 성공
{
  data: T;
}

// 에러
{
  error: {
    code: string;
    message: string;
  }
}
```

### 공통 에러 코드

| HTTP | code               | 설명               |
| ---- | ------------------ | ------------------ |
| 400  | `VALIDATION_ERROR` | 입력값 유효성 오류 |
| 401  | `UNAUTHORIZED`     | 미로그인           |
| 403  | `FORBIDDEN`        | 권한 없음          |
| 404  | `NOT_FOUND`        | 리소스 없음        |
| 409  | `CONFLICT`         | 중복 충돌          |
| 500  | `INTERNAL_ERROR`   | 서버 오류          |

### 구현 방식 구분

- `API Route`: `app/api/.../route.ts`
- `Server Action`: `app/.../actions.ts` (`"use server"`)

---

## 2. 인증 Auth

### GET /auth/callback

Supabase OAuth 콜백 처리  
카카오/구글 로그인 이후 호출된다.

- 방식: API Route
- 인증: 불필요

#### Query

| 파라미터 | 타입   | 설명                        |
| -------- | ------ | --------------------------- |
| `code`   | string | Supabase가 발급한 인증 코드 |

#### 응답

- 신규 유저: `/onboarding` 리다이렉트
- 기존 유저: `/` 리다이렉트

---

### Server Action — signOut()

세션 삭제 후 `/`로 리다이렉트한다.

```ts
// 위치: app/actions/auth.ts
export async function signOut(): Promise<void>;
```

---

## 3. 사용자 Users

### GET /api/users/me

현재 로그인 유저 프로필 조회

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
    "has_sitter_profile": "boolean",
    "created_at": "timestamptz"
  }
}
```

---

### PATCH /api/users/me

프로필 수정

- 방식: Server Action
- 인증: 필요

#### Request Body

```json
{
  "profile_image": "string (Cloudinary URL) | null"
}
```

#### 응답 200

수정된 유저 객체 반환

---

### DELETE /api/users/me

회원 탈퇴  
소프트 삭제 방식으로 처리한다.

- 방식: Server Action
- 인증: 필요

#### 비즈니스 로직

1. `status IN ('paid', 'in_progress')`인 예약이 존재하면 `403` 반환
2. `users.deleted_at = now()` 업데이트

#### 응답 200

```json
{
  "data": {
    "deleted_at": "timestamptz"
  }
}
```

---

## 4. 반려동물 Pets

### GET /api/pets

내 반려동물 목록 조회

- 방식: API Route
- 인증: 필요

#### 응답 200

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "animal_type": "dog | cat ",
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

---

### POST /api/pets

반려동물 등록

- 방식: Server Action
- 인증: 필요

#### Request Body

```json
{
  "name": "string (1~20자)",
  "animal_type": "dog | cat",
  "breed": "string | null",
  "age": "number (0~240 개월)",
  "gender": "MALE | FEMALE | MALE_NEUTERED | FEMALE_NEUTERED",
  "weight": "number (>0, ≤100)",
  "image_url": "string | null",
  "caution": "string | null"
}
```

#### 비즈니스 로직

- 1인 최대 10마리 제한
- 초과 시 `403` 반환

#### 응답 201

생성된 pet 객체 반환

---

### PATCH /api/pets/[id]

반려동물 정보 수정

- 방식: Server Action
- 인증: 필요
- 권한: 본인 소유 반려동물만 수정 가능

#### Request Body

POST와 동일하며 부분 수정 가능

#### 응답 200

수정된 pet 객체 반환

---

### DELETE /api/pets/[id]

반려동물 삭제  
소프트 삭제 방식으로 처리한다.

- 방식: Server Action
- 인증: 필요
- 권한: 본인 소유 반려동물만 삭제 가능

#### 비즈니스 로직

1. `status IN ('paid', 'in_progress')`인 예약 존재 시 `403` 반환
2. 해당 pet의 `open` 상태 구인글은 `status = 'canceled'` 처리
3. `pets.deleted_at = now()` 업데이트

#### 응답 200

```json
{
  "data": {
    "deleted_at": "timestamptz"
  }
}
```

---

## 5. 펫시터 Sitters

### GET /api/sitters

펫시터 목록 조회  
지도 검색에서 사용한다.

- 방식: API Route
- 인증: 불필요

#### Query Parameters

| 파라미터       | 타입        | 기본값 | 설명                            |
| -------------- | ----------- | ------ | ------------------------------- |
| `lat`          | number      | 필수   | 중심 위도                       |
| `lng`          | number      | 필수   | 중심 경도                       |
| `radius`       | 1\|3\|5\|10 | 5      | 검색 반경 km                    |
| `service_type` | string[]    | -      | walk \| care \| hotel \| pickup |
| `animal_type`  | string[]    | -      | dog \| cat \                    |
| `price_min`    | number      | -      | 최소 가격                       |
| `price_max`    | number      | -      | 최대 가격                       |
| `rating_min`   | number      | -      | 최저 평점                       |
| `page`         | number      | 1      | 페이지                          |
| `limit`        | number      | 20     | 페이지당 개수                   |

#### 내부 처리

Supabase RPC `search_sitters_within(lat, lng, radius, filters)` 호출  
PostGIS 기반 반경 검색 처리

#### 응답 200

```json
{
  "data": {
    "sitters": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "full_name": "string",
        "profile_image": "string | null",
        "title": "string | null",
        "rating": "number",
        "base_price": "number",
        "latitude": "number",
        "longitude": "number",
        "distance_km": "number",
        "service_types": ["string"],
        "animal_types": ["string"],
        "is_verified": "boolean",
        "status": "approved"
      }
    ],
    "total": "number"
  }
}
```

---

### GET /api/sitters/[id]

펫시터 상세 조회

- 방식: API Route
- 인증: 불필요

#### 응답 200

```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "full_name": "string",
    "profile_image": "string | null",
    "title": "string | null",
    "introduction": "string | null",
    "career": "string | null",
    "available_area": "string | null",
    "latitude": "number",
    "longitude": "number",
    "base_price": "number",
    "rating": "number",
    "status": "pending | approved | rejected",
    "is_verified": "boolean",
    "services": ["Service"],
    "review_count": "number"
  }
}
```

---

### POST /api/sitters

펫시터 프로필 등록

- 방식: Server Action
- 인증: 필요
- 조건: 본인인증 완료 필요

#### Request Body

```json
{
  "title": "string | null",
  "introduction": "string (20~1000자)",
  "career": "string | null",
  "available_area": "string",
  "latitude": "number",
  "longitude": "number",
  "base_price": "number (≥0)",
  "services": [
    {
      "service_type": "walk | care | hotel | pickup",
      "title": "string",
      "price": "number (≥1000)",
      "description": "string | null"
    }
  ]
}
```

#### 비즈니스 로직

- 이미 `sitters`에 프로필 존재하면 `409`
- `is_verified = false`이면 `403`

#### 응답 201

생성된 sitter 객체 반환

---

### PATCH /api/sitters/[id]

펫시터 프로필 수정

- 방식: Server Action
- 인증: 필요
- 권한: 본인 소유 펫시터 프로필만 수정 가능

#### 응답 200

수정된 sitter 객체 반환

---

## 6. 서비스 Services

### GET /api/sitters/[id]/services

펫시터 서비스 목록 조회

- 방식: API Route
- 인증: 불필요

#### 응답 200

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

### POST /api/services

서비스 추가

- 방식: Server Action
- 인증: 필요
- 권한: 펫시터만 가능

#### Request Body

위 서비스 객체에서 `id`, `sitter_id` 제외

#### 응답 201

생성된 service 객체 반환

---

### PATCH /api/services/[id]

서비스 수정

- 방식: Server Action
- 인증: 필요
- 권한: 소유 펫시터만 가능

#### 응답 200

수정된 service 객체 반환

---

### DELETE /api/services/[id]

서비스 삭제

- 방식: Server Action
- 인증: 필요
- 권한: 소유 펫시터만 가능

#### 비즈니스 로직

- `status IN ('paid', 'in_progress')`인 예약이 있으면 `403` 반환

#### 응답 200

삭제 처리 성공

---

## 7. 구인글 Requests

### GET /api/requests

구인글 목록 조회

- 방식: API Route
- 인증: 필요

#### Query Parameters

| 파라미터       | 타입   | 설명                                     |
| -------------- | ------ | ---------------------------------------- |
| `status`       | string | open \| matched \| completed \| canceled |
| `request_type` | string | 서비스 종류 필터                         |
| `owner_id`     | uuid   | 내 글만 조회 시 (본인만 가능)            |
| `cursor`       | uuid   | 무한 스크롤 커서                         |
| `limit`        | number | 기본 20                                  |

#### 응답 200

```json
{
  "data": {
    "requests": [
      {
        "id": "uuid",
        "owner_id": "uuid",
        "owner_full_name": "string",
        "pet_id": "uuid",
        "title": "string",
        "content": "string | null",
        "request_type": "string",
        "start_datetime": "timestamptz",
        "end_datetime": "timestamptz",
        "budget": "number",
        "location": "string",
        "status": "open | matched | completed | canceled",
        "created_at": "timestamptz"
      }
    ],
    "next_cursor": "uuid | null"
  }
}
```

---

### POST /api/requests

구인글 작성

- 방식: Server Action
- 인증: 필요

#### Request Body

```json
{
  "pet_id": "uuid",
  "title": "string",
  "content": "string | null",
  "request_type": "walk | care | hotel | pickup",
  "start_datetime": "timestamptz (오늘 이후)",
  "end_datetime": "timestamptz (start 이후)",
  "budget": "number (>0)",
  "location": "string",
  "latitude": "number",
  "longitude": "number"
}
```

#### 응답 201

생성된 request 객체 반환

---

### PATCH /api/requests/[id]

구인글 수정 또는 상태 변경

- 방식: Server Action
- 인증: 필요
- 권한: 작성자만 가능

#### 비즈니스 로직

- `status = 'matched'` 이후에는 수정 불가

#### 응답 200

수정된 request 객체 반환

---

### DELETE /api/requests/[id]

구인글 삭제

- 방식: Server Action
- 인증: 필요
- 권한: 작성자만 가능

#### 비즈니스 로직

- `status != 'open'`이면 `403` 반환

#### 응답 200

삭제 처리 성공

---

## 8. 지원 Applications

### GET /api/requests/[id]/applications

특정 구인글 지원 목록 조회

- 방식: API Route
- 인증: 필요
- 권한: 구인글 작성자 또는 본인

#### 응답 200

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

### POST /api/requests/[id]/applications

구인글 지원

- 방식: Server Action
- 인증: 필요
- 권한: 펫시터만 가능

#### Request Body

```json
{
  "message": "string | null",
  "proposed_price": "number (≥0) | null"
}
```

#### 비즈니스 로직

- 동일 `(request_id, sitter_id)` 중복 지원 시 `409`
- 구인글 `status != 'open'`이면 `403`

#### 응답 201

생성된 application 객체 반환

---

### PATCH /api/applications/[id]

지원 상태 변경  
수락, 거절, 취소 처리

- 방식: Server Action
- 인증: 필요

#### Request Body

```json
{
  "status": "selected | rejected | canceled"
}
```

#### 비즈니스 로직

- `selected`: 구인글 작성자만 가능
  - `requests.status = 'matched'` 업데이트
  - 예약 자동 생성 (`total_price = proposed_price ?? service.price`)
  - 채팅방 생성
- `rejected`: 구인글 작성자만 가능
- `canceled`: 지원한 펫시터만 가능

#### 응답 200

수정된 application 객체 반환

---

## 9. 예약 Reservations

### GET /api/reservations

예약 목록 조회

- 방식: API Route
- 인증: 필요

#### Query Parameters

| 파라미터 | 타입          | 설명                                                                |
| -------- | ------------- | ------------------------------------------------------------------- |
| `role`   | owner\|sitter | 보호자/펫시터 뷰                                                    |
| `status` | string        | pending \| accepted \| paid \| in_progress \| completed \| canceled |
| `cursor` | uuid          | 무한 스크롤                                                         |
| `limit`  | number        | 기본 10                                                             |

#### 응답 200

```json
{
  "data": {
    "reservations": [
      {
        "id": "uuid",
        "owner_id": "uuid",
        "sitter_id": "uuid",
        "service_id": "uuid | null",
        "request_id": "uuid | null",
        "start_datetime": "timestamptz",
        "end_datetime": "timestamptz",
        "total_price": "number",
        "status": "pending | accepted | paid | in_progress | completed | canceled",
        "memo": "string | null",
        "pets": ["Pet"],
        "accepted_at": "timestamptz | null",
        "paid_at": "timestamptz | null",
        "completed_at": "timestamptz | null",
        "canceled_at": "timestamptz | null"
      }
    ],
    "next_cursor": "uuid | null"
  }
}
```

---

### POST /api/reservations

예약 생성  
보호자가 펫시터에게 직접 예약을 요청한다.

- 방식: Server Action
- 인증: 필요

#### Request Body

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

#### 응답 201

생성된 reservation 객체 반환

---

### PATCH /api/reservations/[id]

예약 상태 변경

- 방식: Server Action
- 인증: 필요

#### Request Body

```json
{
  "status": "accepted | in_progress | completed | canceled",
  "cancel_reason": "string | null"
}
```

#### 상태 전이 규칙

| 액션          | 허용 현재 상태              | 권한               |
| ------------- | --------------------------- | ------------------ |
| `accepted`    | pending                     | 펫시터             |
| `in_progress` | paid                        | 펫시터             |
| `completed`   | in_progress                 | 펫시터             |
| `canceled`    | pending \| accepted \| paid | 보호자 또는 펫시터 |

#### 응답 200

수정된 reservation 객체 반환

---

## 10. 결제 Payments

### POST /api/payments

결제 초기화  
결제창 열기 전 서버 검증용 API

- 방식: Server Action
- 인증: 필요

#### Request Body

```json
{
  "reservation_id": "uuid",
  "pay_method": "CARD | VIRTUAL_ACCOUNT | TRANSFER"
}
```

#### 비즈니스 로직

1. 해당 `reservation_id`에 `status = 'paid'` 결제 존재 시 `409` 반환
2. `payments` 테이블에 `status = 'ready'` 레코드 생성
3. `fee_rate = 0.05` 적용, `platform_fee` / `settle_amount` 계산 후 저장
4. PortOne 결제 요청용 `payment_id` 반환

#### 응답 201

```json
{
  "data": {
    "payment_id": "string",
    "amount": "number",
    "order_name": "string"
  }
}
```

---

### POST /api/payments/cancel

결제 취소  
서비스 시작 전 전액 취소만 허용한다.

- 방식: Server Action
- 인증: 필요

#### Request Body

```json
{
  "payment_id": "string",
  "reason": "string"
}
```

#### 비즈니스 로직

1. `reservations.start_datetime` 이전인지 확인 → 이후면 `403` 반환
2. PortOne 전액 취소 요청
3. `payments.status = 'canceled'`, `canceled_at = now()` 업데이트
4. `reservations.status = 'canceled'`, `canceled_at = now()` 업데이트

#### 응답 200

```json
{
  "data": {
    "canceled_amount": "number"
  }
}
```

---

## 11. PortOne 웹훅

### POST /api/portone/webhook

PortOne V2 결제 이벤트 수신

- 방식: API Route
- 인증: PortOne 서명 검증
- 검증 방식: webhook secret 사용

#### 처리 이벤트

| 이벤트                  | 처리                                                                       |
| ----------------------- | -------------------------------------------------------------------------- |
| `Transaction.Paid`      | `payments.status = 'paid'`, `reservations.status = 'paid'`, `paid_at` 기록 |
| `Transaction.Cancelled` | `payments.status = 'canceled'`, `reservations.status = 'canceled'`         |
| `Transaction.Failed`    | `payments.status = 'failed'`                                               |

#### 응답 200

```json
{
  "data": {
    "ok": true
  }
}
```

---

## 12. 본인인증 Identity Verification

### POST /api/identity-verification

PortOne 본인인증 결과 서버 검증

- 방식: Server Action
- 인증: 필요

#### Request Body

```json
{
  "identity_verification_id": "string"
}
```

#### 서버 처리

1. PortOne `GET /identity-verifications/{id}` 호출
2. 상태 확인: `VERIFIED`
3. 이미 `is_verified = true`이면 성공으로 간주
4. `users` 업데이트
   - `is_verified = true`

#### 응답 200

```json
{
  "data": {
    "is_verified": true
  }
}
```

#### 에러

| 에러 코드                | HTTP | 설명                      |
| ------------------------ | ---- | ------------------------- |
| `ALREADY_VERIFIED`       | 200  | 이미 인증 완료, 성공 처리 |
| `VERIFICATION_NOT_FOUND` | 404  | 존재하지 않는 인증 ID     |

---

## 13. 후기 Reviews

### GET /api/sitters/[id]/reviews

펫시터 후기 목록 조회

- 방식: API Route
- 인증: 불필요

#### Query Parameters

| 파라미터 | 타입   | 설명        |
| -------- | ------ | ----------- |
| `cursor` | uuid   | 무한 스크롤 |
| `limit`  | number | 기본 10     |

#### 응답 200

```json
{
  "data": {
    "reviews": [
      {
        "id": "uuid",
        "owner_id": "uuid",
        "owner_full_name": "string",
        "owner_profile_image": "string | null",
        "rating": "number (1~5)",
        "content": "string",
        "created_at": "timestamptz"
      }
    ],
    "average_rating": "number",
    "total": "number",
    "next_cursor": "uuid | null"
  }
}
```

---

### POST /api/reviews

후기 작성

- 방식: Server Action
- 인증: 필요

#### Request Body

```json
{
  "reservation_id": "uuid",
  "rating": "number (1~5)",
  "content": "string (10~1000자)"
}
```

#### 비즈니스 로직

1. `reservations.status = 'completed'` 확인
2. `completed_at`으로부터 7일 이내인지 확인
3. 이미 후기 작성 시 `409` 반환
4. 후기 저장 후 `sitters.rating = AVG()` 업데이트
5. 후기 저장과 평점 업데이트는 동일 트랜잭션으로 처리

#### 응답 201

생성된 review 객체 반환

---

### DELETE /api/reviews/[id]

후기 삭제

- 방식: Server Action
- 인증: 필요
- 권한: 작성자 또는 관리자

#### 비즈니스 로직

- 삭제 후 `sitters.rating` 재계산

#### 응답 200

삭제 처리 성공

---

## 14. 채팅 Chat

Supabase Realtime으로 실시간 처리한다.  
API Route는 초기 데이터 로드용으로 사용한다.

### GET /api/chat/rooms

채팅방 목록 조회

- 방식: API Route
- 인증: 필요

#### 응답 200

```json
{
  "data": [
    {
      "id": "uuid",
      "room_type": "request | direct",
      "owner_id": "uuid",
      "sitter_id": "uuid",
      "other_user_full_name": "string",
      "other_user_profile_image": "string | null",
      "unread_count": "number",
      "reservation_id": "uuid | null"
    }
  ]
}
```

---

### POST /api/chat/rooms

채팅방 생성 또는 기존 방 반환

- 방식: Server Action
- 인증: 필요

#### Request Body

```json
{
  "sitter_id": "uuid",
  "room_type": "request | direct",
  "request_id": "uuid | null"
}
```

#### 비즈니스 로직

- `room_type = 'request'`
  - `(request_id, sitter_id)`로 기존 방 조회
  - 있으면 기존 방 반환, 없으면 새 방 생성
- `room_type = 'direct'`
  - `(owner_id, sitter_id, 'direct')`로 기존 방 조회
  - 있으면 기존 방 반환, 없으면 새 방 생성

#### 응답 200 또는 201

```json
{
  "data": {
    "room_id": "uuid"
  }
}
```

---

### GET /api/chat/rooms/[id]/messages

메시지 목록 조회  
초기 로드에 사용하고, 이후에는 Realtime 구독으로 처리한다.

- 방식: API Route
- 인증: 필요
- 권한: 채팅방 참여자만 가능

#### Query Parameters

| 파라미터 | 타입   | 설명                            |
| -------- | ------ | ------------------------------- |
| `cursor` | uuid   | 위로 스크롤 시 이전 메시지 로드 |
| `limit`  | number | 기본 50                         |

#### 응답 200

```json
{
  "data": {
    "messages": [
      {
        "id": "uuid",
        "sender_id": "uuid",
        "content": "string",
        "is_read": "boolean",
        "created_at": "timestamptz"
      }
    ],
    "next_cursor": "uuid | null"
  }
}
```

---

### PATCH /api/chat/rooms/[id]/read

채팅방 메시지 읽음 처리

- 방식: Server Action
- 인증: 필요

#### 응답 200

읽음 처리 성공

---

## 15. 알림 Notifications

### GET /api/notifications

알림 목록 조회

- 방식: API Route
- 인증: 필요

#### Query Parameters

| 파라미터  | 타입    | 설명        |
| --------- | ------- | ----------- |
| `is_read` | boolean | 읽음 필터   |
| `cursor`  | uuid    | 무한 스크롤 |
| `limit`   | number  | 기본 20     |

#### 응답 200

```json
{
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "string",
        "title": "string",
        "content": "string",
        "is_read": "boolean",
        "link_url": "string | null",
        "created_at": "timestamptz"
      }
    ],
    "unread_total": "number",
    "next_cursor": "uuid | null"
  }
}
```

---

### PATCH /api/notifications/[id]/read

단건 알림 읽음 처리

- 방식: Server Action
- 인증: 필요

#### 응답 200

읽음 처리 성공

---

### PATCH /api/notifications/read-all

전체 알림 읽음 처리

- 방식: Server Action
- 인증: 필요

#### 응답 200

전체 읽음 처리 성공

---

## 16. 신고 Reports

### POST /api/reports

신고 접수

- 방식: Server Action
- 인증: 필요

#### Request Body

```json
{
  "target_type": "user | sitter | request | service | reservation | review | message",
  "target_id": "uuid",
  "reason": "string",
  "content": "string | null"
}
```

#### 응답 201

```json
{
  "data": {
    "id": "uuid",
    "status": "pending"
  }
}
```

---

## 17. 지도 검색 Map Search

Supabase RPC 직접 호출 방식으로 처리한다.  
Next.js API Route를 거치지 않고 클라이언트에서 Supabase `rpc()`를 사용한다.

### RPC: search_sitters_within

```sql
search_sitters_within(
  lat           float8,
  lng           float8,
  radius_km     float8,
  service_types text[],
  animal_types  text[],
  price_min     int,
  price_max     int,
  rating_min    float8
)
RETURNS TABLE (
  sitter_id    uuid,
  distance_km  float8,
  ...
)
```

#### 내부 처리

- PostGIS `ST_DWithin` 기반 반경 검색
- 거리순 정렬

---

## 부록 — 알림 type 허용값

백엔드에서 Zod로 검증한다.

```ts
const notificationType = z.enum([
  "reservation_requested", // 예약 요청
  "reservation_accepted", // 예약 수락
  "reservation_rejected", // 예약 거절
  "reservation_completed", // 돌봄 완료
  "reservation_canceled", // 예약 취소
  "payment_confirmed", // 결제 완료
  "review_received", // 후기 등록
  "chat_message", // 새 메시지
  "application_received", // 구인글 지원 수신
  "application_selected", // 지원 채택
  "sitter_approved", // 펫시터 승인
  "report_processed", // 신고 처리 완료
]);
```

# 추가금 요청 API 명세서

> `extra_charges` 테이블 기반. 시터가 보호자에게 추가금을 요청하고 보호자가 승인/거절하는 흐름.

---

## 상태 흐름

```
pending → approved → paid
       → rejected
       → canceled (시터가 직접 취소)
```

---

## 18. 추가금 요청 Extra Charges

### GET /api/reservations/[id]/extra-charges

특정 예약의 추가금 요청 목록 조회

- 방식: API Route
- 인증: 필요
- 권한: 해당 예약의 보호자 또는 시터

#### 응답 200

```json
{
  "data": [
    {
      "id": "uuid",
      "reservation_id": "uuid",
      "sitter_id": "uuid",
      "owner_id": "uuid",
      "amount": "number",
      "reason": "string",
      "status": "pending | approved | rejected | paid | canceled",
      "payment_id": "string | null",
      "requested_at": "timestamptz",
      "responded_at": "timestamptz | null",
      "created_at": "timestamptz"
    }
  ]
}
```

---

### POST /api/reservations/[id]/extra-charges

추가금 요청 생성  
시터가 보호자에게 추가금을 요청한다.

- 방식: Server Action
- 인증: 필요
- 권한: 해당 예약의 시터만 가능

#### Request Body

```json
{
  "amount": "number (>0)",
  "reason": "string"
}
```

#### 비즈니스 로직

1. `reservations.status = 'in_progress'`인 경우만 허용 → 아니면 `403` 반환
2. `extra_charges` 테이블에 `status = 'pending'` 레코드 생성
3. 보호자에게 알림 발송 (`extra_charge_requested`)

#### 응답 201

```json
{
  "data": {
    "id": "uuid",
    "reservation_id": "uuid",
    "amount": "number",
    "reason": "string",
    "status": "pending",
    "requested_at": "timestamptz"
  }
}
```

---

### PATCH /api/extra-charges/[id]

추가금 요청 상태 변경  
보호자의 승인/거절 또는 시터의 취소 처리

- 방식: Server Action
- 인증: 필요

#### Request Body

```json
{
  "status": "approved | rejected | canceled"
}
```

#### 비즈니스 로직

- `approved`: 보호자만 가능
  - `status = 'pending'`인 경우만 허용
  - `responded_at = now()` 업데이트
  - 보호자에게 결제 진행 안내 알림 발송
- `rejected`: 보호자만 가능
  - `status = 'pending'`인 경우만 허용
  - `responded_at = now()` 업데이트
  - 시터에게 거절 알림 발송
- `canceled`: 시터만 가능
  - `status = 'pending'`인 경우만 허용

#### 응답 200

```json
{
  "data": {
    "id": "uuid",
    "status": "approved | rejected | canceled",
    "responded_at": "timestamptz | null"
  }
}
```

---

### POST /api/extra-charges/[id]/pay

추가금 결제 초기화  
보호자가 승인된 추가금을 결제한다.

- 방식: Server Action
- 인증: 필요
- 권한: 해당 예약의 보호자만 가능

#### Request Body

```json
{
  "pay_method": "CARD | VIRTUAL_ACCOUNT | TRANSFER"
}
```

#### 비즈니스 로직

1. `extra_charges.status = 'approved'`인 경우만 허용 → 아니면 `403` 반환
2. `payments` 테이블에 `status = 'ready'` 레코드 생성
3. `fee_rate = 0.05` 적용, `platform_fee` / `settle_amount` 계산 후 저장
4. PortOne 결제 요청용 `payment_id` 반환

#### 응답 201

```json
{
  "data": {
    "payment_id": "string",
    "amount": "number",
    "order_name": "string"
  }
}
```

#### 웹훅 처리 (`Transaction.Paid` 수신 시)

1. `extra_charges.status = 'paid'`
2. `extra_charges.payment_id` 연결
3. `reservations.total_price += extra_charges.amount` 업데이트
4. 시터에게 추가금 결제 완료 알림 발송

---

# 봐주개 API 사용 가이드

> Server Action은 클라이언트 컴포넌트에서 직접 import해서 호출합니다.  
> API Route는 `fetch`로 호출합니다.  
> 모든 함수는 `{ data } | { error: { code, message } }` 형태를 반환합니다.

---

## 환경 변수

```env
# PortOne V2
PORTONE_API_SECRET=your_portone_api_secret
PORTONE_WEBHOOK_SECRET=your_portone_webhook_secret

# Supabase (Next.js 미들웨어/서버 클라이언트용)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 공통 에러 처리 패턴

```ts
const result = await someAction(input);

if ("error" in result) {
  console.error(result.error.code, result.error.message);
  return;
}

// result.data 사용
```

---

## 2. 인증 Auth

### OAuth 콜백
`GET /auth/callback?code=...` — Supabase OAuth 흐름에서 자동 처리됨. 직접 호출 불필요.

### 로그아웃
```ts
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();
await supabase.auth.signOut();
```

---

## 3. 사용자 Users

### 내 프로필 조회
```ts
const res = await fetch("/api/users/me");
const { data } = await res.json();
// data.id, data.full_name, data.role, data.has_sitter_profile, ...
```

### 프로필 이미지 수정
```ts
import { updateProfile } from "@/app/actions/users";

const result = await updateProfile("https://res.cloudinary.com/...");
```

### 회원 탈퇴
```ts
import { deleteUser } from "@/app/actions/users";

const result = await deleteUser();
// 진행 중인 예약 있으면 error.code === "FORBIDDEN"
```

---

## 4. 반려동물 Pets

### 목록 조회
```ts
const res = await fetch("/api/pets");
const { data } = await res.json(); // Pet[]
```

### 등록
```ts
import { createPet } from "@/app/actions/pets";

const result = await createPet({
  name: "초코",
  animal_type: "dog",
  age: 24,
  gender: "MALE",
  weight: 5.2,
});
```

### 수정 / 삭제
```ts
import { updatePet, deletePet } from "@/app/actions/pets";

await updatePet("pet-uuid", { weight: 5.5 });
await deletePet("pet-uuid");
```

---

## 5. 펫시터 Sitters

### 지도 검색 (지도 컴포넌트에서 직접 호출)
```ts
const params = new URLSearchParams({
  lat: "37.5665",
  lng: "126.9780",
  radius: "5",
});
params.append("service_type", "walk");

const res = await fetch(`/api/sitters?${params}`);
const { data } = await res.json();
// data.sitters, data.total
```

### 상세 조회
```ts
const res = await fetch(`/api/sitters/${sitterId}`);
const { data } = await res.json();
// data.services, data.review_count, ...
```

### 펫시터 프로필 등록
```ts
import { createSitter } from "@/app/actions/sitters";

const result = await createSitter({
  introduction: "안녕하세요, 10년 경력 펫시터입니다...",
  available_area: "서울 마포구",
  latitude: 37.5665,
  longitude: 126.9780,
  base_price: 30000,
  // 제공 서비스 (복수 선택)
  // visit: 방문돌봄 / foster: 위탁돌봄 / walk: 산책 / hotel: 펫호텔
  request_type: ["visit", "walk"],
  // 돌봄 가능 동물 (복수 선택)
  // small_dog / medium_dog / large_dog / cat
  available_animals: ["small_dog", "medium_dog", "cat"],
  certificate_urls: ["https://storage.example.com/cert1.pdf"],
  activity_photo_urls: ["https://storage.example.com/photo1.jpg"],
  services: [
    { service_type: "walk", title: "산책", price: 15000 },
  ],
});
// is_verified = false면 error.code === "FORBIDDEN"
```

---

## 6. 서비스 Services

### 서비스 목록 조회
```ts
const res = await fetch(`/api/sitters/${sitterId}/services`);
const { data } = await res.json(); // Service[]
```

### 서비스 추가 / 수정 / 삭제
```ts
import { createService, updateService, deleteService } from "@/app/actions/services";

await createService({ service_type: "care", title: "당일 돌봄", price: 50000 });
await updateService("service-uuid", { price: 55000 });

// is_active: false → deactivated_at이 자동으로 현재 시각으로 기록됨
// is_active: true  → deactivated_at이 null로 초기화됨
await updateService("service-uuid", { is_active: false });

await deleteService("service-uuid"); // paid/in_progress 예약 없을 때만 가능
```

---

## 7. 구인글 Requests

### 목록 조회 (무한 스크롤)
```ts
const params = new URLSearchParams({ status: "open", limit: "20" });
if (cursor) params.set("cursor", cursor);

const res = await fetch(`/api/requests?${params}`);
const { data } = await res.json();
// data.requests, data.next_cursor
```

### 내 구인글만 조회
```ts
const res = await fetch(`/api/requests?owner_id=${userId}`);
```

### 작성 / 수정 / 삭제
```ts
import { createRequest, updateRequest, deleteRequest } from "@/app/actions/requests";

// pet_ids에 반려동물 UUID를 배열로 전달 (복수 선택 가능)
// request_type: visit(방문돌봄) / foster(위탁돌봄) / walk(산책) / hotel(펫호텔)
const result = await createRequest({
  pet_ids: ["pet-uuid-1", "pet-uuid-2"],
  title: "주말 산책 부탁드려요",
  request_type: "walk",
  start_datetime: "2026-06-15T10:00:00+09:00",
  end_datetime: "2026-06-15T11:00:00+09:00",
  budget: 20000,
  location: "서울 마포구",
  latitude: 37.5665,
  longitude: 126.9780,
  // require_badge(인증 펫시터) / prefer_female(여성 선호) / require_certificate(자격증 보유) / no_smoker(흡연자 제외)
  sitter_conditions: ["require_badge", "no_smoker"],
});

// pet_ids를 전달하면 기존 반려동물 목록을 교체
await updateRequest("request-uuid", { budget: 25000 });
await updateRequest("request-uuid", { pet_ids: ["pet-uuid-3"] }); // 반려동물 변경
await deleteRequest("request-uuid"); // status === 'open'일 때만 가능
```

**조회 응답 형태**
```ts
// data.requests[].pet_ids — 등록된 반려동물 UUID 배열
{
  id: "...",
  title: "...",
  pet_ids: ["pet-uuid-1", "pet-uuid-2"],
  view_count: 0,  // 조회수 (기본값 0)
  ...
}
```

---

## 8. 지원 Applications

### 지원 목록 조회 (구인글 작성자 또는 본인)
```ts
const res = await fetch(`/api/requests/${requestId}/applications`);
const { data } = await res.json(); // Application[]
```

### 지원하기 (펫시터만)
```ts
import { createApplication } from "@/app/actions/applications";

const result = await createApplication("request-uuid", {
  message: "잘 돌봐드리겠습니다.",
  proposed_price: 18000,
});
```

### 지원 채택 (구인글 작성자)
```ts
import { updateApplication } from "@/app/actions/applications";

// 채택 → 예약 자동 생성 + reservation_items 자동 생성 + 채팅방 생성 + 구인글 'matched' 처리
const result = await updateApplication("application-uuid", { status: "selected" });
// result.data 예약 정보: reservation.application_id에 지원서 ID가 연결됨
```

### 지원 거절 / 취소
```ts
await updateApplication("application-uuid", { status: "rejected" }); // 작성자
await updateApplication("application-uuid", { status: "canceled" }); // 지원한 시터
```

---

## 9. 예약 Reservations

### 목록 조회
```ts
const params = new URLSearchParams({ role: "owner", status: "paid" });
const res = await fetch(`/api/reservations?${params}`);
const { data } = await res.json();
// data.reservations, data.next_cursor
```

### 직접 예약 생성 (보호자 → 펫시터)
```ts
import { createReservation } from "@/app/actions/reservations";

// pet_ids에 지정한 반려동물들이 reservation_items 테이블에 자동 저장됨
const result = await createReservation({
  sitter_id: "sitter-uuid",
  service_id: "service-uuid",
  pet_ids: ["pet-uuid-1", "pet-uuid-2"],
  start_datetime: "2026-06-20T10:00:00+09:00",
  end_datetime: "2026-06-20T18:00:00+09:00",
  memo: "알레르기 없어요",
});
```

**조회 응답 형태**
```ts
// data.reservations[].pets — reservation_items를 통해 조인된 반려동물 배열
// data.reservations[].application_id — 구인글 경로로 생성된 경우 지원서 ID
{
  id: "...",
  status: "pending",
  application_id: "application-uuid | null",
  pets: [{ id: "...", name: "초코", animal_type: "dog", ... }],
  ...
}
```

### 상태 변경
```ts
import { updateReservation } from "@/app/actions/reservations";

// 펫시터: 수락
await updateReservation("reservation-uuid", { status: "accepted" });

// 취소 (보호자 또는 펫시터)
await updateReservation("reservation-uuid", {
  status: "canceled",
  cancel_reason: "개인 사정으로 취소합니다",
});

// 펫시터: 서비스 시작 / 완료
await updateReservation("reservation-uuid", { status: "in_progress" }); // paid 상태에서
await updateReservation("reservation-uuid", { status: "completed" });
```

**상태 전이 요약**
```
pending → accepted (펫시터)
accepted → paid (PortOne 웹훅 자동)
paid → in_progress (펫시터)
in_progress → completed (펫시터)
pending | accepted | paid → canceled (보호자 또는 펫시터)
```

---

## 10. 결제 Payments

### 결제 초기화 → PortOne 결제창 오픈
```ts
import { createPayment } from "@/app/actions/payments";
import PortOne from "@portone/browser-sdk/v2";

// 1. 서버에서 결제 초기화
const result = await createPayment("reservation-uuid", "CARD");
if ("error" in result) return;

const { payment_id, amount, order_name } = result.data;

// 2. PortOne 결제창 오픈 (클라이언트에서)
await PortOne.requestPayment({
  storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
  paymentId: payment_id,
  orderName: order_name,
  totalAmount: amount,
  currency: "CURRENCY_KRW",
  payMethod: "CARD",
  channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY!,
});
// 결제 완료 후 PortOne이 웹훅(/api/portone/webhook)으로 서버에 알림
```

### 결제 취소
```ts
import { cancelPayment } from "@/app/actions/payments";

const result = await cancelPayment("pay_uuid_1234567890", "단순 변심");
// result.data.canceled_amount
```

---

## 11. PortOne 웹훅

`POST /api/portone/webhook` — PortOne 대시보드에서 설정. 직접 호출 불필요.

**처리 흐름**
```
Transaction.Paid     → payments.status='paid',     reservations.status='paid'
Transaction.Cancelled → payments.status='canceled', reservations.status='canceled'
Transaction.Failed   → payments.status='failed'
```

---

## 12. 본인인증 Identity Verification

> 최초 가입 시에는 `completeSignup` (app/auth/verification/actions.ts)을 사용합니다.  
> 이미 가입된 유저가 인증을 추가하려면 `verifyIdentity`를 사용합니다.

```ts
import { verifyIdentity } from "@/app/actions/identity-verification";
import PortOne from "@portone/browser-sdk/v2";

// 1. PortOne 본인인증창 오픈
const { identityVerificationId } = await PortOne.requestIdentityVerification({
  storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
  identityVerificationId: `identity_${Date.now()}`,
  channelKey: process.env.NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY!,
});

// 2. 서버 검증
const result = await verifyIdentity(identityVerificationId);
// result.data.is_verified === true
```

---

## 13. 후기 Reviews

### 펫시터 후기 목록 조회
```ts
const res = await fetch(`/api/sitters/${sitterId}/reviews?limit=10`);
const { data } = await res.json();
// data.reviews, data.average_rating, data.total, data.next_cursor
```

### 후기 작성 (완료된 예약, 7일 이내)
```ts
import { createReview } from "@/app/actions/reviews";

const result = await createReview({
  reservation_id: "reservation-uuid",
  rating: 5,
  content: "정말 친절하고 꼼꼼하게 돌봐주셨어요!",
});
```

### 후기 삭제 (작성자 또는 관리자)
```ts
import { deleteReview } from "@/app/actions/reviews";

await deleteReview("review-uuid");
```

---

## 14. 채팅 Chat

### 채팅방 목록 조회
```ts
const res = await fetch("/api/chat/rooms");
const { data } = await res.json();
// last_message_at 기준 내림차순 정렬 (메시지 없는 방은 뒤로)
// data[].other_user_full_name, data[].unread_count, data[].reservation_id
// data[].last_message      — 마지막 메시지 미리보기 (null이면 아직 메시지 없음)
// data[].last_message_at   — 마지막 메시지 전송 일시
```

### 채팅방 생성 또는 입장
```ts
import { findOrCreateRoom } from "@/app/actions/chat";

// 구인글 기반 채팅
const result = await findOrCreateRoom({
  sitter_id: "sitter-uuid",
  room_type: "request",
  request_id: "request-uuid",
});

// 직접 채팅
const result = await findOrCreateRoom({
  sitter_id: "sitter-uuid",
  room_type: "direct",
});

// result.data.room_id → 채팅방으로 이동
```

### 메시지 목록 조회 (초기 로드)
```ts
const res = await fetch(`/api/chat/rooms/${roomId}/messages?limit=50`);
const { data } = await res.json();
// data.messages (created_at DESC), data.next_cursor

// 위로 스크롤 시 이전 메시지 로드
const res2 = await fetch(`/api/chat/rooms/${roomId}/messages?cursor=${oldestMessageId}`);
```

### 메시지 전송
```ts
import { sendMessage } from "@/app/actions/chat";

// 메시지 insert + chat_rooms.last_message / last_message_at 자동 업데이트
const result = await sendMessage(roomId, "안녕하세요!");
// result.data — 삽입된 메시지 행 전체
```

### 실시간 메시지 구독 (Supabase Realtime)
```ts
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

const channel = supabase
  .channel(`room:${roomId}`)
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` },
    (payload) => {
      // 새 메시지 처리
      setMessages((prev) => [...prev, payload.new]);
    },
  )
  .subscribe();

// 컴포넌트 언마운트 시
return () => { supabase.removeChannel(channel); };
```

### 읽음 처리
```ts
import { markRoomRead } from "@/app/actions/chat";

await markRoomRead(roomId);
```

---

## 15. 알림 Notifications

### 알림 목록 조회
```ts
// 전체
const res = await fetch("/api/notifications");

// 읽지 않은 것만
const res = await fetch("/api/notifications?is_read=false");

const { data } = await res.json();
// data.notifications, data.unread_total, data.next_cursor
```

### 단건 읽음 처리
```ts
import { markNotificationRead } from "@/app/actions/notifications";

await markNotificationRead("notification-uuid");
```

### 전체 읽음 처리
```ts
import { markAllNotificationsRead } from "@/app/actions/notifications";

await markAllNotificationsRead();
```

### 알림 type 값
| type | 설명 |
|------|------|
| `reservation_requested` | 예약 요청 수신 |
| `reservation_accepted` | 예약 수락됨 |
| `reservation_completed` | 돌봄 완료 |
| `reservation_canceled` | 예약 취소됨 |
| `payment_confirmed` | 결제 완료 |
| `review_received` | 후기 등록됨 |
| `chat_message` | 새 메시지 |
| `application_received` | 구인글 지원 수신 |
| `application_selected` | 지원 채택됨 |
| `sitter_approved` | 펫시터 승인 |
| `report_processed` | 신고 처리 완료 |

---

## 16. 신고 Reports

```ts
import { createReport } from "@/app/actions/reports";

const result = await createReport({
  target_type: "user",   // user | sitter | request | service | reservation | review | message
  target_id: "target-uuid",
  reason: "부적절한 내용",
  content: "상세 내용...",
  image_urls: ["https://res.cloudinary.com/..."],  // 선택. Cloudinary 업로드 후 URL 배열
});
// result.data.id, result.data.status === "pending"
```

---

## 17. 지도 검색 Map Search

지도 검색은 클라이언트에서 Supabase RPC를 직접 호출합니다. (`/api/sitters`도 동일 RPC 사용)

```ts
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

const { data, error } = await supabase.rpc("search_sitters_within", {
  lat: 37.5665,
  lng: 126.9780,
  radius_km: 5,
  service_types: ["walk", "care"], // null이면 전체
  animal_types: ["dog"],
  price_min: null,
  price_max: null,
  rating_min: null,
});

// data[].sitter_id, data[].distance_km, ...
```

---

## 전체 흐름 예시 — 구인글 → 채택 → 결제

```
1. 보호자: createRequest({ pet_ids: ["pet-uuid"], ... })
              └─ 자동: request_pets INSERT (반려동물 복수 매핑)
2. 펫시터: createApplication(requestId, { proposed_price })
3. 보호자: updateApplication(appId, { status: "selected" })
              └─ 자동: reservations INSERT (application_id 연결)
                      + reservation_items INSERT (request_pets에서 pet 복사)
                      + chat_rooms INSERT
                      + requests.status='matched'
4. 펫시터: updateReservation(reservationId, { status: "accepted" })
5. 보호자: createPayment(reservationId, "CARD") → PortOne 결제창
6. PortOne: POST /api/portone/webhook (Transaction.Paid)
              └─ 자동: payments.status='paid', reservations.status='paid'
7. 펫시터: updateReservation(reservationId, { status: "in_progress" })
8. 펫시터: updateReservation(reservationId, { status: "completed" })
9. 보호자: createReview({ reservation_id, rating: 5, content })
```

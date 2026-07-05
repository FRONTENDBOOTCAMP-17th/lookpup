# LookPup 발표 시나리오

## 흐름 요약

> 보호자가 펫시터를 찾아 예약·결제하고, 펫시터가 서비스를 완료하기까지의 전 과정

---

## 1. 홈 (랜딩)

- 서비스 소개 — 방문돌봄 / 위탁돌봄 / 산책 / 펫호텔 / 픽업
- "어떤 돌봄이 필요하신가요?" 카테고리 버튼 클릭 → 게시판으로 이동

---

## 2. 펫시터 검색 (`/petsitters`)

- **지도 + 리스트 동시 표시** (카카오맵)
- 내 위치 기반 거리 표시
- 카드 클릭 → 지도 핀 강조, "예약하기" CTA 노출

---

## 3. 펫시터 상세 (`/petsitters/[id]`)

- 프로필 · 제공 서비스 · 평점 · 리뷰 확인
- "예약 신청" 버튼 → 날짜·시간·반려동물 선택

---

## 4. 커뮤니티 게시판 (`/board`)

**목록 (`/board`)**
- 카테고리 필터 (방문돌봄 / 위탁돌봄 / 산책 / 펫호텔 / 픽업 / 기타)
- 제목·내용 텍스트 검색
- 페이지네이션 (5개씩)

**글쓰기 (`/board/write`)**
- 서비스 유형 선택 + 예산 입력 (프리셋 버튼 or 협의 가능)
- 날짜·시간 범위 선택 (RangePicker)
- 돌봄 장소 선택 (우리 집 / 펫시터 집 / 직접 입력) + 카카오맵 핀 지정 + 현재 위치 사용
- 등록된 반려동물 선택 (다중 선택 가능)
- 내용 작성 — **템플릿 3종** 제공 (기본 산책·장기 위탁·픽업)
- 펫시터 조건 입력 — 조건 태그 클릭으로 자동 추가
- **임시저장 / 불러오기** (localStorage)

**상세 (`/board/[id]`)**
- 조회수 카운트
- 위치 지도 표시
- 상태 배지 (모집중 / 매칭완료 / 완료 / 취소)
- 펫시터 조건 섹션 / 반려동물 정보 표시
- 지원자 목록 (이름 + 제안 금액 + 메시지) 노출
- **지원하기** (펫시터만 가능, 비로그인 시 로그인 이동, 펫시터 미등록 시 등록 이동) → 확인 모달 → 지원 완료 후 채팅 지원자 탭으로 이동
- 보호자 본인: 수정 / 삭제 / **모집마감** 처리
- 작성자 프로필 (인증 배지 포함) + 같은 보호자의 다른 게시글 최대 3개 노출
- 지원자 목록 → 채팅탭에서 선택 확정

---

## 5. 채팅 (`/chat`) ← 핵심

탭 3개로 구성:

| 탭 | 설명 |
|----|------|
| 1:1 채팅 | 결제·돌봄기록·사진 전송 |
| 예약 요청 | 펫시터가 수락/거절 |
| 지원자 관리 | 보호자가 펫시터 선택 확정 |

**채팅 내 전체 예약 플로우:**
1. 펫시터가 결제 요청 메시지 발송
2. 보호자가 채팅 내에서 바로 카드 결제 (PortOne)
3. 펫시터 → "서비스 시작" 버튼
4. 펫시터 → 돌봄 기록 전송 (사진 포함)
5. 펫시터 → "서비스 완료" 버튼
6. 보호자 → 완료 확인 → 리뷰 작성 이동

---

## 6. 알림 (`/notifications`)

- 예약 수락·결제 요청·서비스 완료 등 실시간 알림 (Supabase Realtime)

---

## 7. 마이프로필 (`/myprofile`)

- 예약 내역 확인
- 내 반려동물 등록·관리
- 펫시터 전환: 시터 프로필 등록 → 수익 차트 확인

---

## 8. 관리자 (`/admin`)

- 신고 관리 (유저 정지 처리)
- 전체 예약 상태 모니터링

---

## 기능별 코드 설명

### 펫시터 검색 — 거리 계산

위치 기반 거리는 Haversine 공식으로 두 좌표 간 실거리를 계산합니다.

```ts
// src/utils/distance.ts
export function calculateDistanceKm(from: Coordinate, to: Coordinate): number {
  const R = 6371; // 지구 반지름(km)
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

---

### 게시판 글쓰기 — 임시저장

유저 ID를 키로 localStorage에 폼 전체를 저장합니다. 페이지를 나갔다 돌아와도 작성 내용이 유지됩니다.

```ts
// src/components/board/BoardWriteClient.tsx
const draftKey = user?.id ? `board-write-draft:${user.id}` : null;

const handleSaveDraft = () => {
  localStorage.setItem(draftKey, JSON.stringify(form));
};

const handleLoadDraft = () => {
  const saved = JSON.parse(localStorage.getItem(draftKey));
  setForm({ ...saved, startDate: new Date(saved.startDate), ... });
};
```

---

### 게시판 글쓰기 — 카카오맵 주소 자동완성

입력값이 바뀔 때마다 300ms 디바운스 후 카카오 Geocoder API를 호출해서 주소 후보 목록을 드롭다운으로 보여줍니다.

```ts
// src/components/board/BoardWriteClient.tsx
suggestTimer.current = setTimeout(async () => {
  const list = await searchAddressList(query); // 카카오 Geocoder 호출
  setSuggestions(list);
  setShowSuggestions(list.length > 0);
}, 300); // 300ms 디바운스
```

지도를 클릭하거나 마커를 드래그하면 역지오코딩으로 좌표 → 주소를 자동 변환합니다.

```ts
const handleMapClick = async (lat: number, lng: number) => {
  setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  const address = await coordToAddress(lat, lng); // 역지오코딩
  if (address) setForm((prev) => ({ ...prev, location: address }));
};
```

---

### 게시판 상세 — 지원하기 역할 분기

버튼 클릭 한 번에 로그인 여부 → 펫시터 등록 여부를 순서대로 체크합니다.

```ts
// src/components/board/BoardDetailClient.tsx
const isSitter = user?.role === "both" || user?.role === "admin";

const handleApplyClick = () => {
  if (!isLoggedIn) { router.push("/auth/login"); return; }
  if (!isSitter)   { router.push("/sitter-register"); return; }
  setShowApplyModal(true); // 정상 → 확인 모달
};
```

---

### 채팅 — 메시지 타입 구분 (프리픽스 패턴)

별도 메시지 테이블 없이 `content` 문자열 앞에 프리픽스를 붙여 메시지 종류를 구분합니다. 수신 시 프리픽스를 파싱해 UI 컴포넌트를 결정합니다.

```ts
// src/lib/chatMessagePrefixes.ts
export const PAYMENT_REQUEST_PREFIX  = "__payment_request__:";
export const PAYMENT_COMPLETE_PREFIX = "__payment_complete__:";
export const SERVICE_START_PREFIX    = "__service_start__";
export const SERVICE_COMPLETE_PREFIX = "__service_complete__";
export const RESERVATION_EDIT_PREFIX = "__reservation_edit__:";
// ... 총 14종

// src/hooks/chat/useChatMessages.ts — 수신 시 파싱
if (m.content.startsWith(PAYMENT_REQUEST_PREFIX)) {
  const data = JSON.parse(m.content.slice(PAYMENT_REQUEST_PREFIX.length));
  return { from: "payment_request", paymentData: data, ... };
}
```

---

### 채팅 — 실시간 메시지 (Supabase Broadcast)

DB를 거치지 않고 Supabase Realtime broadcast 채널로 직접 전송해 지연을 최소화합니다. 채팅방이 바뀌면 이전 채널을 해제하고 새 채널을 구독합니다.

```ts
// src/hooks/chat/useChatMessages.ts
const channel = supabase
  .channel(`room:${roomId}`)
  .on("broadcast", { event: "message" }, ({ payload }) => {
    addMessage(payload); // 수신 즉시 UI에 추가
  })
  .subscribe();

// 전송 시
channel.send({ type: "broadcast", event: "message", payload: newMessage });
```

---

### 채팅 — 선택 확정 자동화

지원자 확정 한 번에 4단계가 연쇄 실행됩니다.

```ts
// src/components/chat/ChatClient.tsx — handleConfirmApplicant
await updateApplicationByRoom(id, "selected", overrides); // 1. 지원 상태 변경
const roomResult = await findOrCreateRoom({ ... });       // 2. 1:1 채팅방 생성
broadcastReservationAccepted(newRoomId);                   // 3. 상대방에게 Broadcast
await sendAutoPaymentRequestMessage(newRoomId, { amount }); // 4. 결제 요청 자동 발송
```

---

### 채팅 — 인라인 결제 흐름

채팅창을 떠나지 않고 PortOne SDK → 서버 검증 → 완료 메시지 전송까지 한 흐름으로 처리합니다.

```ts
// src/components/chat/ChatClient.tsx — handlePayNow
const payResult = await createPayment(reservationId, "CARD", totalAmount); // 결제 레코드 생성
requestPayment({ paymentId, totalAmount, ... }, {
  onSuccess: async () => {
    await verifyAndConfirmPayment(portonePaymentId); // PortOne API 서버 검증
    await sendPaymentCompleteMessage(activeRoomId, { amount }); // 완료 메시지 전송
  },
});
```

결제 수수료(5%)는 서버 액션에서 자동 계산해 `platform_fee`와 `settle_amount`로 분리 저장합니다.

```ts
// src/app/actions/payments.ts
const FEE_RATE = 0.05;
const platformFee  = Math.floor(amount * FEE_RATE);
const settleAmount = amount - platformFee;
```

---

### 알림 — Supabase Realtime (postgres_changes)

채팅 broadcast와 달리 알림은 DB 변경을 직접 구독합니다. `notifications` 테이블에 row가 INSERT되면 즉시 클라이언트에 전달됩니다.

```ts
// src/components/notifications/NotificationsRealtimeSync.tsx
supabase
  .channel("notifications-sync")
  .on("postgres_changes", {
    event: "*",
    schema: "public",
    table: "notifications",
    filter: `user_id=eq.${userId}`, // 본인 알림만 구독
  }, onSync)
  .subscribe();
```

---

## 기능별 강조 포인트

### 펫시터 검색
- 지도와 리스트가 **동기화** — 카드 선택 시 지도 핀이 강조되고 예약 CTA가 노출됨
- **위치 기반 거리 계산** — 현재 위치에서 각 펫시터까지 실거리 표시

### 게시판 글쓰기
- **임시저장 / 불러오기** — localStorage 기반, 새로고침·이탈 후에도 작성 내용 유지
- **템플릿 3종** — 빈 칸 작성 부담 없이 클릭 한 번으로 기본 양식 채워짐
- **카카오맵 연동** — 주소 자동완성, 지도 클릭·마커 드래그, 현재 위치 사용 모두 지원
- **조건 태그** — 원하는 펫시터 조건을 태그 클릭으로 자동 추가

### 게시판 상세 / 지원하기
- **역할 기반 접근 제어** — 비로그인 → 로그인, 펫시터 미등록 → 시터 등록, 정상 → 지원으로 자동 분기
- 지원 완료 후 **채팅 지원자 탭으로 자동 이동**
- 보호자 전용: **모집마감** 처리로 상태 즉시 변경

### 채팅 ← 가장 강조
- **3탭 구조** — 1:1 채팅 / 예약 요청 / 지원자 관리를 하나의 페이지에서 통합 관리
- **채팅 내 인라인 결제** — 앱을 떠나지 않고 채팅창에서 바로 PortOne 카드 결제 완료
- **선택 확정 시 자동화** — 지원자 확정 → 1:1 채팅방 자동 생성 → 결제 요청 메시지 자동 발송
- **서비스 전 과정 채팅 내 처리** — 결제 요청 → 결제 → 서비스 시작 → 돌봄 기록 → 완료 → 리뷰까지
- **예약 수정 협의** — 채팅 안에서 수정 요청 / 수락 / 거절 모두 처리
- **추가금 결제** — 기본 결제 완료 후 추가 비용 발생 시 추가금 요청 별도 지원
- **사진 전송** — Cloudinary 업로드 후 채팅으로 전달 (10MB 제한)

### 알림
- **Supabase Realtime** — 새로고침 없이 즉시 수신
- 예약·결제·서비스 완료 등 주요 이벤트 전 구간 커버

### 마이프로필 / 수익
- **보호자·펫시터 역할 통합** — 하나의 계정에서 두 역할 모두 수행, 전환 가능
- **수익 차트** — 기간별 수익 추이 시각화 + 거래 내역 목록

### 관리자
- **신고 처리** — 유저 신고 접수 → 확인 → 정지 처리까지 관리자 대시보드에서 일괄 처리
- **예약 상태 모니터링** — 전체 예약 현황 실시간 확인

---

## 데모 추천 순서

```
홈 → 펫시터 검색(지도) → 펫시터 상세 → 예약 신청
→ 게시판(글쓰기 → 상세 → 지원하기)
→ 채팅(지원자 확정 → 결제 → 서비스 시작 → 완료 확인)
→ 알림 → 마이프로필(예약 내역·수익)
```

---

## 데모 스크립트

→ [SCRIPT.md](./SCRIPT.md)

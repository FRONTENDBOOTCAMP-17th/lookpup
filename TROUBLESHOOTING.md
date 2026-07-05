# LookPup 트러블슈팅 & 기술적 결정

---

## 1. 채팅 — 이전 메시지 로드 시 스크롤 위치가 맨 위로 튀는 문제

### 문제
채팅 스크롤을 맨 위로 올려 이전 메시지를 불러오면, 새 메시지가 prepend되면서 스크롤이 다시 최상단으로 이동해 버렸습니다. 사용자가 읽던 위치를 잃게 되는 UX 문제였습니다.

### 해결
메시지 로드 직전 `scrollHeight`를 앵커로 저장해두고, 로드 완료 후 `scrollHeight` 차이만큼 `scrollTop`을 보정합니다. `useLayoutEffect`를 써서 DOM 렌더 직후 페인트 전에 처리해 깜빡임을 방지했습니다.

```ts
// src/components/chat/ChatClient.tsx
const handleLoadMore = () => {
  scrollAnchorRef.current = mobileEl.scrollHeight; // 로드 전 높이 저장
  isLoadMoreRef.current = true;
  loadMore();
};

useLayoutEffect(() => {
  if (isLoadMoreRef.current) {
    // 새 메시지가 쌓인 만큼 스크롤 보정
    mobileEl.scrollTop += mobileEl.scrollHeight - scrollAnchorRef.current;
    return;
  }
  // 일반 메시지 수신 시엔 최하단 유지
  mobileEl.scrollTop = mobileEl.scrollHeight;
}, [messages]);
```

---

## 2. 채팅 — 같은 메시지가 두 번 표시되는 문제

### 문제
실시간 메시지 수신을 위해 Supabase **broadcast**와 **postgres_changes** 두 채널을 동시에 구독하다 보니, 동일한 메시지가 두 번 렌더링되는 현상이 발생했습니다.

### 왜 두 채널을 모두 구독하나?
- **broadcast**: DB를 거치지 않고 전송해 속도가 빠르지만, 상대방이 오프라인이면 못 받을 수 있습니다.
- **postgres_changes**: DB INSERT를 직접 감지해 메시지를 절대 놓치지 않지만 약간 늦습니다.

두 채널을 함께 써서 빠른 수신과 안정성을 모두 확보했습니다.

### 해결
수신 시 메시지 ID 중복 체크로 이미 있는 메시지는 무시합니다.

```ts
// src/hooks/chat/useChatMessages.ts
setMessages((prev) => {
  if (prev.some((msg) => msg.id === m.id)) return prev; // 중복 무시
  return [...prev, toMessage(m, userId)];
});
```

---

## 3. 채팅 — 방을 빠르게 전환할 때 이전 방 메시지가 덮어씌워지는 문제

### 문제
채팅방을 빠르게 전환하면, 이전 방의 fetch 응답이 늦게 도착해서 현재 방의 메시지 상태를 덮어쓰는 경쟁 상태(Race Condition)가 발생했습니다.

### 해결
`AbortController`로 채팅방이 바뀔 때 이전 fetch를 즉시 취소합니다.

```ts
// src/hooks/chat/useChatMessages.ts
useEffect(() => {
  const controller = new AbortController();

  fetch(`/api/chat/rooms/${activeRoomId}/messages`, {
    signal: controller.signal, // fetch에 취소 신호 연결
  }).then(...);

  return () => controller.abort(); // 방 전환 시 이전 fetch 취소
}, [activeRoomId]);
```

---

## 4. 채팅 — 메시지 타입이 늘어날수록 DB 스키마를 바꿔야 하는 문제

### 문제
채팅 기능이 확장되면서 결제 요청, 서비스 시작, 돌봄 기록, 예약 수정 등 메시지 종류가 계속 늘었습니다. 타입마다 별도 컬럼이나 테이블을 추가하면 스키마 변경이 잦아질 것이 우려됐습니다.

### 해결
`content` 단일 컬럼에 프리픽스를 붙여 타입을 구분하는 방식을 채택했습니다. 새 타입을 추가할 때 DB 스키마 변경 없이 프리픽스 상수 하나만 추가하면 됩니다.

```ts
// src/lib/chatMessagePrefixes.ts — 총 14종
export const PAYMENT_REQUEST_PREFIX  = "__payment_request__:";
export const SERVICE_START_PREFIX    = "__service_start__";
export const RESERVATION_EDIT_PREFIX = "__reservation_edit__:";

// 수신 시 파싱
if (m.content.startsWith(PAYMENT_REQUEST_PREFIX)) {
  const data = JSON.parse(m.content.slice(PAYMENT_REQUEST_PREFIX.length));
  return { from: "payment_request", paymentData: data };
}
```

---

## 5. 채팅 — 지원 확정 카드가 있어야 하는데 메시지 기록이 없는 경우

### 문제
지원자가 이미 선택/거절된 상태인데, 채팅 내에 확정/거절 메시지가 DB에 없는 케이스가 존재했습니다. (확정 후 메시지 전송 전에 오류가 났거나, 기존 데이터인 경우) UI에 상태 카드를 보여줄 수 없었습니다.

### 해결
메시지 목록에 실제 DB 메시지가 없을 때 렌더 시점에 **synthetic 메시지**를 삽입합니다. 실제로 DB에 저장되지 않는 가상 메시지로, UI에만 존재합니다.

```ts
// src/components/chat/ChatClient.tsx
const syntheticMsg = status === "selected"
  ? { id: "__synthetic_selected__", from: "application_selected", ... }
  : { id: "__synthetic_rejected__", from: "application_rejected", ... };

// 메시지 리스트에 삽입 후 렌더
return [...messages.slice(0, insertAt), syntheticMsg, ...messages.slice(insertAt)];
```

---

## 6. 위치 정보 — 정확한 주소가 DB에 저장되는 개인정보 문제

### 문제
보호자의 집 주소나 펫시터 활동 위치를 정확한 좌표로 저장하면, DB 유출 시 건물 단위까지 특정 가능해 개인정보 침해 우려가 있었습니다.

### 해결
좌표를 저장할 때 소수점 3자리로 반올림합니다. 위경도 소수점 3자리는 약 100m 격자에 해당해, 건물 단위 특정은 불가능하지만 동네 단위 거리 계산에는 충분한 정밀도입니다.

```ts
// src/utils/geoPrivacy.ts
const PRECISION = 3; // 소수점 3자리 ≈ 약 100m 격자

export function fuzzCoordinate(value: number): number {
  return Math.round(value * 10 ** PRECISION) / 10 ** PRECISION;
}
```

---

## 7. 결제 — 모바일에서 PortOne 팝업이 동작하지 않는 문제

### 문제
PortOne SDK는 데스크톱에서 팝업 방식으로 결제창을 띄우지만, 모바일에서는 팝업 차단 정책으로 인해 PG사 페이지로 리다이렉트합니다. 리다이렉트 후 돌아올 때 결제 완료 처리를 해줄 페이지가 필요했습니다.

### 해결
`/payment/complete` 페이지를 `redirectUrl`로 지정해 모바일 리다이렉트 착지 페이지로 사용합니다. 쿼리 파라미터로 전달되는 `paymentId`(성공) 또는 `code`(실패)를 읽어 결과를 표시합니다.

```ts
// src/hooks/usePortOne.ts
requestPayment({
  redirectUrl: `${window.location.origin}/payment/complete`, // 모바일 리다이렉트 착지
  ...
})

// src/app/payment/complete/page.tsx
const code      = searchParams.get("code");      // 실패 시 존재
const paymentId = searchParams.get("paymentId"); // 성공 시 존재
const status    = code || !paymentId ? "fail" : "success";
```

---

## 8. 게시판 글쓰기 — 주소 입력 시 API 과호출 문제

### 문제
주소 자동완성을 위해 입력마다 카카오 Geocoder API를 호출하면, 빠르게 타이핑할 때 불필요한 요청이 과다하게 발생했습니다.

### 해결
300ms 디바운스를 적용해 입력이 멈춘 뒤에만 API를 호출합니다. 타이머가 남아있으면 clearTimeout으로 이전 요청을 취소합니다.

```ts
// src/components/board/BoardWriteClient.tsx
if (suggestTimer.current) clearTimeout(suggestTimer.current);

suggestTimer.current = setTimeout(async () => {
  const list = await searchAddressList(query);
  setSuggestions(list);
}, 300); // 300ms 디바운스
```

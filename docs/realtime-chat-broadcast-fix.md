# 채팅 실시간 수신 방식 개선: postgres_changes → broadcast

## 문제 요약 (Before)

**RLS 정책 (Supabase 대시보드에서 관리, 리포지토리 코드 외부)**

```sql
-- messages 테이블 RLS 정책 (문제 있던 버전)
sitter_id = auth.uid()   -- sitter_id는 sitters 테이블의 row id, auth.uid()는 인증 UUID → 값 불일치
```

→ 펫시터 계정은 `SELECT` 권한 체크에 실패해 `postgres_changes` 구독 이벤트를 수신하지 못함.
(관련 커밋: `7d7fbc0`, `931aab0` 등)

**기존 실시간 수신 코드 (postgres_changes 기반)**

```ts
const channel = supabase
  .channel(`room-${activeRoomId}`)
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "messages",
      filter: `room_id=eq.${activeRoomId}`,
    },
    (payload) => {
      const m = payload.new as MessageApiItem;
      setMessages((prev) => [
        ...prev,
        { id: m.id, from: m.sender_id === userId ? "me" : "other", ... },
      ]);
    },
  )
  .subscribe();
```

→ RLS 통과 여부에 실시간 수신이 좌우되는 구조.

## 해결 (After) — `src/hooks/chat/useChatMessages.ts`

### 1. 발신자: 전송 성공 시 즉시 반영 + 채널 broadcast

```ts
// ChatClient.tsx
const deliverMessage = useCallback(
  (roomId: string, message) => {
    if (activeRoomIdRef.current === roomId) addMessage(message); // 내 화면 즉시 반영
    broadcastMessage(roomId, message);                            // 상대 채널로 전파
  },
  [addMessage, broadcastMessage],
);
```

### 2. broadcastMessage: DB 저장 결과를 채널로 전송 (RLS와 무관)

```ts
const broadcastMessage = useCallback((roomId, m) => {
  if (roomId === activeRoomId) {
    channelRef.current?.send({ type: "broadcast", event: "new_message", payload: m });
    return;
  }
  // 비활성 방인 경우 임시 채널을 열어 전송 후 정리
  const channel = supabase.channel(`room-${roomId}`);
  channel.subscribe((status) => {
    if (status !== "SUBSCRIBED") return;
    channel.send({ type: "broadcast", event: "new_message", payload: m })
      .finally(() => supabase.removeChannel(channel));
  });
}, [activeRoomId]);
```

### 3. 수신자: broadcast 이벤트 구독

```ts
const channel = supabase
  .channel(`room-${activeRoomId}`)
  .on("broadcast", { event: "new_message" }, ({ payload }) => {
    const m = payload as MessageApiItem;
    if (m.sender_id === userId) return;
    setMessages((prev) =>
      prev.some((msg) => msg.id === m.id) ? prev : [...prev, toMessage(m, userId)],
    );
  })
  .subscribe();
```

## 핵심 포인트

- `postgres_changes` → `broadcast`로 전환하면서 RLS `SELECT` 권한 문제와 무관하게 채널 구독만으로 양방향 실시간 전달을 보장함.
- 전환 커밋: `7d7fbc0` "fix: 채팅 실시간 수신 방식을 broadcast로 전환"
- 이후 `postgres_changes` 구독은 보완/백업용으로 남겨두되(현재 코드 397~428행), 주 경로는 broadcast.

---

# 채팅 목록 미리보기 미갱신 문제: 발신자 화면 직접 갱신

## 문제 요약 (Before)

채팅방 목록의 "마지막 메시지 미리보기"가 **수신자 화면에서는 정상 갱신**되지만, **발신자(나) 화면에서는 갱신되지 않음.**

Supabase Realtime의 broadcast 채널은 **자신이 보낸 이벤트를 자기 자신에게 되돌려주지 않기 때문** (self-broadcast 미지원).
→ 발신자는 `broadcast` 구독 콜백이 아예 호출되지 않으므로, 그 안에서 미리보기를 갱신하는 로직도 실행되지 않음.

```ts
// src/app/chat/page.tsx (수정 전)
if (result.data) {
  addMessage(result.data);
  broadcastMessage(result.data); // 상대방에게만 전달, 나에게는 안 옴
}
setInput("");
```

## 해결 (After) — 전송 성공 직후 `updatePreview()` 직접 호출

메시지 전송 성공 응답을 받은 시점에 broadcast 수신을 기다리지 않고, 클라이언트에서 곧바로 목록 상태를 갱신.

```ts
// src/app/chat/page.tsx (수정 후)
if (result.data) {
  addMessage(result.data);
  broadcastMessage(result.data);
  // broadcast는 self=false라 내 구독에 안 옴 → 직접 미리보기 갱신
  updatePreview(activeRoomId, result.data.content, result.data.created_at);
}
```

```ts
// src/hooks/chat/useChatRooms.ts
function updateRoomPreview(roomId: string, content: string, createdAt: string) {
  const time = formatTime(createdAt);
  setRooms((prev) =>
    prev.map((r) => (r.id === roomId ? { ...r, lastMessage: content, time } : r)),
  );
  setApplicants((prev) =>
    prev.map((a) => (a.id === roomId ? { ...a, preview: content } : a)),
  );
}
```

현재 최신 코드에서는 결제 요청/완료, 지원 확정/거절 등 모든 발신 액션 이후 동일하게 `updatePreview()`를 호출해 미리보기를 갱신함(`src/components/chat/ChatClient.tsx` 다수 지점, 예: `handleSend`).

## 핵심 포인트

- broadcast는 "상대방에게 알리는" 채널이지 "내 상태를 되돌려받는" 채널이 아님 — self-echo 없음.
- 발신자 화면 갱신은 서버 응답(`result.data`)을 이용해 **낙관적으로 즉시 처리**, 수신자 화면 갱신은 broadcast 구독으로 처리 → 두 경로가 분리됨.
- 전환 커밋: `c44a2a7` "fix: 채팅방 목록 미리보기가 내 메시지 전송 후 갱신되지 않는 문제 중점으로 해결"

---

# 1:1 채팅방 동시 생성 시 중복 방 문제

## 문제 요약 (Before)

1:1 채팅방 생성 시 `owner_id = 나`, `sitter_id = 상대`로만 단방향 SELECT로 기존 방을 확인한 뒤 없으면 INSERT하는 **check-then-act** 방식으로 구현됨.

```ts
// src/app/actions/chat.ts (수정 전)
const { data } = await db
  .from("chat_rooms")
  .select("id")
  .eq("owner_id", user.id)
  .eq("sitter_id", input.sitter_id)
  .eq("room_type", "direct")
  .maybeSingle();
existingRoom = data;
// 없으면 INSERT
```

각자 펫시터 프로필을 가진 두 사용자가 서로에게 거의 동시에 채팅을 시작하면:
- A는 `owner_id=A, sitter_id=(B의 sitter row)`로 조회
- B는 `owner_id=B, sitter_id=(A의 sitter row)`로 조회

서로의 관점에서 컬럼 조합이 다르기 때문에, 상대방의 INSERT가 반영되기 전이면 양쪽 다 "기존 방 없음"으로 판단 → 동일한 두 사용자 사이에 방이 **2개** 생성.

## 해결 (After) — `src/app/actions/chat.ts` (`findOrCreateRoom`)

상대방의 실제 `user_id`와 내 `sitters.id`를 먼저 병렬 조회(상대가 펫시터인 경우까지 포함)한 뒤, 두 조합을 `or()`로 묶어 **양방향**으로 기존 방을 확인.

```ts
const [{ data: otherSitter }, { data: mySitter }] = await Promise.all([
  db.from("sitters").select("user_id").eq("id", input.sitter_id).maybeSingle(),
  db.from("sitters").select("id").eq("user_id", user.id).maybeSingle(),
]);

const otherUserId = otherSitter?.user_id;
const mySitterId = mySitter?.id;

if (otherUserId && mySitterId) {
  const { data } = await db
    .from("chat_rooms")
    .select("id")
    .eq("room_type", "direct")
    .or(
      `and(owner_id.eq.${user.id},sitter_id.eq.${input.sitter_id}),` +
        `and(owner_id.eq.${otherUserId},sitter_id.eq.${mySitterId})`,
    )
    .maybeSingle();
  existingRoom = data;
} else {
  // 상대가 펫시터가 아닌 경우 기존 단방향 조회로 폴백
  ...
}
```

→ 누가 먼저 채팅방 생성을 요청했더라도, 두 조합(`A가 owner인 방` OR `B가 owner인 방`) 중 하나라도 존재하면 그 방을 재사용.

## 핵심 포인트

- 근본 원인은 "두 사용자 모두 서로에게 펫시터+오너 역할을 동시에 가질 수 있는" 도메인 구조에서, 단방향 컬럼 조합만으로는 같은 두 사람 사이의 관계를 하나로 식별할 수 없었던 것.
- race condition 자체(동시 요청)를 막은 게 아니라, **조회 조건을 양방향으로 넓혀** 어느 쪽이 먼저 만든 방이든 항상 같은 방으로 수렴하도록 함(여전히 이론상 완전한 원자성 보장은 아니며, DB 유니크 제약이 더 근본적인 해법이 될 수 있음).
- 전환 커밋: `c02f40a` "fix: 지난 코드 리뷰에 따른 1:1 채팅방 양방향 중복 생성 방지"

---

# 공개 검색 RPC의 개인정보 노출

## 문제 요약 (Before)

펫시터 목록·지도 검색에 쓰이는 공개 RPC `get_petsitters_filtered`(Supabase DB 함수, 로그인 없이 anon 키로 직접 호출 가능)가 다음을 그대로 반환:

- 실명(`full_name`)
- 인증 UUID(`user_id`)
- 전체 상세 주소(`available_area`, 도로명·상세주소 포함)
- 정밀 위경도(소수점 그대로, 오차 없음) → **집 위치 특정 가능**

비로그인 사용자가 RPC를 직접 호출하면(devtools/curl 등) 지도 UI를 거치지 않고도 이 정보를 그대로 받을 수 있었음.

## 해결 (After)

DB 함수 및 저장 시점 양쪽에서 조치:

**1. 응답 컬럼 최소화 (DB 함수)**
- `full_name` → `display_name`으로 대체 (실명 대신 표시용 이름)
- `user_id`(인증 UUID) 컬럼 자체를 응답에서 제거
- 주소를 시/구/동 단위로 축약한 `display_area`만 반환 (도로명·상세주소 제거)
- 좌표를 소수점 3자리로 반올림해 반환 (오차 ≈ 100m)

**2. 저장 시점에도 좌표를 뭉개어 원본 정밀도 자체를 남기지 않음 — `src/utils/geoPrivacy.ts`**

```ts
// 위경도를 약 100m 격자 단위로 반올림해 정확한 주소 특정을 방지한다.
// DB 유출 시에도 건물 단위 특정이 불가능하도록 저장 시점에 적용한다.
const PRECISION = 3;

export function fuzzCoordinate(value: number): number {
  return Math.round(value * 10 ** PRECISION) / 10 ** PRECISION;
}
```

`sitters`, `requests`, `users`(보호자 위치) 각각의 생성/수정 액션(`src/app/actions/sitters.ts`, `requests.ts`, `users.ts`)에서 위경도를 저장하기 직전에 `fuzzCoordinate()`를 적용:

```ts
// src/app/actions/sitters.ts (createSitter)
.insert({
  ...sitterFields,
  latitude: fuzzCoordinate(sitterFields.latitude),
  longitude: fuzzCoordinate(sitterFields.longitude),
  user_id: user.id,
})
```

지도 UI에서도 좌표가 실제 입력 주소와 최대 100m가량 어긋날 수 있음을 사용자에게 안내:

```
개인정보 보호를 위해 좌표는 약 100m 오차 내로 저장돼요.
지도 핀 위치가 입력한 주소와 약간 다르게 보일 수 있어요.
```

## 핵심 포인트

- 프론트엔드 필터링(마스킹)만으로는 anon 키 직접 호출을 막을 수 없으므로, **DB 함수 응답 자체**와 **저장 데이터 자체** 두 층에서 모두 정밀도를 낮춤 (defense in depth).
- 좌표는 "거리 계산/지도 표시"에만 쓰이므로, 소수점 3자리(~100m 오차)로도 서비스 기능에는 지장이 없으면서 건물 단위 특정은 불가능해짐.
- 관련 커밋: `90022af` "fix: 위경도 좌표를 저장 시점에 반올림해 정확한 주소 노출 방지" — DB 함수(`get_petsitters_filtered`) 자체는 Supabase 대시보드에서 별도 관리되어 리포지토리 코드로는 반영되지 않음.
- 20차 리뷰(`review/202607070910-리뷰.md`)에서 anon 키로 직접 호출해 재검증: `user_id` 제거, `display_area` 구·동 단위, 좌표 소수점 3자리로 뭉개짐을 확인.

# LookPup 기술 선택 이유

> 각 기술/패턴을 왜 선택했는지, 어떤 문제를 풀기 위한 결정이었는지를 설명합니다.

---

## 1. Next.js App Router — 서버 컴포넌트 + 서버 액션

### 왜?
LookPup은 펫시터 검색, 게시판 상세처럼 SEO가 중요한 페이지가 많습니다. 기존 React SPA는 JS가 실행된 뒤에야 콘텐츠가 그려져 검색 엔진에 빈 페이지로 잡힙니다.

Next.js App Router의 **서버 컴포넌트**는 서버에서 HTML을 완성해서 내려주기 때문에 검색 엔진이 콘텐츠를 바로 읽을 수 있습니다. 동시에 클라이언트에 전송되는 JS 번들 크기도 줄어듭니다.

**서버 액션**은 폼 제출이나 데이터 변경을 위한 별도 REST API 엔드포인트를 만들 필요가 없게 해줍니다. `"use server"` 하나로 서버 함수를 컴포넌트에서 직접 호출하고, CSRF 토큰도 자동 처리됩니다.

```ts
// 별도 /api 라우트 없이 컴포넌트에서 직접 서버 함수 호출
"use server";
export async function createBoard(data: BoardFormData) {
  const supabase = createServiceClient();
  await supabase.from("boards").insert(data);
}
```

---

## 2. Supabase — DB + Auth + Realtime 통합

### 왜?
별도 백엔드 서버를 두지 않는 구조를 목표로 했습니다. Supabase는 PostgreSQL DB, 소셜 로그인을 포함한 Auth, 실시간 이벤트(Realtime)를 하나의 플랫폼에서 제공하기 때문에 선택했습니다.

특히 **RLS(Row Level Security)**가 핵심이었습니다. 예를 들어 채팅 메시지는 해당 채팅방 참여자만 읽을 수 있도록 DB 정책으로 강제합니다. 서버 코드에 별도 권한 체크 로직을 작성하지 않아도 됩니다.

```sql
-- messages 테이블 RLS 예시: 채팅방 멤버만 읽기 가능
CREATE POLICY "room members only"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = messages.room_id
    AND (owner_id = auth.uid() OR sitter_id = auth.uid())
  )
);
```

---

## 3. Supabase 서비스 롤 클라이언트 — RLS 우회

### 왜?
관리자 작업(신고 처리, 알림 발송)처럼 RLS를 통과해야 하는 서버 전용 작업이 있습니다. 이런 경우 `service_role` 키를 사용하는 별도 클라이언트를 서버 액션에서만 씁니다.

클라이언트 측 코드에서는 절대 노출되지 않도록 `src/utils/supabase/service.ts`에서만 생성하고, 서버 액션 파일에서만 import합니다.

```ts
// src/utils/supabase/service.ts
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // 서버 전용 — 클라이언트에 절대 노출 금지
  );
}
```

---

## 4. Zustand — 전역 유저 상태

### 왜?
헤더의 알림 뱃지, 채팅 탭의 읽지 않은 수, 역할 기반 UI 분기 등 앱 전체에서 현재 유저 정보가 필요합니다.

**React Context**는 값이 바뀔 때 구독 중인 모든 컴포넌트가 리렌더되는 문제가 있습니다. **Redux**는 보일러플레이트가 많습니다. Zustand는 필요한 값만 선택적으로 구독해서 불필요한 리렌더를 방지하면서도 코드량이 적습니다.

```ts
// src/store/userStore.ts
const useUserStore = create<UserState>((set) => ({
  user: null, sitter: null, isLoggedIn: false,
  isLoading: true, unreadCount: 0, role: "owner",
  setUser: (user) => set({ user, isLoggedIn: !!user }),
  incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
}));

// 필요한 값만 선택적으로 구독 — 다른 값이 바뀌어도 이 컴포넌트는 리렌더 안 됨
const unreadCount = useUserStore((s) => s.unreadCount);
```

---

## 5. PortOne — 한국 결제

### 왜?
PortOne(구 아임포트)은 카카오페이, 카드사, 네이버페이 등 국내 주요 PG사를 하나의 SDK로 연동할 수 있는 한국 결제 애그리게이터입니다. 각 PG사를 직접 연동하면 계약·개발 비용이 수배가 됩니다.

모바일/데스크톱 분기도 SDK가 처리합니다. 데스크톱에서는 팝업, 모바일에서는 PG사 페이지로 리다이렉트 후 `/payment/complete`로 돌아옵니다.

```ts
// src/hooks/usePortOne.ts
requestPayment({
  paymentId,
  orderName: "반려동물 돌봄 서비스",
  totalAmount,
  currency: "KRW",
  payMethod: "CARD",
  redirectUrl: `${window.location.origin}/payment/complete`, // 모바일 착지 페이지
});
```

---

## 6. Cloudinary — 이미지 업로드 CDN

### 왜?
채팅 사진, 프로필 이미지, 반려동물 사진을 직접 서버에 저장하면 스토리지와 CDN을 따로 구성해야 합니다. Cloudinary는 업로드·변환·CDN 배포를 한 번에 처리합니다.

보안을 위해 **서명(Signature)은 서버 액션에서만 생성**합니다. 클라이언트는 서버에서 받은 서명으로 Cloudinary에 직접 업로드하기 때문에, API 시크릿이 브라우저에 노출될 일이 없습니다.

```ts
// src/app/actions/upload.ts — 서버에서 서명 생성
const str = `folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`;
const signature = crypto.createHash("sha256").update(str).digest("hex");

// src/utils/cloudinary.ts — 클라이언트에서 서명 사용해 직접 업로드
const { cloudName, apiKey, timestamp, signature } = await getCloudinarySignature(folder);
const form = new FormData();
form.append("file", file);
form.append("signature", signature); // 서버가 발급한 서명
form.append("api_key", apiKey);
await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: form });
```

---

## 7. 카카오 Maps API — 주소 검색 & 지도

### 왜?
구글 맵은 한국 지도 데이터 품질이 낮고, 도로명 주소 검색 지원이 미흡합니다. 카카오 Maps API는 한국 표준 도로명 주소 검색과 역지오코딩(좌표 → 주소)을 국문으로 정확하게 지원합니다.

게시판 글쓰기의 주소 자동완성, 마커 드래그 후 자동 주소 변환, 펫시터 상세의 위치 지도 표시에 모두 사용됩니다.

```ts
// 역지오코딩 — 좌표를 주소로 변환
const geocoder = new kakao.maps.services.Geocoder();
geocoder.coord2Address(lng, lat, (result, status) => {
  if (status === kakao.maps.services.Status.OK) {
    const address = result[0].road_address?.address_name ?? result[0].address.address_name;
    setForm((prev) => ({ ...prev, location: address }));
  }
});
```

---

## 8. TanStack Query — 서버 상태 캐싱

### 왜?
펫시터 목록, 리뷰, 수익 데이터처럼 자주 읽지만 자주 바뀌지 않는 데이터가 많습니다. 매번 fetch를 새로 하면 불필요한 네트워크 요청이 발생합니다.

TanStack Query는 `staleTime` 동안 이전 결과를 캐시해서 재사용하고, 백그라운드에서 자동 재검증합니다. 로딩 상태, 에러 상태 관리도 포함돼 있어 별도 `useState`가 필요 없습니다.

```ts
// src/hooks/queries/useSitters.ts
return useQuery({
  queryKey: ["sitters", filters],
  queryFn: () => fetchSitters(filters),
  staleTime: 1000 * 30, // 30초간 캐시 유지 — 같은 필터면 재요청 안 함
});
```

---

## 9. react-hook-form + Zod — 폼 유효성 검사

### 왜?
게시판 글쓰기, 예약 신청, 펫시터 등록 등 입력 필드가 많은 폼이 여럿 있습니다.

`useState`로 각 필드를 관리하면 입력마다 전체 컴포넌트가 리렌더됩니다. **react-hook-form**은 비제어 컴포넌트 방식으로 리렌더를 최소화합니다. **Zod**는 TypeScript 타입과 런타임 유효성 검사를 동시에 처리해서 타입 불일치 버그를 컴파일 타임에 잡습니다.

```ts
const schema = z.object({
  title: z.string().min(5, "제목은 5자 이상 입력해주세요"),
  budget: z.number().min(0),
  serviceType: z.enum(["방문돌봄", "위탁돌봄", "산책", "펫호텔", "픽업"]),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

---

## 10. Recharts — 수익 차트

### 왜?
수익 관리 페이지에서 월별 수익 추이를 시각화해야 했습니다. D3.js는 강력하지만 러닝커브가 높고 선언형 React와 결합하기 번거롭습니다. Recharts는 React 컴포넌트 형태로 차트를 조합해서 빠르게 구현할 수 있습니다.

```tsx
// src/components/earnings/EarningsChart.tsx
<ResponsiveContainer width="100%" height={250}>
  <LineChart data={chartData}>
    <XAxis dataKey="month" />
    <YAxis tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
    <Line type="monotone" dataKey="amount" stroke="#f97316" strokeWidth={2} />
    <Tooltip formatter={(v) => `${Number(v).toLocaleString()}원`} />
  </LineChart>
</ResponsiveContainer>
```

---

## 11. 채팅 이중 구독 (Broadcast + postgres_changes)

### 왜?
빠른 메시지 수신과 안정적인 메시지 보장을 동시에 달성하기 위해 두 채널을 함께 씁니다.

| 채널 | 장점 | 단점 |
|------|------|------|
| broadcast | DB를 거치지 않아 빠름 | 상대방이 오프라인이면 못 받을 수 있음 |
| postgres_changes | DB INSERT를 감지해 절대 놓치지 않음 | 약간 느림 |

두 채널 모두 구독하면 중복 수신이 발생할 수 있어, 메시지 ID 기반 중복 제거로 해결했습니다.

```ts
// src/hooks/chat/useChatMessages.ts
const channel = supabase
  .channel(`room:${roomId}`)
  .on("broadcast", { event: "new_message" }, ({ payload }) => {
    setMessages((prev) =>
      prev.some((m) => m.id === payload.id) ? prev : [...prev, toMessage(payload, userId)]
    );
  })
  .on("postgres_changes", { event: "INSERT", table: "messages", filter: `room_id=eq.${roomId}` },
    ({ new: m }) => {
      setMessages((prev) =>
        prev.some((msg) => msg.id === m.id) ? prev : [...prev, toMessage(m, userId)]
      );
    }
  )
  .subscribe();
```

---

## 12. 채팅 메시지 프리픽스 패턴

### 왜?
결제 요청, 서비스 시작, 돌봄 기록, 예약 수정 등 메시지 종류가 14가지로 늘었습니다. 타입별로 컬럼을 추가하거나 별도 테이블을 만들면 기능이 추가될 때마다 DB 스키마를 변경해야 합니다.

`content` 단일 컬럼에 프리픽스를 붙이면, 새 메시지 타입 추가 시 **DB 마이그레이션 없이** 상수 하나만 추가하면 됩니다.

```ts
// src/lib/chatMessagePrefixes.ts
export const PAYMENT_REQUEST_PREFIX  = "__payment_request__:";  // 뒤에 JSON
export const SERVICE_START_PREFIX    = "__service_start__";      // 데이터 없음
export const CARE_RECORD_PREFIX      = "__care_record__:";       // 뒤에 JSON
// ... 총 14종

// 파싱
if (content.startsWith(PAYMENT_REQUEST_PREFIX)) {
  const data = JSON.parse(content.slice(PAYMENT_REQUEST_PREFIX.length));
  return { type: "payment_request", ...data };
}
```

---

## 13. 좌표 퍼지 (fuzzCoordinate) — 위치 개인정보 보호

### 왜?
보호자 집 주소나 펫시터 활동 지역을 정확한 좌표로 DB에 저장하면, 유출 시 건물 단위까지 특정 가능합니다.

소수점 3자리로 반올림하면 정밀도가 약 100m 격자로 떨어져 건물 특정이 불가능하지만, 동네 거리 계산에는 충분합니다. DB에 저장되는 시점에 적용하기 때문에 앱 어디서도 정확한 좌표가 노출되지 않습니다.

```ts
// src/utils/geoPrivacy.ts
const PRECISION = 3; // 소수점 3자리 ≈ 약 100m 격자

export function fuzzCoordinate(value: number): number {
  return Math.round(value * 10 ** PRECISION) / 10 ** PRECISION;
}

// 사용 — DB 저장 시점에 적용
await supabase.from("boards").insert({
  latitude:  fuzzCoordinate(lat),
  longitude: fuzzCoordinate(lng),
});
```

---

## 14. Haversine 공식 — 실거리 계산

### 왜?
지도상 두 점의 경위도 차이를 그냥 빼면 직선 픽셀 거리가 나옵니다. 지구는 구면이기 때문에 위도가 높아질수록 경도 1도의 실거리가 줄어듭니다.

Haversine 공식은 지구 곡률을 반영해 두 좌표 간 실거리(km)를 계산합니다. 펫시터 검색 페이지에서 "현재 위치에서 X.Xkm" 표시에 사용됩니다.

```ts
// src/utils/distance.ts
export function calculateDistanceKm(from: Coordinate, to: Coordinate): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) *
    Math.cos(toRadians(to.lat)) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

---

## 15. useLayoutEffect — 채팅 스크롤 보정

### 왜?
이전 메시지를 불러오면 새 메시지가 목록 상단에 prepend되면서 스크롤이 맨 위로 튑니다. `useEffect`는 브라우저가 화면에 그린 뒤 실행되기 때문에, 스크롤 보정을 `useEffect`로 하면 위치가 튀는 순간이 사용자에게 보입니다.

`useLayoutEffect`는 DOM이 업데이트된 직후, 브라우저가 화면에 페인트하기 전에 동기로 실행됩니다. 스크롤 위치를 보정하는 코드를 여기 두면 깜빡임 없이 부드럽게 처리됩니다.

```ts
// src/components/chat/ChatClient.tsx
const handleLoadMore = () => {
  scrollAnchorRef.current = el.scrollHeight; // 로드 전 높이 저장
  isLoadMoreRef.current = true;
  loadMore();
};

useLayoutEffect(() => {
  if (isLoadMoreRef.current) {
    el.scrollTop += el.scrollHeight - scrollAnchorRef.current; // 높이 차이만큼 보정
    isLoadMoreRef.current = false;
    return;
  }
  el.scrollTop = el.scrollHeight; // 일반 메시지는 최하단 유지
}, [messages]);
```

---

## 16. AbortController — 채팅방 전환 경쟁 조건 방지

### 왜?
채팅방 A에서 B로 빠르게 전환하면, A의 fetch 응답이 B의 메시지 상태를 덮어씌우는 경쟁 조건(Race Condition)이 발생할 수 있습니다.

`AbortController`로 채팅방이 바뀌는 순간 이전 fetch를 즉시 취소합니다. React `useEffect`의 클린업 함수에서 `abort()`를 호출하면 방이 바뀔 때 자동으로 실행됩니다.

```ts
// src/hooks/chat/useChatMessages.ts
useEffect(() => {
  const controller = new AbortController();

  fetch(`/api/chat/rooms/${activeRoomId}/messages`, {
    signal: controller.signal,
  }).then(/* 메시지 적용 */);

  return () => controller.abort(); // 방 전환 시 이전 fetch 취소
}, [activeRoomId]);
```

---

## 17. 서버 액션 vs. API 라우트 — 분리 원칙

### 왜?
두 방식이 비슷해 보이지만 역할이 다릅니다.

| | 서버 액션 (`"use server"`) | API 라우트 (`/api/...`) |
|---|---|---|
| 용도 | 데이터 변경(뮤테이션) | 데이터 읽기(GET) 또는 외부 HTTP 클라이언트용 |
| CSRF 보호 | 자동 | 직접 구현 필요 |
| 호출 방식 | 컴포넌트에서 직접 import | fetch로 HTTP 요청 |

LookPup에서는 이 원칙을 엄격히 지킵니다. 게시글 작성, 지원하기, 결제 생성은 서버 액션. 수익 데이터 조회(`/api/earnings`), 채팅 메시지 목록(`/api/chat/rooms/[id]/messages`)처럼 외부 클라이언트나 TanStack Query에서 호출이 필요한 읽기는 API 라우트로 분리합니다.

---

## 요약

| 기술 | 선택 이유 한 줄 요약 |
|------|----------------------|
| Next.js App Router | SEO + 서버 렌더링 + 별도 API 없는 서버 액션 |
| Supabase | DB·Auth·Realtime을 한 플랫폼에서, RLS로 DB 레벨 권한 강제 |
| Supabase 서비스 롤 | 관리자·알림 등 신뢰된 서버 작업에서만 RLS 우회 |
| Zustand | Context 리렌더 없이 전역 유저 상태 선택적 구독 |
| PortOne | 국내 PG사 한 번에 연동, 모바일 리다이렉트 자동 처리 |
| Cloudinary | 이미지 CDN·변환 통합, 서명으로 API 시크릿 서버 보호 |
| 카카오 Maps | 한국 도로명 주소 정확도, 역지오코딩 한국어 지원 |
| TanStack Query | 읽기 데이터 30초 캐시로 불필요한 재요청 방지 |
| react-hook-form + Zod | 비제어 컴포넌트로 리렌더 최소화 + 타입 안전 유효성 |
| Recharts | 선언형 React 컴포넌트 형태 차트 |
| 이중 Realtime 구독 | 빠른 broadcast + 안정적 postgres_changes, ID 기반 중복 제거 |
| 메시지 프리픽스 패턴 | DB 스키마 변경 없이 메시지 타입 14종 확장 |
| fuzzCoordinate | 좌표 100m 격자 퍼지로 건물 단위 특정 차단 |
| Haversine | 지구 곡률 반영한 실거리 계산 |
| useLayoutEffect | 페인트 전 스크롤 보정으로 깜빡임 제거 |
| AbortController | 채팅방 전환 시 이전 fetch 즉시 취소해 경쟁 조건 방지 |
| 서버 액션/API 분리 | 뮤테이션은 서버 액션, 읽기는 API 라우트로 역할 명확화 |

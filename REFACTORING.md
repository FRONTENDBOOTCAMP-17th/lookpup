# LookPup 리팩토링 정리

---

## 1. 헤더 컴포넌트 분리

### 배경
`HeaderClient.tsx` 하나에 인증 상태 관리, 모바일 메뉴, 네비게이션 링크가 모두 뒤섞여 616줄 짜리 파일이 됐습니다. 한 파일에 너무 많은 관심사가 섞여 유지보수가 어려웠습니다.

### 개선
역할에 따라 3개 파일로 분리했습니다.

```
HeaderClient.tsx (616줄) → 삭제
  ├── HeaderAuth.tsx     — 로그인/로그아웃, 알림 뱃지
  ├── HeaderMobileMenu.tsx — 모바일 햄버거 메뉴
  └── NavLink.tsx        — 활성 링크 스타일 처리
```

---

## 2. 수익 관리 페이지 분리

### 배경
`EarningsClient.tsx` 하나에 차트, 요약 카드, 거래 내역, API 호출, 유틸 함수가 모두 들어있어 247줄이 넘는 단일 파일이었습니다.

### 개선
관심사별로 분리했습니다.

```
EarningsClient.tsx (247줄) →
  ├── earnings/EarningsChart.tsx         — 차트 UI
  ├── earnings/EarningsSummaryCards.tsx  — 요약 카드 UI
  ├── earnings/EarningsTransactions.tsx  — 거래 내역 UI
  ├── hooks/queries/useEarnings.ts       — 데이터 페칭 훅
  ├── types/earnings.ts                  — 타입 정의
  └── utils/earnings.ts                  — 계산 유틸
```

---

## 3. 공통 컴포넌트 추출

### BackButton
마이프로필 하위 11개 페이지에서 뒤로가기 버튼을 각자 다르게 구현하고 있었습니다. 스타일도 미묘하게 달랐습니다.

`BackButton.tsx` 공통 컴포넌트로 추출해 11개 파일에서 중복 코드 제거. 데스크톱/모바일 분기도 내부에서 처리합니다.

### SectionCard
마이프로필과 펫시터 프로필 12개 페이지에서 카드 래퍼 스타일이 제각각이었습니다.

`SectionCard.tsx`로 통일해 border, shadow, radius 스타일이 전체 페이지에서 일관되게 적용됩니다.

---

## 4. 채팅 페이지 리렌더링 최적화

### 배경
채팅 페이지는 메시지 수신, 탭 전환, 채팅방 선택 등 상태 변경이 빈번한데, 상태가 바뀔 때마다 ChatSidebar, ChatWindow, 각종 모달이 불필요하게 리렌더링되고 있었습니다.

### 개선
- 이벤트 핸들러에 `useCallback` 적용
- 파생 데이터(필터링된 목록, 결제 상태 등)에 `useMemo` 적용
- `ChatSidebar`, `ChatWindow` props를 shared props 객체로 정리해 불필요한 prop 드릴링 제거
- 관련 7개 파일 전면 정리 (1133줄 추가 / 877줄 삭제)

---

## 5. 채팅 모달 동적 임포트

### 배경
결제 모달, 돌봄 기록 모달, 서비스 완료 모달 등 5개 모달이 채팅 페이지 진입 시 전부 번들에 포함되어 초기 로딩이 느렸습니다.

### 개선
`next/dynamic`으로 전환해 실제로 열릴 때 로드합니다. `ssr: false` 옵션으로 서버사이드 렌더링도 제외했습니다.

```ts
// 기존 — 페이지 진입 시 전부 로드
import CareRecordModal from "@/components/common/chat/CareRecordModal";

// 개선 — 모달이 열릴 때만 로드
const CareRecordModal = dynamic(
  () => import("@/components/common/chat/CareRecordModal"),
  { ssr: false }
);
```

총 5개 모달 동적 임포트 전환 (PaymentModal, CareRecordModal, ServiceCompleteModal, ReservationConfirmModal, ReservationEditModal)

---

## 6. LCP 개선 (Lighthouse 기반)

Lighthouse 보고서에서 LCP 지연 원인을 찾아 순차적으로 개선했습니다.

| 항목 | 조치 |
|------|------|
| 채팅방 목록 초기 로딩 | 클라이언트 fetch → 서버사이드 프리페치로 전환 |
| 헤더 로고 이미지 | `fetchPriority="high"` 적용 |
| 예약 상세 반려동물 이미지 | `priority` prop 추가 (Next.js Image) |

### 채팅방 목록 서버 프리페치
채팅 페이지 진입 직후 빈 화면이 잠시 보이는 문제가 있었습니다. 채팅방 목록 fetch가 클라이언트에서 일어나다 보니 JS 로드 → 렌더 → fetch 순서로 지연이 생겼습니다.

서버 컴포넌트에서 미리 데이터를 조회해 `initialRoomsData`로 내려주는 방식으로 변경했습니다.

```ts
// src/app/chat/page.tsx — 서버 컴포넌트
const initialRoomsData = await getRoomsForUser(userId);

return <ChatClient initialRoomsData={initialRoomsData} />;
```

---

## 7. 이미지 업로드 Cloudinary 단일화

### 배경
반려동물 이미지는 Supabase Storage에, 채팅 사진과 프로필 이미지는 Cloudinary에 각각 올라가고 있었습니다. 저장소가 혼용되어 이미지 URL 포맷이 달랐고 삭제·관리 로직도 이원화됐습니다.

### 개선
반려동물 이미지도 Cloudinary로 통일했습니다. Supabase Storage 업로드 관련 코드 28줄 제거, 로직이 단순해졌습니다.

---

## 8. 렌더링 중 ref 접근 패턴 제거

### 배경
채팅 훅과 컴포넌트에서 렌더링 도중 `ref.current`를 직접 읽거나 쓰는 코드가 있었습니다. ESLint `react-hooks/exhaustive-deps` 규칙 위반 8건이 검출됐습니다. 렌더 중 ref를 변경하면 React의 동시성 모드에서 예측 불가능한 동작이 생길 수 있습니다.

### 개선
렌더 로직에서 ref 접근을 모두 `useEffect` 또는 이벤트 핸들러로 이동했습니다.

---

## 9. 타입 안정성 개선

### `as any` 제거
Supabase 응답 타입을 `as any`로 캐스팅하던 곳을 명시적 타입으로 교체했습니다.

### button → Link 교체
페이지 이동 동작을 하면서 `<button onClick={() => router.push(...)}>` 로 구현된 곳을 `<Link href="...">` 로 교체했습니다.
- 접근성: 앵커 태그로 동작해 키보드 탐색, 우클릭 새 탭 열기 지원
- SEO: 크롤러가 링크로 인식 가능

---

## 요약

| 분류 | 내용 |
|------|------|
| 구조 개선 | 헤더 분리, 수익 페이지 분리, BackButton·SectionCard 공통화 |
| 성능 | 모달 동적 임포트, 서버 프리페치, LCP 이미지 최적화, 리렌더링 최소화 |
| 일관성 | Cloudinary 단일화, 스타일 통일 |
| 코드 품질 | as any 제거, ref 패턴 수정, button → Link 교체 |

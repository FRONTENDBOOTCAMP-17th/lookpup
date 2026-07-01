<div align="center">
  <img src="./public/lookpup_logo.png" alt="봐주개 로고" width="500" />
</div>

> 믿고 맡기는 우리 동네 펫시터 매칭 - 봐주개

**개발 기간**: 2026.05.28 ~ 2026.07.08

<div>
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />
</div>

## 📑 목차

- [프로젝트 소개](#-프로젝트-소개)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [프로젝트 구조](#-프로젝트-구조)
- [시작하기](#-시작하기)
- [팀원](#-팀원)

## 📝 프로젝트 소개

봐주개는 반려동물 보호자와 펫시터를 연결해주는 매칭 플랫폼입니다.
보호자는 원하는 조건의 펫시터를 찾아 예약하고, 펫시터는 프로필을 등록해 돌봄 서비스를 제공할 수 있습니다.

## ✨ 주요 기능

- 회원가입 / 로그인 (일반 사용자, 펫시터)
- 반려동물 등록 및 관리
- 펫시터 등록 및 검색
- 예약 요청 / 예약 관리
- 실시간 채팅
- 결제 (포트원 연동)
- 리뷰 작성 및 조회
- 알림
- 게시판
- 정산(수익) 관리
- 관리자 페이지

## 🛠 기술 스택

- **Framework**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI, shadcn
- **State/Data**: TanStack Query, Zustand, React Hook Form, Zod
- **Backend/DB**: Supabase
- **결제**: PortOne
- **기타**: Recharts, date-fns

## 📚 주요 라이브러리

| 라이브러리                       | 버전            | 용도                              |
| -------------------------------- | --------------- | --------------------------------- |
| next                             | 16.2.6          | React 프레임워크, 라우팅/렌더링   |
| react / react-dom                | 19.2.4          | UI 렌더링                         |
| typescript                       | ^5              | 정적 타입 검사                    |
| tailwindcss                      | ^4              | 스타일링                          |
| @tailwindcss/postcss             | ^4              | Tailwind CSS PostCSS 플러그인     |
| tw-animate-css                   | ^1.4.0          | Tailwind 애니메이션 유틸리티      |
| radix-ui / @radix-ui/react-icons | ^1.4.3 / ^1.3.2 | 헤드리스 UI 컴포넌트, 아이콘      |
| shadcn                           | ^4.9.0          | Radix 기반 UI 컴포넌트 세트       |
| class-variance-authority         | ^0.7.1          | 컴포넌트 variant 스타일 관리      |
| clsx / tailwind-merge            | ^2.1.1 / ^3.6.0 | 클래스명 조건부 결합 및 중복 제거 |
| lucide-react                     | ^1.18.0         | 아이콘                            |
| @supabase/supabase-js            | ^2.107.0        | Supabase 클라이언트(DB, Auth)     |
| @supabase/ssr                    | ^0.10.3         | SSR 환경 Supabase 세션 처리       |
| @tanstack/react-query            | ^5.101.0        | 서버 상태 관리 및 데이터 패칭     |
| zustand                          | ^5.0.14         | 클라이언트 전역 상태 관리         |
| react-hook-form                  | ^7.77.0         | 폼 상태 관리                      |
| @hookform/resolvers              | ^5.4.0          | react-hook-form과 zod 스키마 연동 |
| zod                              | ^4.4.3          | 스키마 기반 유효성 검증           |
| react-day-picker                 | ^9.14.0         | 날짜 선택 UI (예약 일정 등)       |
| date-fns                         | ^4.4.0          | 날짜 포맷/연산                    |
| @portone/browser-sdk             | ^0.1.8          | 결제(PortOne) 연동                |
| recharts                         | ^3.8.0          | 정산/통계 차트                    |
| sonner                           | ^2.0.7          | 토스트 알림 UI                    |
| eslint / eslint-config-next      | ^9 / 16.2.6     | 코드 린팅                         |

## 📂 프로젝트 구조

<details>
<summary>펼쳐보기</summary>

```
lookpup/
├── src/
│   ├── app/
│   │   ├── about/                # 서비스 소개 페이지
│   │   ├── actions/               # 서버 액션
│   │   ├── admin/                 # 관리자 페이지 (신고, 상태 관리)
│   │   │   ├── reports/
│   │   │   └── state/
│   │   ├── api/                   # API 라우트
│   │   │   ├── chat/
│   │   │   ├── earnings/          # 정산
│   │   │   ├── notifications/
│   │   │   ├── pets/
│   │   │   ├── portone/           # 결제 웹훅/검증
│   │   │   ├── requests/          # 예약 요청
│   │   │   ├── reservations/
│   │   │   ├── reviews/
│   │   │   ├── sitters/
│   │   │   └── users/
│   │   ├── auth/                  # 인증
│   │   │   ├── callback/
│   │   │   ├── login/
│   │   │   ├── restore/
│   │   │   └── verification/
│   │   ├── board/                 # 게시판
│   │   │   ├── [id]/
│   │   │   └── write/
│   │   ├── chat/                  # 채팅
│   │   ├── myprofile/             # 마이페이지
│   │   │   ├── booking-history/
│   │   │   ├── earnings/
│   │   │   ├── mypets/
│   │   │   ├── posts/
│   │   │   ├── report/
│   │   │   ├── reviews/
│   │   │   ├── settings/
│   │   │   ├── sitter-edit/
│   │   │   └── sitter-profile/
│   │   ├── notifications/
│   │   ├── payment/               # 결제
│   │   │   └── complete/
│   │   ├── pet-register/          # 반려동물 등록
│   │   ├── petsitters/            # 펫시터 목록/상세
│   │   │   └── [id]/
│   │   ├── sitter-register/       # 펫시터 등록
│   │   ├── privacy/               # 개인정보처리방침
│   │   ├── terms/                 # 이용약관
│   │   ├── suspended/             # 정지 계정 안내
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/                # 도메인/공통 UI 컴포넌트
│   │   ├── about/
│   │   ├── admin/
│   │   ├── board/
│   │   ├── chat/
│   │   ├── common/                # 공통 컴포넌트 (chat 등)
│   │   ├── home/
│   │   ├── layout/                # 헤더/푸터 등 레이아웃
│   │   ├── legal/
│   │   ├── myprofile/
│   │   ├── notifications/
│   │   ├── pet-register/
│   │   ├── petsitters/
│   │   ├── providers/             # Context/Query Provider
│   │   ├── sitter/
│   │   ├── sitter-register/
│   │   └── ui/                    # shadcn 기반 공통 UI
│   ├── hooks/                     # 커스텀 훅
│   │   ├── chat/
│   │   ├── pet-register/
│   │   ├── petsitters/
│   │   ├── sitter-register/
│   │   ├── queries/                # TanStack Query 훅 (펫시터/예약 등 조회)
│   │   ├── useAddressSearch.ts
│   │   ├── useAuth.ts
│   │   ├── useImageUpload.ts
│   │   └── usePortOne.ts
│   ├── lib/                       # 도메인 로직/헬퍼
│   │   ├── board.ts
│   │   ├── chatMessagePrefixes.ts
│   │   ├── notificationHelpers.ts
│   │   ├── notificationPrefs.ts
│   │   ├── sitterRegister.ts
│   │   ├── supabase.ts
│   │   └── utils.ts
│   ├── schemas/                   # zod 유효성 검증 스키마
│   │   ├── booking.schema.ts
│   │   ├── petRegister.ts
│   │   └── sitterRegister.ts
│   ├── store/                     # zustand 전역 상태
│   │   ├── bookingStore.ts
│   │   └── userStore.ts
│   ├── types/                     # 타입 정의 (Supabase 타입 포함)
│   │   ├── board.ts
│   │   ├── database.types.ts
│   │   ├── petRegister.ts
│   │   └── sitterRegister.ts
│   └── utils/                     # 유틸 함수
│       ├── boardConditions.ts
│       ├── cloudinary.ts
│       ├── distance.ts
│       ├── geoPrivacy.ts
│       ├── kakaoGeocode.ts
│       ├── mapMarker.ts
│       ├── petsitterArea.ts
│       └── supabase/               # Supabase 클라이언트/서버/미들웨어
│           ├── client.ts
│           ├── middleware.ts
│           ├── server.ts
│           └── service.ts
├── supabase/                       # Supabase 설정 및 마이그레이션
├── docs/                           # 프로젝트 문서 (API 명세 등)
└── public/                         # 정적 리소스 (로고, 이미지 등)
```

</details>

## 🏁 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/FRONTENDBOOTCAMP-17th/lookpup.git

# 2. 폴더 이동
cd lookpup

# 3. 의존성 설치
npm install

# 4. 개발 서버 실행
npm run dev
```

## 🔑 환경 변수

프로젝트 루트에 `.env` 파일을 생성하고 아래 항목을 채워주세요.

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# PortOne (결제)
NEXT_PUBLIC_PORTONE_STORE_ID=
NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY=
NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY_TOSS=
PORTONE_API_SECRET=
PORTONE_WEBHOOK_SECRET=

# Cloudinary (이미지 업로드)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Kakao Map
NEXT_PUBLIC_KAKAO_MAP_KEY=

# 사이트 URL
NEXT_PUBLIC_SITE_URL=
```

## 👥 팀원

| 이름   | 역할 | GitHub           |
| ------ | ---- | ---------------- |
| 이규화 | 팀장 | @gyuhwa9922      |
| 박규나 | 팀원 | @Gyu-me          |
| 이우현 | 팀원 | @sealheal        |
| 최영은 | 팀원 | @0sliverchoi321z |

# Next.js로 SEO 제대로 하기 — App Router 실전 가이드

> 대상: Next.js 16 (App Router) · React 19 · TypeScript
> 17기 파이널 프로젝트 조원 모두에게 공유합니다. 블로그에도 같은 글을 올립니다.
> 이 글의 모든 예제는 끝에 적어 둔 **샘플 프로젝트에서 실제로 띄워 검증**한 코드입니다.

검색엔진에 잘 걸리게 만드는 일을 흔히 SEO(Search Engine Optimization)라고 부르는데, 부트캠프 막바지에 와서 "기능은 다 되는데 구글에 검색하면 우리 서비스가 안 나온다"는 이야기를 자주 듣습니다. 사실 Next.js를 쓰고 있다면 SEO의 8할은 이미 깔아 둔 셈이고, 나머지는 메타데이터 몇 개를 제대로 채워 넣는 일에 가깝습니다. 이 글은 그 "나머지"를 처음부터 끝까지, 실제로 동작하는 코드로 정리한 것입니다.

---

## 0. SEO가 정확히 무엇을 보는가 — 먼저 크롤러의 눈으로

검색엔진은 사람이 보는 화면을 보지 않습니다. 구글 봇이 우리 페이지에 들어오면 제일 먼저 하는 일은 **서버가 내려준 HTML 원문을 그대로 읽는 것**입니다. 그 HTML 안에 제목(`<title>`)이 있고, 설명(`<meta name="description">`)이 있고, 본문 텍스트가 들어 있어야 "아, 이 페이지는 이런 내용이구나" 하고 색인(index)에 넣습니다. 즉 SEO의 출발점은 디자인이 아니라 **"서버가 내려주는 HTML에 의미 있는 정보가 들어 있는가"** 입니다.

여기서 부트캠프 프로젝트들이 가장 많이 걸리는 함정이 하나 있습니다. 바로 클라이언트 렌더링입니다.

```tsx
'use client';

export default function ProductPage() {
  const [product, setProduct] = useState(null);
  useEffect(() => {
    fetch('/api/products/1').then(r => r.json()).then(setProduct);
  }, []);
  if (!product) return <p>로딩 중...</p>;
  return <h1>{product.name}</h1>;
}
```

이 코드는 화면에선 잘 동작합니다. 그런데 크롤러가 받아 가는 첫 HTML에는 `<h1>` 안에 상품 이름이 없습니다. 서버가 내려준 시점엔 아직 `로딩 중...` 만 있고, 상품 이름은 자바스크립트가 실행된 **뒤에야** 채워지기 때문입니다. 구글은 자바스크립트를 실행해 주긴 하지만 그 처리를 뒤로 미루고(렌더 큐), 그동안 빈 페이지로 평가하거나 아예 색인을 건너뛰기도 합니다. 그래서 **검색에 노출되어야 하는 공개 페이지(메인, 목록, 상세)는 가능하면 서버 컴포넌트로 데이터를 받아 HTML에 박아서 내려보내야** 합니다.

App Router의 기본은 서버 컴포넌트입니다. 위 코드를 이렇게 바꾸면 됩니다.

```tsx
// 'use client' 없음 — 서버 컴포넌트(기본값)
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);   // 서버에서 직접 데이터 fetch
  return <h1>{product.name}</h1>;          // HTML에 이름이 박혀서 내려감
}
```

차이를 눈으로 확인하는 방법은 뒤(10장)에서 다루지만, 한 줄로 미리 말하면 `curl 주소 | grep '<h1'` 했을 때 상품 이름이 보이면 통과, `로딩 중`만 보이면 SEO상 문제입니다.

> **핵심 한 줄**: 검색에 걸려야 하는 페이지에서 `'use client'` + `useEffect` 데이터 패칭은 피한다. 데이터는 서버 컴포넌트에서 받아 HTML에 담아 내려보낸다. 상호작용이 필요한 일부 UI만 `'use client'` 자식 컴포넌트로 떼어낸다.

---

## 1. Metadata API — `<head>`를 직접 건드리지 않는다

옛날 방식(Pages Router나 순수 React)에서는 `<head>`에 `<title>`, `<meta>`를 직접 넣거나 `react-helmet` 같은 라이브러리를 썼습니다. App Router에서는 그럴 필요가 없습니다. **파일에서 `metadata` 객체만 export하면 Next가 알아서 `<head>`를 만들어 줍니다.**

가장 기본은 루트 레이아웃입니다.

```tsx
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'), // 배포 도메인. 상대경로 OG 이미지를 절대경로로 바꿔줌
  title: {
    default: 'Cookeat — 레시피와 마켓을 한 곳에서',
    template: '%s | Cookeat',  // 하위 페이지 제목 뒤에 자동으로 " | Cookeat" 붙음
  },
  description: '집밥 레시피 공유와 식재료 마켓을 함께 즐기는 푸드 커뮤니티',
  openGraph: {
    type: 'website',
    siteName: 'Cookeat',
    locale: 'ko_KR',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

여기서 초보자가 꼭 알아야 할 포인트 세 가지입니다.

- **`metadataBase`** — 이걸 설정하지 않으면 OG 이미지를 `/og.png` 같은 상대경로로 적었을 때 절대경로로 바뀌지 않아 카카오톡·페이스북 미리보기가 깨집니다. 배포 도메인을 한 번 적어 두면 끝입니다.
- **`title.template`** — 페이지마다 `상품명 | Cookeat`, `로그인 | Cookeat`처럼 서비스명을 뒤에 붙이고 싶을 때 씁니다. 하위 페이지에서는 `title: '상품명'`만 적으면 자동으로 합쳐집니다.
- **`lang="ko"`** — 한국어 서비스인데 `lang="en"`으로 두는 조가 많습니다. 검색엔진과 스크린리더가 언어를 잘못 인식하니 반드시 `ko`로 바꿔 주세요.

정적인 페이지(소개, 약관 등)는 그냥 `metadata`만 export하면 됩니다.

```tsx
// app/about/page.tsx
export const metadata = {
  title: '서비스 소개',          // → "서비스 소개 | Cookeat"
  description: 'Cookeat이 어떤 서비스인지 알려드립니다.',
};

export default function AboutPage() {
  return <main>...</main>;
}
```

---

## 2. 상세 페이지의 핵심 — `generateMetadata`로 동적 메타 만들기

SEO에서 진짜 중요한 건 상품 상세, 게시글 상세처럼 **개수가 많고 URL이 각각 다른 페이지**입니다. 이런 페이지는 제목·설명이 데이터에 따라 달라져야 하므로 고정 `metadata` 대신 `generateMetadata` 함수를 씁니다.

```tsx
// app/products/[id]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;          // Next 15+부터 params는 Promise라 await 필요
  const product = await getProduct(id);

  if (!product) {
    return { title: '상품을 찾을 수 없습니다' };
  }

  const title = product.name;
  const description = product.summary?.slice(0, 120) ?? `${product.name} 상품 상세 정보`;

  return {
    title,
    description,
    alternates: { canonical: `/products/${id}` },   // 이 페이지의 대표 URL
    openGraph: {
      title,
      description,
      url: `/products/${id}`,
      images: [{ url: product.imageUrl, width: 1200, height: 630, alt: product.name }],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();            // 없는 상품 → 404 (SEO상 soft-404 방지)
  return (
    <main>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
    </main>
  );
}
```

초보자가 자주 놓치는 부분을 짚어 둡니다.

- **`params`는 `await` 해야 합니다.** Next 15부터 `params`가 Promise로 바뀌었습니다. `params.id`로 바로 쓰면 타입 에러가 납니다.
- **`generateMetadata`와 본문에서 같은 데이터를 두 번 fetch해도 괜찮습니다.** 같은 요청 안에서 `fetch`는 자동으로 캐시(요청 메모이제이션)되고, Supabase 호출처럼 캐시가 안 되는 경우엔 `React.cache()`로 감싸 한 번만 호출되게 할 수 있습니다(9장).
- **없는 데이터는 `notFound()`로 404를 내려야 합니다.** 상품이 없는데도 200 OK에 "상품이 없습니다" 화면만 보여주면 구글은 이를 soft-404로 보고 신뢰도를 깎습니다.

---

## 3. canonical(대표 URL) — 중복 URL 정리

같은 내용이 여러 주소로 열리는 경우가 흔합니다. `?utm_source=...`가 붙거나, 정렬 파라미터(`?sort=price`)가 붙거나, 페이지네이션이 섞이거나요. 검색엔진은 이걸 전부 다른 페이지로 오해해 평가 점수를 분산시킵니다. 그래서 "이 페이지의 진짜 대표 주소는 이거다"를 알려주는 게 canonical입니다.

```tsx
export const metadata = {
  alternates: { canonical: '/products' },
};
```

`metadataBase`를 설정해 두었으면 상대경로로 적어도 자동으로 절대경로(`https://example.com/products`)가 됩니다. 목록 페이지에 정렬·필터 파라미터가 많은 조라면 canonical을 꼭 넣어 주세요.

---

## 4. Open Graph / 트위터 카드 — 카카오톡·SNS 미리보기

링크를 카카오톡이나 슬랙에 붙였을 때 뜨는 썸네일·제목·설명이 Open Graph입니다. 한국 서비스는 카카오톡 공유가 많으니 이건 SEO만큼 체감이 큽니다. 1장의 루트 레이아웃에 `openGraph` 기본값을 깔아 두고, 상세 페이지에서 제목·이미지만 덮어쓰면 됩니다(2장 예제처럼).

이미지를 따로 만들기 번거롭다면 Next가 코드로 OG 이미지를 그려 주는 기능이 있습니다. `app/` 아래(또는 라우트 폴더 아래)에 `opengraph-image.tsx`를 두면 됩니다.

```tsx
// app/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export const alt = 'Cookeat';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 96, background: '#16a34a', color: 'white',
      }}>
        Cookeat
      </div>
    ),
    { ...size },
  );
}
```

이 파일만 두면 Next가 `<meta property="og:image">`를 알아서 채워 줍니다. 트위터 카드(`twitter:`)도 `openGraph`가 있으면 상당 부분 자동으로 따라오지만, 명시하고 싶으면 `twitter: { card: 'summary_large_image' }`를 metadata에 추가하면 됩니다.

---

## 5. JSON-LD 구조화 데이터 — 리치 결과(가격·별점) 노리기

구글 검색결과에서 가격이나 별점, 재고 같은 정보가 제목 아래에 함께 붙어 나오는 걸 본 적 있을 겁니다. 그건 페이지에 JSON-LD라는 구조화 데이터를 심어 둔 덕분입니다. 사람 눈엔 안 보이지만 크롤러가 읽어 "이건 상품이고, 가격은 8,900원, 재고 있음"처럼 구조적으로 이해합니다. 상품·레시피·이벤트·게시글처럼 종류가 뚜렷한 상세 페이지라면 넣어 둘 가치가 충분합니다.

서버 컴포넌트 안에서 `<script type="application/ld+json">`을 직접 렌더링하면 됩니다.

```tsx
// app/products/[id]/page.tsx — 본문 컴포넌트
export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.imageUrl,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'KRW',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1>{product.name}</h1>
      {/* ... 본문 ... */}
    </main>
  );
}
```

`dangerouslySetInnerHTML`라는 이름이 무섭게 들리지만, 여기서는 우리가 만든 객체를 `JSON.stringify`로 직렬화해 넣는 것뿐이라 안전합니다(사용자가 입력한 문자열을 그대로 넣지만 않으면 됩니다). 스키마 종류는 schema.org 기준으로 `Recipe`, `Event`, `Article` 등 서비스 성격에 맞게 바꿔 쓰면 됩니다. 배포 후 구글 [Rich Results Test](https://search.google.com/test/rich-results)에 URL을 넣으면 이 데이터가 잘 읽히는지 바로 확인됩니다.

---

## 6. sitemap.xml — 크롤러에게 페이지 목록 건네주기

사이트맵은 "우리 사이트에 이런 URL들이 있어요"를 구글에 한 번에 알려주는 파일입니다. App Router에서는 `app/sitemap.ts` 하나면 끝입니다. 정적 페이지는 손으로 적고, 상세 페이지는 DB에서 목록을 가져와 펼치면 됩니다.

```ts
// app/sitemap.ts
import type { MetadataRoute } from 'next';

const BASE = 'https://example.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProductIds(); // DB에서 공개 상품 id 목록

  const productUrls = products.map((id) => ({
    url: `${BASE}/products/${id}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  return [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/products`, changeFrequency: 'hourly', priority: 0.9 },
    ...productUrls,
  ];
}
```

이러면 `/sitemap.xml` 주소로 XML이 자동 생성됩니다. 빌드 없이 dev 서버에서도 확인됩니다. 주의할 점은 **비공개·인증 전용 페이지(마이페이지, 관리자, 결제)는 사이트맵에 넣지 않는 것**입니다. 검색에 노출될 이유도 없고, 어차피 로그인 없이는 못 봅니다.

---

## 7. robots.txt — 크롤러 출입 규칙

`app/robots.ts`로 크롤러에게 "여긴 봐도 되고 여긴 보지 마"를 알려줍니다.

```ts
// app/robots.ts
import type { MetadataRoute } from 'next';

const BASE = 'https://example.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/mypage/', '/api/'],  // 비공개 영역은 크롤 금지
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
```

`/robots.txt`로 자동 생성됩니다. 사이트맵 주소를 여기 적어 두면 구글이 사이트맵을 더 잘 찾습니다. 다만 robots.txt의 `disallow`는 "크롤하지 마"일 뿐 "절대 색인하지 마"가 아니라는 점을 기억하세요. 정말로 검색결과에서 빼고 싶은 페이지는 다음 8장의 `noindex`를 씁니다.

---

## 8. 인증·비공개 페이지는 색인에서 빼기 (noindex)

마이페이지, 장바구니, 관리자, 결제 결과처럼 **로그인해야 보이는 페이지나 개인정보가 담긴 페이지는 검색에 절대 나오면 안 됩니다.** 이런 페이지에는 `robots: { index: false }`를 줍니다.

```tsx
// app/mypage/layout.tsx (또는 page.tsx)
export const metadata = {
  title: '마이페이지',
  robots: { index: false, follow: false },
};
```

이러면 `<meta name="robots" content="noindex, nofollow">`가 들어가 검색결과에서 제외됩니다. 반대로 **메인·목록·상세 같은 공개 페이지는 별도 설정이 없어도 기본이 색인 허용**이니 굳이 `index: true`를 적을 필요는 없습니다.

> 정리하면 이렇게 나뉩니다.
> - **공개(메인/목록/상세)**: 풍부한 metadata + canonical + 사이트맵 포함, 색인 허용(기본)
> - **비공개(마이페이지/관리자/결제)**: `robots: { index: false }`, 사이트맵 제외, robots.txt에서 disallow

---

## 9. 데이터 두 번 fetch 막기 — `React.cache`

2장에서 `generateMetadata`와 페이지 본문이 같은 데이터를 쓴다고 했습니다. `fetch()` API는 같은 요청 안에서 자동 캐시되지만, Supabase 클라이언트 호출 같은 건 캐시되지 않아 그대로 두면 DB를 두 번 때립니다. 이럴 때 `React.cache`로 함수를 감싸면 한 요청 안에서 한 번만 실행됩니다.

```ts
// lib/products.ts
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export const getProduct = cache(async (id: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from('products').select('*').eq('id', id).single();
  return data;
});
```

이제 `generateMetadata`와 페이지에서 둘 다 `getProduct(id)`를 불러도 DB 조회는 한 번입니다. 작은 디테일 같지만 상세 페이지마다 쿼리가 절반으로 줄어드니 습관으로 들여 두면 좋습니다.

---

## 10. 잘 됐는지 확인하는 법 — 추측하지 말고 직접 본다

코드를 다 넣었으면 진짜로 HTML에 들어갔는지 확인해야 합니다. 화면만 보면 모릅니다. **서버가 내려주는 원문**을 봐야 합니다.

```bash
# 1) dev 서버를 띄운 뒤
npm run dev

# 2) 메타 태그가 HTML에 박혔는지 — 자바스크립트 실행 전 원문
curl -s http://localhost:3000/products/1 | grep -iE '<title>|og:title|description|canonical'

# 3) 본문 데이터가 HTML에 들어갔는지 (SSR 확인)
curl -s http://localhost:3000/products/1 | grep -i '<h1'

# 4) 사이트맵 / robots
curl -s http://localhost:3000/sitemap.xml | head -20
curl -s http://localhost:3000/robots.txt
```

`curl`로 받은 원문에 제목·설명·상품 이름이 보이면 크롤러도 그걸 봅니다. 만약 `<h1>`이 비어 있고 자바스크립트로만 채워진다면 0장으로 돌아가서 서버 컴포넌트로 바꿔야 합니다.

브라우저에서도 **"페이지 소스 보기"(Ctrl+U)** 가 같은 역할을 합니다. 개발자도구의 Elements 탭은 자바스크립트 실행 후의 DOM이라 SEO 확인용으로는 부적절합니다. 반드시 "소스 보기"의 원문을 보세요. 배포 후에는 구글 [Rich Results Test](https://search.google.com/test/rich-results)와 Search Console로 실제 색인 상태를 확인할 수 있습니다.

---

## 11. 한 장으로 보는 체크리스트

공개 페이지를 만들 때마다 이 목록을 훑어보면 됩니다.

- [ ] 루트 `layout.tsx`에 `metadataBase`, `title.template`, `description`, `lang="ko"` 설정
- [ ] 메인·목록 페이지에 `metadata`(title/description) 있음
- [ ] 상세 페이지는 `generateMetadata`로 데이터 기반 title/description 생성
- [ ] 상세/목록에 `alternates.canonical` 지정
- [ ] 상품·레시피·게시글 상세에 JSON-LD 구조화 데이터 삽입
- [ ] 공개 페이지 데이터는 서버 컴포넌트에서 fetch (`'use client'`+`useEffect` 패칭 아님)
- [ ] 없는 데이터는 `notFound()`로 404
- [ ] `openGraph`(이미지 포함) 설정 — 카카오톡 미리보기
- [ ] `app/sitemap.ts`에 공개 URL(상세 포함), 비공개 제외
- [ ] `app/robots.ts`에 sitemap 주소 + 비공개 disallow
- [ ] 마이페이지·관리자·결제 등 비공개에 `robots: { index: false }`
- [ ] `curl`로 원문에 메타·본문 데이터가 들어갔는지 실측

---

## 부록. 검증에 사용한 샘플 프로젝트

이 글의 코드는 추측으로 적은 게 아니라 별도 샘플 프로젝트(`seo-sample`, Next.js 16 / React 19 / TS)를 만들어 dev 서버를 띄우고 위 10장의 `curl` 명령으로 하나하나 확인한 것입니다. 검증한 항목과 실제 출력은 글 아래 "검증 로그"에 붙여 두었습니다.

### 검증 로그 (2026-06-29 · Next.js 16.2.7 / React 19.2 / Turbopack dev)

샘플 프로젝트를 `npm run dev`로 띄운 뒤 `curl`로 서버 원문을 받아 확인했습니다. 전부 자바스크립트 실행 이전의 HTML 원문 기준입니다.

**홈(`/`) `<head>`** — 루트 metadata, `lang="ko"`, OG 기본값, 코드로 생성된 OG 이미지가 절대경로로 들어감.
```
<html lang="ko" ...>
<title>SEO 샘플 — 가이드 검증용 스토어</title>
<meta name="description" content="Next.js 16 App Router SEO 가이드의 모든 기법을 실제로 검증하는 샘플 스토어"/>
<meta property="og:site_name" content="SEO 샘플"/>
<meta property="og:image" content="http://localhost:3939/opengraph-image?..."/>
```

**상세(`/products/1`) `<head>`** — `title.template` 적용, 데이터 기반 description, canonical이 `metadataBase` 덕에 절대경로로 해석됨, OG 이미지 교체.
```
<title>유기농 방울토마토 1kg | SEO 샘플</title>
<meta name="description" content="햇살 가득 머금은 달콤한 방울토마토, 농장 직송으로 신선하게."/>
<link rel="canonical" href="https://seo-sample.example.com/products/1"/>
<meta property="og:title" content="유기농 방울토마토 1kg"/>
<meta property="og:image" content="https://images.example.com/tomato.jpg"/>
```

**상세 본문(SSR)** — `<h1>`에 상품명이 박혀 내려오고(클라이언트 패칭이 아님), JSON-LD가 원문에 포함됨.
```
<h1>유기농 방울토마토 1kg</h1>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"유기농 방울토마토 1kg",...,"offers":{"@type":"Offer","price":8900,"priceCurrency":"KRW","availability":"https://schema.org/InStock"}}</script>
```

**`/sitemap.xml`** — 공개 URL 4건(홈·목록·상세 2건) 자동 생성, 비공개(`/mypage`) 미포함.
**`/robots.txt`** — `Disallow: /mypage/`, `Disallow: /api/` + `Sitemap: https://seo-sample.example.com/sitemap.xml`.
**`/mypage`** — `<meta name="robots" content="noindex, nofollow">` 확인.
**없는 상세(`/products/999`)** — `notFound()`로 `HTTP 404` 응답.
**`/opengraph-image`** — `content-type: image/png`, 약 25KB 생성.

결론: 가이드의 모든 항목이 작성한 코드 그대로 동작했습니다. 별도 라이브러리(react-helmet, next-seo 등) 없이 Next 16 기본 기능만으로 충분합니다.

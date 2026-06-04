import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "봐주개 - 믿을 수 있는 반려동물 돌봄 플랫폼",
  description: "지역 기반 검색으로 가까운 펫시터를 찾고, 안전한 예약과 결제까지 한 번에",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}

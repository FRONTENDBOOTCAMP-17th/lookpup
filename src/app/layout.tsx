import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import UserProvider from "@/components/providers/UserProvider";
import NotificationToaster from "@/components/providers/NotificationToaster";
import QueryProvider from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";

const pretendard = localFont({
  src: [
    { path: "./fonts/Pretendard-Regular.woff2", weight: "400" },
    { path: "./fonts/Pretendard-Medium.woff2", weight: "500" },
    { path: "./fonts/Pretendard-SemiBold.woff2", weight: "600" },
    { path: "./fonts/Pretendard-Bold.woff2", weight: "700" },
  ],
  variable: "--font-pretendard",
  display: "swap",
});

export const metadata: Metadata = {
  title: "봐주개 - 믿을 수 있는 반려동물 돌봄 플랫폼",
  description:
    "지역 기반 검색으로 가까운 펫시터를 찾고, 안전한 예약과 결제까지 한 번에",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`h-full ${pretendard.variable}`}>
      <body className="min-h-full flex flex-col antialiased">
          <QueryProvider>
            <UserProvider>{children}</UserProvider>
          </QueryProvider>
          <NotificationToaster />
          <Toaster position="top-center" richColors closeButton />
        </body>
    </html>
  );
}

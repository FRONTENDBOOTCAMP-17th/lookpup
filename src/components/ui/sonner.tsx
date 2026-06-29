"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      // 데스크탑 토스트 폭을 알림 드롭다운(w-80, 320px)에 맞춤. 모바일(≤600px)은 sonner가 전체폭으로 자동 처리
      style={{ "--width": "320px" } as React.CSSProperties}
      toastOptions={{
        // 헤더 유저 프로필 호버 박스/알림 드롭다운 톤에 맞춤 (기존 Tailwind 토큰 사용)
        classNames: {
          toast:
            "bg-white! text-stone-900! border! border-[#ffe9d6]! rounded-xl! shadow-[0px_4px_20px_0px_rgba(232,116,42,0.15)]!",
          description: "text-gray-500!",
          actionButton:
            "rounded-lg! bg-orange-50! text-orange-600! font-medium! hover:bg-orange-100!",
          closeButton: "border-[#ffe9d6]! text-stone-400! hover:bg-orange-50!",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

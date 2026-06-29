"use client";

import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ShieldAlert } from "lucide-react";
import { Suspense } from "react";

function SuspendedContent() {
  const searchParams = useSearchParams();
  const until = searchParams.get("until");

  const formattedDate = until
    ? format(new Date(until), "yyyy년 MM월 dd일 HH시 mm분", { locale: ko })
    : null;

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-10 max-w-md w-full flex flex-col items-center gap-5 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-stone-900">계정이 일시 정지되었습니다</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            서비스 이용 정책 위반으로 계정이 임시 제한되었습니다.
          </p>
        </div>
        {formattedDate && (
          <div className="w-full bg-red-50 border border-red-100 rounded-xl px-5 py-4">
            <p className="text-xs text-red-400 mb-1">정지 해제 일시</p>
            <p className="text-sm font-semibold text-red-700">{formattedDate}</p>
          </div>
        )}
        <p className="text-xs text-gray-400">
          문의사항은 고객센터로 연락해주세요.
        </p>
      </div>
    </div>
  );
}

export default function SuspendedPage() {
  return (
    <Suspense>
      <SuspendedContent />
    </Suspense>
  );
}

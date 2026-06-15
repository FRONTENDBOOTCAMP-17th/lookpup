"use client";

import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Lock,
  FileCheck,
  ChevronLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { AvatarWithCamera } from "@/components/ui/Avatar";
import { Switch } from "@/components/ui/switch";
import { CustomModal } from "@/components/common/CustomModal";

type Tab = "profile" | "security" | "notifications";

const TABS: { id: Tab; label: string }[] = [
  { id: "profile", label: "프로필 정보" },
  { id: "security", label: "보안" },
  { id: "notifications", label: "알림 설정" },
];

const NOTIFICATION_ITEMS = [
  {
    label: "예약 알림",
    description: "예약 확정, 변경, 취소 알림을 받습니다",
    enabled: true,
  },
  {
    label: "채팅 메시지",
    description: "새로운 메시지가 도착하면 알림을 받습니다",
    enabled: true,
  },
  {
    label: "리뷰 알림",
    description: "새로운 리뷰가 등록되면 알림을 받습니다",
    enabled: true,
  },
  {
    label: "마케팅 알림",
    description: "이벤트 및 프로모션 소식을 받습니다",
    enabled: false,
  },
  {
    label: "푸시 알림",
    description: "앱 푸시 알림을 받습니다",
    enabled: false,
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("notifications");
  const [notifications, setNotifications] = useState(NOTIFICATION_ITEMS);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const toggleNotification = (index: number) => {
    setNotifications((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, enabled: !item.enabled } : item,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-[#FFF8F3]">
      <Header />

      {/* 모바일 헤더 */}
      <div className="md:hidden sticky top-16 z-50 bg-white border-b border-[#FFE9D6]">
        <div className="h-14 px-5 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 -ml-1">
            <ChevronLeft size={24} className="text-[#281A0E]" />
          </button>
          <span className="flex-1 font-semibold text-[#281A0E]">
            프로필 설정
          </span>
        </div>
      </div>

      <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6 pt-6 md:pt-12 pb-10 md:pb-20">
        {/* 데스크탑 타이틀 */}
        <div className="hidden md:flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl border border-[#FFE9D6] flex items-center justify-center hover:bg-[#FFF8F3] transition-colors shrink-0"
          >
            <ChevronLeft size={20} className="text-[#281A0E]" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-[#281A0E]">프로필 설정</h2>
            <p className="text-sm text-[#6B7280] mt-1">
              계정 정보 및 설정을 관리하세요
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8 lg:items-start">
          {/* 사이드바 */}
          <aside className="bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-[#FFE9D6] p-5 w-full lg:w-72 lg:shrink-0">
            <div className="flex flex-col items-center">
              <AvatarWithCamera
                initial="김"
                className="mb-4"
              />
              <p className="text-[#281A0E] text-xl font-bold">김민수</p>
              <p className="mt-1 mb-3 text-[#6B7280] text-sm">
                kimminsu@example.com
              </p>
              <span className="px-3 py-1 bg-[#E8742A] rounded-md text-white text-xs font-medium">
                본인인증 완료
              </span>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full h-12 rounded-xl text-left px-4 text-base font-medium transition-all ${activeTab === tab.id ? "bg-[#E8742A] text-white" : "bg-[#FFF8F3] text-[#6B7280] hover:bg-[#FFF0E8]"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </aside>

          {/* 우측 콘텐츠 */}
          <div className="flex-1 flex flex-col gap-6">
            {activeTab === "profile" && (
              <div className="bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-[#FFE9D6] p-5">
                <h2 className="text-[#281A0E] text-xl font-bold mb-6">
                  기본 정보
                </h2>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <p className="text-[#281A0E] text-sm font-medium">이름</p>
                    <div className="w-full h-12 rounded-xl border border-[#FFE9D6] flex items-center px-4 text-[#281A0E] text-base">
                      김민수
                    </div>
                  </div>
                  {[
                    {
                      label: "이메일",
                      value: "kimminsu@example.com",
                      Icon: Mail,
                    },
                    {
                      label: "휴대폰 번호",
                      value: "010-1234-5678",
                      Icon: Phone,
                    },
                    { label: "주소", value: "서울시 마포구", Icon: MapPin },
                  ].map(({ label, value, Icon }) => (
                    <div key={label} className="flex flex-col gap-2">
                      <p className="text-[#281A0E] text-sm font-medium">
                        {label}
                      </p>
                      <div className="relative">
                        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#6B7280]" />
                        <div className="w-full h-12 rounded-xl border border-[#FFE9D6] flex items-center pl-12 pr-4 text-[#281A0E] text-base">
                          {value}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-col gap-2">
                    <p className="text-[#281A0E] text-sm font-medium">
                      생년월일
                    </p>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#6B7280]" />
                      <div className="w-full h-12 rounded-xl border border-[#FFE9D6]" />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button className="flex-1 h-12 px-6 bg-white rounded-[10px] border border-[#E8742A] text-[#E8742A] text-base font-semibold">
                      취소
                    </button>
                    {/* 저장하기 기능 모달 */}
                    <button
                      onClick={() => setShowSaveModal(true)}
                      className="flex-1 h-12 px-6 bg-[#E8742A] rounded-[10px] text-white text-base font-semibold"
                    >
                      저장하기
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <>
                <div className="bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-[#FFE9D6] p-5">
                  <h2 className="text-[#281A0E] text-xl font-bold mb-6">
                    비밀번호 변경
                  </h2>
                  <div className="flex flex-col gap-4">
                    {["현재 비밀번호", "새 비밀번호", "새 비밀번호 확인"].map(
                      (label) => (
                        <div key={label} className="flex flex-col gap-2">
                          <p className="text-[#281A0E] text-sm font-medium">
                            {label}
                          </p>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#6B7280]" />
                            <div className="w-full h-12 pl-12 pr-4 rounded-xl border border-[#FFE9D6]" />
                          </div>
                        </div>
                      ),
                    )}
                    <button className="w-full h-12 px-6 bg-[#E8742A] rounded-[10px] text-white text-base font-semibold mt-2">
                      비밀번호 변경
                    </button>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-[#FFE9D6] p-5">
                  <h2 className="text-[#281A0E] text-xl font-bold mb-6">
                    본인 인증
                  </h2>
                  <div className="w-full p-4 bg-[#FFF8F3] rounded-xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <FileCheck className="size-6 text-emerald-500" />
                      <div>
                        <p className="text-[#281A0E] text-lg font-semibold">
                          인증 완료
                        </p>
                        <p className="text-[#6B7280] text-sm">2024년 6월 1일</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-[#E8742A] rounded-md text-white text-xs font-medium">
                      인증됨
                    </span>
                  </div>
                </div>
              </>
            )}

            {activeTab === "notifications" && (
              <div className="bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-[#FFE9D6] p-5">
                <h2 className="text-[#281A0E] text-xl font-bold mb-6">
                  알림 설정
                </h2>
                <div className="flex flex-col gap-4">
                  {notifications.map((item, index) => (
                    <div
                      key={item.label}
                      className="w-full p-4 bg-[#FFF8F3] rounded-xl flex justify-between items-center gap-4"
                    >
                      <div className="flex flex-col gap-1">
                        <p className="text-[#281A0E] text-base font-semibold">
                          {item.label}
                        </p>
                        <p className="text-[#6B7280] text-sm">
                          {item.description}
                        </p>
                      </div>
                      <Switch
                        checked={item.enabled}
                        onCheckedChange={() => toggleNotification(index)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 저장하기 기능 모달 */}
      <CustomModal
        open={showSaveModal}
        preset="saveConfirm"
        onClose={() => setShowSaveModal(false)}
        onConfirm={() => {
          // TODO: 프로필 저장 API 연동
          setShowSaveModal(false);
        }}
      />
    </div>
  );
}

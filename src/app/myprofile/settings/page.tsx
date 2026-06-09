'use client';

import { useState } from 'react';
import { Camera, Mail, Phone, MapPin, Calendar, Lock, FileCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Header from '@/components/layout/Header';

type Tab = 'profile' | 'security' | 'notifications';

const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs));

const CARD = 'bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-orange-100 p-5';
const PRETENDARD = "font-['Pretendard']";

const TABS: { id: Tab; label: string }[] = [
  { id: 'profile', label: '프로필 정보' },
  { id: 'security', label: '보안' },
  { id: 'notifications', label: '알림 설정' },
];

const NOTIFICATION_ITEMS = [
  { label: '예약 알림', description: '예약 확정, 변경, 취소 알림을 받습니다', enabled: true },
  { label: '채팅 메시지', description: '새로운 메시지가 도착하면 알림을 받습니다', enabled: true },
  { label: '리뷰 알림', description: '새로운 리뷰가 등록되면 알림을 받습니다', enabled: true },
  { label: '마케팅 알림', description: '이벤트 및 프로모션 소식을 받습니다', enabled: false },
  { label: '푸시 알림', description: '앱 푸시 알림을 받습니다', enabled: false },
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className={cn('text-stone-900 text-sm font-medium leading-5', PRETENDARD)}>
      {children}
    </p>
  );
}

function FormRow({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-500" />}
        <div className={cn('w-full h-12 rounded-xl border border-orange-100 flex items-center text-stone-900 text-base font-normal leading-6', PRETENDARD, Icon ? 'pl-12 pr-4' : 'px-4')}>
          {value}
        </div>
      </div>
    </div>
  );
}

function PasswordField({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
        <div className="w-full h-12 pl-12 pr-4 rounded-xl border border-orange-100" />
      </div>
    </div>
  );
}

function Toggle({ enabled }: { enabled: boolean }) {
  return (
    <div className={cn('relative w-11 h-6 rounded-full shrink-0', enabled ? 'bg-orange-500' : 'bg-gray-200')}>
      <div className={cn('absolute size-5 top-0.5 bg-white rounded-full border', enabled ? 'left-5.5 border-white' : 'left-0.5 border-gray-300')} />
    </div>
  );
}

function NotificationRow({ label, description, enabled }: { label: string; description: string; enabled: boolean }) {
  return (
    <div className="w-full p-4 bg-orange-50 rounded-xl flex justify-between items-center gap-4">
      <div className="flex flex-col gap-1">
        <p className={cn('text-stone-900 text-lg font-normal lg:font-semibold leading-6', PRETENDARD)}>{label}</p>
        <p className={cn('text-gray-500 text-sm font-normal leading-5', PRETENDARD)}>{description}</p>
      </div>
      <Toggle enabled={enabled} />
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('notifications');

  return (
    <div className="min-h-screen bg-orange-50">
      <Header />

      {/* 본문 */}
      <main className="max-w-5xl mx-auto px-5 md:px-8 py-8 md:py-12">
        <div className="mb-8">
          <h1 className={cn('text-stone-900 text-3xl font-bold leading-9', PRETENDARD)}>프로필 설정</h1>
          <p className={cn('mt-2 text-gray-500 text-base font-normal leading-6', PRETENDARD)}>계정 정보 및 설정을 관리하세요</p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8 lg:items-start">
          {/* 사이드바 */}
          <aside className={cn(CARD, 'w-full lg:w-72 lg:shrink-0')}>
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div className="size-24 bg-orange-50 rounded-full border-2 border-orange-100 flex justify-center items-center">
                  <span className={cn('text-orange-500 text-xl font-semibold leading-7', PRETENDARD)}>김</span>
                </div>
                <div className="absolute bottom-0 right-0 size-8 bg-orange-500 rounded-full flex justify-center items-center">
                  <Camera className="size-4 text-white" />
                </div>
              </div>
              <p className={cn('text-stone-900 text-xl font-bold leading-7', PRETENDARD)}>김민수</p>
              <p className={cn('mt-1 mb-3 text-gray-500 text-sm font-normal leading-5', PRETENDARD)}>kimminsu@example.com</p>
              <span className={cn('px-3 py-1 bg-orange-500 rounded-md text-white text-xs font-medium leading-4', PRETENDARD)}>본인인증 완료</span>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn('w-full h-12 rounded-xl text-left px-4 text-base font-medium leading-6', PRETENDARD, activeTab === tab.id ? 'bg-orange-500 text-white' : 'bg-orange-50 text-gray-500')}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </aside>

          {/* 우측 콘텐츠 */}
          <div className="flex-1 flex flex-col gap-6">
            {activeTab === 'profile' && (
              <div className={CARD}>
                <h2 className={cn('text-stone-900 text-xl font-bold leading-7 mb-6', PRETENDARD)}>기본 정보</h2>
                <div className="flex flex-col gap-6">
                  <FormRow label="이름" value="김민수" />
                  <FormRow label="이메일" value="kimminsu@example.com" icon={Mail} />
                  <FormRow label="휴대폰 번호" value="010-1234-5678" icon={Phone} />
                  <FormRow label="주소" value="서울시 마포구" icon={MapPin} />
                  <div className="flex flex-col gap-2">
                    <FieldLabel>생년월일</FieldLabel>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                      <div className="w-full h-12 rounded-xl border border-orange-100" />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button className={cn('flex-1 h-12 px-6 bg-white rounded-[10px] border border-orange-500 text-orange-500 text-base font-semibold leading-6', PRETENDARD)}>취소</button>
                    <button className={cn('flex-1 h-12 px-6 bg-orange-500 rounded-[10px] text-white text-base font-semibold leading-6', PRETENDARD)}>저장하기</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <>
                <div className={CARD}>
                  <h2 className={cn('text-stone-900 text-xl font-bold leading-7 mb-6', PRETENDARD)}>비밀번호 변경</h2>
                  <div className="flex flex-col gap-4">
                    <PasswordField label="현재 비밀번호" />
                    <PasswordField label="새 비밀번호" />
                    <PasswordField label="새 비밀번호 확인" />
                    <button className={cn('w-full h-12 px-6 bg-orange-500 rounded-[10px] text-white text-base font-semibold leading-6 mt-2', PRETENDARD)}>비밀번호 변경</button>
                  </div>
                </div>
                <div className={CARD}>
                  <h2 className={cn('text-stone-900 text-xl font-bold leading-7 mb-6', PRETENDARD)}>본인 인증</h2>
                  <div className="w-full p-4 bg-orange-50 rounded-xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <FileCheck className="size-6 text-emerald-500" />
                      <div>
                        <p className={cn('text-stone-900 text-lg font-semibold leading-6', PRETENDARD)}>인증 완료</p>
                        <p className={cn('text-gray-500 text-sm font-normal leading-5', PRETENDARD)}>2024년 6월 1일</p>
                      </div>
                    </div>
                    <span className={cn('px-3 py-1 bg-orange-500 rounded-md text-white text-xs font-medium leading-4', PRETENDARD)}>인증됨</span>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'notifications' && (
              <div className={CARD}>
                <h2 className={cn('text-stone-900 text-xl font-bold leading-7 mb-6', PRETENDARD)}>알림 설정</h2>
                <div className="flex flex-col gap-4">
                  {NOTIFICATION_ITEMS.map((item) => (
                    <NotificationRow key={item.label} {...item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

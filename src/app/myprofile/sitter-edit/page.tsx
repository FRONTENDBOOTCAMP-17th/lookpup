"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Plus,
  X,
  Eye,
  Camera,
  MapPin,
  Check,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Avatar from "@/components/ui/Avatar";

//상수

const SERVICE_OPTIONS = ["방문돌봄", "위탁돌봄", "산책", "목욕", "훈련"];

const PET_OPTIONS = [
  "강아지 소형 (7kg 미만)",
  "강아지 중형 (7–25kg)",
  "강아지 대형 (25kg 이상)",
  "고양이",
  "기타 소동물",
];

interface ServiceItem {
  id: number;
  name: string;
  unit: string;
  price: string;
  desc: string;
}

// 초기 폼 상태 (mock — 추후 DB 값으로 교체)

const INITIAL_FORM = {
  name: "김민지",
  location: "서울 마포구",
  bio: "",
  career: "5",
  completedCount: 230,
  selectedServices: ["방문돌봄", "위탁돌봄", "산책"] as string[],
  selectedPets: [
    "강아지 소형 (7kg 미만)",
    "강아지 중형 (7–25kg)",
    "고양이",
  ] as string[],
  serviceList: [
    {
      id: 1,
      name: "방문돌봄",
      unit: "1일",
      price: "30000",
      desc: "하루 2-3회 방문하여 식사, 산책, 놀이 제공",
    },
    {
      id: 2,
      name: "위탁돌봄",
      unit: "1일",
      price: "35000",
      desc: "펫시터 집에서 24시간 케어",
    },
    {
      id: 3,
      name: "산책",
      unit: "1시간",
      price: "15000",
      desc: "1시간 산책 서비스",
    },
  ] as ServiceItem[],
  radius: "3",
  photos: [null, null, null, null, null, null] as (string | null)[],
};

//서브 컴포넌트

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 text-xs text-gray-400 uppercase tracking-wide mb-2">
      {children}
    </p>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-orange-100 shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] p-5">
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-lg text-stone-900 mb-4">{children}</h3>
  );
}

function ToggleChip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs transition-colors ${
        selected
          ? "bg-orange-500 text-white border border-orange-500"
          : "bg-orange-50 text-gray-500 border border-orange-100 hover:border-orange-300"
      }`}
    >
      {selected && <Check size={10} strokeWidth={2.5} />}
      {label}
    </button>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  icon,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {icon}
        </div>
      )}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full h-12 ${icon ? "pl-9" : "pl-4"} pr-4 bg-white border border-orange-100 rounded-[10px] text-base text-stone-900 placeholder:text-gray-400 outline-none focus:border-orange-300 transition-colors`}
      />
    </div>
  );
}

//  서비스 가격 행

function ServiceRow({
  item,
  onChange,
  onRemove,
}: {
  item: ServiceItem;
  onChange: (updated: ServiceItem) => void;
  onRemove: () => void;
}) {
  return (
    <div className="bg-orange-50 rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        <input
          value={item.name}
          onChange={(e) => onChange({ ...item, name: e.target.value })}
          placeholder="서비스명"
          className="flex-1 h-9 px-3 bg-white border border-orange-100 rounded-[10px] text-sm text-stone-900 outline-none focus:border-orange-300"
        />
        <input
          value={item.unit}
          onChange={(e) => onChange({ ...item, unit: e.target.value })}
          placeholder="단위"
          className="w-20 h-9 px-2 bg-white border border-orange-100 rounded-[10px] text-sm text-center text-stone-900 outline-none focus:border-orange-300"
        />
        <div className="relative">
          <input
            value={item.price}
            onChange={(e) =>
              onChange({ ...item, price: e.target.value.replace(/\D/g, "") })
            }
            placeholder="가격"
            className="w-28 h-9 pl-3 pr-7 bg-white border border-orange-100 rounded-[10px] text-sm text-right text-orange-500 font-bold outline-none focus:border-orange-300"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
            원
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="size-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-400 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
      <input
        value={item.desc}
        onChange={(e) => onChange({ ...item, desc: e.target.value })}
        placeholder="서비스 설명"
        className="w-full h-9 px-3 bg-white border border-orange-100 rounded-[10px] text-sm text-gray-500 outline-none focus:border-orange-300"
      />
    </div>
  );
}

//  페이지 

export default function SitterEditPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(INITIAL_FORM);
  const nextId = useRef(form.serviceList.length + 1);

  // 서비스 유형 토글
  const toggleService = (s: string) =>
    setForm((f) => ({
      ...f,
      selectedServices: f.selectedServices.includes(s)
        ? f.selectedServices.filter((x) => x !== s)
        : [...f.selectedServices, s],
    }));

  // 돌봄 가능 토글
  const togglePet = (p: string) =>
    setForm((f) => ({
      ...f,
      selectedPets: f.selectedPets.includes(p)
        ? f.selectedPets.filter((x) => x !== p)
        : [...f.selectedPets, p],
    }));

  // 서비스 가격 행 수정
  const updateServiceItem = (updated: ServiceItem) =>
    setForm((f) => ({
      ...f,
      serviceList: f.serviceList.map((s) =>
        s.id === updated.id ? updated : s,
      ),
    }));

  // 서비스 가격 행 삭제
  const removeServiceItem = (id: number) =>
    setForm((f) => ({
      ...f,
      serviceList: f.serviceList.filter((s) => s.id !== id),
    }));

  // 서비스 가격 행 추가
  const addServiceItem = () => {
    nextId.current += 1;
    setForm((f) => ({
      ...f,
      serviceList: [
        ...f.serviceList,
        { id: nextId.current, name: "", unit: "1일", price: "", desc: "" },
      ],
    }));
  };

  // 포트폴리오 사진 삭제
  const removePhoto = (idx: number) =>
    setForm((f) => {
      const photos = [...f.photos];
      photos[idx] = null;
      return { ...f, photos };
    });

  const bioLength = form.bio.length;

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col">
      <Header />

      <main className="flex-1 pb-24">
        <div className="max-w-[1152px] mx-auto px-8 pt-6">
          {/* 페이지 헤더 */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl hover:bg-orange-100 transition-colors"
            >
              <ChevronLeft size={20} className="text-stone-900" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-stone-900">
                펫시터 프로필 수정
              </h1>
              <p className="text-sm text-gray-400">
                등록한 프로필 정보를 수정할 수 있습니다.
              </p>
            </div>
          </div>

          {/* 2단 레이아웃 */}
          <div className="flex gap-8 items-start">
            {/* ── 좌측 컬럼 ── */}
            <div className="w-80 shrink-0 space-y-4">
              {/* 프로필 사진 + 기본 정보 */}
              <div>
                <SectionLabel>프로필 사진</SectionLabel>
                <Card>
                  {/* 이미지 프리뷰 */}
                  <div className="relative w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden flex items-center justify-center mb-5">
                    <Avatar initial={form.name[0] ?? "김"} size="2xl" variant="dark" />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-orange-100 rounded-full shadow-sm text-xs text-stone-900 hover:bg-orange-50 transition-colors"
                    >
                      <Camera size={12} className="text-orange-500" />
                      사진 변경
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  {/* 이름 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-stone-900 mb-2">
                      이름
                    </label>
                    <TextInput
                      value={form.name}
                      onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                    />
                  </div>

                  {/* 활동 지역 */}
                  <div>
                    <label className="block text-sm font-medium text-stone-900 mb-2">
                      활동 지역
                    </label>
                    <TextInput
                      value={form.location}
                      onChange={(v) => setForm((f) => ({ ...f, location: v }))}
                      icon={<MapPin size={16} />}
                    />
                  </div>
                </Card>
              </div>

              {/* 제공 서비스 */}
              <div>
                <SectionLabel>제공 서비스</SectionLabel>
                <Card>
                  <CardTitle>서비스 유형 선택</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_OPTIONS.map((s) => (
                      <ToggleChip
                        key={s}
                        label={s}
                        selected={form.selectedServices.includes(s)}
                        onToggle={() => toggleService(s)}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-gray-400">
                    선택한 서비스가 프로필에 표시됩니다.
                  </p>
                </Card>
              </div>
            </div>

            {/*  우측 컬럼  */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* 소개 */}
              <div>
                <SectionLabel>소개</SectionLabel>
                <Card>
                  <CardTitle>소개</CardTitle>
                  <div className="relative">
                    <textarea
                      value={form.bio}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, bio: e.target.value }))
                      }
                      maxLength={500}
                      rows={7}
                      placeholder="보호자에게 보여질 자기소개를 작성해 주세요."
                      className="w-full px-4 py-3 bg-white border border-orange-100 rounded-[10px] text-base text-stone-900 placeholder:text-gray-400 outline-none focus:border-orange-300 resize-none leading-6"
                    />
                    <span className="block text-xs text-gray-400 mt-1">
                      {bioLength}자
                    </span>
                  </div>
                </Card>
              </div>

              {/* 경력 및 실적 */}
              <div>
                <SectionLabel>경력 및 실적</SectionLabel>
                <Card>
                  <CardTitle>경력 및 실적</CardTitle>
                  <div className="grid grid-cols-2 gap-4">
                    {/* 경력 입력 */}
                    <div className="bg-orange-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-2">경력 (년)</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={form.career}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, career: e.target.value }))
                          }
                          className="flex-1 h-12 px-3 bg-white border border-orange-100 rounded-[10px] text-2xl font-bold text-orange-500 text-center outline-none focus:border-orange-300"
                        />
                        <span className="text-sm text-gray-500">년</span>
                      </div>
                    </div>
                    {/* 완료 건수 (자동 집계) */}
                    <div className="bg-orange-50 rounded-xl p-4 flex flex-col items-center justify-center">
                      <p className="text-3xl font-bold text-orange-500 mb-1">
                        {form.completedCount}+
                      </p>
                      <p className="text-xs text-gray-500">완료 건수 (자동 집계)</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* 돌봄 가능 반려동물 */}
              <div>
                <SectionLabel>돌봄 가능 반려동물</SectionLabel>
                <Card>
                  <CardTitle>돌봄 가능</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    {PET_OPTIONS.map((p) => (
                      <ToggleChip
                        key={p}
                        label={p}
                        selected={form.selectedPets.includes(p)}
                        onToggle={() => togglePet(p)}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-gray-400">
                    돌볼 수 있는 반려동물 유형을 모두 선택해 주세요.
                  </p>
                </Card>
              </div>

              {/* 서비스 가격 */}
              <div>
                <SectionLabel>서비스 가격</SectionLabel>
                <Card>
                  <CardTitle>제공 서비스 및 가격</CardTitle>
                  <div className="space-y-3">
                    {form.serviceList.map((item) => (
                      <ServiceRow
                        key={item.id}
                        item={item}
                        onChange={updateServiceItem}
                        onRemove={() => removeServiceItem(item.id)}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={addServiceItem}
                      className="w-full h-11 flex items-center justify-center gap-2 border border-orange-100 rounded-xl text-sm text-gray-500 hover:bg-orange-50 transition-colors"
                    >
                      <Plus size={16} />
                      서비스 추가
                    </button>
                  </div>
                </Card>
              </div>

              {/* 활동 지역 */}
              <div>
                <SectionLabel>활동 지역</SectionLabel>
                <Card>
                  <CardTitle>활동 지역</CardTitle>
                  {/* 지도 placeholder */}
                  <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 mb-4">
                    <MapPin size={28} className="text-gray-400" />
                    <span className="text-sm text-gray-500">지도 미리보기</span>
                  </div>
                  {/* 주소 + 반경 */}
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-stone-900 mb-2">
                        기준 주소
                      </label>
                      <TextInput
                        value={form.location}
                        onChange={(v) =>
                          setForm((f) => ({ ...f, location: v }))
                        }
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-sm font-medium text-stone-900 mb-2">
                        반경 (km)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={form.radius}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, radius: e.target.value }))
                          }
                          className="w-full h-12 pl-4 pr-9 bg-white border border-orange-100 rounded-[10px] text-base text-stone-900 outline-none focus:border-orange-300"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                          km
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* 포트폴리오 사진 */}
              <div>
                <SectionLabel>포트폴리오 사진</SectionLabel>
                <Card>
                  <CardTitle>사진</CardTitle>
                  <div className="grid grid-cols-3 gap-3">
                    {form.photos.map((photo, idx) => (
                      <div key={idx} className="relative group">
                        {photo ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photo}
                              alt={`사진 ${idx + 1}`}
                              className="aspect-square w-full rounded-xl object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(idx)}
                              className="absolute -top-2 -right-2 size-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm"
                            >
                              <X size={10} className="text-white" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="aspect-square w-full rounded-xl border border-orange-100 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 transition-colors"
                          >
                            <Plus size={20} className="text-gray-400" />
                            <span className="text-xs font-medium text-gray-500">
                              사진 추가
                            </span>
                          </button>
                        )}
                        {/* 번호 레이블 */}
                        {photo && (
                          <span className="absolute bottom-1.5 left-2 text-[10px] font-medium text-gray-400">
                            사진 {idx + 1}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-gray-400">
                    최대 9장까지 등록할 수 있습니다.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 하단 고정 액션 바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-100 z-20">
        <div className="max-w-[1152px] mx-auto px-8 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-28 h-11 px-5 bg-white border border-orange-500 rounded-[10px] text-base text-orange-500 hover:bg-orange-50 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => router.push("/myprofile/sitter-profile")}
            className="w-32 h-11 px-5 bg-white border border-orange-500 rounded-[10px] text-base text-orange-500 flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors"
          >
            <Eye size={16} />
            미리보기
          </button>
          <button
            type="button"
            onClick={() => router.push("/myprofile")}
            className="w-36 h-11 px-5 bg-orange-500 rounded-[10px] text-base text-white hover:bg-orange-600 transition-colors"
          >
            수정 완료
          </button>
        </div>
      </div>
    </div>
  );
}

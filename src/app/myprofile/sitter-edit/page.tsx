"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, X, Eye, Camera, MapPin, Check } from "lucide-react";
import Header from "@/components/layout/Header";
import Avatar from "@/components/ui/Avatar";
import StatGrid from "@/components/ui/StatGrid";
import { useUserStore } from "@/store/userStore";
import { updateSitterProfile, getMySitterProfile, getSitterServices } from "@/app/actions/sitters";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { searchAddressToCoord } from "@/utils/kakaoGeocode";

const SERVICE_OPTIONS = ["방문돌봄", "위탁돌봄", "산책", "호텔"];

const PET_OPTIONS = [
  "강아지 소형 (7kg 미만)",
  "강아지 중형 (7–25kg)",
  "강아지 대형 (25kg 이상)",
  "고양이",
  "기타 소동물",
];

const ANIMAL_TO_LABEL: Record<string, string> = {
  small_dog: "강아지 소형 (7kg 미만)",
  medium_dog: "강아지 중형 (7–25kg)",
  large_dog: "강아지 대형 (25kg 이상)",
  cat: "고양이",
};

const LABEL_TO_ANIMAL: Record<string, string> = {
  "강아지 소형 (7kg 미만)": "small_dog",
  "강아지 중형 (7–25kg)": "medium_dog",
  "강아지 대형 (25kg 이상)": "large_dog",
  고양이: "cat",
};

// 서비스명 → 기본 단위 매핑
const SERVICE_DEFAULT_UNIT: Record<string, string> = {
  방문돌봄: "1일",
  위탁돌봄: "1일",
  산책: "1시간",
  목욕: "1회",
  훈련: "1시간",
};

interface ServiceItem {
  id: number;
  dbId?: string; // DB UUID — 저장 API 구현 시 사용
  name: string;
  unit: string;
  price: string;
  desc: string;
}

const EMPTY_FORM = {
  fullName: "",
  availableArea: "",
  bio: "",
  career: "",
  completedCount: 0,
  services: [] as string[],
  pets: [] as string[],
  serviceList: [] as ServiceItem[],
  radius: "3",
  photos: [null, null, null, null, null, null] as (string | null)[],
};

const TABS = ["소개", "서비스", "위치"] as const;
type Tab = (typeof TABS)[number];

const CARD =
  "bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-6";

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
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
        selected ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-500"
      }`}
    >
      {selected && <Check size={10} strokeWidth={2.5} />}
      {label}
    </button>
  );
}

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
      <input
        value={item.name}
        onChange={(e) => onChange({ ...item, name: e.target.value })}
        placeholder="서비스명"
        className="w-full h-9 px-3 bg-white border border-orange-100 rounded-[10px] text-sm text-stone-900 outline-none focus:border-orange-300"
      />
      <div className="flex items-center gap-2">
        <input
          value={item.unit}
          onChange={(e) => onChange({ ...item, unit: e.target.value })}
          placeholder="단위"
          className="hidden lg:block w-20 h-9 px-2 bg-white border border-orange-100 rounded-[10px] text-sm text-center text-stone-900 outline-none focus:border-orange-300"
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

export default function SitterEditPage() {
  const router = useRouter();
  const { user, sitter, setSitter } = useUserStore();
  const profileFileRef = useRef<HTMLInputElement>(null);
  const photoFileRef = useRef<HTMLInputElement>(null);
  const photoSlotIndex = useRef(-1);
  const sitterIdRef = useRef<string | null>(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState<Tab>("소개");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const nextId = useRef(100);
  const photoFilesRef = useRef<(File | null)[]>([
    null,
    null,
    null,
    null,
    null,
    null,
  ]);
  const deletedServiceIdsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!user || !sitter) return;

    sitterIdRef.current = sitter.id;

    const photoSlots: (string | null)[] = [null, null, null, null, null, null];
    sitter.activityPhotoUrls.forEach((url, i) => {
      if (i < 6) photoSlots[i] = url;
    });

    const baseValues = {
      fullName: user.fullName,
      availableArea: sitter.availableArea,
      bio: sitter.introduction ?? "",
      career: sitter.career ?? "",
      completedCount: sitter.reviewCount,
      pets: sitter.availableAnimals.map((a) => ANIMAL_TO_LABEL[a] ?? a),
      photos: photoSlots,
    };

    getSitterServices(sitter.id).then(({ data }) => {
      const dbServices: ServiceItem[] = data.map((s, idx) => ({
        id: idx + 1,
        dbId: s.id,
        name: s.title,
        unit: SERVICE_DEFAULT_UNIT[s.title] ?? "1회",
        price: String(s.price),
        desc: s.description ?? "",
      }));
      nextId.current = dbServices.length + 100;
      setForm((f) => ({
        ...f,
        ...baseValues,
        services: dbServices.map((s) => s.name),
        serviceList: dbServices,
      }));
      setLoading(false);
    });
  }, [user, sitter]);

  // services 토글 시 serviceList도 함께 동기화
  const toggleService = (s: string) =>
    setForm((f) => {
      const isSelected = f.services.includes(s);
      if (isSelected) {
        return {
          ...f,
          services: f.services.filter((x) => x !== s),
          serviceList: f.serviceList.filter((item) => item.name !== s),
        };
      }
      nextId.current += 1;
      return {
        ...f,
        services: [...f.services, s],
        serviceList: [
          ...f.serviceList,
          {
            id: nextId.current,
            name: s,
            unit: SERVICE_DEFAULT_UNIT[s] ?? "1회",
            price: "1000",
            desc: "",
          },
        ],
      };
    });

  const togglePet = (p: string) =>
    setForm((f) => ({
      ...f,
      pets: f.pets.includes(p) ? f.pets.filter((x) => x !== p) : [...f.pets, p],
    }));

  // serviceList 수정 시 services 배열도 동기화
  const updateServiceItem = (updated: ServiceItem) =>
    setForm((f) => ({
      ...f,
      serviceList: f.serviceList.map((s) =>
        s.id === updated.id ? updated : s,
      ),
      services: f.serviceList.map((s) =>
        s.id === updated.id ? updated.name : s.name,
      ),
    }));

  // serviceList 삭제 시 services 배열도 동기화
  const removeServiceItem = (id: number) =>
    setForm((f) => {
      const target = f.serviceList.find((s) => s.id === id);
      if (target?.dbId) {
        deletedServiceIdsRef.current = [
          ...deletedServiceIdsRef.current,
          target.dbId,
        ];
      }
      return {
        ...f,
        serviceList: f.serviceList.filter((s) => s.id !== id),
        services: target
          ? f.services.filter((s) => s !== target.name)
          : f.services,
      };
    });

  const openPhotoSlot = (idx: number) => {
    photoSlotIndex.current = idx;
    photoFileRef.current?.click();
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const idx = photoSlotIndex.current;
    photoFilesRef.current[idx] = file;
    setForm((f) => {
      const photos = [...f.photos];
      photos[idx] = url;
      return { ...f, photos };
    });
    e.target.value = "";
  };

  const removePhoto = (idx: number) => {
    photoFilesRef.current[idx] = null;
    setForm((f) => {
      const photos = [...f.photos];
      const current = photos[idx];
      if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
      photos[idx] = null;
      return { ...f, photos };
    });
  };

  const handleSave = async () => {
    setSaving(true);

    // 새로 추가된 사진은 Cloudinary에 업로드, 기존 URL은 그대로 유지
    const finalPhotoUrls: string[] = [];
    for (let i = 0; i < form.photos.length; i++) {
      const photo = form.photos[i];
      const file = photoFilesRef.current[i];
      if (!photo) continue;
      if (file) {
        const url = await uploadToCloudinary(file, "sitters/activity-photos");
        finalPhotoUrls.push(url);
      } else {
        finalPhotoUrls.push(photo);
      }
    }

    // 주소가 변경된 경우 새 좌표로 변환
    const geocoded = form.availableArea
      ? await searchAddressToCoord(form.availableArea)
      : null;

    const result = await updateSitterProfile({
      availableArea: form.availableArea,
      latitude: geocoded?.lat ?? null,
      longitude: geocoded?.lng ?? null,
      introduction: form.bio,
      career: form.career,
      availableAnimals: form.pets.map((p) => LABEL_TO_ANIMAL[p] ?? p),
      activityPhotoUrls: finalPhotoUrls,
      services: form.serviceList.map((s) => ({
        id: s.dbId,
        title: s.name,
        price: Number(s.price) || 0,
        description: s.desc,
      })),
      deletedServiceIds: deletedServiceIdsRef.current,
    });

    if ("error" in result) {
      setSaving(false);
      alert(result.error?.message ?? "저장 중 오류가 발생했습니다.");
      return;
    }

    // store 갱신 후 이동
    const refreshed = await getMySitterProfile();
    if ("data" in refreshed && refreshed.data) {
      setSitter(refreshed.data);
    }

    setSaving(false);
    router.push("/myprofile/sitter-profile");
  };

  const stats = [
    { label: "경력", value: form.career || "-" },
    {
      label: "완료",
      value: form.completedCount > 0 ? `${form.completedCount}+` : "-",
    },
  ];

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-orange-50 flex items-center justify-center">
          <p className="text-sm text-gray-400">불러오는 중...</p>
        </div>
      </>
    );
  }

  const renderTabContent = () => (
    <>
      {/* 소개 탭 */}
      {activeTab === "소개" && (
        <div className="flex flex-col gap-4">
          <div className={CARD}>
            <h3 className="font-bold text-stone-900 mb-4">소개</h3>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              maxLength={500}
              rows={7}
              placeholder="보호자에게 보여질 자기소개를 작성해 주세요."
              className="w-full px-4 py-3 bg-white border border-orange-100 rounded-[10px] text-[15px] text-stone-900 placeholder:text-gray-400 outline-none focus:border-orange-300 resize-none leading-6"
            />
            <span className="block text-xs text-gray-400 mt-1">
              {form.bio.length}자
            </span>
          </div>

          {/* 경력 (모바일에서만 표시 — 데스크탑은 왼쪽 카드에) */}
          <div className={`${CARD} md:hidden`}>
            <h3 className="font-bold text-stone-900 mb-4">경력</h3>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={50}
                value={form.career}
                onChange={(e) =>
                  setForm((f) => ({ ...f, career: e.target.value }))
                }
                className="w-24 h-12 px-3 bg-orange-50 border border-orange-100 rounded-[10px] text-2xl font-bold text-orange-500 text-center outline-none focus:border-orange-300"
              />
              <span className="text-sm text-gray-500">년</span>
            </div>
          </div>

          <div className={CARD}>
            <h3 className="font-bold text-stone-900 mb-4">돌봄 가능</h3>
            <div className="flex flex-wrap gap-2">
              {PET_OPTIONS.map((p) => (
                <ToggleChip
                  key={p}
                  label={p}
                  selected={form.pets.includes(p)}
                  onToggle={() => togglePet(p)}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-400">
              돌볼 수 있는 반려동물 유형을 모두 선택해 주세요.
            </p>
          </div>

          <div className={CARD}>
            <h3 className="font-bold text-stone-900 mb-1">사진</h3>
            <p className="text-xs text-gray-400 mb-4">
              최대 6장까지 등록할 수 있습니다.
            </p>
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
                      onClick={() => openPhotoSlot(idx)}
                      className="aspect-square w-full rounded-xl border border-dashed border-orange-100 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 transition-colors"
                    >
                      <Plus size={20} className="text-gray-400" />
                      <span className="text-xs font-medium text-gray-500">
                        사진 추가
                      </span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 서비스 탭 */}
      {activeTab === "서비스" && (
        <div className="flex flex-col gap-4">
          <div className={CARD}>
            <h3 className="font-bold text-stone-900 mb-4">제공 서비스</h3>
            <div className="flex flex-wrap gap-2">
              {SERVICE_OPTIONS.map((s) => (
                <ToggleChip
                  key={s}
                  label={s}
                  selected={form.services.includes(s)}
                  onToggle={() => toggleService(s)}
                />
              ))}
            </div>
          </div>
          <div className={CARD}>
            <h3 className="font-bold text-stone-900 mb-4">서비스 및 가격</h3>
            <div className="space-y-3">
              {form.serviceList.map((item) => (
                <ServiceRow
                  key={item.id}
                  item={item}
                  onChange={updateServiceItem}
                  onRemove={() => removeServiceItem(item.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 위치 탭 */}
      {activeTab === "위치" && (
        <div className={CARD}>
          <h3 className="font-bold text-stone-900 mb-4">활동 지역</h3>
          <div className="h-64 bg-linear-to-br from-gray-100 to-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 mb-4">
            <MapPin size={28} className="text-gray-400" />
            <span className="text-sm text-gray-500">지도 미리보기</span>
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-stone-900 mb-2">
                기준 주소
              </label>
              <div className="relative">
                <MapPin
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  value={form.availableArea}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, availableArea: e.target.value }))
                  }
                  className="w-full h-12 pl-9 pr-4 bg-white border border-orange-100 rounded-[10px] text-[15px] text-stone-900 placeholder:text-gray-400 outline-none focus:border-orange-300 transition-colors"
                />
              </div>
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
                  className="w-full h-12 pl-4 pr-9 bg-white border border-orange-100 rounded-[10px] text-[15px] text-stone-900 outline-none focus:border-orange-300"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                  km
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <Header />

      {/* ── 모바일 레이아웃 (md 미만) ── */}
      <div className="md:hidden flex flex-col bg-orange-50 min-h-screen">
        {/* 상단 배너 — 프로필 사진 + 이름/위치 편집 */}
        <div className="relative w-full h-44 bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm z-10"
          >
            <ChevronLeft size={20} className="text-stone-900" />
          </button>

          <Avatar initial={form.fullName[0] ?? "?"} size="2xl" variant="dark" />

          <button
            type="button"
            onClick={() => profileFileRef.current?.click()}
            className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-white/50 rounded-full shadow-sm text-xs text-stone-900"
          >
            <Camera size={12} className="text-orange-500" />
            사진 변경
          </button>

          {/* 프로필 이미지 변경용 */}
          <input
            ref={profileFileRef}
            type="file"
            accept="image/*"
            className="hidden"
          />
          {/* 갤러리 슬롯 공유 input — openPhotoSlot()으로 슬롯 인덱스 지정 후 트리거 */}
          <input
            ref={photoFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoFileChange}
          />

          {/* 그라디언트 오버레이 */}
          <div
            className="absolute bottom-0 left-0 right-0 h-20 bg-linear-to-t from-black/40 to-transparent"
            aria-hidden="true"
          />

          {/* 이름 + 위치 인라인 편집 */}
          <div className="absolute bottom-4 left-4 right-16">
            <input
              value={form.fullName}
              disabled
              className="text-xl font-bold text-white bg-transparent border-b border-white/20 outline-none w-full mb-1 opacity-80 cursor-not-allowed"
              placeholder="이름"
            />
            <div className="flex items-center gap-1 text-white/80">
              <MapPin size={11} aria-hidden="true" />
              <input
                value={form.availableArea}
                onChange={(e) =>
                  setForm((f) => ({ ...f, availableArea: e.target.value }))
                }
                className="text-sm bg-transparent border-b border-white/30 outline-none flex-1 placeholder:text-white/50"
                placeholder="활동 지역"
              />
            </div>
          </div>
        </div>

        {/* 경력 / 완료 */}
        <StatGrid stats={stats} className="px-5 pb-4 bg-white" />

        {/* 탭 바 */}
        <div className="bg-white border-b border-orange-100 px-5 sticky top-16 z-10">
          <div className="flex gap-6">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-semibold transition-colors relative ${
                  activeTab === tab ? "text-orange-500" : "text-gray-400"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="flex-1 px-5 py-5 pb-28">{renderTabContent()}</div>
      </div>

      {/* ── 데스크탑 레이아웃 (md 이상) ── */}
      <main className="hidden md:block bg-orange-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-10 py-12">
          {/* 페이지 헤더 */}
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => router.back()} className="p-1 -ml-1">
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

          <div className="flex gap-8 items-start">
            {/* 왼쪽: 프로필 카드 */}
            <div className="w-85.25 shrink-0 bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-5 flex flex-col items-center">
              {/* 프로필 이미지 */}
              <div className="relative w-full aspect-square rounded-xl bg-linear-to-br from-gray-100 to-gray-200 mb-4 overflow-hidden flex items-center justify-center">
                <Avatar
                  initial={form.fullName[0] ?? "?"}
                  size="2xl"
                  variant="dark"
                />
                <button
                  type="button"
                  onClick={() => profileFileRef.current?.click()}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-orange-100 rounded-full shadow-sm text-xs text-stone-900 hover:bg-orange-50 transition-colors"
                >
                  <Camera size={12} className="text-orange-500" />
                  사진 변경
                </button>
              </div>

              {/* 이름 (수정 불가) */}
              <input
                value={form.fullName}
                disabled
                placeholder="이름"
                className="text-2xl font-bold text-stone-900 text-center border-b-2 border-orange-100 outline-none bg-transparent w-full mb-2 pb-1 opacity-60 cursor-not-allowed"
              />

              {/* 위치 편집 */}
              <div className="flex items-center gap-1 text-gray-500 mb-4 w-full justify-center">
                <MapPin size={14} className="shrink-0 text-orange-400" />
                <input
                  value={form.availableArea}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, availableArea: e.target.value }))
                  }
                  placeholder="활동 지역"
                  className="text-sm text-center border-b border-orange-100 focus:border-orange-400 outline-none bg-transparent flex-1 transition-colors"
                />
              </div>

              {/* 경력 / 완료 통계 */}
              <StatGrid stats={stats} className="w-full mb-4" />

              {/* 경력 편집 */}
              <div className="w-full bg-orange-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-2">경력 수정 (년)</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={form.career}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, career: e.target.value }))
                    }
                    className="flex-1 h-10 px-3 bg-white border border-orange-100 rounded-[10px] text-xl font-bold text-orange-500 text-center outline-none focus:border-orange-300"
                  />
                  <span className="text-sm text-gray-500">년</span>
                </div>
              </div>
            </div>

            {/* 오른쪽: 탭 + 편집 콘텐츠 */}
            <div className="flex-1 min-w-0">
              {/* 탭 네비게이션 */}
              <div className="border-b border-orange-100 flex gap-8 mb-6">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-lg font-semibold relative transition-colors ${
                      activeTab === tab
                        ? "text-orange-500"
                        : "text-gray-500 hover:text-stone-900"
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
                    )}
                  </button>
                ))}
              </div>

              {renderTabContent()}
            </div>
          </div>
        </div>
      </main>

      {/* 하단 고정 액션 바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-100 z-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-10 py-4 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 md:flex-none md:w-36 h-12 border border-orange-500 rounded-[10px] text-base font-semibold text-orange-500 hover:bg-orange-50 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => router.push("/myprofile/sitter-profile")}
            className="flex-1 md:flex-none md:w-40 h-12 border border-orange-500 rounded-[10px] text-base font-semibold text-orange-500 flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors"
          >
            <Eye size={16} />
            미리보기
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 md:flex-none md:w-44 h-12 bg-orange-500 rounded-[10px] text-base font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "저장 중..." : "수정 완료"}
          </button>
        </div>
      </div>
    </>
  );
}

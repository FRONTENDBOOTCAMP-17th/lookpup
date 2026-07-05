"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, X, Eye, Camera, MapPin, Check } from "lucide-react";
import Header from "@/components/layout/Header";
import { MobileBackButton, DesktopBackButton } from "@/components/common/BackButton";
import SectionCard from "@/components/common/SectionCard";
import { CustomModal } from "@/components/common/CustomModal";
import Avatar from "@/components/ui/Avatar";
import StatGrid from "@/components/ui/StatGrid";
import SitterProfileCard from "@/components/sitter/SitterProfileCard";
import { useUserStore, type SitterData } from "@/store/userStore";
import { updateSitterProfile, getMySitterProfile, getSitterServices } from "@/app/actions/sitters";
import { updateProfile } from "@/app/actions/users";
import { uploadToCloudinary } from "@/utils/cloudinary";
import LocationPickerWithMap, { type LocationValue } from "@/components/LocationPickerWithMap";

const SERVICE_OPTIONS = ["방문돌봄", "위탁돌봄", "산책", "펫호텔"];

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

const SERVICE_DEFAULT_UNIT: Record<string, string> = {
  방문돌봄: "1일",
  위탁돌봄: "1일",
  산책: "1시간",
  목욕: "1회",
  훈련: "1시간",
};

interface ServiceItem {
  id: number;
  dbId?: string;
  name: string;
  unit: string;
  price: string;
  desc: string;
  enabled: boolean;
}

const DEFAULT_SERVICE_LIST: ServiceItem[] = SERVICE_OPTIONS.map((name, i) => ({
  id: i + 1,
  dbId: undefined,
  name,
  unit: SERVICE_DEFAULT_UNIT[name] ?? "1회",
  price: "10000",
  desc: "",
  enabled: false,
}));

const EMPTY_FORM = {
  fullName: "",
  bio: "",
  career: "",
  completedCount: 0,
  services: [] as string[],
  pets: [] as string[],
  serviceList: DEFAULT_SERVICE_LIST,
  photos: [null, null, null, null, null, null] as (string | null)[],
};

const TABS = ["소개", "서비스", "위치"] as const;
type Tab = (typeof TABS)[number];

function ToggleChip({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
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

function ServiceRow({ item, onChange }: { item: ServiceItem; onChange: (updated: ServiceItem) => void }) {
  return (
    <div className="bg-orange-50 rounded-xl p-4 space-y-2">
      <input
        value={item.name}
        disabled
        className="w-full h-9 px-3 bg-white border border-orange-100 rounded-[10px] text-sm text-stone-900 outline-none opacity-70 cursor-not-allowed"
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
            onChange={(e) => onChange({ ...item, price: e.target.value.replace(/\D/g, "") })}
            placeholder="가격"
            className="w-28 h-9 pl-3 pr-7 bg-white border border-orange-100 rounded-[10px] text-sm text-right text-orange-500 font-bold outline-none focus:border-orange-300"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">원</span>
        </div>
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

export default function SitterEditClient({
  initialProfile,
  initialServices,
}: {
  initialProfile?: { user: { fullName: string; profileImage: string | null }; sitter: SitterData } | null;
  initialServices?: { id: string; title: string; price: number; description: string | null; is_active: boolean }[];
}) {
  const router = useRouter();
  const { user, sitter, setSitter, setUser } = useUserStore();
  const profileFileRef = useRef<HTMLInputElement>(null);
  const photoFileRef = useRef<HTMLInputElement>(null);
  const photoSlotIndex = useRef(-1);
  const sitterIdRef = useRef<string | null>(null);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const profilePhotoFileRef = useRef<File | null>(null);
  const [locationValue, setLocationValue] = useState<LocationValue | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("소개");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const photoFilesRef = useRef<(File | null)[]>([null, null, null, null, null, null]);

  const formInitialized = useRef(false);

  const initForm = (
    u: { fullName: string; profileImage: string | null },
    s: SitterData,
    services: { id: string; title: string; price: number; description: string | null }[],
  ) => {
    sitterIdRef.current = s.id;
    setProfilePreview(u.profileImage);

    const photoSlots: (string | null)[] = [null, null, null, null, null, null];
    s.activityPhotoUrls.forEach((url, i) => { if (i < 6) photoSlots[i] = url; });

    if (s.latitude && s.longitude && s.availableArea) {
      setLocationValue({
        address: s.availableArea,
        lat: s.latitude,
        lng: s.longitude,
        displayArea: s.displayArea ?? s.availableArea,
      });
    }

    const serviceList: ServiceItem[] = SERVICE_OPTIONS.map((name, idx) => {
      const dbService = services.find((sv) => sv.title === name);
      return {
        id: idx + 1,
        dbId: dbService?.id,
        name,
        unit: SERVICE_DEFAULT_UNIT[name] ?? "1회",
        price: dbService ? String(dbService.price) : "10000",
        desc: dbService?.description ?? "",
        enabled: !!dbService,
      };
    });

    setForm({
      fullName: u.fullName,
      bio: s.introduction ?? "",
      career: s.career ?? "",
      completedCount: s.reviewCount,
      pets: s.availableAnimals.map((a) => ANIMAL_TO_LABEL[a] ?? a),
      photos: photoSlots,
      services: serviceList.filter((sv) => sv.enabled).map((sv) => sv.name),
      serviceList,
    });
    setLoading(false);
  };

  useEffect(() => {
    if (formInitialized.current) return;

    if (initialProfile && initialServices) {
      formInitialized.current = true;
      initForm(initialProfile.user, initialProfile.sitter, initialServices);
      return;
    }

    if (!user || !sitter) return;
    formInitialized.current = true;

    getSitterServices(sitter.id).then(({ data }) => {
      initForm(
        { fullName: user.fullName, profileImage: user.profileImage },
        sitter,
        data,
      );
    });
  }, [user, sitter, initialProfile, initialServices]);

  const toggleServiceEnabled = (id: number) =>
    setForm((f) => {
      const serviceList = f.serviceList.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
      return { ...f, serviceList, services: serviceList.filter((s) => s.enabled).map((s) => s.name) };
    });

  const togglePet = (p: string) =>
    setForm((f) => ({ ...f, pets: f.pets.includes(p) ? f.pets.filter((x) => x !== p) : [...f.pets, p] }));

  const updateServiceItem = (updated: ServiceItem) =>
    setForm((f) => {
      const serviceList = f.serviceList.map((s) => (s.id === updated.id ? updated : s));
      return { ...f, serviceList };
    });

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    profilePhotoFileRef.current = file;
    setProfilePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

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
    try {
      if (profilePhotoFileRef.current) {
        const profileUrl = await uploadToCloudinary(profilePhotoFileRef.current, "users/profile");
        const profileResult = await updateProfile(profileUrl);
        if ("data" in profileResult && profileResult.data && user) {
          setUser({ ...user, profileImage: profileUrl });
        }
      }

      const finalPhotoUrls: string[] = [];
      for (let i = 0; i < form.photos.length; i++) {
        const photo = form.photos[i];
        const file = photoFilesRef.current[i];
        if (!photo) continue;
        if (file) {
          finalPhotoUrls.push(await uploadToCloudinary(file, "sitters/activity-photos"));
        } else {
          finalPhotoUrls.push(photo);
        }
      }

      const result = await updateSitterProfile({
        availableArea: locationValue?.address ?? "",
        displayArea: locationValue?.displayArea ?? null,
        latitude: locationValue?.lat ?? null,
        longitude: locationValue?.lng ?? null,
        introduction: form.bio,
        career: form.career,
        availableAnimals: form.pets.map((p) => LABEL_TO_ANIMAL[p] ?? p),
        activityPhotoUrls: finalPhotoUrls,
        services: form.serviceList.filter((s) => s.enabled).map((s) => ({ id: s.dbId, title: s.name, price: Number(s.price) || 0, description: s.desc })),
        deletedServiceIds: form.serviceList.filter((s) => !s.enabled && s.dbId).map((s) => s.dbId!),
      });

      if (result?.error) {
        setErrorMessage(result.error.message ?? "저장 중 오류가 발생했습니다.");
        setShowErrorModal(true);
        return;
      }

      const refreshed = await getMySitterProfile();
      if (refreshed?.data) setSitter(refreshed.data);

      setShowSaveModal(true);
    } catch (e) {
      console.error("handleSave error:", e);
      setErrorMessage("저장 중 오류가 발생했습니다.");
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  const stats = [
    { label: "경력", value: form.career || "-" },
    { label: "완료", value: form.completedCount > 0 ? `${form.completedCount}+` : "-" },
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
      {activeTab === "소개" && (
        <div className="flex flex-col gap-4">
          <SectionCard className="p-6 gap-0">
            <h3 className="font-bold text-stone-900 mb-4">소개</h3>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              maxLength={500}
              rows={7}
              placeholder="보호자에게 보여질 자기소개를 작성해 주세요."
              className="w-full px-4 py-3 bg-white border border-orange-100 rounded-[10px] text-[15px] text-stone-900 placeholder:text-gray-400 outline-none focus:border-orange-300 resize-none leading-6"
            />
            <span className="block text-xs text-gray-400 mt-1">{form.bio.length}자</span>
          </SectionCard>

          <SectionCard className="p-6 gap-0 md:hidden">
            <h3 className="font-bold text-stone-900 mb-4">경력</h3>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={50}
                value={form.career}
                onChange={(e) => setForm((f) => ({ ...f, career: e.target.value }))}
                className="w-24 h-12 px-3 bg-orange-50 border border-orange-100 rounded-[10px] text-2xl font-bold text-orange-500 text-center outline-none focus:border-orange-300"
              />
              <span className="text-sm text-gray-500">년</span>
            </div>
          </SectionCard>

          <SectionCard className="p-6 gap-0">
            <h3 className="font-bold text-stone-900 mb-4">돌봄 가능</h3>
            <div className="flex flex-wrap gap-2">
              {PET_OPTIONS.map((p) => (
                <ToggleChip key={p} label={p} selected={form.pets.includes(p)} onToggle={() => togglePet(p)} />
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-400">돌볼 수 있는 반려동물 유형을 모두 선택해 주세요.</p>
          </SectionCard>

          <SectionCard className="p-6 gap-0">
            <h3 className="font-bold text-stone-900 mb-1">사진</h3>
            <p className="text-xs text-gray-400 mb-4">최대 6장까지 등록할 수 있습니다.</p>
            <div className="grid grid-cols-3 gap-3">
              {form.photos.map((photo, idx) => (
                <div key={idx} className="relative group">
                  {photo ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo} alt={`사진 ${idx + 1}`} className="aspect-square w-full rounded-xl object-cover" />
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
                      <span className="text-xs font-medium text-gray-500">사진 추가</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {activeTab === "서비스" && (
        <div className="flex flex-col gap-4">
          <SectionCard className="p-6 gap-0">
            <h3 className="font-bold text-stone-900 mb-4">제공 서비스</h3>
            <div className="flex flex-wrap gap-2">
              {SERVICE_OPTIONS.map((s) => (
                <ToggleChip key={s} label={s} selected={form.services.includes(s)} onToggle={() => toggleServiceEnabled(form.serviceList.find((item) => item.name === s)!.id)} />
              ))}
            </div>
          </SectionCard>
          {form.serviceList.some((item) => item.enabled) && (
            <SectionCard className="p-6 gap-0">
              <h3 className="font-bold text-stone-900 mb-4">서비스 및 가격</h3>
              <div className="space-y-3">
                {form.serviceList.filter((item) => item.enabled).map((item) => (
                  <ServiceRow key={item.id} item={item} onChange={updateServiceItem} />
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      )}

      {activeTab === "위치" && (
        <SectionCard className="p-6 gap-0">
          <h3 className="font-bold text-stone-900 mb-4">활동 지역</h3>
          <LocationPickerWithMap value={locationValue} onChange={setLocationValue} />
        </SectionCard>
      )}
    </>
  );

  return (
    <>
      <Header />

      <div className="md:hidden flex flex-col bg-orange-50">
        <div className="px-5 pt-4">
          <MobileBackButton />
        </div>

        <div className="px-5 pt-3 pb-5">
          <SitterProfileCard
            profile={{
              name: form.fullName,
              initial: form.fullName[0] ?? "?",
              src: profilePreview ?? user?.profileImage,
              verified: user?.isVerified ?? false,
              location: locationValue?.displayArea ?? sitter?.displayArea ?? sitter?.availableArea ?? "위치 탭에서 설정하세요",
              rating: sitter?.rating,
              reviewCount: sitter?.reviewCount,
              services: form.services,
              career: form.career || "-",
            }}
            action={
              <button
                type="button"
                onClick={() => profileFileRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-full text-xs text-stone-900 shrink-0 self-start hover:bg-orange-100 transition-colors"
              >
                <Camera size={12} className="text-orange-500" />
                사진 변경
              </button>
            }
          />
        </div>

        <input ref={profileFileRef} type="file" accept="image/*" className="hidden" onChange={handleProfileFileChange} />
        <input ref={photoFileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoFileChange} />

        <div className="bg-orange-50 border-b border-orange-100 px-5 sticky top-0 z-10">
          <div className="flex gap-6">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === tab ? "text-orange-500" : "text-gray-400"}`}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t-full" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 px-5 py-5 pb-28">{renderTabContent()}</div>
      </div>

      <main className="hidden md:block bg-orange-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-10 py-12">
          <div className="flex items-center gap-3 mb-8">
            <DesktopBackButton />
            <div>
              <h1 className="text-xl font-bold text-stone-900">펫시터 프로필 수정</h1>
              <p className="text-sm text-gray-400">등록한 프로필 정보를 수정할 수 있습니다.</p>
            </div>
          </div>

          <div className="flex gap-8 items-start">
            <SectionCard className="w-85.25 shrink-0 items-center gap-0">
              <div className="relative w-full aspect-square rounded-xl bg-linear-to-br from-gray-100 to-gray-200 mb-4 overflow-hidden flex items-center justify-center">
                <Avatar initial={form.fullName[0] ?? "?"} size="2xl" variant="dark" src={profilePreview ?? user?.profileImage} />
                <button
                  type="button"
                  onClick={() => profileFileRef.current?.click()}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-orange-100 rounded-full shadow-sm text-xs text-stone-900 hover:bg-orange-50 transition-colors"
                >
                  <Camera size={12} className="text-orange-500" />
                  사진 변경
                </button>
              </div>

              <input
                value={form.fullName}
                disabled
                placeholder="이름"
                className="text-2xl font-bold text-stone-900 text-center border-b-2 border-orange-100 outline-none bg-transparent w-full mb-2 pb-1 opacity-60 cursor-not-allowed"
              />

              <button
                type="button"
                onClick={() => setActiveTab("위치")}
                className="flex items-center gap-1 text-gray-500 mb-4 w-full justify-center hover:text-orange-500 transition-colors"
              >
                <MapPin size={14} className="shrink-0 text-orange-400" />
                <span className="text-sm truncate">{locationValue?.displayArea ?? "위치 탭에서 설정"}</span>
              </button>

              <StatGrid stats={stats} className="w-full mb-4" />

              <div className="w-full bg-orange-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-2">경력 수정 (년)</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={form.career}
                    onChange={(e) => setForm((f) => ({ ...f, career: e.target.value }))}
                    className="flex-1 h-10 px-3 bg-white border border-orange-100 rounded-[10px] text-xl font-bold text-orange-500 text-center outline-none focus:border-orange-300"
                  />
                  <span className="text-sm text-gray-500">년</span>
                </div>
              </div>
            </SectionCard>

            <div className="flex-1 min-w-0">
              <div className="border-b border-orange-100 flex gap-8 mb-6">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-lg font-semibold relative transition-colors ${
                      activeTab === tab ? "text-orange-500" : "text-gray-500 hover:text-stone-900"
                    }`}
                  >
                    {tab}
                    {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
                  </button>
                ))}
              </div>
              {renderTabContent()}
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-100 z-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-10 py-4 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 md:flex-none md:w-36 h-12 border border-orange-500 rounded-[10px] text-base font-semibold text-orange-500 hover:bg-orange-50 transition-colors"
          >
            취소
          </button>
          <Link
            href="/myprofile/sitter-profile"
            className="flex-1 md:flex-none md:w-40 h-12 border border-orange-500 rounded-[10px] text-base font-semibold text-orange-500 flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors"
          >
            <Eye size={16} />
            미리보기
          </Link>
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

      <CustomModal
        open={showSaveModal}
        type="success"
        title="저장이 완료되었습니다"
        confirmText="프로필 보기"
        closeOnOverlay={false}
        closeOnEsc={false}
        showCloseButton={false}
        onConfirm={() => router.replace("/myprofile/sitter-profile")}
        onClose={() => router.replace("/myprofile/sitter-profile")}
      />

      <CustomModal
        open={showErrorModal}
        type="error"
        title="저장에 실패했습니다"
        description={errorMessage}
        confirmText="확인"
        onConfirm={() => setShowErrorModal(false)}
        onClose={() => setShowErrorModal(false)}
      />
    </>
  );
}

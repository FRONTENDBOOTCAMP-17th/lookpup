"use client";

import { useState, useRef } from "react";
import { X, ChevronLeft, Clock, ImagePlus } from "lucide-react";

//타입 정의 

export type CareRecordType =
  | "visit"
  | "check_in"
  | "check_out"
  | "pickup_start"
  | "pickup_done"
  | "handover"
  | "meal"
  | "walk"
  | "potty"
  | "medication"
  | "play"
  | "rest"
  | "condition"
  | "photo"
  | "memo";

export type ServiceType = "pickup" | "walk" | "care" | "hotel";

type FieldType = "time" | "text" | "number" | "textarea" | "select" | "photo";

interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  optional?: boolean;
}

interface RecordTypeConfig {
  type: CareRecordType;
  emoji: string;
  label: string;
  statusText: string;
  fields: FieldConfig[];
}

//설정 객체

const SERVICE_TYPE_RECS: Record<ServiceType, CareRecordType[]> = {
  pickup: ["pickup_start", "pickup_done", "handover", "photo", "memo"],
  walk: ["visit", "check_in", "walk", "potty", "photo", "memo"],
  care: [
    "check_in", "meal", "walk", "potty", "medication",
    "play", "condition", "photo", "memo", "check_out",
  ],
  hotel: [
    "check_in", "meal", "walk", "potty", "medication",
    "play", "rest", "condition", "photo", "memo", "check_out",
  ],
};

const SERVICE_TYPE_LABEL: Record<ServiceType, string> = {
  pickup: "픽업",
  walk: "산책",
  care: "방문돌봄",
  hotel: "위탁돌봄",
};

export const CARE_RECORD_TYPES: RecordTypeConfig[] = [
  {
    type: "visit",
    emoji: "🏠",
    label: "방문",
    statusText: "방문 완료",
    fields: [
      { key: "time", label: "방문 시간", type: "time" },
      { key: "memo", label: "메모", type: "textarea", placeholder: "특이사항을 입력하세요", optional: true },
    ],
  },
  {
    type: "check_in",
    emoji: "🏠",
    label: "체크인",
    statusText: "체크인 완료",
    fields: [
      { key: "time", label: "체크인 시간", type: "time" },
      { key: "memo", label: "메모", type: "textarea", placeholder: "특이사항을 입력하세요", optional: true },
    ],
  },
  {
    type: "check_out",
    emoji: "🚪",
    label: "체크아웃",
    statusText: "체크아웃 완료",
    fields: [
      { key: "time", label: "체크아웃 시간", type: "time" },
      { key: "memo", label: "메모", type: "textarea", placeholder: "특이사항을 입력하세요", optional: true },
    ],
  },
  {
    type: "pickup_start",
    emoji: "🚗",
    label: "픽업 출발",
    statusText: "픽업 출발",
    fields: [
      { key: "departure", label: "출발 위치", type: "text", placeholder: "출발 위치를 입력하세요" },
      { key: "eta", label: "예상 도착 시간", type: "time" },
      { key: "memo", label: "메모", type: "textarea", optional: true },
    ],
  },
  {
    type: "pickup_done",
    emoji: "✅",
    label: "픽업 완료",
    statusText: "픽업 완료",
    fields: [
      { key: "arrival", label: "도착 위치", type: "text", placeholder: "도착 위치를 입력하세요" },
      { key: "time", label: "실제 도착 시간", type: "time" },
      { key: "memo", label: "메모", type: "textarea", optional: true },
    ],
  },
  {
    type: "handover",
    emoji: "🤝",
    label: "보호자 인계",
    statusText: "인계 완료",
    fields: [
      { key: "target", label: "인계 대상", type: "text", placeholder: "인계 받는 분 이름" },
      { key: "time", label: "인계 시간", type: "time" },
      { key: "memo", label: "메모", type: "textarea", optional: true },
    ],
  },
  {
    type: "meal",
    emoji: "🍚",
    label: "식사",
    statusText: "식사 완료",
    fields: [
      { key: "mealTime", label: "식사 시간", type: "select", options: ["아침", "점심", "저녁", "간식"] },
      { key: "amount", label: "식사량", type: "select", options: ["전부 먹음", "절반 먹음", "조금 먹음", "안 먹음"] },
      { key: "memo", label: "메모", type: "textarea", optional: true },
    ],
  },
  {
    type: "walk",
    emoji: "🚶",
    label: "산책",
    statusText: "산책 완료",
    fields: [
      { key: "duration", label: "산책 시간 (분)", type: "number", placeholder: "예: 30" },
      { key: "distance", label: "산책 거리", type: "text", placeholder: "예: 1.5km", optional: true },
      { key: "memo", label: "메모", type: "textarea", optional: true },
    ],
  },
  {
    type: "potty",
    emoji: "💩",
    label: "배변",
    statusText: "배변 기록",
    fields: [
      { key: "pottyType", label: "배변 종류", type: "select", options: ["소변", "대변", "둘 다"] },
      { key: "condition", label: "배변 상태", type: "select", options: ["정상", "묽음", "딱딱함", "기타"] },
      { key: "memo", label: "메모", type: "textarea", optional: true },
    ],
  },
  {
    type: "medication",
    emoji: "💊",
    label: "약 복용",
    statusText: "약 복용 완료",
    fields: [
      { key: "name", label: "약 이름", type: "text", placeholder: "약 이름을 입력하세요" },
      { key: "time", label: "복용 시간", type: "time" },
      { key: "status", label: "복용 여부", type: "select", options: ["완료", "거부", "부분 복용"] },
      { key: "memo", label: "메모", type: "textarea", optional: true },
    ],
  },
  {
    type: "play",
    emoji: "🎾",
    label: "놀이/케어",
    statusText: "케어 완료",
    fields: [
      { key: "activity", label: "활동 종류", type: "select", options: ["놀이", "빗질", "목욕", "훈련", "기타"] },
      { key: "duration", label: "활동 시간 (분)", type: "number", placeholder: "예: 20" },
      { key: "reaction", label: "반려동물 반응", type: "select", options: ["좋아함", "보통", "싫어함"] },
      { key: "memo", label: "메모", type: "textarea", optional: true },
    ],
  },
  {
    type: "rest",
    emoji: "😴",
    label: "휴식/수면",
    statusText: "휴식 기록",
    fields: [
      { key: "duration", label: "수면/휴식 시간", type: "text", placeholder: "예: 2시간 30분" },
      { key: "condition", label: "컨디션", type: "select", options: ["편안함", "불안함", "피곤함", "활발함"] },
      { key: "memo", label: "메모", type: "textarea", optional: true },
    ],
  },
  {
    type: "condition",
    emoji: "💗",
    label: "상태 체크",
    statusText: "상태 체크",
    fields: [
      { key: "condition", label: "컨디션", type: "select", options: ["좋음", "보통", "나쁨", "이상 있음"] },
      { key: "water", label: "물 섭취", type: "select", options: ["정상", "적음", "많음"] },
      { key: "memo", label: "특이사항", type: "textarea", optional: true },
    ],
  },
  {
    type: "photo",
    emoji: "📷",
    label: "사진",
    statusText: "사진 기록",
    fields: [
      { key: "photo", label: "사진 첨부", type: "photo" },
      { key: "description", label: "설명", type: "text", placeholder: "사진 설명을 입력하세요", optional: true },
      { key: "memo", label: "메모", type: "textarea", optional: true },
    ],
  },
  {
    type: "memo",
    emoji: "📝",
    label: "메모",
    statusText: "메모 기록",
    fields: [
      { key: "memo", label: "특이사항", type: "textarea", placeholder: "전달할 내용을 입력하세요" },
    ],
  },
];

// 서브 컴포넌트

function CareRecordTypeCard({
  config,
  onClick,
}: {
  config: RecordTypeConfig;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 p-2.5 bg-orange-50 rounded-2xl border border-orange-100 hover:bg-orange-100 hover:border-orange-200 transition-colors"
    >
      <span className="text-xl leading-none">{config.emoji}</span>
      <span className="text-[11px] text-stone-900 font-medium text-center leading-tight">
        {config.label}
      </span>
    </button>
  );
}

function CareRecordField({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  value: string;
  onChange: (v: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const inputBase =
    "w-full h-10 px-3 bg-white border border-orange-100 rounded-xl text-sm text-stone-900 placeholder:text-gray-400 outline-none focus:border-orange-300 transition-colors";

  return (
    <div>
      <label className="block text-sm font-medium text-stone-900 mb-1.5">
        {field.label}
        {field.optional && (
          <span className="ml-1 text-xs text-gray-400 font-normal">(선택)</span>
        )}
      </label>

      {field.type === "time" && (
        <div className="flex gap-2">
          <input
            type="time"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputBase} flex-1`}
          />
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              const h = String(now.getHours()).padStart(2, "0");
              const m = String(now.getMinutes()).padStart(2, "0");
              onChange(`${h}:${m}`);
            }}
            className="h-10 px-3 bg-orange-50 border border-orange-100 rounded-xl text-xs text-orange-500 hover:bg-orange-100 transition-colors flex items-center gap-1 shrink-0"
          >
            <Clock size={12} />
            현재
          </button>
        </div>
      )}

      {field.type === "text" && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={inputBase}
        />
      )}

      {field.type === "number" && (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          min={0}
          className={inputBase}
        />
      )}

      {field.type === "textarea" && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? "입력하세요"}
          rows={3}
          className="w-full px-3 py-2.5 bg-white border border-orange-100 rounded-xl text-sm text-stone-900 placeholder:text-gray-400 outline-none focus:border-orange-300 transition-colors resize-none"
        />
      )}

      {field.type === "select" && field.options && (
        <div className="flex flex-wrap gap-2">
          {field.options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                value === opt
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-orange-50 text-gray-600 border-orange-100 hover:border-orange-300"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {field.type === "photo" && (
        <>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full h-24 bg-orange-50 border-2 border-dashed border-orange-200 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:bg-orange-100 transition-colors"
          >
            <ImagePlus size={20} className="text-orange-400" />
            <span className="text-xs text-gray-400">
              {value ? value : "사진을 추가하세요"}
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) onChange(e.target.files[0].name);
            }}
          />
        </>
      )}
    </div>
  );
}

//유형 선택 화면
function CareRecordTypeSelect({
  serviceType,
  onSelect,
  onClose,
}: {
  serviceType?: ServiceType;
  onSelect: (type: CareRecordType) => void;
  onClose: () => void;
}) {
  const [showAll, setShowAll] = useState(false);

  const recTypes = serviceType ? SERVICE_TYPE_RECS[serviceType] : null;
  const displayList =
    recTypes && !showAll
      ? CARE_RECORD_TYPES.filter((t) => recTypes.includes(t.type))
      : CARE_RECORD_TYPES;

  return (
    <>
      <div className="flex items-center justify-between px-5 py-4 border-b border-orange-100">
        <h2 className="text-base font-bold text-stone-900">기록 유형 선택</h2>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-orange-50 transition-colors"
        >
          <X size={18} className="text-gray-400" />
        </button>
      </div>

      <div className="p-5 space-y-3">
        {serviceType && !showAll && (
          <p className="text-xs text-gray-400">
            {SERVICE_TYPE_LABEL[serviceType]} 서비스 추천 기록 유형
          </p>
        )}

        <div className="grid grid-cols-4 gap-2 max-h-[55vh] overflow-y-auto">
          {displayList.map((config) => (
            <CareRecordTypeCard
              key={config.type}
              config={config}
              onClick={() => onSelect(config.type)}
            />
          ))}
        </div>

        {serviceType && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="w-full py-2 text-xs text-orange-500 hover:text-orange-600 transition-colors font-medium"
          >
            {showAll ? "추천만 보기 ↑" : "전체 유형 보기 ↓"}
          </button>
        )}
      </div>
    </>
  );
}

//유형별 입력 폼 화면 

function CareRecordForm({
  config,
  onSubmit,
  onBack,
}: {
  config: RecordTypeConfig;
  onSubmit: (fields: Record<string, string>) => void;
  onBack: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(config.fields.map((f) => [f.key, ""]))
  );

  return (
    <>
      <div className="flex items-center justify-between px-5 py-4 border-b border-orange-100">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1 rounded-full hover:bg-orange-50 transition-colors"
          >
            <ChevronLeft size={18} className="text-gray-500" />
          </button>
          <h2 className="text-base font-bold text-stone-900">
            {config.emoji} {config.label}
          </h2>
        </div>
        <span className="px-2.5 py-1 bg-orange-50 rounded-full text-xs text-orange-500 font-medium">
          {config.statusText}
        </span>
      </div>

      <div className="p-5 space-y-4 overflow-y-auto max-h-[55vh]">
        {config.fields.map((field) => (
          <CareRecordField
            key={field.key}
            field={field}
            value={values[field.key] ?? ""}
            onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
          />
        ))}
      </div>

      <div className="px-5 py-4 border-t border-orange-100">
        <button
          type="button"
          onClick={() => onSubmit(values)}
          className="w-full h-12 bg-orange-500 rounded-2xl text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
        >
          저장하기
        </button>
      </div>
    </>
  );
}

//페이로드 타입 (외부 사용) 

export interface CareRecordPayload {
  reservationId?: string;
  roomId?: string;
  senderId?: string;
  type: CareRecordType;
  serviceType?: ServiceType;
  title: string;
  statusText: string;
  content: string;
  fields: Record<string, string>;
  imageUrls: string[];
  createdAt: string;
}

//메인 모달

interface CareRecordModalProps {
  open: boolean;
  onClose: () => void;
  serviceType?: ServiceType;
  reservationId?: string;
  roomId?: string;
  senderId?: string;
  onSubmit?: (record: CareRecordPayload) => void;
}

export default function CareRecordModal({
  open,
  onClose,
  serviceType,
  reservationId,
  roomId,
  senderId,
  onSubmit,
}: CareRecordModalProps) {
  const [step, setStep] = useState<"select" | "form">("select");
  const [selectedType, setSelectedType] = useState<CareRecordType | null>(null);

  if (!open) return null;

  const selectedConfig = selectedType
    ? CARE_RECORD_TYPES.find((t) => t.type === selectedType)
    : null;

  const handleTypeSelect = (type: CareRecordType) => {
    setSelectedType(type);
    setStep("form");
  };

  const handleBack = () => {
    setStep("select");
    setSelectedType(null);
  };

  const handleClose = () => {
    setStep("select");
    setSelectedType(null);
    onClose();
  };

  const handleSubmit = (fields: Record<string, string>) => {
    if (!selectedConfig) return;
    const record: CareRecordPayload = {
      reservationId,
      roomId,
      senderId,
      type: selectedConfig.type,
      serviceType,
      title: selectedConfig.label,
      statusText: selectedConfig.statusText,
      content: fields.memo ?? "",
      fields,
      imageUrls: fields.photo ? [fields.photo] : [],
      createdAt: new Date().toISOString(),
    };
    console.log("[CareRecord 저장]", record);
    onSubmit?.(record);
    handleClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleClose}
    >
      <div
        className="w-96 max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {step === "select" ? (
          <CareRecordTypeSelect
            serviceType={serviceType}
            onSelect={handleTypeSelect}
            onClose={handleClose}
          />
        ) : selectedConfig ? (
          <CareRecordForm
            config={selectedConfig}
            onSubmit={handleSubmit}
            onBack={handleBack}
          />
        ) : null}
      </div>
    </div>
  );
}

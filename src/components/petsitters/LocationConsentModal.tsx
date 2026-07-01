import { LocateFixed } from "lucide-react";

interface LocationConsentModalProps {
  onDismiss: () => void;
  onConfirm: () => void;
}

export default function LocationConsentModal({
  onDismiss,
  onConfirm,
}: LocationConsentModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <LocateFixed size={20} className="text-orange-500" />
          </div>
          <h2 className="text-stone-900 text-lg font-semibold">현재 위치 사용</h2>
        </div>
        <p className="text-gray-500 text-sm mb-5 leading-relaxed">
          현재 위치를 사용하면 가까운 펫시터를 찾을 수 있어요!
          <br />
          위치 정보는 펫시터 거리 계산에만 사용됩니다.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium"
          >
            나중에
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium"
          >
            동의하기
          </button>
        </div>
      </div>
    </div>
  );
}

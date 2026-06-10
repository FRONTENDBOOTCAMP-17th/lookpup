'use client';

const REPORT_REASONS = [
  '불쾌하거나 부적절한 내용',
  '허위 또는 과장된 정보',
  '사기 또는 스팸 의심',
  '개인정보 침해',
  '기타',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

interface ReportModalContentProps {
  selectedReason: ReportReason | '';
  onReasonChange: (reason: ReportReason) => void;
  additionalText: string;
  onAdditionalTextChange: (text: string) => void;
}

export function ReportModalContent({
  selectedReason,
  onReasonChange,
  additionalText,
  onAdditionalTextChange,
}: ReportModalContentProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Radio list */}
      <fieldset>
        <legend className="sr-only">신고 사유</legend>
        <div className="flex flex-col gap-2">
          {REPORT_REASONS.map((reason) => (
            <label
              key={reason}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="radio"
                name="report-reason"
                value={reason}
                checked={selectedReason === reason}
                onChange={() => onReasonChange(reason)}
                className="w-4 h-4 accent-orange-500 cursor-pointer"
              />
              <span className="text-stone-900 text-sm leading-5 group-hover:text-orange-600 transition-colors">
                {reason}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Textarea */}
      <textarea
        value={additionalText}
        onChange={(e) => onAdditionalTextChange(e.target.value)}
        placeholder="추가 내용을 직접 입력해 주세요. (선택)"
        rows={4}
        className="w-full px-4 py-3 bg-orange-50 rounded-xl outline outline-1 outline-offset-[-1px] outline-orange-100 text-sm text-stone-900 placeholder:text-gray-400 leading-5 resize-none focus:outline-orange-300 transition-colors"
      />
    </div>
  );
}

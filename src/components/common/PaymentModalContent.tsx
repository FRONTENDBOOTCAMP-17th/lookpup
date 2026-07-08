interface PaymentModalContentProps {
  amount?: number;
  feeRate?: number;
}

function formatKRW(value: number) {
  return value.toLocaleString('ko-KR') + '원';
}

export function PaymentModalContent({ amount = 35000, feeRate = 0.05 }: PaymentModalContentProps) {
  const fee = Math.round(amount * feeRate);
  const total = amount + fee;

  return (
    <div className="w-full bg-orange-50 rounded-xl outline outline-1 outline-offset-[-1px] outline-orange-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-orange-100 flex justify-between items-center">
        <span className="text-gray-500 text-sm leading-5">예약 금액</span>
        <span className="text-stone-900 text-sm leading-5">{formatKRW(amount)}</span>
      </div>
      <div className="px-4 py-3 border-b border-orange-100 flex justify-between items-center">
        <span className="text-gray-500 text-sm leading-5">서비스 수수료 ({Math.round(feeRate * 100)}%)</span>
        <span className="text-stone-900 text-sm leading-5">{formatKRW(fee)}</span>
      </div>
      <div className="px-4 py-3.5 bg-white flex justify-between items-center">
        <span className="text-stone-900 text-sm font-bold leading-5">총 결제 금액</span>
        <span className="text-orange-500 text-base font-bold leading-6">{formatKRW(total)}</span>
      </div>
    </div>
  );
}

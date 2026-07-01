const FAQS = [
  {
    q: "서비스 중 반려동물이 다쳤을 경우 어떻게 되나요?",
    a: "펫시터의 과실이 확인된 경우, 봐주개는 예약 내역·채팅 기록 등 플랫폼 내 증거 자료를 보관하고 분쟁 조정 시 이를 제공합니다. 다만 봐주개는 중개 플랫폼으로 직접적인 의료비 보상 의무는 없으며, 손해배상 청구는 보호자-펫시터 간 민사 절차(또는 소비자분쟁조정위원회)를 통해 진행됩니다. 보호자분께서는 서비스 이용 전 반려동물 의료보험 가입을 권장합니다.",
  },
  {
    q: "펫시터가 연락이 되지 않거나 서비스를 이행하지 않으면 어떻게 하나요?",
    a: "예약 확정 후 펫시터가 무단으로 서비스를 이행하지 않은 경우 전액 환불 처리됩니다. 신고 후 해당 펫시터 계정은 즉시 이용 정지됩니다. 채팅 기록과 예약 데이터는 분쟁 증빙 자료로 활용될 수 있도록 90일간 보관됩니다.",
  },
  {
    q: "펫시터 인증은 어떻게 진행되나요?",
    a: "본인인증을 통한 실명 확인(필수)과 반려동물 관련 자격증 파일 첨부(권장)로 검토합니다. 허위 서류 제출이 확인될 경우 계정은 즉시 이용 정지되고 관련 기관에 통보됩니다.",
  },
  {
    q: "예약 취소 및 환불 정책이 어떻게 되나요?",
    a: "예약 시작 24시간 전까지 취소하면 전액 환불됩니다. 24시간 이내 취소 시에는 취소 수수료가 발생할 수 있으며, 노쇼는 환불이 불가합니다. 펫시터 귀책 사유로 인한 취소는 취소 시점과 무관하게 전액 환불됩니다.",
  },
  {
    q: "결제는 어떻게 이루어지며 안전한가요?",
    a: "토스페이먼츠를 통해 신용카드, 계좌이체, 간편결제(토스페이·카카오페이 등)를 지원합니다. 결제 정보는 토스페이먼츠의 PCI-DSS 인증 보안 시스템으로 안전하게 관리됩니다.",
  },
];

export default function FaqSection() {
  return (
    <section className="py-16 md:py-20">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-10">
        <h2 className="text-2xl md:text-3xl font-bold text-stone-900 text-center mb-4">
          자주 묻는 질문
        </h2>
        <p className="text-gray-500 text-center mb-10 md:mb-14">
          궁금한 점을 미리 확인하세요
        </p>
        <div className="flex flex-col gap-4">
          {FAQS.map(({ q, a }) => (
            <div
              key={q}
              className="p-5 bg-white rounded-2xl shadow-[0px_2px_12px_0px_rgba(232,116,42,0.10)] border border-orange-100 flex items-start gap-4"
            >
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
                <span
                  className="text-white text-base font-bold"
                  aria-label="질문"
                >
                  Q
                </span>
              </div>
              <div>
                <h3 className="text-stone-900 text-lg font-semibold mb-2">
                  {q}
                </h3>
                <p className="text-gray-500 text-base leading-6">{a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

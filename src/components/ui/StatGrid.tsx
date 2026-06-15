interface StatItem {
  label: string;
  value: string;
}

interface Props {
  stats: StatItem[];
  className?: string;
}

/**
 * 경력·완료 건수 등 2열 그리드로 표시되는 펫시터 통계.
 * 펫시터 프로필 미리보기 / 펫시터 프로필의 네모네모 박스.
 */
export default function StatGrid({ stats, className }: Props) {
  return (
    <div className={`grid grid-cols-2 gap-2 ${className ?? ""}`}>
      {stats.map((item) => (
        /* 통계 셀 */
        <div
          key={item.label}
          className="bg-orange-50 rounded-xl py-2 text-center"
        >
          <p className="text-xs font-bold text-orange-500">{item.value}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

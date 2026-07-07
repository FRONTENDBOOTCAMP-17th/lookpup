interface StatItem {
  label: string;
  value: string;
}

interface Props {
  stats: StatItem[];
  className?: string;
}

export default function StatGrid({ stats, className }: Props) {
  return (
    <div className={`grid grid-cols-2 gap-2 ${className ?? ""}`}>
      {stats.map((item) => (
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

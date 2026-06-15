interface PillProps {
  children: React.ReactNode;
  className?: string;
}

export default function Pill({ children, className }: PillProps) {
  return (
    <span
      className={`px-3 py-1 bg-orange-50 rounded-full text-orange-500 text-xs font-medium${className ? ` ${className}` : ""}`}
    >
      {children}
    </span>
  );
}

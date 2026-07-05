export default function LoadingPage({
  label = "불러오는 중...",
  fullScreen = false,
  className = "",
}: {
  label?: string;
  fullScreen?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${
        fullScreen ? "min-h-screen bg-orange-50" : "py-20"
      } ${className}`}
    >
      <div className="w-10 h-10 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
      {label && <p className="text-gray-400 text-sm">{label}</p>}
    </div>
  );
}

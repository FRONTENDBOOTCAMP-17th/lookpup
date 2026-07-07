import { Star } from "lucide-react";

interface Props {
  size: number;
  count?: number;
}

export default function StarRow({ size, count = 5 }: Props) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < count
              ? "fill-amber-400 text-amber-400"
              : "fill-gray-200 text-gray-200"
          }
        />
      ))}
    </>
  );
}

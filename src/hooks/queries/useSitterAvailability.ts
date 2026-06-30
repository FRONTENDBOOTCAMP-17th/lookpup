import { useQuery } from "@tanstack/react-query";
import { startOfDay } from "date-fns";

export function useSitterAvailability(sitterId: string) {
  return useQuery({
    queryKey: ["sitter-availability", sitterId] as const,
    queryFn: async () => {
      const res = await fetch(`/api/sitters/${sitterId}/availability`);
      if (!res.ok) throw new Error("예약 가능 정보를 불러오지 못했습니다.");
      const { data } = await res.json() as { data: { from: string; to: string }[] };
      return data.map((r) => ({
        from: startOfDay(new Date(r.from)),
        to: startOfDay(new Date(r.to)),
      }));
    },
    enabled: !!sitterId,
    staleTime: 1000 * 60 * 5,
  });
}

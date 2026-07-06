import { useQuery } from "@tanstack/react-query";
import type { EarningsData } from "@/types/earnings";

async function fetchEarnings(): Promise<EarningsData> {
  const res = await fetch("/api/earnings");
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error?.message ?? "정산 정보를 불러오지 못했습니다.");
  }
  return body.data;
}

export function useEarnings(initialData?: EarningsData) {
  return useQuery({
    queryKey: ["earnings"] as const,
    queryFn: fetchEarnings,
    initialData,
    enabled: !initialData,
  });
}

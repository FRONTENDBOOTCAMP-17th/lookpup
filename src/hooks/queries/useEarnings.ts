import { useQuery } from "@tanstack/react-query";
import type { EarningsData } from "@/types/earnings";

async function fetchEarnings(): Promise<EarningsData> {
  const res = await fetch("/api/earnings");
  const { data } = await res.json();
  return data;
}

export function useEarnings(initialData?: EarningsData) {
  return useQuery({
    queryKey: ["earnings"] as const,
    queryFn: fetchEarnings,
    initialData,
    enabled: !initialData,
  });
}

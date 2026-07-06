import { useQuery } from "@tanstack/react-query";

export interface SitterService {
  id: string;
  service_type: string;
  price: number;
}

export interface SitterBookingInfo {
  id: string;
  name: string;
  initial: string;
  profileImage: string | null;
  pricePerDay: number;
  services: SitterService[];
}

const SITTER_SERVICE_LABEL: Record<string, string> = {
  walk: "산책",
  care: "방문돌봄",
  hotel: "위탁돌봄",
  pickup: "픽업",
};

type SitterApiResponse = {
  id: string;
  full_name: string;
  profile_image: string | null;
  base_price: number | null;
  request_type: string[];
  services: (SitterService & { is_active: boolean })[];
};

export function useSitterBookingInfo(sitterId: string) {
  return useQuery({
    queryKey: ["sitter-booking-info", sitterId] as const,
    queryFn: async () => {
      const res = await fetch(`/api/sitters/${sitterId}`);
      if (!res.ok) throw new Error("시터 정보를 불러오지 못했습니다.");
      const { data } = (await res.json()) as { data: SitterApiResponse };
      const activeServices = data.services
        .filter((s) => s.is_active)
        .map(({ id, service_type, price }) => ({ id, service_type, price }));
      const primary = activeServices[0];
      return {
        id: data.id,
        name: data.full_name ?? "",
        initial: (data.full_name ?? "?").charAt(0),
        profileImage: data.profile_image ?? null,
        pricePerDay: data.base_price ?? primary?.price ?? 0,
        services: activeServices,
      } satisfies SitterBookingInfo;
    },
    enabled: !!sitterId,
  });
}

export { SITTER_SERVICE_LABEL };

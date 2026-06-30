import { useQuery } from "@tanstack/react-query";

export interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string;
  age: number;
  weight: number;
  image_url: string | null;
}

type PetApiItem = {
  id: string;
  name: string;
  animal_type: string;
  breed: string | null;
  age: number;
  weight: number;
  image_url: string | null;
};

function mapAnimalType(t: string): string {
  if (t === "dog") return "강아지";
  if (t === "cat") return "고양이";
  return t;
}

export function usePets() {
  return useQuery({
    queryKey: ["pets"] as const,
    queryFn: async () => {
      const res = await fetch("/api/pets");
      if (!res.ok) throw new Error("반려동물 정보를 불러오지 못했습니다.");
      const { data } = (await res.json()) as { data: PetApiItem[] };
      return data.map(
        (p): Pet => ({
          id: p.id,
          name: p.name,
          type: mapAnimalType(p.animal_type),
          breed: p.breed ?? "",
          age: p.age,
          weight: p.weight,
          image_url: p.image_url,
        }),
      );
    },
    staleTime: 1000 * 60 * 5,
  });
}

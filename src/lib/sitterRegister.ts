import type { SitterAnimalId, SitterServiceId } from "@/types/sitterRegister";

export const SERVICES: {
  id: SitterServiceId;
  emoji: string;
  title: string;
  desc: string;
}[] = [
  { id: "visit", emoji: "🏠", title: "방문돌봄", desc: "보호자님 집에서 돌봄" },
  { id: "foster", emoji: "🏡", title: "위탁돌봄", desc: "내 집에서 돌봄" },
  { id: "walk", emoji: "🚶", title: "산책", desc: "반려동물 산책 서비스" },
  { id: "pickup", emoji: "🚗", title: "픽업", desc: "반려동물 픽업 서비스" },
];

export const ANIMALS: { id: SitterAnimalId; label: string }[] = [
  { id: "small_dog", label: "소형견 (7kg 이하)" },
  { id: "medium_dog", label: "중형견 (7-15kg)" },
  { id: "large_dog", label: "대형견 (15kg 이상)" },
  { id: "cat", label: "고양이" },
];

export const CAREER_OPTIONS = [
  { value: "없음", label: "경력 없음" },
  { value: "1년 미만", label: "1년 미만" },
  { value: "1~3년", label: "1~3년" },
  { value: "3~5년", label: "3~5년" },
  { value: "5년 이상", label: "5년 이상" },
];

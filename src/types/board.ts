// 구인게시판 작성/수정 폼에서 공유하는 반려동물 타입.

// 폼에서 사용하는 반려동물 (UI 표시용으로 가공된 형태)
export type Pet = {
  id: string;
  name: string;
  type: string;
  age: number | null;
  weight: number | null;
  emoji: string;
  image_url: string | null;
};

// GET /api/pets 응답 행 (필요한 필드만)
export type PetRow = {
  id: string;
  name: string;
  animal_type: string;
  age: number | null;
  weight: number | null;
  image_url: string | null;
};

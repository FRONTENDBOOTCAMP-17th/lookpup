import { create } from "zustand";
import { DateRange } from "react-day-picker";

// 클라이언트 UI 상태만 보관 — 서버 데이터(시터 정보 등)는 TanStack Query로 관리
interface BookingState {
  dateRange: DateRange | undefined;
  petIds: string[];
  petNames: string[];
  note: string;
  paymentMethod: "card" | "kakaopay" | "tosspay" | null;

  setDateRange: (range: DateRange | undefined) => void;
  togglePet: (id: string, name: string) => void;
  setNote: (note: string) => void;
  setPaymentMethod: (method: "card" | "kakaopay" | "tosspay") => void;
  reset: () => void;
}

const initialState = {
  dateRange: undefined,
  petIds: [] as string[],
  petNames: [] as string[],
  note: "",
  paymentMethod: null,
};

export const useBookingStore = create<BookingState>((set, get) => ({
  ...initialState,
  setDateRange: (range) => set({ dateRange: range }),
  togglePet: (id: string, name: string) => {
    const { petIds, petNames } = get();
    if (petIds.includes(id)) {
      set({
        petIds: petIds.filter((p) => p !== id),
        petNames: petNames.filter((n) => n !== name),
      });
    } else {
      set({ petIds: [...petIds, id], petNames: [...petNames, name] });
    }
  },
  setNote: (note) => set({ note }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  reset: () => set(initialState),
}));

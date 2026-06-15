import { create } from "zustand";
import { DateRange } from "react-day-picker";

interface BookingState {
  petsitterId: number | null;
  petsitterName: string;
  service: string;
  dateRange: DateRange | undefined;
  petIds: number[];
  petNames: string[];
  note: string;
  paymentMethod: "card" | "kakaopay" | "tosspay" | null;

  setPetsitter: (id: number, name: string, service: string) => void;
  setDateRange: (range: DateRange | undefined) => void;
  togglePet: (id: number, name: string) => void;
  setNote: (note: string) => void;
  setPaymentMethod: (method: "card" | "kakaopay" | "tosspay") => void;
  reset: () => void;
}

const initialState = {
  petsitterId: null,
  petsitterName: "",
  service: "",
  dateRange: undefined,
  petIds: [] as number[],
  petNames: [] as string[],
  note: "",
  paymentMethod: null,
};

export const useBookingStore = create<BookingState>((set, get) => ({
  ...initialState,
  setPetsitter: (id, name, service) =>
    set({ petsitterId: id, petsitterName: name, service }),
  setDateRange: (range) => set({ dateRange: range }),
  togglePet: (id, name) => {
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

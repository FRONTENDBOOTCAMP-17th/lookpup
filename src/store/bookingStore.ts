import { create } from "zustand";
import { DateRange } from "react-day-picker";

interface BookingState {
  petsitterId: number | null;
  petsitterName: string;
  service: string;
  dateRange: DateRange | undefined;
  petId: number | null;
  petName: string;
  note: string;
  paymentMethod: "card" | "kakaopay" | "tosspay" | null;

  setPetsitter: (id: number, name: string, service: string) => void;
  setDateRange: (range: DateRange | undefined) => void;
  setPet: (id: number, name: string) => void;
  setNote: (note: string) => void;
  setPaymentMethod: (method: "card" | "kakaopay" | "tosspay") => void;
  reset: () => void;
}

const initialState = {
  petsitterId: null,
  petsitterName: "",
  service: "",
  dateRange: undefined,
  petId: null,
  petName: "",
  note: "",
  paymentMethod: null,
};

export const useBookingStore = create<BookingState>((set) => ({
  ...initialState,
  setPetsitter: (id, name, service) => set({ petsitterId: id, petsitterName: name, service }),
  setDateRange: (range) => set({ dateRange: range }),
  setPet: (id, name) => set({ petId: id, petName: name }),
  setNote: (note) => set({ note }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  reset: () => set(initialState),
}));

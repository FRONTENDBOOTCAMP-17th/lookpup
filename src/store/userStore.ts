import { create } from "zustand";

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  profileImage: string | null;
  isVerified: boolean;
  role: "owner" | "both" | "admin";
}

export interface SitterData {
  id: string;
  availableArea: string;
  displayArea: string | null;
  career: string | null;
  introduction: string | null;
  rating: number;
  services: string[];
  reviewCount: number;
  requestType: string[];
  availableAnimals: string[];
  activityPhotoUrls: string[];
  latitude: number | null;
  longitude: number | null;
  serviceRadiusKm: number | null;
}

interface UserState {
  user: UserProfile | null;
  sitter: SitterData | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isDeletedAccount: boolean;
  setUser: (user: UserProfile) => void;
  setSitter: (sitter: SitterData) => void;
  clearUser: () => void;
  verifyUser: () => void;
  setDeletedAccount: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  sitter: null,
  isLoggedIn: false,
  isLoading: true,
  isDeletedAccount: false,
  setUser: (user) => set({ user, isLoggedIn: true, isLoading: false, isDeletedAccount: false }),
  setSitter: (sitter) => set({ sitter }),
  clearUser: () => set({ user: null, sitter: null, isLoggedIn: false, isLoading: false, isDeletedAccount: false }),
  verifyUser: () =>
    set((state) =>
      state.user ? { user: { ...state.user, isVerified: true } } : {},
    ),
  setDeletedAccount: () =>
    set({ user: null, sitter: null, isLoggedIn: false, isLoading: false, isDeletedAccount: true }),
}));

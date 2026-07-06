import { create } from "zustand";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  displayArea: string | null;
  latitude: number | null;
  longitude: number | null;
  birthdate: string | null;
  profileImage: string | null;
  isVerified: boolean;
  role: "owner" | "both" | "admin";
}

export interface SitterData {
  id: string;
  status: string;
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
}

interface UserState {
  user: UserProfile | null;
  sitter: SitterData | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isDeletedAccount: boolean;
  unreadCount: number;
  setUser: (user: UserProfile) => void;
  setSitter: (sitter: SitterData) => void;
  clearUser: () => void;
  verifyUser: () => void;
  setDeletedAccount: () => void;
  setUnreadCount: (count: number) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  sitter: null,
  isLoggedIn: false,
  isLoading: true,
  isDeletedAccount: false,
  unreadCount: 0,
  setUser: (user) =>
    set({ user, isLoggedIn: true, isLoading: false, isDeletedAccount: false }),
  setSitter: (sitter) => set({ sitter }),
  clearUser: () =>
    set({
      user: null,
      sitter: null,
      isLoggedIn: false,
      isLoading: false,
      isDeletedAccount: false,
      unreadCount: 0,
    }),
  verifyUser: () =>
    set((state) =>
      state.user ? { user: { ...state.user, isVerified: true } } : {},
    ),
  setDeletedAccount: () =>
    set({
      user: null,
      sitter: null,
      isLoggedIn: false,
      isLoading: false,
      isDeletedAccount: true,
      unreadCount: 0,
    }),
  setUnreadCount: (count) => set({ unreadCount: count }),
}));

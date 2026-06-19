import { create } from "zustand";

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  isVerified: boolean;
  role: "owner" | "both" | "admin";
}

interface UserState {
  user: UserProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isDeletedAccount: boolean;
  setUser: (user: UserProfile) => void;
  clearUser: () => void;
  verifyUser: () => void;
  setDeletedAccount: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  isDeletedAccount: false,
  setUser: (user) => set({ user, isLoggedIn: true, isLoading: false, isDeletedAccount: false }),
  clearUser: () => set({ user: null, isLoggedIn: false, isLoading: false, isDeletedAccount: false }),
  verifyUser: () =>
    set((state) =>
      state.user ? { user: { ...state.user, isVerified: true } } : {},
    ),
  setDeletedAccount: () =>
    set({ user: null, isLoggedIn: false, isLoading: false, isDeletedAccount: true }),
}));

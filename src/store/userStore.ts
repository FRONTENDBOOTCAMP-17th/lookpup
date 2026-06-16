import { create } from "zustand";

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  isVerified: boolean;
}

interface UserState {
  user: UserProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  setUser: (user: UserProfile) => void;
  clearUser: () => void;
  verifyUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  setUser: (user) => set({ user, isLoggedIn: true, isLoading: false }),
  clearUser: () => set({ user: null, isLoggedIn: false, isLoading: false }),
  verifyUser: () =>
    set((state) =>
      state.user ? { user: { ...state.user, isVerified: true } } : {},
    ),
}));

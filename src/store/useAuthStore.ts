import { create } from "zustand";
import { User } from "@supabase/supabase-js";

interface AuthStore {
  user: User | null;
  isLogin: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setIsLogin: (isLogin: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  isLogin: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setIsLogin: (isLogin) => set({ isLogin }),
}));

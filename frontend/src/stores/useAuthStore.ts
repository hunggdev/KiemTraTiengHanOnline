import { create } from "zustand";
import { authService } from "@/services/authService.ts";
import type { UserDTO, SignInPayload, SignUpPayload } from "@/types/auth.types.ts";

interface AuthState {
  user: UserDTO | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (payload: SignInPayload) => Promise<UserDTO>;
  signUp: (payload: SignUpPayload) => Promise<UserDTO>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<UserDTO | null>;
  setUser: (user: UserDTO | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    set({ user, isAuthenticated: !!user, isLoading: false });
  },

  signIn: async (payload) => {
    set({ isLoading: true });
    try {
      const res = await authService.signIn(payload);
      if (res.data) {
        set({ user: res.data, isAuthenticated: true, isLoading: false });
        return res.data;
      }
      throw new Error("Không nhận được dữ liệu người dùng");
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  signUp: async (payload) => {
    set({ isLoading: true });
    try {
      const res = await authService.signUp(payload);
      if (res.data) {
        set({ user: res.data, isAuthenticated: true, isLoading: false });
        return res.data;
      }
      throw new Error("Đăng ký không thành công");
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await authService.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const res = await authService.getMe();
      if (res.data) {
        set({ user: res.data, isAuthenticated: true, isLoading: false });
        return res.data;
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
      return null;
    } catch (err) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return null;
    }
  },
}));

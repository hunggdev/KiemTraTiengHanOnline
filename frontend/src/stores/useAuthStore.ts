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

const getInitialUser = (): UserDTO | null => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialUser = getInitialUser();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  isAuthenticated: !!initialUser,
  isLoading: true,

  setUser: (user) => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
    set({ user, isAuthenticated: !!user, isLoading: false });
  },

  signIn: async (payload) => {
    set({ isLoading: true });
    try {
      const res = await authService.signIn(payload);
      if (res.data) {
        localStorage.setItem("user", JSON.stringify(res.data));
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
        localStorage.setItem("user", JSON.stringify(res.data));
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
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const res = await authService.getMe();
      if (res.data) {
        localStorage.setItem("user", JSON.stringify(res.data));
        set({ user: res.data, isAuthenticated: true, isLoading: false });
        return res.data;
      }
      localStorage.removeItem("user");
      set({ user: null, isAuthenticated: false, isLoading: false });
      return null;
    } catch (err) {
      // Nếu có sẵn user trong localStorage (offline/mobile), giữ tạm
      const savedUser = getInitialUser();
      if (savedUser) {
        set({ user: savedUser, isAuthenticated: true, isLoading: false });
        return savedUser;
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
      return null;
    }
  },
}));


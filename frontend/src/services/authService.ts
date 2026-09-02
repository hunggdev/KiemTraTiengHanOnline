import axios from "axios";
import type {
  SignInPayload,
  SignUpPayload,
  AuthResponse,
  UserDTO,
} from "@/types/auth.types.ts";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Đính kèm token vào mọi request (quan trọng cho Safari/Chrome mobile khi bị chặn cross-site cookies)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  // Đăng ký tài khoản mới (mặc định STUDENT)
  signUp: async (payload: SignUpPayload): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/signup", payload);
    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("accessToken", data.token);
    }
    return data;
  },

  // Đăng nhập
  signIn: async (payload: SignInPayload): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/signin", payload);
    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("accessToken", data.token);
    }
    return data;
  },

  // Đăng xuất
  signOut: async (): Promise<{ success: boolean; message: string }> => {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    const { data } = await api.post<{ success: boolean; message: string }>("/auth/signout");
    return data;
  },

  // Lấy thông tin user hiện tại
  getMe: async (): Promise<{ success: boolean; data: UserDTO }> => {
    const { data } = await api.get<{ success: boolean; data: UserDTO }>("/auth/me");
    return data;
  },
};


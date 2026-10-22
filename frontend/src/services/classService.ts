import axios from "axios";
import type {
  ClassListResponse,
  ClassDetailResponse,
  ClassMutationResponse,
} from "@/types/class.types.ts";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const classService = {
  // Lấy danh sách tất cả lớp học
  getAll: async (): Promise<ClassListResponse> => {
    const { data } = await api.get<ClassListResponse>("/classes");
    return data;
  },

  // Lấy chi tiết lớp học
  getById: async (id: number): Promise<ClassDetailResponse> => {
    const { data } = await api.get<ClassDetailResponse>(`/classes/${id}`);
    return data;
  },

  // Tạo lớp mới
  create: async (name: string): Promise<ClassMutationResponse> => {
    const { data } = await api.post<ClassMutationResponse>("/classes", { name });
    return data;
  },

  // Đổi tên lớp
  update: async (id: number, name: string): Promise<ClassMutationResponse> => {
    const { data } = await api.put<ClassMutationResponse>(`/classes/${id}`, { name });
    return data;
  },

  // Xóa lớp
  delete: async (id: number): Promise<ClassMutationResponse> => {
    const { data } = await api.delete<ClassMutationResponse>(`/classes/${id}`);
    return data;
  },

  // Thêm học sinh vào lớp
  addStudents: async (classId: number, studentIds: number[]): Promise<ClassMutationResponse> => {
    const { data } = await api.post<ClassMutationResponse>(`/classes/${classId}/students`, { studentIds });
    return data;
  },

  // Gỡ học sinh khỏi lớp
  removeStudents: async (classId: number, studentIds: number[]): Promise<ClassMutationResponse> => {
    const { data } = await api.delete<ClassMutationResponse>(`/classes/${classId}/students`, {
      data: { studentIds },
    });
    return data;
  },
};

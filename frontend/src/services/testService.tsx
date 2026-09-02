import axios from "axios";
import type {
  CreateTestPayload,
  UpdateTestPayload,
  TestListResponse,
  TestDetailResponse,
  TestMutationResponse,
  TestListQueryParams,
} from "@/types/admin-test.types.ts";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const testService = {
  // Lấy danh sách tất cả bài test (có phân trang, tìm kiếm)
  getAll: async (params?: TestListQueryParams): Promise<TestListResponse> => {
    const { data } = await api.get<TestListResponse>("/tests", { params });
    return data;
  },

  // Lấy chi tiết 1 bài test theo ID
  getById: async (id: string): Promise<TestDetailResponse> => {
    const { data } = await api.get<TestDetailResponse>(`/tests/${id}`);
    return data;
  },

  // Tạo bài test mới
  create: async (payload: CreateTestPayload): Promise<TestMutationResponse> => {
    const { data } = await api.post<TestMutationResponse>("/tests", payload);
    return data;
  },

  // Cập nhật bài test
  update: async (id: string, payload: UpdateTestPayload): Promise<TestMutationResponse> => {
    const { data } = await api.put<TestMutationResponse>(`/tests/${id}`, payload);
    return data;
  },

  // Xóa bài test
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.delete(`/tests/${id}`);
    return data;
  },

  // Bật / tắt xuất bản
  togglePublish: async (id: string): Promise<TestMutationResponse> => {
    const { data } = await api.patch<TestMutationResponse>(`/tests/${id}/publish`);
    return data;
  },

  // Lấy bài thi cho học sinh làm bài (không lộ đáp án đúng)
  getForTaking: async (id: string): Promise<{ success: boolean; data: any }> => {
    const { data } = await api.get<{ success: boolean; data: any }>(`/tests/${id}/take`);
    return data;
  },

  // Nộp bài thi và lưu vào Database
  submitAttempt: async (
    id: string,
    payload: { userId?: string; answers: { questionId: string; answerText: string }[] }
  ): Promise<{ success: boolean; message: string; data: any }> => {
    const { data } = await api.post<{ success: boolean; message: string; data: any }>(
      `/tests/${id}/submit`,
      payload
    );
    return data;
  },
};

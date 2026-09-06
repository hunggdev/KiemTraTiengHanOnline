import axios from "axios";
import type {
  CreateTestPayload,
  UpdateTestPayload,
  TestListResponse,
  TestDetailResponse,
  TestMutationResponse,
  TestListQueryParams,
  TestStatsResponse,
  TestAttemptsResponse,
  AttemptDetailResponse,
  GradeAttemptPayload,
  GradeAttemptResponse,
} from "@/types/admin-test.types.ts";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Tự động đính kèm token nếu lưu trong localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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

  // Lấy thống kê số liệu chi tiết cho giáo viên
  getStats: async (id: string): Promise<TestStatsResponse> => {
    const { data } = await api.get<TestStatsResponse>(`/tests/${id}/stats`);
    return data;
  },

  // Lấy danh sách bài làm của học sinh cho 1 bài test (cho giáo viên)
  getAttempts: async (
    testId: string,
    params?: { status?: string; search?: string }
  ): Promise<TestAttemptsResponse> => {
    const { data } = await api.get<TestAttemptsResponse>(`/tests/${testId}/attempts`, { params });
    return data;
  },

  // Lấy chi tiết bài làm cụ thể để chấm điểm
  getAttemptDetail: async (attemptId: string): Promise<AttemptDetailResponse> => {
    const { data } = await api.get<AttemptDetailResponse>(`/tests/attempts/${attemptId}`);
    return data;
  },

  // Chấm điểm bài tự luận và tổng kết điểm
  gradeAttempt: async (
    attemptId: string,
    payload: GradeAttemptPayload
  ): Promise<GradeAttemptResponse> => {
    const { data } = await api.post<GradeAttemptResponse>(
      `/tests/attempts/${attemptId}/grade`,
      payload
    );
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



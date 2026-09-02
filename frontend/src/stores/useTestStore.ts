import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { testService } from "@/services/testService.tsx";
import type {
  CreateTestPayload,
  UpdateTestPayload,
  TestListQueryParams,
} from "@/types/admin-test.types.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Query Keys
// ─────────────────────────────────────────────────────────────────────────────
export const testKeys = {
  all: ["tests"] as const,
  lists: () => [...testKeys.all, "list"] as const,
  list: (params: TestListQueryParams) => [...testKeys.lists(), params] as const,
  details: () => [...testKeys.all, "detail"] as const,
  detail: (id: string) => [...testKeys.details(), id] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// Hooks (TanStack Query)
// ─────────────────────────────────────────────────────────────────────────────

/** Lấy danh sách bài test (có phân trang, tìm kiếm, lọc) */
export const useTests = (params: TestListQueryParams = {}) => {
  return useQuery({
    queryKey: testKeys.list(params),
    queryFn: () => testService.getAll(params),
    staleTime: 30_000,
  });
};

/** Lấy chi tiết 1 bài test */
export const useTestById = (id: string) => {
  return useQuery({
    queryKey: testKeys.detail(id),
    queryFn: () => testService.getById(id),
    enabled: !!id,
    staleTime: 30_000,
  });
};

/** Tạo bài test mới */
export const useCreateTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTestPayload) => testService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testKeys.lists() });
    },
  });
};

/** Cập nhật bài test */
export const useUpdateTest = (id?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: UpdateTestPayload | { id: string; payload: UpdateTestPayload }) => {
      if ("id" in variables && "payload" in variables) {
        return testService.update(variables.id, variables.payload);
      }
      if (!id) throw new Error("Test ID is required for update");
      return testService.update(id, variables as UpdateTestPayload);
    },
    onSuccess: (_, variables) => {
      const targetId = "id" in variables ? variables.id : id;
      queryClient.invalidateQueries({ queryKey: testKeys.lists() });
      if (targetId) {
        queryClient.invalidateQueries({ queryKey: testKeys.detail(targetId) });
      }
    },
  });
};

/** Xóa bài test */
export const useDeleteTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => testService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testKeys.lists() });
    },
  });
};

/** Bật / tắt xuất bản bài test */
export const useTogglePublishTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => testService.togglePublish(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: testKeys.lists() });
      queryClient.invalidateQueries({ queryKey: testKeys.detail(id) });
    },
  });
};

/** Lấy đề thi cho học sinh làm bài */
export const useTestForTaking = (id: string) => {
  return useQuery({
    queryKey: [...testKeys.detail(id), "take"],
    queryFn: () => testService.getForTaking(id),
    enabled: !!id,
    staleTime: 60_000,
  });
};

/** Nộp bài thi và lưu vào Database */
export const useSubmitTestAttempt = (testId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      testId?: string;
      userId?: string;
      answers: { questionId: string; answerText: string }[];
    }) => {
      const id = variables.testId || testId;
      if (!id) throw new Error("Test ID is required to submit attempt");
      return testService.submitAttempt(id, {
        userId: variables.userId,
        answers: variables.answers,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testKeys.lists() });
    },
  });
};

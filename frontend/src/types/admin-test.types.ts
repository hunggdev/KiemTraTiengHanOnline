import type {
  TestDTO,
  TestSectionDTO,
  QuestionDTO,
  OptionDTO,
} from "./test.types.ts";

// ──────────────────────────────────────────────
// Admin: payload để tạo / cập nhật bài test
// ──────────────────────────────────────────────

export interface CreateOptionPayload {
  label: string; // A, B, C, D
  content: string;
}

export interface CreateQuestionPayload {
  type: "MULTIPLE_CHOICE" | "ESSAY" | "AUDIO_RESPONSE";
  order?: number;
  content: string;
  audioUrl?: string | null;
  imageUrl?: string | null;
  correctAnswer?: string | null;
  score?: number;
  options?: CreateOptionPayload[];
}

export interface CreateSectionPayload {
  skill: "LISTENING" | "SPEAKING" | "READING" | "WRITING";
  order?: number;
  durationMin?: number | null;
  questions?: CreateQuestionPayload[];
}

export interface CreateTestPayload {
  title: string;
  description?: string | null;
  durationMin: number;
  createdBy?: string;
  isPublished?: boolean;
  sections?: CreateSectionPayload[];
}

export interface UpdateTestPayload {
  title?: string;
  description?: string | null;
  durationMin?: number;
  isPublished?: boolean;
  sections?: CreateSectionPayload[];
}

// ──────────────────────────────────────────────
// Danh sách bài test (GET /api/tests)
// ──────────────────────────────────────────────

export interface TestListItemDTO {
  id: number | string;
  title: string;
  description?: string | null;
  durationMin: number;
  createdBy: string;
  createdAt: string;
  isPublished: boolean;
  _count: {
    sections: number;
    assignments: number;
    attempts: number;
  };
}

export interface TestListResponse {
  success: boolean;
  data: TestListItemDTO[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TestDetailResponse {
  success: boolean;
  data: TestDTO & {
    sections: (TestSectionDTO & {
      questions: (QuestionDTO & { options: OptionDTO[] })[];
    })[];
  };
}

export interface TestMutationResponse {
  success: boolean;
  message: string;
  data: TestListItemDTO;
}

export interface TestListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isPublished?: boolean;
  createdBy?: string;
}

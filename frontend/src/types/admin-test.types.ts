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

// ──────────────────────────────────────────────
// Thống kê bài test (GET /api/tests/:id/stats)
// ──────────────────────────────────────────────

export interface ScoreDistributionBucket {
  key: string;
  range: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface SkillStatDTO {
  sectionId: number | string;
  skill: "LISTENING" | "SPEAKING" | "READING" | "WRITING";
  order: number;
  questionCount: number;
  maxScore: number;
  accuracyRate: number;
  totalAnswers: number;
  correctAnswers: number;
}

export interface ParticipantStatDTO {
  userId: number | string;
  fullName: string;
  username: string;
  className: string;
  highestScore: number;
  scoreOn10: number;
  percentage: number;
  isPassed: boolean;
  grade: "Xuất sắc" | "Giỏi" | "Khá" | "Trung bình" | "Yếu" | "Kém";
  attemptsCount: number;
  submittedAt: string;
  attemptId: number | string;
  rank: number;
}

export interface TestStatsData {
  test: {
    id: number | string;
    title: string;
    description?: string | null;
    durationMin: number;
    isPublished: boolean;
    createdAt: string;
    maxScore: number;
    totalQuestions: number;
    sectionsCount: number;
  };
  summary: {
    totalParticipants: number;
    totalAttemptsCount: number;
    averageScore: number;
    averageScoreOn10: number;
    highestScore: number;
    lowestScore: number;
    passCount: number;
    failCount: number;
    passRate: number;
    excellenceCount: number;
    excellenceRate: number;
  };
  distribution: ScoreDistributionBucket[];
  skillStats: SkillStatDTO[];
  participants: ParticipantStatDTO[];
}

export interface TestStatsResponse {
  success: boolean;
  data: TestStatsData;
}

// ──────────────────────────────────────────────
// Danh sách bài làm & Chấm điểm tự luận
// ──────────────────────────────────────────────

export interface AttemptListItemDTO {
  id: number | string;
  userId: number | string;
  fullName: string;
  username: string;
  className: string;
  submittedAt: string;
  status: "IN_PROGRESS" | "SUBMITTED" | "GRADED" | "EXPIRED";
  totalScore: number;
  scoreOn10: number;
  maxScore: number;
  multipleChoiceScore: number;
  essayScore: number;
  essayQuestionsCount: number;
  gradedEssayCount: number;
  needsGrading: boolean;
}

export interface TestAttemptsData {
  test: {
    id: number | string;
    title: string;
    maxScore: number;
    totalQuestions: number;
    hasEssay: boolean;
    essayCount: number;
  };
  summary: {
    totalAttempts: number;
    pendingGradingCount: number;
    gradedCount: number;
  };
  attempts: AttemptListItemDTO[];
}

export interface TestAttemptsResponse {
  success: boolean;
  data: TestAttemptsData;
}

export interface AttemptQuestionResponseDTO {
  id: number | string;
  answerText: string | null;
  audioUrl: string | null;
  isCorrect: boolean | null;
  scoreGiven: number | null;
  gradedBy: string | null;
  gradedAt: string | null;
}

export interface AttemptQuestionDTO {
  id: number | string;
  order: number;
  type: "MULTIPLE_CHOICE" | "ESSAY" | "AUDIO_RESPONSE";
  content: string;
  audioUrl?: string | null;
  imageUrl?: string | null;
  correctAnswer?: string | null;
  score: number;
  options?: OptionDTO[];
  response: AttemptQuestionResponseDTO | null;
}

export interface AttemptSectionDTO {
  id: number | string;
  skill: "LISTENING" | "SPEAKING" | "READING" | "WRITING";
  order: number;
  durationMin?: number | null;
  questions: AttemptQuestionDTO[];
}

export interface AttemptDetailDTO {
  attemptId: number | string;
  status: string;
  startedAt: string;
  submittedAt: string;
  totalScore: number;
  maxScore: number;
  scoreOn10: number;
  autoMcScore: number;
  manualEssayScore: number;
  totalQuestions: number;
  essayQuestionsCount: number;
  gradedEssayCount: number;
  needsGrading: boolean;
  user: {
    id: number | string;
    fullName: string;
    username: string;
    className: string;
  };
  test: {
    id: number | string;
    title: string;
    description?: string | null;
    durationMin: number;
  };
  sections: AttemptSectionDTO[];
}

export interface AttemptDetailResponse {
  success: boolean;
  data: AttemptDetailDTO;
}

export interface GradeItemPayload {
  questionId: number | string;
  scoreGiven: number;
}

export interface GradeAttemptPayload {
  grades: GradeItemPayload[];
}

export interface GradeAttemptResponse {
  success: boolean;
  message: string;
  data: {
    attemptId: number | string;
    totalScore: number;
    maxScore: number;
    scoreOn10: number;
    status: string;
  };
}


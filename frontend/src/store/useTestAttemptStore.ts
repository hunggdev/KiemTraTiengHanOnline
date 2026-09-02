import { create } from "zustand";
import { testAttemptService } from "@/services/testAttempt.service";
import type {
  TestDTO,
  TestAttemptDTO,
  QuestionDTO,
  TestSectionDTO,
  ResponseDTO,
  SaveStatus,
} from "@/types/test.types";

interface TestAttemptState {
  test: TestDTO | null;
  attempt: TestAttemptDTO | null;
  currentSectionIndex: number;
  currentQuestionIndex: number;
  /** questionId -> optionId đã chọn */
  answers: Record<string, string>;
  /** questionId -> trạng thái lưu (hiển thị "Đang lưu...", "Đã lưu"...) */
  saveStatus: Record<string, SaveStatus>;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  loadTest: (testId: string) => Promise<void>;
  resumeAttempt: (attemptId: string) => Promise<void>;
  selectAnswer: (questionId: string, optionId: string) => Promise<void>;
  retrySave: (questionId: string) => Promise<void>;
  goToQuestion: (sectionIndex: number, questionIndex: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  submitAttempt: () => Promise<void>;

  getCurrentQuestion: () => QuestionDTO | null;
  getAnsweredCount: () => number;
  getTotalQuestionCount: () => number;
}

function buildAnswersMap(attempt: TestAttemptDTO): Record<string, string> {
  const answers: Record<string, string> = {};
  attempt.responses.forEach((response: ResponseDTO) => {
    if (response.answerText) {
      answers[response.questionId] = response.answerText;
    }
  });
  return answers;
}

export const useTestAttemptStore = create<TestAttemptState>((set, get) => ({
  test: null,
  attempt: null,
  currentSectionIndex: 0,
  currentQuestionIndex: 0,
  answers: {},
  saveStatus: {},
  isLoading: false,
  isSubmitting: false,
  error: null,

  loadTest: async (testId: string) => {
    set({ isLoading: true, error: null });
    try {
      const [test, attempt] = await Promise.all([
        testAttemptService.getTest(testId),
        testAttemptService.startAttempt(testId),
      ]);
      set({ test, attempt, answers: buildAnswersMap(attempt), isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Không thể tải đề thi",
        isLoading: false,
      });
    }
  },

  resumeAttempt: async (attemptId: string) => {
    set({ isLoading: true, error: null });
    try {
      const attempt = await testAttemptService.getAttempt(attemptId);
      const test = await testAttemptService.getTest(attempt.testId);
      set({ test, attempt, answers: buildAnswersMap(attempt), isLoading: false });
    } catch (err) {
      set({
        error:
          err instanceof Error ? err.message : "Không thể khôi phục bài làm",
        isLoading: false,
      });
    }
  },

  selectAnswer: async (questionId: string, optionId: string) => {
    const { attempt } = get();
    if (!attempt) return;

    // Optimistic update: hiển thị lựa chọn ngay, không đợi server phản hồi
    set((state) => ({
      answers: { ...state.answers, [questionId]: optionId },
      saveStatus: { ...state.saveStatus, [questionId]: "saving" },
    }));

    try {
      await testAttemptService.saveMultipleChoiceAnswer({
        attemptId: attempt.id,
        questionId,
        optionId,
      });
      set((state) => ({
        saveStatus: { ...state.saveStatus, [questionId]: "saved" },
      }));
    } catch {
      set((state) => ({
        saveStatus: { ...state.saveStatus, [questionId]: "error" },
      }));
    }
  },

  retrySave: async (questionId: string) => {
    const optionId = get().answers[questionId];
    if (!optionId) return;
    await get().selectAnswer(questionId, optionId);
  },

  goToQuestion: (sectionIndex: number, questionIndex: number) => {
    set({
      currentSectionIndex: sectionIndex,
      currentQuestionIndex: questionIndex,
    });
  },

  nextQuestion: () => {
    const { test, currentSectionIndex, currentQuestionIndex } = get();
    if (!test) return;
    const section = test.sections[currentSectionIndex];
    if (!section) return;

    if (currentQuestionIndex < section.questions.length - 1) {
      set({ currentQuestionIndex: currentQuestionIndex + 1 });
    } else if (currentSectionIndex < test.sections.length - 1) {
      set({
        currentSectionIndex: currentSectionIndex + 1,
        currentQuestionIndex: 0,
      });
    }
  },

  prevQuestion: () => {
    const { test, currentSectionIndex, currentQuestionIndex } = get();
    if (!test) return;

    if (currentQuestionIndex > 0) {
      set({ currentQuestionIndex: currentQuestionIndex - 1 });
    } else if (currentSectionIndex > 0) {
      const prevSection = test.sections[currentSectionIndex - 1];
      set({
        currentSectionIndex: currentSectionIndex - 1,
        currentQuestionIndex: prevSection.questions.length - 1,
      });
    }
  },

  submitAttempt: async () => {
    const { attempt, isSubmitting } = get();
    if (!attempt || isSubmitting) return;

    set({ isSubmitting: true, error: null });
    try {
      const result = await testAttemptService.submitAttempt(attempt.id);
      set({ attempt: result.attempt, isSubmitting: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Không thể nộp bài",
        isSubmitting: false,
      });
    }
  },

  getCurrentQuestion: () => {
    const { test, currentSectionIndex, currentQuestionIndex } = get();
    const section = test?.sections[currentSectionIndex];
    return section?.questions[currentQuestionIndex] ?? null;
  },

  getAnsweredCount: () => Object.keys(get().answers).length,

  getTotalQuestionCount: () => {
    const { test } = get();
    if (!test) return 0;
    return test.sections.reduce((sum: number, s: TestSectionDTO) => sum + s.questions.length, 0);
  },
}));

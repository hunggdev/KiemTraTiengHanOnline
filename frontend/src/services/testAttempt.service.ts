import { apiClient } from "@/lib/api-client";
import type {
  TestDTO,
  TestAttemptDTO,
  SaveMultipleChoiceAnswerPayload,
  SubmitAttemptResult,
} from "@/types/test.types";

export const testAttemptService = {
  /** Lấy đề thi (câu hỏi + option, KHÔNG có đáp án đúng) */
  async getTest(testId: string): Promise<TestDTO> {
    const { data } = await apiClient.get<TestDTO>(`/tests/${testId}`);
    return data;
  },

  /**
   * Bắt đầu làm bài. Nếu học viên đã có attempt IN_PROGRESS cho đề này,
   * backend trả về attempt cũ (kèm các response đã lưu) thay vì tạo mới.
   */
  async startAttempt(testId: string): Promise<TestAttemptDTO> {
    const { data } = await apiClient.post<TestAttemptDTO>("/attempts/start", {
      testId,
    });
    return data;
  },

  /** Lấy lại trạng thái một attempt đang làm dở */
  async getAttempt(attemptId: string): Promise<TestAttemptDTO> {
    const { data } = await apiClient.get<TestAttemptDTO>(
      `/attempts/${attemptId}`
    );
    return data;
  },

  /** Autosave câu trả lời trắc nghiệm ngay khi học viên chọn */
  async saveMultipleChoiceAnswer(
    payload: SaveMultipleChoiceAnswerPayload
  ): Promise<void> {
    await apiClient.post(`/attempts/${payload.attemptId}/responses`, {
      questionId: payload.questionId,
      answerText: payload.optionId,
    });
  },

  /**
   * Nộp bài. Backend tự chấm điểm trắc nghiệm dựa trên correctAnswer trong DB.
   */
  async submitAttempt(attemptId: string): Promise<SubmitAttemptResult> {
    const { data } = await apiClient.post<SubmitAttemptResult>(
      `/attempts/${attemptId}/submit`
    );
    return data;
  },
};

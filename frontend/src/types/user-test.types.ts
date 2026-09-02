import type { SkillType, QuestionType } from "./test.types.ts";

export interface StudentQuestionOption {
  id: number | string;
  label: string;
  content: string;
}

export interface StudentQuestion {
  id: number | string;
  type: QuestionType;
  order: number;
  content: string;
  audioUrl?: string | null;
  imageUrl?: string | null;
  score: number;
  options: StudentQuestionOption[];
}

export interface StudentSection {
  id: number | string;
  skill: SkillType;
  order: number;
  durationMin?: number | null;
  questions: StudentQuestion[];
}

export interface StudentTestTakingDTO {
  id: number | string;
  title: string;
  description?: string | null;
  durationMin: number;
  sections: StudentSection[];
}

export interface SubmitAnswerItem {
  questionId: number | string;
  answerText: string;
}

export interface SubmitTestPayload {
  userId?: number | string;
  answers: SubmitAnswerItem[];
}

export interface QuestionReviewItem {
  questionId: number | string;
  content: string;
  type: QuestionType;
  score: number;
  userAnswer: string | null;
  correctAnswer?: string | null;
  isCorrect?: boolean | null;
  scoreGiven?: number | null;
  options: StudentQuestionOption[];
}

export interface TestResultDTO {
  attemptId: number | string;
  testId: number | string;
  testTitle: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  correctCount: number;
  totalQuestions: number;
  submittedAt: string;
  questionReview: QuestionReviewItem[];
}

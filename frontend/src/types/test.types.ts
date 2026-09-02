export type SkillType = "LISTENING" | "SPEAKING" | "READING" | "WRITING";

export type QuestionType = "MULTIPLE_CHOICE" | "ESSAY" | "AUDIO_RESPONSE";

export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "GRADED" | "EXPIRED";

export interface OptionDTO {
  id: number | string;
  label: string; // A, B, C, D
  content: string;
}

export interface QuestionDTO {
  id: number | string;
  sectionId: number | string;
  type: QuestionType;
  order: number;
  content: string;
  audioUrl?: string | null;
  imageUrl?: string | null;
  options: OptionDTO[];
  score: number;
}

export interface TestSectionDTO {
  id: number | string;
  testId: number | string;
  skill: SkillType;
  order: number;
  durationMin?: number | null;
  questions: QuestionDTO[];
}

export interface TestDTO {
  id: number | string;
  title: string;
  description?: string | null;
  durationMin: number;
  sections: TestSectionDTO[];
}

export interface ResponseDTO {
  id: number | string;
  attemptId: number | string;
  questionId: number | string;
  answerText?: string | null;
  audioUrl?: string | null;
  isCorrect?: boolean | null;
  scoreGiven?: number | null;
  updatedAt: string;
}

export interface TestAttemptDTO {
  id: number | string;
  userId: number | string;
  testId: number | string;
  startedAt: string;
  submittedAt?: string | null;
  status: AttemptStatus;
  totalScore?: number | null;
  deadline: string;
  responses: ResponseDTO[];
}

export interface SaveMultipleChoiceAnswerPayload {
  attemptId: number | string;
  questionId: number | string;
  optionId: number | string;
}

export interface SubmitAttemptResult {
  attempt: TestAttemptDTO;
  totalScore: number;
  correctCount: number;
  totalQuestions: number;
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";

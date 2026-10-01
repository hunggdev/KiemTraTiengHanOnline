export type DeckType = "VOCABULARY" | "SENTENCE" | "GRAMMAR";

export type FrontLanguage = "korean" | "vietnamese" | "english" | "japanese";

export type StudyMode = "flashcard" | "typing" | "match" | "quiz";

export type SRSRating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export interface FlashcardItem {
  id: string | number;
  deckId?: string | number;
  korean?: string;
  vietnamese: string;
  english?: string;
  japanese?: string; // giữ tương thích ngược
  hanja?: string;
  romaji?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  notes?: string;
  order?: number;
  mastered: boolean;
  // Các thông số SRS SuperMemo SM-2
  state?: "NEW" | "LEARNING" | "REVIEW" | "MASTERED";
  interval?: number; // Số ngày giãn cách
  repetition?: number; // Số lần nhớ liên tiếp
  easeFactor?: number; // Hệ số dễ (2.5)
  nextReviewDate?: string | null;
  lastReviewedAt?: string | null;
  isDue?: boolean;
}

export interface FlashcardDeck {
  id: string | number;
  title: string;
  description?: string;
  type: DeckType;
  language?: string;
  isPublic?: boolean;
  createdBy?: number | null;
  creator?: {
    id: number;
    fullName: string;
    username: string;
    role: string;
  };
  cards: FlashcardItem[];
  createdAt: string;
  updatedAt: string;
  // Thống kê nhanh từ backend
  totalCards?: number;
  masteredCount?: number;
  learningCount?: number;
  dueCount?: number;
}

export interface ColumnMappingConfig {
  koreanColIndex?: number;
  vietnameseColIndex: number;
  englishColIndex?: number;
  japaneseColIndex?: number;
  romajiColIndex?: number;
  hanjaColIndex?: number;
  exampleColIndex?: number;
}

export interface ParsedTableData {
  headers: string[];
  rows: string[][];
  hasHeader: boolean;
  fileName: string;
}

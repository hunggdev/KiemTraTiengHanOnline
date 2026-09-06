export type DeckType = "VOCABULARY" | "SENTENCE";

export type FrontLanguage = "vietnamese" | "english" | "japanese";

export interface FlashcardItem {
  id: string;
  vietnamese: string;
  english: string;
  japanese: string;
  romaji?: string;
  notes?: string;
  mastered: boolean;
  lastReviewedAt?: string;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  description?: string;
  type: DeckType;
  cards: FlashcardItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ColumnMappingConfig {
  vietnameseColIndex: number;
  englishColIndex: number;
  japaneseColIndex: number;
  romajiColIndex?: number;
}

export interface ParsedTableData {
  headers: string[];
  rows: string[][];
  hasHeader: boolean;
  fileName: string;
}

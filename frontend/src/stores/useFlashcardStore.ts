import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FlashcardDeck, FlashcardItem, DeckType } from "@/types/flashcard.types.ts";

interface FlashcardStoreState {
  decks: FlashcardDeck[];
  activeDeckId: string | null;

  // Actions
  setActiveDeckId: (id: string | null) => void;
  addDeck: (deck: Omit<FlashcardDeck, "id" | "createdAt" | "updatedAt">) => FlashcardDeck;
  updateDeck: (id: string, partial: Partial<FlashcardDeck>) => void;
  deleteDeck: (id: string) => void;
  toggleCardMastered: (deckId: string, cardId: string) => void;
  markAllCards: (deckId: string, mastered: boolean) => void;
  resetDeckProgress: (deckId: string) => void;
  loadSampleDecksIfEmpty: () => void;
  importPreloadedSamples: () => void;
}

const SAMPLE_DECKS: FlashcardDeck[] = [
  {
    id: "sample-vocab-n5",
    title: "Từ vựng N5 thông dụng (VI - EN - JA - Romaji)",
    description: "Bộ thẻ từ vựng chào hỏi, đồ vật, số đếm và sinh hoạt cơ bản",
    type: "VOCABULARY",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cards: [
      {
        id: "v-1",
        vietnamese: "Xin chào (buổi sáng)",
        english: "Good morning",
        japanese: "おはようございます",
        romaji: "Ohayou gozaimasu",
        mastered: false,
      },
      {
        id: "v-2",
        vietnamese: "Xin chào (ban ngày)",
        english: "Hello / Good afternoon",
        japanese: "こんにちは",
        romaji: "Konnichiwa",
        mastered: false,
      },
      {
        id: "v-3",
        vietnamese: "Xin cảm ơn rất nhiều",
        english: "Thank you very much",
        japanese: "ありがとうございます",
        romaji: "Arigatou gozaimasu",
        mastered: true,
      },
      {
        id: "v-4",
        vietnamese: "Tạm biệt",
        english: "Goodbye",
        japanese: "さようなら",
        romaji: "Sayounara",
        mastered: false,
      },
      {
        id: "v-5",
        vietnamese: "Học sinh / Sinh viên",
        english: "Student",
        japanese: "学生 (がくせい)",
        romaji: "Gakusei",
        mastered: false,
      },
      {
        id: "v-6",
        vietnamese: "Giáo viên / Thầy cô",
        english: "Teacher",
        japanese: "先生 (せんせい)",
        romaji: "Sensei",
        mastered: true,
      },
      {
        id: "v-7",
        vietnamese: "Nước uống",
        english: "Water",
        japanese: "水 (みず)",
        romaji: "Mizu",
        mastered: false,
      },
      {
        id: "v-8",
        vietnamese: "Sách",
        english: "Book",
        japanese: "本 (ほん)",
        romaji: "Hon",
        mastered: false,
      },
      {
        id: "v-9",
        vietnamese: "Bạn bè",
        english: "Friend",
        japanese: "友達 (ともだち)",
        romaji: "Tomodachi",
        mastered: false,
      },
      {
        id: "v-10",
        vietnamese: "Hôm nay",
        english: "Today",
        japanese: "今日 (きょう)",
        romaji: "Kyou",
        mastered: false,
      },
    ],
  },
  {
    id: "sample-sentences-daily",
    title: "Mẫu câu giao tiếp hàng ngày (VI - EN - JA)",
    description: "Các mẫu câu phổ biến khi đi du lịch, hỏi đường và mua sắm",
    type: "SENTENCE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cards: [
      {
        id: "s-1",
        vietnamese: "Cái này giá bao nhiêu tiền vậy ạ?",
        english: "How much is this?",
        japanese: "これはいくらですか？",
        romaji: "Kore wa ikura desu ka?",
        mastered: false,
      },
      {
        id: "s-2",
        vietnamese: "Cho tôi xin một ly nước.",
        english: "Please give me some water.",
        japanese: "お水をください。",
        romaji: "Omizu o kudasai.",
        mastered: false,
      },
      {
        id: "s-3",
        vietnamese: "Nhà vệ sinh ở đâu vậy ạ?",
        english: "Where is the restroom?",
        japanese: "トイレはどこですか？",
        romaji: "Toire wa doko desu ka?",
        mastered: true,
      },
      {
        id: "s-4",
        vietnamese: "Rất vui được gặp bạn!",
        english: "Nice to meet you!",
        japanese: "はじめまして、よろしくお願いします。",
        romaji: "Hajimemashite, yoroshiku onegaishimasu.",
        mastered: false,
      },
      {
        id: "s-5",
        vietnamese: "Bạn có nói được tiếng Anh không?",
        english: "Do you speak English?",
        japanese: "英語を話せますか？",
        romaji: "Eigo o hanasemasu ka?",
        mastered: false,
      },
      {
        id: "s-6",
        vietnamese: "Tôi không hiểu, xin hãy nói lại một lần nữa.",
        english: "I don't understand, please say it again.",
        japanese: "分かりません、もう一度言ってください。",
        romaji: "Wakarimasen, mou ichido itte kudasai.",
        mastered: false,
      },
    ],
  },
];

export const useFlashcardStore = create<FlashcardStoreState>()(
  persist(
    (set, get) => ({
      decks: SAMPLE_DECKS,
      activeDeckId: null,

      setActiveDeckId: (id) => set({ activeDeckId: id }),

      addDeck: (deckData) => {
        const newDeck: FlashcardDeck = {
          ...deckData,
          id: `deck-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          decks: [newDeck, ...state.decks],
          activeDeckId: newDeck.id,
        }));

        return newDeck;
      },

      updateDeck: (id, partial) => {
        set((state) => ({
          decks: state.decks.map((d) =>
            d.id === id ? { ...d, ...partial, updatedAt: new Date().toISOString() } : d
          ),
        }));
      },

      deleteDeck: (id) => {
        set((state) => ({
          decks: state.decks.filter((d) => d.id !== id),
          activeDeckId: state.activeDeckId === id ? null : state.activeDeckId,
        }));
      },

      toggleCardMastered: (deckId, cardId) => {
        set((state) => ({
          decks: state.decks.map((d) => {
            if (d.id !== deckId) return d;
            return {
              ...d,
              updatedAt: new Date().toISOString(),
              cards: d.cards.map((c) =>
                c.id === cardId
                  ? {
                      ...c,
                      mastered: !c.mastered,
                      lastReviewedAt: new Date().toISOString(),
                    }
                  : c
              ),
            };
          }),
        }));
      },

      markAllCards: (deckId, mastered) => {
        set((state) => ({
          decks: state.decks.map((d) => {
            if (d.id !== deckId) return d;
            return {
              ...d,
              updatedAt: new Date().toISOString(),
              cards: d.cards.map((c) => ({
                ...c,
                mastered,
                lastReviewedAt: new Date().toISOString(),
              })),
            };
          }),
        }));
      },

      resetDeckProgress: (deckId) => {
        set((state) => ({
          decks: state.decks.map((d) => {
            if (d.id !== deckId) return d;
            return {
              ...d,
              updatedAt: new Date().toISOString(),
              cards: d.cards.map((c) => ({
                ...c,
                mastered: false,
              })),
            };
          }),
        }));
      },

      loadSampleDecksIfEmpty: () => {
        const { decks } = get();
        if (!decks || decks.length === 0) {
          set({ decks: SAMPLE_DECKS });
        }
      },

      importPreloadedSamples: () => {
        set((state) => {
          const existingIds = new Set(state.decks.map((d) => d.id));
          const toAdd = SAMPLE_DECKS.filter((d) => !existingIds.has(d.id));
          return {
            decks: [...toAdd, ...state.decks],
          };
        });
      },
    }),
    {
      name: "flashcards_decks_storage_v1",
    }
  )
);

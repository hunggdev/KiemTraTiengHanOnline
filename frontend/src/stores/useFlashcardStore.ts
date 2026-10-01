import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  FlashcardDeck,
  FlashcardItem,
  DeckType,
  SRSRating,
} from "@/types/flashcard.types.ts";
import { flashcardService } from "@/services/flashcardService.ts";

interface FlashcardStoreState {
  decks: FlashcardDeck[];
  activeDeckId: string | number | null;
  isLoading: boolean;
  isSyncing: boolean;

  // Actions
  setActiveDeckId: (id: string | number | null) => void;
  fetchCloudDecks: () => Promise<void>;
  fetchDeckDetail: (deckId: string | number) => Promise<FlashcardDeck | null>;
  syncLocalToCloud: () => Promise<void>;
  addDeck: (
    deck: Omit<FlashcardDeck, "id" | "createdAt" | "updatedAt">,
  ) => Promise<FlashcardDeck>;
  updateDeck: (id: string | number, partial: Partial<FlashcardDeck>) => Promise<void>;
  deleteDeck: (id: string | number) => Promise<void>;
  addCard: (deckId: string | number, card: Partial<FlashcardItem>) => Promise<FlashcardItem | null>;
  deleteCard: (deckId: string | number, cardId: string | number) => Promise<void>;
  reviewCardSRS: (cardId: string | number, rating: SRSRating, deckId?: string | number) => Promise<void>;
  toggleCardMastered: (deckId: string | number, cardId: string | number) => void;
  markAllCards: (deckId: string | number, mastered: boolean) => void;
  resetDeckProgress: (deckId: string | number) => void;
  loadSampleDecksIfEmpty: () => void;
  importPreloadedSamples: () => void;
}

const SAMPLE_DECKS: FlashcardDeck[] = [
  {
    id: "sample-kr-food",
    title: "Từ vựng Tiếng Hàn Sơ Cấp - Ẩm thực & Nhà hàng (TOPIK I)",
    description: "Bộ thẻ 20 từ vựng và câu ví dụ phổ biến nhất về đồ ăn, vị giác và giao tiếp trong nhà hàng Hàn Quốc",
    type: "VOCABULARY",
    language: "ko",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cards: [
      {
        id: "kr-1",
        korean: "음식",
        vietnamese: "Thức ăn, món ăn",
        romaji: "eumsik",
        exampleSentence: "한국 음식이 맛있어요.",
        exampleTranslation: "Món ăn Hàn Quốc rất ngon.",
        mastered: false,
        state: "NEW",
        interval: 0,
        repetition: 0,
        easeFactor: 2.5,
      },
      {
        id: "kr-2",
        korean: "요리하다",
        vietnamese: "Nấu ăn",
        romaji: "yorihada",
        exampleSentence: "주말에 요리해요.",
        exampleTranslation: "Tôi nấu ăn vào cuối tuần.",
        mastered: false,
        state: "NEW",
        interval: 0,
        repetition: 0,
        easeFactor: 2.5,
      },
      {
        id: "kr-3",
        korean: "밥",
        vietnamese: "Cơm, bữa cơm",
        romaji: "bap",
        exampleSentence: "밥을 먹었어요?",
        exampleTranslation: "Bạn đã ăn cơm chưa?",
        mastered: true,
        state: "REVIEW",
        interval: 3,
        repetition: 2,
        easeFactor: 2.5,
      },
      {
        id: "kr-4",
        korean: "불고기",
        vietnamese: "Thịt nướng Bulgogi",
        romaji: "bulgogi",
        exampleSentence: "불고기를 주문했어요.",
        exampleTranslation: "Tôi đã gọi món thịt nướng Bulgogi.",
        mastered: false,
        state: "LEARNING",
        interval: 1,
        repetition: 1,
        easeFactor: 2.5,
      },
      {
        id: "kr-5",
        korean: "김치찌개",
        vietnamese: "Canh kim chi",
        romaji: "gimchijjigae",
        exampleSentence: "김치찌개가 조금 매워요.",
        exampleTranslation: "Canh kim chi hơi cay một chút.",
        mastered: false,
        state: "NEW",
        interval: 0,
        repetition: 0,
        easeFactor: 2.5,
      },
      {
        id: "kr-6",
        korean: "맛있다",
        vietnamese: "Ngon",
        romaji: "masitta",
        exampleSentence: "이 사과가 정말 맛있어요.",
        exampleTranslation: "Quả táo này thật sự rất ngon.",
        mastered: true,
        state: "MASTERED",
        interval: 21,
        repetition: 4,
        easeFactor: 2.65,
      },
      {
        id: "kr-7",
        korean: "맵다",
        vietnamese: "Cay",
        romaji: "maepda",
        exampleSentence: "떡볶이가 아주 매워요.",
        exampleTranslation: "Bánh gạo cay rất là cay.",
        mastered: false,
        state: "NEW",
        interval: 0,
        repetition: 0,
        easeFactor: 2.5,
      },
      {
        id: "kr-8",
        korean: "주문하다",
        vietnamese: "Gọi món / Đặt món",
        romaji: "jumunhada",
        exampleSentence: "주문하시겠어요?",
        exampleTranslation: "Quý khách muốn gọi món gì ạ?",
        mastered: false,
        state: "LEARNING",
        interval: 1,
        repetition: 1,
        easeFactor: 2.5,
      },
      {
        id: "kr-9",
        korean: "계산하다",
        vietnamese: "Tính tiền / Thanh toán",
        romaji: "gyesanhada",
        exampleSentence: "여기 계산해 주세요.",
        exampleTranslation: "Làm ơn tính tiền ở đây cho tôi.",
        mastered: false,
        state: "NEW",
        interval: 0,
        repetition: 0,
        easeFactor: 2.5,
      },
      {
        id: "kr-10",
        korean: "숟가락",
        vietnamese: "Cái thìa / muỗng",
        romaji: "sutgarak",
        exampleSentence: "숟가락을 떨어뜨렸어요.",
        exampleTranslation: "Tôi lỡ làm rơi cái thìa.",
        mastered: false,
        state: "NEW",
        interval: 0,
        repetition: 0,
        easeFactor: 2.5,
      },
    ],
  },
  {
    id: "sample-kr-daily",
    title: "10 Câu Giao Tiếp Tiếng Hàn Thông Dụng Mỗi Ngày",
    description: "Các mẫu câu chào hỏi, cảm ơn, xin lỗi, hỏi giá cả và nhờ giúp đỡ thiết yếu",
    type: "SENTENCE",
    language: "ko",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cards: [
      {
        id: "kd-1",
        korean: "안녕하세요",
        vietnamese: "Xin chào (lịch sự)",
        romaji: "annyeonghaseyo",
        exampleSentence: "안녕하세요! 만나서 반갑습니다.",
        exampleTranslation: "Xin chào! Rất vui được gặp bạn.",
        mastered: true,
        state: "MASTERED",
        interval: 30,
        repetition: 5,
        easeFactor: 2.8,
      },
      {
        id: "kd-2",
        korean: "감사합니다",
        vietnamese: "Xin cảm ơn",
        romaji: "gamsahamnida",
        exampleSentence: "도와주셔서 감사합니다.",
        exampleTranslation: "Cảm ơn vì đã giúp đỡ tôi.",
        mastered: true,
        state: "MASTERED",
        interval: 30,
        repetition: 5,
        easeFactor: 2.8,
      },
      {
        id: "kd-3",
        korean: "죄송합니다",
        vietnamese: "Xin lỗi (trang trọng)",
        romaji: "joesonghamnida",
        exampleSentence: "늦어서 죄송합니다.",
        exampleTranslation: "Xin lỗi vì tôi đến muộn.",
        mastered: false,
        state: "LEARNING",
        interval: 1,
        repetition: 1,
        easeFactor: 2.5,
      },
      {
        id: "kd-4",
        korean: "괜찮아요",
        vietnamese: "Không sao đâu",
        romaji: "gwaenchanayo",
        exampleSentence: "괜찮아요, 신경 쓰지 마세요.",
        exampleTranslation: "Không sao đâu, đừng bận tâm.",
        mastered: false,
        state: "NEW",
        interval: 0,
        repetition: 0,
        easeFactor: 2.5,
      },
      {
        id: "kd-5",
        korean: "얼마예요?",
        vietnamese: "Bao nhiêu tiền vậy ạ?",
        romaji: "eolmayeyo",
        exampleSentence: "이 가방 얼마예요?",
        exampleTranslation: "Chiếc túi xách này bao nhiêu tiền ạ?",
        mastered: false,
        state: "LEARNING",
        interval: 3,
        repetition: 2,
        easeFactor: 2.5,
      },
    ],
  },
];

export const useFlashcardStore = create<FlashcardStoreState>()(
  persist(
    (set, get) => ({
      decks: SAMPLE_DECKS,
      activeDeckId: null,
      isLoading: false,
      isSyncing: false,

      setActiveDeckId: (id) => set({ activeDeckId: id }),

      // Gọi Backend để tải danh sách Cloud Decks
      fetchCloudDecks: async () => {
        try {
          set({ isLoading: true });
          const cloudDecks = await flashcardService.getAllDecks();

          if (cloudDecks && Array.isArray(cloudDecks) && cloudDecks.length > 0) {
            set((state) => {
              const cloudIds = new Set(cloudDecks.map((d) => String(d.id)));
              // Giữ lại các deck local chưa có trên cloud, luôn đảm bảo mảng cards tồn tại
              const nonCloudDecks = (state.decks || [])
                .filter((d) => !cloudIds.has(String(d.id)))
                .map((d) => ({ ...d, cards: d.cards || [] }));

              const normalizedCloudDecks = cloudDecks.map((d) => ({
                ...d,
                cards: d.cards || [],
              }));

              return {
                decks: [...normalizedCloudDecks, ...nonCloudDecks],
                isLoading: false,
              };
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.warn("Không thể tải deck từ Cloud Backend, sử dụng cache local:", error);
          set({ isLoading: false });
        }
      },

      // Lấy chi tiết bộ thẻ từ Cloud kèm danh sách thẻ đầy đủ
      fetchDeckDetail: async (deckId) => {
        try {
          const detail = await flashcardService.getDeckById(deckId);
          if (detail && detail.id) {
            const normalizedDeck = { ...detail, cards: detail.cards || [] };
            set((state) => {
              const exists = state.decks.some((d) => String(d.id) === String(deckId));
              if (exists) {
                return {
                  decks: state.decks.map((d) =>
                    String(d.id) === String(deckId) ? normalizedDeck : d
                  ),
                };
              }
              return {
                decks: [normalizedDeck, ...state.decks],
              };
            });
            return normalizedDeck;
          }
        } catch (err) {
          console.warn(`Lỗi lấy chi tiết deck ${deckId}:`, err);
        }
        return null;
      },

      // Đồng bộ toàn bộ deck từ localStorage lên Cloud
      syncLocalToCloud: async () => {
        try {
          const { decks } = get();
          set({ isSyncing: true });
          await flashcardService.syncLocalDecks(decks);
          // Sau khi sync, tải lại từ Cloud
          const updated = await flashcardService.getAllDecks();
          if (updated && updated.length > 0) {
            set({ decks: updated, isSyncing: false });
          } else {
            set({ isSyncing: false });
          }
        } catch (error) {
          console.error("Lỗi đồng bộ local lên cloud:", error);
          set({ isSyncing: false });
        }
      },

      addDeck: async (deckData) => {
        const tempId = `local-${Date.now()}`;
        const newDeck: FlashcardDeck = {
          ...deckData,
          id: tempId,
          language: deckData.language || "ko",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          cards: deckData.cards || [],
        };

        // Cập nhật UI ngay lập tức
        set((state) => ({
          decks: [newDeck, ...state.decks],
        }));

        // Gửi lên Backend nếu có kết nối
        try {
          const created = await flashcardService.createDeck(deckData);
          if (created && created.id) {
            set((state) => ({
              decks: state.decks.map((d) => (d.id === tempId ? created : d)),
            }));
            return created;
          }
        } catch (err) {
          console.warn("Lưu deck lên cloud thất bại, đã lưu local:", err);
        }

        return newDeck;
      },

      updateDeck: async (id, partial) => {
        // Optimistic update
        set((state) => ({
          decks: state.decks.map((d) => {
            if (String(d.id) !== String(id)) return d;
            return {
              ...d,
              ...partial,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));

        if (typeof id === "number" || !String(id).startsWith("local-")) {
          try {
            await flashcardService.updateDeck(id, partial);
          } catch (err) {
            console.error("Lỗi cập nhật deck cloud:", err);
          }
        }
      },

      deleteDeck: async (id) => {
        set((state) => ({
          decks: state.decks.filter((d) => String(d.id) !== String(id)),
          activeDeckId: state.activeDeckId === id ? null : state.activeDeckId,
        }));

        if (typeof id === "number" || !String(id).startsWith("local-")) {
          try {
            await flashcardService.deleteDeck(id);
          } catch (err) {
            console.error("Lỗi xóa deck cloud:", err);
          }
        }
      },

      addCard: async (deckId, cardData) => {
        const tempCardId = `card-${Date.now()}`;
        const newCard: FlashcardItem = {
          id: tempCardId,
          deckId,
          korean: cardData.korean || (cardData as any).front || "",
          vietnamese: cardData.vietnamese || (cardData as any).back || "",
          english: cardData.english || "",
          romaji: cardData.romaji || "",
          hanja: cardData.hanja || "",
          exampleSentence: cardData.exampleSentence || "",
          exampleTranslation: cardData.exampleTranslation || "",
          mastered: false,
          state: "NEW",
          interval: 0,
          repetition: 0,
          easeFactor: 2.5,
        };

        // Cập nhật state local
        set((state) => ({
          decks: state.decks.map((d) => {
            if (String(d.id) !== String(deckId)) return d;
            return {
              ...d,
              cards: [...d.cards, newCard],
              totalCards: (d.totalCards || d.cards.length) + 1,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));

        // Gọi Backend
        try {
          const created = await flashcardService.addCard(deckId, cardData);
          if (created && created.id) {
            set((state) => ({
              decks: state.decks.map((d) => {
                if (String(d.id) !== String(deckId)) return d;
                return {
                  ...d,
                  cards: d.cards.map((c) => (c.id === tempCardId ? { ...c, ...created } : c)),
                };
              }),
            }));
            return created;
          }
        } catch (err) {
          console.warn("Lưu card lên cloud thất bại, đã lưu local:", err);
        }

        return newCard;
      },

      deleteCard: async (deckId, cardId) => {
        set((state) => ({
          decks: state.decks.map((d) => {
            if (String(d.id) !== String(deckId)) return d;
            return {
              ...d,
              cards: d.cards.filter((c) => String(c.id) !== String(cardId)),
              totalCards: Math.max(0, (d.totalCards || d.cards.length) - 1),
            };
          }),
        }));

        if (typeof cardId === "number" || !String(cardId).startsWith("card-")) {
          try {
            await flashcardService.deleteCard(cardId);
          } catch (err) {
            console.error("Lỗi xóa card cloud:", err);
          }
        }
      },

      // Đánh giá SRS theo thuật toán SuperMemo SM-2
      reviewCardSRS: async (cardId, rating, deckId) => {
        // Cập nhật tính toán SM-2 ngay lập tức trên UI (Optimistic)
        set((state) => ({
          decks: state.decks.map((d) => {
            if (deckId && String(d.id) !== String(deckId)) return d;
            const hasCard = d.cards.some((c) => String(c.id) === String(cardId));
            if (!hasCard) return d;

            return {
              ...d,
              cards: d.cards.map((c) => {
                if (String(c.id) !== String(cardId)) return c;

                let curInterval = c.interval || 0;
                let curRep = c.repetition || 0;
                let curEF = c.easeFactor || 2.5;
                let newState: "NEW" | "LEARNING" | "REVIEW" | "MASTERED" = "LEARNING";

                if (rating === 1) {
                  curRep = 0;
                  curInterval = 1;
                  curEF = Math.max(1.3, curEF - 0.2);
                  newState = "LEARNING";
                } else if (rating === 2) {
                  curInterval = Math.max(1, Math.round((curInterval || 1) * 1.2));
                  curEF = Math.max(1.3, curEF - 0.15);
                  newState = "LEARNING";
                } else if (rating === 3) {
                  curInterval = curRep === 0 ? 1 : curRep === 1 ? 3 : Math.round(curInterval * curEF);
                  curRep += 1;
                  newState = curInterval >= 21 ? "MASTERED" : "REVIEW";
                } else if (rating === 4) {
                  curInterval = curRep === 0 ? 2 : curRep === 1 ? 5 : Math.round(curInterval * curEF * 1.3);
                  curRep += 1;
                  curEF += 0.15;
                  newState = curInterval >= 14 ? "MASTERED" : "REVIEW";
                }

                const isMastered = newState === "MASTERED";

                return {
                  ...c,
                  interval: curInterval,
                  repetition: curRep,
                  easeFactor: curEF,
                  state: newState,
                  mastered: isMastered,
                  lastReviewedAt: new Date().toISOString(),
                };
              }),
            };
          }),
        }));

        // Gửi lên Backend nếu card ID hợp lệ
        if (typeof cardId === "number" || !String(cardId).startsWith("card-")) {
          try {
            await flashcardService.reviewCardSRS(cardId, rating);
          } catch (err) {
            console.warn("Lưu tiến độ SRS lên cloud thất bại:", err);
          }
        }
      },

      toggleCardMastered: (deckId, cardId) => {
        set((state) => ({
          decks: state.decks.map((d) => {
            if (String(d.id) !== String(deckId)) return d;
            return {
              ...d,
              cards: d.cards.map((c) => {
                if (String(c.id) !== String(cardId)) return c;
                return {
                  ...c,
                  mastered: !c.mastered,
                  state: !c.mastered ? "MASTERED" : "LEARNING",
                  lastReviewedAt: new Date().toISOString(),
                };
              }),
            };
          }),
        }));
      },

      markAllCards: (deckId, mastered) => {
        set((state) => ({
          decks: state.decks.map((d) => {
            if (String(d.id) !== String(deckId)) return d;
            return {
              ...d,
              cards: d.cards.map((c) => ({
                ...c,
                mastered,
                state: mastered ? "MASTERED" : "LEARNING",
                lastReviewedAt: new Date().toISOString(),
              })),
            };
          }),
        }));
      },

      resetDeckProgress: (deckId) => {
        set((state) => ({
          decks: state.decks.map((d) => {
            if (String(d.id) !== String(deckId)) return d;
            return {
              ...d,
              cards: d.cards.map((c) => ({
                ...c,
                mastered: false,
                state: "NEW",
                interval: 0,
                repetition: 0,
                easeFactor: 2.5,
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
          const existingTitles = new Set(state.decks.map((d) => d.title.trim()));
          const toAdd = SAMPLE_DECKS.filter((d) => !existingTitles.has(d.title.trim()));
          return {
            decks: [...toAdd, ...state.decks],
          };
        });
      },
    }),
    {
      name: "flashcards_decks_storage_v1",
    },
  ),
);

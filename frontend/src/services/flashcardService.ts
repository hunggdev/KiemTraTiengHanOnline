import axios from "axios";
import type { FlashcardDeck, FlashcardItem, SRSRating } from "@/types/flashcard.types.ts";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const flashcardService = {
  // Lấy toàn bộ bộ thẻ kèm thống kê SRS của user
  getAllDecks: async (): Promise<FlashcardDeck[]> => {
    const res = await api.get<{ success: boolean; data: FlashcardDeck[] }>("/flashcards/decks");
    return res.data.data;
  },

  // Chi tiết 1 bộ thẻ kèm toàn bộ thẻ và tiến độ
  getDeckById: async (deckId: string | number): Promise<FlashcardDeck> => {
    const res = await api.get<{ success: boolean; data: FlashcardDeck }>(`/flashcards/decks/${deckId}`);
    return res.data.data;
  },

  // Tạo bộ thẻ mới
  createDeck: async (payload: Partial<FlashcardDeck>): Promise<FlashcardDeck> => {
    const res = await api.post<{ success: boolean; data: FlashcardDeck }>("/flashcards/decks", payload);
    return res.data.data;
  },

  // Sửa bộ thẻ
  updateDeck: async (deckId: string | number, payload: Partial<FlashcardDeck>): Promise<FlashcardDeck> => {
    const res = await api.put<{ success: boolean; data: FlashcardDeck }>(`/flashcards/decks/${deckId}`, payload);
    return res.data.data;
  },

  // Xóa bộ thẻ
  deleteDeck: async (deckId: string | number): Promise<boolean> => {
    const res = await api.delete<{ success: boolean }>(`/flashcards/decks/${deckId}`);
    return res.data.success;
  },

  // Thêm thẻ từ vựng vào bộ thẻ (hoặc vào bộ cá nhân nếu deckId = "personal")
  addCard: async (deckId: string | number, card: Partial<FlashcardItem>): Promise<FlashcardItem> => {
    const res = await api.post<{ success: boolean; data: FlashcardItem }>(`/flashcards/decks/${deckId}/cards`, card);
    return res.data.data;
  },

  // Xóa thẻ từ vựng
  deleteCard: async (cardId: string | number): Promise<boolean> => {
    const res = await api.delete<{ success: boolean }>(`/flashcards/cards/${cardId}`);
    return res.data.success;
  },

  // Đánh giá SRS theo thuật toán SuperMemo SM-2
  reviewCardSRS: async (cardId: string | number, rating: SRSRating): Promise<any> => {
    const res = await api.post<{ success: boolean; data: any }>(`/flashcards/cards/${cardId}/review`, { rating });
    return res.data.data;
  },

  // Đồng bộ danh sách bộ thẻ local lên Cloud Database
  syncLocalDecks: async (localDecks: FlashcardDeck[]): Promise<number> => {
    const res = await api.post<{ success: boolean; syncedCount: number }>("/flashcards/sync-local", { localDecks });
    return res.data.syncedCount;
  },
};

import express from "express";
import {
  getAllDecks,
  getDeckById,
  createDeck,
  updateDeck,
  deleteDeck,
  addCardToDeck,
  deleteCard,
  reviewCardSRS,
  syncLocalDecks,
} from "../controllers/flashcardController.js";
import { verifyAuth, optionalAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

// GET  /api/flashcards/decks           - Lấy danh sách bộ thẻ kèm thống kê SRS của user
router.get("/decks", optionalAuth, getAllDecks);

// POST /api/flashcards/decks           - Tạo bộ thẻ mới
router.post("/decks", optionalAuth, createDeck);

// GET  /api/flashcards/decks/:id       - Lấy chi tiết bộ thẻ kèm cards và tiến độ SRS
router.get("/decks/:id", optionalAuth, getDeckById);

// PUT  /api/flashcards/decks/:id       - Cập nhật thông tin bộ thẻ
router.put("/decks/:id", verifyAuth, updateDeck);

// DELETE /api/flashcards/decks/:id     - Xóa bộ thẻ
router.delete("/decks/:id", verifyAuth, deleteDeck);

// POST /api/flashcards/decks/:id/cards - Thêm thẻ từ vựng vào bộ thẻ (hỗ trợ :id = 'personal')
router.post("/decks/:id/cards", optionalAuth, addCardToDeck);

// DELETE /api/flashcards/cards/:cardId - Xóa 1 thẻ từ vựng
router.delete("/cards/:cardId", verifyAuth, deleteCard);

// POST /api/flashcards/cards/:cardId/review - Đánh giá SRS theo thuật toán SM-2 (1: Again, 2: Hard, 3: Good, 4: Easy)
router.post("/cards/:cardId/review", verifyAuth, reviewCardSRS);

// POST /api/flashcards/sync-local      - Đồng bộ bộ thẻ từ LocalStorage lên Cloud DB
router.post("/sync-local", optionalAuth, syncLocalDecks);

export default router;

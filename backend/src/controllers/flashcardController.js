import prisma from "../prisma.js";

/**
 * Tính toán thuật toán SuperMemo SM-2 cho một lần ôn tập thẻ
 * @param {number} currentInterval - Khoảng cách ngày hiện tại
 * @param {number} currentRepetition - Số lần nhớ liên tiếp hiện tại
 * @param {number} currentEaseFactor - Hệ số độ dễ hiện tại (mặc định 2.5)
 * @param {number} rating - Đánh giá của người học: 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
 */
export function calculateSM2(currentInterval = 0, currentRepetition = 0, currentEaseFactor = 2.5, rating = 3) {
  let interval = currentInterval;
  let repetition = currentRepetition;
  let easeFactor = currentEaseFactor;
  let state = "LEARNING";

  if (rating === 1) {
    // Again: Quên từ -> reset lại chu trình học
    repetition = 0;
    interval = 1;
    easeFactor = Math.max(1.3, Number((easeFactor - 0.2).toFixed(2)));
    state = "LEARNING";
  } else if (rating === 2) {
    // Hard: Khó nhớ
    interval = Math.max(1, Math.round((interval || 1) * 1.2));
    easeFactor = Math.max(1.3, Number((easeFactor - 0.15).toFixed(2)));
    state = "LEARNING";
  } else if (rating === 3) {
    // Good: Nhớ chuẩn
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 3;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetition += 1;
    state = interval >= 21 ? "MASTERED" : "REVIEW";
  } else if (rating === 4) {
    // Easy: Rất dễ / Đã thuộc làu
    if (repetition === 0) {
      interval = 2;
    } else if (repetition === 1) {
      interval = 5;
    } else {
      interval = Math.round(interval * easeFactor * 1.3);
    }
    repetition += 1;
    easeFactor = Number((easeFactor + 0.15).toFixed(2));
    state = interval >= 14 ? "MASTERED" : "REVIEW";
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    interval,
    repetition,
    easeFactor,
    state,
    nextReviewDate,
  };
}

/**
 * GET /api/flashcards/decks - Lấy danh sách tất cả các bộ thẻ
 */
export async function getAllDecks(req, res) {
  try {
    const userId = req.user?.id;
    const isTeacher = req.user?.role === "TEACHER";

    // Lấy các bộ thẻ công khai hoặc do chính user tạo
    const decks = await prisma.flashcardDeck.findMany({
      where: isTeacher
        ? {}
        : {
            OR: [
              { isPublic: true },
              ...(userId ? [{ createdBy: userId }] : []),
            ],
          },
      include: {
        creator: {
          select: { id: true, fullName: true, username: true, role: true },
        },
        cards: {
          orderBy: { order: "asc" },
          include: {
            progress: userId
              ? {
                  where: { userId },
                }
              : false,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();

    const formattedDecks = decks.map((deck) => {
      let masteredCount = 0;
      let learningCount = 0;
      let dueCount = 0;

      const formattedCards = (deck.cards || []).map((card) => {
        const prog = card.progress?.[0] || null;
        const isDue = prog ? new Date(prog.nextReviewDate) <= now : true;
        const isMastered = prog?.state === "MASTERED";

        if (isMastered) {
          masteredCount++;
        } else if (prog) {
          learningCount++;
        }

        if (isDue) {
          dueCount++;
        }

        return {
          id: card.id,
          deckId: card.deckId,
          korean: card.korean,
          vietnamese: card.vietnamese,
          english: card.english,
          hanja: card.hanja,
          romaji: card.romaji,
          exampleSentence: card.exampleSentence,
          exampleTranslation: card.exampleTranslation,
          notes: card.notes,
          order: card.order,
          mastered: isMastered,
          state: prog?.state || "NEW",
          interval: prog?.interval || 0,
          repetition: prog?.repetition || 0,
          easeFactor: prog?.easeFactor || 2.5,
          nextReviewDate: prog?.nextReviewDate || null,
          lastReviewedAt: prog?.lastReviewedAt || null,
          isDue,
        };
      });

      return {
        id: deck.id,
        title: deck.title,
        description: deck.description,
        type: deck.type,
        language: deck.language,
        isPublic: deck.isPublic,
        createdBy: deck.createdBy,
        creator: deck.creator,
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt,
        totalCards: formattedCards.length,
        masteredCount,
        learningCount,
        dueCount,
        cards: formattedCards,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedDecks,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách Flashcard Decks:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi lấy danh sách bộ thẻ",
      error: error.message,
    });
  }
}

/**
 * GET /api/flashcards/decks/:id - Chi tiết bộ thẻ kèm toàn bộ cards và tiến độ SRS
 */
export async function getDeckById(req, res) {
  try {
    const deckId = parseInt(req.params.id, 10);
    const userId = req.user?.id;

    if (isNaN(deckId)) {
      return res.status(400).json({ success: false, message: "ID bộ thẻ không hợp lệ" });
    }

    const deck = await prisma.flashcardDeck.findUnique({
      where: { id: deckId },
      include: {
        creator: {
          select: { id: true, fullName: true, username: true, role: true },
        },
        cards: {
          orderBy: { order: "asc" },
          include: {
            progress: userId
              ? {
                  where: { userId },
                }
              : false,
          },
        },
      },
    });

    if (!deck) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bộ thẻ" });
    }

    const now = new Date();

    const formattedCards = deck.cards.map((card) => {
      const prog = card.progress?.[0] || null;
      const isDue = prog ? new Date(prog.nextReviewDate) <= now : true;
      const isMastered = prog?.state === "MASTERED";

      return {
        id: card.id,
        deckId: card.deckId,
        korean: card.korean,
        vietnamese: card.vietnamese,
        english: card.english,
        hanja: card.hanja,
        romaji: card.romaji,
        exampleSentence: card.exampleSentence,
        exampleTranslation: card.exampleTranslation,
        notes: card.notes,
        order: card.order,
        // Dữ liệu tiến độ học tập (SRS)
        mastered: isMastered,
        state: prog?.state || "NEW",
        interval: prog?.interval || 0,
        repetition: prog?.repetition || 0,
        easeFactor: prog?.easeFactor || 2.5,
        nextReviewDate: prog?.nextReviewDate || null,
        lastReviewedAt: prog?.lastReviewedAt || null,
        isDue,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        ...deck,
        cards: formattedCards,
      },
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết bộ thẻ:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi lấy chi tiết bộ thẻ",
      error: error.message,
    });
  }
}

/**
 * POST /api/flashcards/decks - Tạo bộ thẻ mới
 */
export async function createDeck(req, res) {
  try {
    const userId = req.user?.id;
    const { title, description, type = "VOCABULARY", language = "ko", isPublic = true, cards = [] } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ success: false, message: "Tiêu đề bộ thẻ không được để trống" });
    }

    const newDeck = await prisma.flashcardDeck.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        type,
        language,
        isPublic: Boolean(isPublic),
        createdBy: userId || null,
        cards: {
          create: cards.map((c, index) => ({
            korean: c.korean || c.japanese || c.front || "",
            vietnamese: c.vietnamese || c.back || "",
            english: c.english || null,
            hanja: c.hanja || null,
            romaji: c.romaji || null,
            exampleSentence: c.exampleSentence || null,
            exampleTranslation: c.exampleTranslation || null,
            notes: c.notes || null,
            order: index,
          })),
        },
      },
      include: {
        cards: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Tạo bộ thẻ thành công",
      data: newDeck,
    });
  } catch (error) {
    console.error("Lỗi tạo bộ thẻ:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi tạo bộ thẻ",
      error: error.message,
    });
  }
}

/**
 * PUT /api/flashcards/decks/:id - Sửa thông tin bộ thẻ
 */
export async function updateDeck(req, res) {
  try {
    const deckId = parseInt(req.params.id, 10);
    const userId = req.user?.id;
    const isTeacher = req.user?.role === "TEACHER";
    const { title, description, type, language, isPublic } = req.body;

    const existingDeck = await prisma.flashcardDeck.findUnique({
      where: { id: deckId },
    });

    if (!existingDeck) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bộ thẻ" });
    }

    if (!isTeacher && existingDeck.createdBy !== userId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền sửa bộ thẻ này" });
    }

    const updated = await prisma.flashcardDeck.update({
      where: { id: deckId },
      data: {
        title: title ? title.trim() : existingDeck.title,
        description: description !== undefined ? description?.trim() : existingDeck.description,
        type: type || existingDeck.type,
        language: language || existingDeck.language,
        isPublic: isPublic !== undefined ? Boolean(isPublic) : existingDeck.isPublic,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật bộ thẻ thành công",
      data: updated,
    });
  } catch (error) {
    console.error("Lỗi cập nhật bộ thẻ:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi cập nhật bộ thẻ",
      error: error.message,
    });
  }
}

/**
 * DELETE /api/flashcards/decks/:id - Xoá bộ thẻ
 */
export async function deleteDeck(req, res) {
  try {
    const deckId = parseInt(req.params.id, 10);
    const userId = req.user?.id;
    const isTeacher = req.user?.role === "TEACHER";

    const existingDeck = await prisma.flashcardDeck.findUnique({
      where: { id: deckId },
    });

    if (!existingDeck) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bộ thẻ" });
    }

    if (!isTeacher && existingDeck.createdBy !== userId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xóa bộ thẻ này" });
    }

    await prisma.flashcardDeck.delete({
      where: { id: deckId },
    });

    return res.status(200).json({
      success: true,
      message: "Đã xóa bộ thẻ thành công",
    });
  } catch (error) {
    console.error("Lỗi xóa bộ thẻ:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi xóa bộ thẻ",
      error: error.message,
    });
  }
}

/**
 * POST /api/flashcards/decks/:id/cards - Thêm một thẻ từ vựng vào bộ thẻ
 * Hỗ trợ tạo tự động bộ "Từ vựng của tôi" nếu deckId = "personal" hoặc không tìm thấy
 */
export async function addCardToDeck(req, res) {
  try {
    let deckIdParam = req.params.id;
    const userId = req.user?.id;
    const { korean, vietnamese, english, hanja, romaji, exampleSentence, exampleTranslation, notes } = req.body;

    if (!korean || !vietnamese) {
      return res.status(400).json({
        success: false,
        message: "Cần cung cấp từ vựng tiếng Hàn và nghĩa tiếng Việt",
      });
    }

    let targetDeckId;

    if (deckIdParam === "personal" || !deckIdParam) {
      // Tìm hoặc tạo bộ thẻ cá nhân cho User
      let personalDeck = await prisma.flashcardDeck.findFirst({
        where: {
          createdBy: userId,
          title: "Sổ tay từ vựng của tôi",
        },
      });

      if (!personalDeck) {
        personalDeck = await prisma.flashcardDeck.create({
          data: {
            title: "Sổ tay từ vựng của tôi",
            description: "Các từ vựng được bạn lưu nhanh khi tra cứu trong bài thi và bài đọc",
            language: "ko",
            isPublic: false,
            createdBy: userId,
          },
        });
      }
      targetDeckId = personalDeck.id;
    } else {
      targetDeckId = parseInt(deckIdParam, 10);
    }

    // Đếm số lượng cards hiện có để đặt order
    const cardCount = await prisma.flashcardCard.count({
      where: { deckId: targetDeckId },
    });

    const newCard = await prisma.flashcardCard.create({
      data: {
        deckId: targetDeckId,
        korean: korean.trim(),
        vietnamese: vietnamese.trim(),
        english: english?.trim() || null,
        hanja: hanja?.trim() || null,
        romaji: romaji?.trim() || null,
        exampleSentence: exampleSentence?.trim() || null,
        exampleTranslation: exampleTranslation?.trim() || null,
        notes: notes?.trim() || null,
        order: cardCount,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Đã thêm từ vựng thành công!",
      data: {
        ...newCard,
        targetDeckId,
      },
    });
  } catch (error) {
    console.error("Lỗi thêm thẻ từ vựng:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi thêm thẻ từ vựng",
      error: error.message,
    });
  }
}

/**
 * DELETE /api/flashcards/cards/:cardId - Xóa 1 thẻ từ vựng
 */
export async function deleteCard(req, res) {
  try {
    const cardId = parseInt(req.params.cardId, 10);
    const userId = req.user?.id;
    const isTeacher = req.user?.role === "TEACHER";

    const card = await prisma.flashcardCard.findUnique({
      where: { id: cardId },
      include: { deck: true },
    });

    if (!card) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thẻ" });
    }

    if (!isTeacher && card.deck.createdBy !== userId) {
      return res.status(403).json({ success: false, message: "Không có quyền xóa thẻ này" });
    }

    await prisma.flashcardCard.delete({
      where: { id: cardId },
    });

    return res.status(200).json({
      success: true,
      message: "Đã xóa thẻ từ vựng",
    });
  } catch (error) {
    console.error("Lỗi xóa thẻ từ vựng:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi xóa thẻ",
      error: error.message,
    });
  }
}

/**
 * POST /api/flashcards/cards/:cardId/review - Đánh giá thẻ theo thuật toán Lặp lại ngắt quãng (SRS SM-2)
 * Body: { rating: 1 | 2 | 3 | 4 }
 */
export async function reviewCardSRS(req, res) {
  try {
    const cardId = parseInt(req.params.cardId, 10);
    const userId = req.user?.id;
    const { rating = 3 } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Cần đăng nhập để lưu tiến độ ôn tập SRS" });
    }

    const card = await prisma.flashcardCard.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thẻ từ vựng" });
    }

    // Tìm tiến độ hiện tại của user cho thẻ này
    let currentProgress = await prisma.flashcardProgress.findUnique({
      where: {
        userId_cardId: {
          userId,
          cardId,
        },
      },
    });

    const interval = currentProgress?.interval || 0;
    const repetition = currentProgress?.repetition || 0;
    const easeFactor = currentProgress?.easeFactor || 2.5;

    // Tính toán SM-2
    const sm2Result = calculateSM2(interval, repetition, easeFactor, Number(rating));

    const updatedProgress = await prisma.flashcardProgress.upsert({
      where: {
        userId_cardId: {
          userId,
          cardId,
        },
      },
      create: {
        userId,
        cardId,
        interval: sm2Result.interval,
        repetition: sm2Result.repetition,
        easeFactor: sm2Result.easeFactor,
        state: sm2Result.state,
        nextReviewDate: sm2Result.nextReviewDate,
        lastReviewedAt: new Date(),
      },
      update: {
        interval: sm2Result.interval,
        repetition: sm2Result.repetition,
        easeFactor: sm2Result.easeFactor,
        state: sm2Result.state,
        nextReviewDate: sm2Result.nextReviewDate,
        lastReviewedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Đã lưu kết quả ôn tập SRS",
      data: {
        ...updatedProgress,
        mastered: updatedProgress.state === "MASTERED",
      },
    });
  } catch (error) {
    console.error("Lỗi chấm điểm SRS thẻ:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi lưu tiến độ SRS",
      error: error.message,
    });
  }
}

/**
 * POST /api/flashcards/sync-local - Đồng bộ các bộ thẻ từ localStorage lên Cloud Database
 * Bảo toàn 100% dữ liệu cũ của người dùng
 */
export async function syncLocalDecks(req, res) {
  try {
    const userId = req.user?.id;
    const { localDecks = [] } = req.body;

    if (!Array.isArray(localDecks) || localDecks.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Không có bộ thẻ local nào cần đồng bộ",
        syncedCount: 0,
      });
    }

    let syncedCount = 0;

    for (const localDeck of localDecks) {
      let deck = await prisma.flashcardDeck.findFirst({
        where: {
          title: localDeck.title,
          ...(userId ? { createdBy: userId } : {}),
        },
      });

      if (!deck) {
        deck = await prisma.flashcardDeck.create({
          data: {
            title: localDeck.title,
            description: localDeck.description || null,
            type: localDeck.type || "VOCABULARY",
            language: localDeck.language || "ko",
            isPublic: true,
            createdBy: userId || null,
            cards: {
              create: (localDeck.cards || []).map((c, idx) => ({
                korean: c.korean || c.japanese || c.front || "",
                vietnamese: c.vietnamese || c.back || "",
                english: c.english || null,
                hanja: c.hanja || null,
                romaji: c.romaji || null,
                notes: c.notes || null,
                order: idx,
              })),
            },
          },
        });
        syncedCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Đã đồng bộ thành công ${syncedCount} bộ thẻ lên Cloud Database`,
      syncedCount,
    });
  } catch (error) {
    console.error("Lỗi đồng bộ bộ thẻ local:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi đồng bộ bộ thẻ",
      error: error.message,
    });
  }
}

import { useEffect } from "react";
import { Routes, Route, useNavigate, useParams, Navigate } from "react-router-dom";
import { FlashcardDeckListPage } from "./FlashcardDeckListPage.tsx";
import { FlashcardStudyPage } from "./FlashcardStudyPage.tsx";
import { useFlashcardStore } from "@/stores/useFlashcardStore.ts";
import { useSmartNavigate } from "@/lib/navigation.ts";

/**
 * FlashcardFeature — quản lý và ôn luyện thẻ nhớ tiếng Hàn (SRS).
 * Sử dụng URL routes để theo dõi lịch sử duyệt trang, hỗ trợ back/forward.
 */
export function FlashcardFeature() {
  const navigate = useNavigate();
  const { goBack } = useSmartNavigate();

  return (
    <Routes>
      {/* 1. Danh sách bộ Flashcard */}
      <Route
        index
        element={
          <FlashcardDeckListPage
            onStartStudy={(deckId) => navigate(`/flashcards/${deckId}`)}
          />
        }
      />

      {/* 2. Màn hình học thẻ SRS */}
      <Route
        path=":deckId"
        element={<FlashcardStudyRoute onBack={() => goBack("/flashcards")} />}
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/flashcards" replace />} />
    </Routes>
  );
}

function FlashcardStudyRoute({ onBack }: { onBack: () => void }) {
  const { deckId } = useParams();
  const { setActiveDeckId } = useFlashcardStore();

  useEffect(() => {
    if (deckId) {
      setActiveDeckId(deckId);
    }
  }, [deckId, setActiveDeckId]);

  if (!deckId) return <Navigate to="/flashcards" replace />;

  return (
    <FlashcardStudyPage
      deckId={deckId}
      onBack={onBack}
    />
  );
}

// Named re-exports
export { FlashcardDeckListPage } from "./FlashcardDeckListPage.tsx";
export { FlashcardStudyPage } from "./FlashcardStudyPage.tsx";
export { ImportDeckModal } from "./ImportDeckModal.tsx";
export { DeckDetailModal } from "./DeckDetailModal.tsx";

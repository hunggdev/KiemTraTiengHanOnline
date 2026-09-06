import { useState } from "react";
import { FlashcardDeckListPage } from "./FlashcardDeckListPage.tsx";
import { FlashcardStudyPage } from "./FlashcardStudyPage.tsx";
import { useFlashcardStore } from "@/stores/useFlashcardStore.ts";

type FlashcardView = "list" | "study";

export function FlashcardFeature() {
  const { activeDeckId, setActiveDeckId } = useFlashcardStore();
  const [view, setView] = useState<FlashcardView>(activeDeckId ? "study" : "list");
  const [currentDeckId, setCurrentDeckId] = useState<string | null>(activeDeckId);

  const handleStartStudy = (deckId: string) => {
    setCurrentDeckId(deckId);
    setActiveDeckId(deckId);
    setView("study");
  };

  const handleBackToList = () => {
    setCurrentDeckId(null);
    setActiveDeckId(null);
    setView("list");
  };

  return (
    <>
      {view === "list" && (
        <FlashcardDeckListPage onStartStudy={handleStartStudy} />
      )}

      {view === "study" && currentDeckId && (
        <FlashcardStudyPage
          deckId={currentDeckId}
          onBack={handleBackToList}
        />
      )}
    </>
  );
}

// Named re-exports
export { FlashcardDeckListPage } from "./FlashcardDeckListPage.tsx";
export { FlashcardStudyPage } from "./FlashcardStudyPage.tsx";
export { ImportDeckModal } from "./ImportDeckModal.tsx";
export { DeckDetailModal } from "./DeckDetailModal.tsx";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Plus,
  Play,
  BookOpen,
  Layers,
  Trash2,
  CheckCircle2,
  Clock,
  Search,
  Download,
  RotateCcw,
  Languages,
  Eye,
  FileQuestion,
} from "lucide-react";
import { useFlashcardStore } from "@/stores/useFlashcardStore.ts";
import type { FlashcardDeck } from "@/types/flashcard.types.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { ImportDeckModal } from "./ImportDeckModal.tsx";
import { DeckDetailModal } from "./DeckDetailModal.tsx";

interface FlashcardDeckListPageProps {
  onStartStudy: (deckId: string) => void;
}

export function FlashcardDeckListPage({ onStartStudy }: FlashcardDeckListPageProps) {
  const { decks, deleteDeck, loadSampleDecksIfEmpty, importPreloadedSamples } = useFlashcardStore();

  const [search, setSearch] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedDeckForDetail, setSelectedDeckForDetail] = useState<FlashcardDeck | null>(null);

  // Khởi tạo sample decks nếu chưa có bộ nào
  useEffect(() => {
    loadSampleDecksIfEmpty();
  }, [loadSampleDecksIfEmpty]);

  const filteredDecks = decks.filter((d) => {
    if (!search.trim()) return true;
    return (
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const totalDecks = decks.length;
  const totalCards = decks.reduce((sum, d) => sum + d.cards.length, 0);
  const totalMastered = decks.reduce(
    (sum, d) => sum + d.cards.filter((c) => c.mastered).length,
    0
  );
  const overallProgress = totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0;

  const handleDeleteDeck = (e: React.MouseEvent, deckId: string, title: string) => {
    e.stopPropagation();
    if (window.confirm(`Bạn có chắc muốn xoá bộ thẻ "${title}"?`)) {
      deleteDeck(deckId);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Hero Header */}
      <div className="border-b bg-gradient-to-b from-primary/5 via-muted/30 to-background py-10 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Languages className="w-3.5 h-3.5" />
            Hệ thống Flashcard Đa ngôn ngữ (VI - EN - JA - Romaji)
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Bộ thẻ Flashcard học từ vựng & mẫu câu
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Học tập qua thẻ ghi nhớ 3D, hỗ trợ phát âm chuẩn bản xứ, nhập nhanh từ Excel / CSV và theo dõi tiến độ ghi nhớ liên tục.
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-4 text-center">
            <div className="p-3 rounded-2xl bg-card border shadow-xs">
              <span className="text-[11px] text-muted-foreground block mb-0.5">Tổng số bộ thẻ</span>
              <span className="text-xl font-bold text-foreground">{totalDecks}</span>
            </div>
            <div className="p-3 rounded-2xl bg-card border shadow-xs">
              <span className="text-[11px] text-muted-foreground block mb-0.5">Tổng số thẻ</span>
              <span className="text-xl font-bold text-foreground">{totalCards}</span>
            </div>
            <div className="p-3 rounded-2xl bg-card border shadow-xs">
              <span className="text-[11px] text-muted-foreground block mb-0.5">Đã thuộc</span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {totalMastered}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-card border shadow-xs">
              <span className="text-[11px] text-muted-foreground block mb-0.5">Tiến độ tổng</span>
              <span className="text-xl font-bold text-primary">{overallProgress}%</span>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 max-w-md mx-auto">
            <Button
              onClick={() => setIsImportModalOpen(true)}
              className="w-full sm:w-auto rounded-xl gap-2 font-semibold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nhập bộ thẻ mới (.xlsx, .csv)</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => importPreloadedSamples()}
              className="w-full sm:w-auto rounded-xl gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Nạp bộ thẻ mẫu</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Decks Grid */}
      <div className="max-w-5xl mx-auto px-4 pt-8 space-y-6">
        {/* Search bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm bộ thẻ..."
              className="pl-10 h-10 rounded-xl bg-card"
            />
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Hiển thị {filteredDecks.length} bộ thẻ
          </span>
        </div>

        {filteredDecks.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground space-y-3">
            <FileQuestion className="w-12 h-12 mx-auto opacity-40" />
            <p className="font-semibold text-foreground">Chưa tìm thấy bộ thẻ nào</p>
            <p className="text-xs text-muted-foreground">
              Nhấn "+ Nhập bộ thẻ mới" hoặc "Nạp bộ thẻ mẫu" để bắt đầu học ngay.
            </p>
            <Button
              onClick={() => setIsImportModalOpen(true)}
              size="sm"
              className="rounded-xl mt-2"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Nhập bộ thẻ mới
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDecks.map((deck) => {
              const cardCount = deck.cards.length;
              const mastered = deck.cards.filter((c) => c.mastered).length;
              const percent = cardCount > 0 ? Math.round((mastered / cardCount) * 100) : 0;

              return (
                <div
                  key={deck.id}
                  className="group bg-card rounded-3xl border shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between overflow-hidden p-5 space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header: Type Badge & Delete */}
                    <div className="flex items-start justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          deck.type === "VOCABULARY"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                            : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                        }`}
                      >
                        {deck.type === "VOCABULARY" ? "Từ vựng" : "Mẫu câu"}
                      </Badge>

                      <button
                        onClick={(e) => handleDeleteDeck(e, deck.id, deck.title)}
                        className="w-7 h-7 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors cursor-pointer"
                        title="Xoá bộ thẻ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="font-bold text-foreground text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {deck.title}
                      </h3>
                      {deck.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {deck.description}
                        </p>
                      )}
                    </div>

                    {/* Progress Bar & Stats */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Đã thuộc {mastered}/{cardCount} thẻ
                        </span>
                        <span className="font-bold text-foreground">{percent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDeckForDetail(deck)}
                      className="rounded-xl text-xs gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem từ ({cardCount})</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => onStartStudy(deck.id)}
                      className="rounded-xl text-xs gap-1.5 font-semibold shadow-xs cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Học ngay</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <ImportDeckModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={(deckId) => {
          setIsImportModalOpen(false);
          onStartStudy(deckId);
        }}
      />

      <DeckDetailModal
        deck={selectedDeckForDetail}
        isOpen={selectedDeckForDetail !== null}
        onClose={() => setSelectedDeckForDetail(null)}
        onStartStudy={(deckId) => {
          setSelectedDeckForDetail(null);
          onStartStudy(deckId);
        }}
      />
    </div>
  );
}

import React, { useState, useEffect } from "react";
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
  ShieldCheck,
  Lock,
  Cloud,
  Loader2,
  Flame,
  Award,
} from "lucide-react";
import { useFlashcardStore } from "@/stores/useFlashcardStore.ts";
import { useAuthStore } from "@/stores/useAuthStore.ts";
import type { FlashcardDeck } from "@/types/flashcard.types.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { ImportDeckModal } from "./ImportDeckModal.tsx";
import { DeckDetailModal } from "./DeckDetailModal.tsx";
import { StudentPermissionModal } from "./StudentPermissionModal.tsx";

interface FlashcardDeckListPageProps {
  onStartStudy: (deckId: string | number) => void;
}

export function FlashcardDeckListPage({ onStartStudy }: FlashcardDeckListPageProps) {
  const { user } = useAuthStore();
  const {
    decks,
    deleteDeck,
    loadSampleDecksIfEmpty,
    importPreloadedSamples,
    syncLocalToCloud,
    isSyncing,
  } = useFlashcardStore();

  const isTeacher = user?.role === "TEACHER";
  const canAccess = isTeacher || Boolean(user?.canAccessFlashcard);

  const [search, setSearch] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [selectedDeckForDetail, setSelectedDeckForDetail] = useState<FlashcardDeck | null>(null);

  // Khởi tạo sample decks nếu chưa có bộ nào
  useEffect(() => {
    loadSampleDecksIfEmpty();
  }, [loadSampleDecksIfEmpty]);

  // Nếu là học sinh và chưa được cấp quyền -> Hiện màn hình khoá
  if (!canAccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center mb-5 shadow-xs">
          <Lock className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Chưa được cấp quyền sử dụng Flashcard
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
          Chức năng học Flashcard hiện chỉ dành cho Giáo viên hoặc Học sinh đã được Giáo viên cấp quyền truy cập. Vui lòng liên hệ giáo viên phụ trách của bạn để được kích hoạt quyền học nhé!
        </p>
        <Badge variant="outline" className="px-3 py-1 text-xs gap-1.5 bg-muted text-muted-foreground">
          Tài khoản: {user?.fullName} (@{user?.username})
        </Badge>
      </div>
    );
  }

  const filteredDecks = decks.filter((d) => {
    if (!search.trim()) return true;
    return (
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const now = new Date();
  const totalDecks = decks.length;
  const totalCards = decks.reduce(
    (sum, d) => sum + (d.cards?.length || d.totalCards || 0),
    0
  );
  const totalMastered = decks.reduce(
    (sum, d) =>
      sum + (d.cards ? d.cards.filter((c) => c.mastered).length : (d.masteredCount || 0)),
    0
  );
  const totalDueToday = decks.reduce((sum, d) => {
    if (d.cards && d.cards.length > 0) {
      const dueInDeck = d.cards.filter((c) => {
        if (!c.nextReviewDate) return true;
        return new Date(c.nextReviewDate) <= now;
      }).length;
      return sum + dueInDeck;
    }
    return sum + (d.dueCount || 0);
  }, 0);

  const overallProgress = totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0;

  const handleDeleteDeck = (e: React.MouseEvent, deckId: string | number, title: string) => {
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
            Hệ thống Flashcard SRS 2.0 (Tiếng Hàn TOPIK & Đa ngôn ngữ)
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Bộ thẻ Flashcard học từ vựng & mẫu câu thông minh
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Ghi nhớ sâu bằng thuật toán SuperMemo SM-2, tích hợp bàn phím ảo tiếng Hàn 2-beolsik, trò chơi ghép thẻ tốc độ và đồng bộ đám mây PostgreSQL.
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-4 text-center">
            <div className="p-3 rounded-2xl bg-card border shadow-xs">
              <span className="text-[11px] text-muted-foreground block mb-0.5">Tổng số bộ thẻ</span>
              <span className="text-xl font-bold text-foreground">{totalDecks}</span>
            </div>
            <div className="p-3 rounded-2xl bg-card border shadow-xs">
              <span className="text-[11px] text-muted-foreground block mb-0.5">Cần ôn hôm nay</span>
              <span className="text-xl font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 fill-amber-500" />
                {totalDueToday}
              </span>
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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 max-w-xl mx-auto flex-wrap">
            <Button
              onClick={() => setIsImportModalOpen(true)}
              className="w-full sm:w-auto rounded-xl gap-2 font-semibold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nhập bộ thẻ (.xlsx, .csv)</span>
            </Button>

            <Button
              variant="outline"
              disabled={isSyncing}
              onClick={() => syncLocalToCloud()}
              className="w-full sm:w-auto rounded-xl gap-1.5 font-semibold text-foreground border-border hover:bg-muted cursor-pointer"
              title="Đồng bộ toàn bộ bộ thẻ lên Cloud Database"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Đang đồng bộ...</span>
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4 text-primary" />
                  <span>Đồng bộ Cloud DB</span>
                </>
              )}
            </Button>

            {isTeacher && (
              <Button
                variant="outline"
                onClick={() => setIsPermissionModalOpen(true)}
                className="w-full sm:w-auto rounded-xl gap-1.5 font-semibold text-primary border-primary/30 hover:bg-primary/5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Cấp quyền học sinh</span>
              </Button>
            )}

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
              Nhấn "+ Nhập bộ thẻ" hoặc "Nạp bộ thẻ mẫu" để bắt đầu học ngay.
            </p>
            <Button
              onClick={() => setIsImportModalOpen(true)}
              size="sm"
              className="rounded-xl mt-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Nhập bộ thẻ mới
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDecks.map((deck) => {
              const cards = deck.cards || [];
              const cardCount = cards.length || deck.totalCards || 0;
              const mastered =
                cards.length > 0
                  ? cards.filter((c) => c.mastered).length
                  : (deck.masteredCount || 0);
              const dueInDeck =
                cards.length > 0
                  ? cards.filter((c) => {
                      if (!c.nextReviewDate) return true;
                      return new Date(c.nextReviewDate) <= now;
                    }).length
                  : (deck.dueCount || 0);
              const percent = cardCount > 0 ? Math.round((mastered / cardCount) * 100) : 0;
              const isKorean = deck.language === "ko" || cards.some((c) => c.korean);

              return (
                <div
                  key={deck.id}
                  className="group bg-card rounded-3xl border shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between overflow-hidden p-5 space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header: Type Badge, Lang Badge & Delete */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${
                            isKorean
                              ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                          }`}
                        >
                          {isKorean ? "Tiếng Hàn (한국어)" : "Song ngữ"}
                        </Badge>

                        {dueInDeck > 0 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 flex items-center gap-0.5"
                          >
                            <Flame className="w-3 h-3 fill-amber-500" />
                            {dueInDeck} cần ôn
                          </Badge>
                        )}
                      </div>

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

      {isTeacher && (
        <StudentPermissionModal
          isOpen={isPermissionModalOpen}
          onClose={() => setIsPermissionModalOpen(false)}
        />
      )}
    </div>
  );
}

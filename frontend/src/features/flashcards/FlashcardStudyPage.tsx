import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Volume2,
  CheckCircle2,
  XCircle,
  Shuffle,
  Filter,
  Sparkles,
  Trophy,
  RotateCcw,
  Languages,
  Keyboard,
  HelpCircle,
} from "lucide-react";
import type { FlashcardDeck, FlashcardItem, FrontLanguage } from "@/types/flashcard.types.ts";
import { useFlashcardStore } from "@/stores/useFlashcardStore.ts";
import { speakText } from "@/lib/speechUtils.ts";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";

interface FlashcardStudyPageProps {
  deckId: string;
  onBack: () => void;
}

export function FlashcardStudyPage({ deckId, onBack }: FlashcardStudyPageProps) {
  const { decks, toggleCardMastered, resetDeckProgress } = useFlashcardStore();
  const deck = decks.find((d) => d.id === deckId);

  const [frontLang, setFrontLang] = useState<FrontLanguage>("japanese");
  const [onlyUnmastered, setOnlyUnmastered] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardOrder, setCardOrder] = useState<FlashcardItem[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  // Initialize and filter cards
  useEffect(() => {
    if (!deck) return;
    let list = [...deck.cards];
    if (onlyUnmastered) {
      list = list.filter((c) => !c.mastered);
    }
    setCardOrder(list);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(list.length === 0);
  }, [deck, onlyUnmastered]);

  const currentCard: FlashcardItem | undefined = cardOrder[currentIndex];

  // Shuffle cards
  const handleShuffle = () => {
    setCardOrder((prev) => {
      const shuffled = [...prev];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleNext = useCallback(() => {
    if (currentIndex < cardOrder.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setIsFinished(true);
    }
  }, [currentIndex, cardOrder.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleMarkMastered = useCallback(
    (mastered: boolean) => {
      if (!currentCard || !deck) return;
      if (currentCard.mastered !== mastered) {
        toggleCardMastered(deck.id, currentCard.id);
      }
      handleNext();
    },
    [currentCard, deck, toggleCardMastered, handleNext]
  );

  // Play audio for current card depending on active side
  const handlePlayAudio = useCallback(() => {
    if (!currentCard) return;
    if (frontLang === "japanese" && !isFlipped) {
      speakText(currentCard.japanese, "ja-JP");
    } else if (frontLang === "english" && !isFlipped) {
      speakText(currentCard.english, "en-US");
    } else if (frontLang === "vietnamese" && !isFlipped) {
      speakText(currentCard.vietnamese, "vi-VN");
    } else {
      // Khi lật mặt sau, ưu tiên phát âm tiếng Nhật
      speakText(currentCard.japanese, "ja-JP");
    }
  }, [currentCard, frontLang, isFlipped]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tránh bắt phím khi đang gõ vào input
      if (["input", "textarea", "select"].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }

      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        handleFlip();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "1") {
        e.preventDefault();
        handleMarkMastered(false);
      } else if (e.key === "2") {
        e.preventDefault();
        handleMarkMastered(true);
      } else if (e.key.toLowerCase() === "r" || e.key.toLowerCase() === "a") {
        e.preventDefault();
        handlePlayAudio();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlip, handleNext, handlePrev, handleMarkMastered, handlePlayAudio]);

  if (!deck) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Không tìm thấy bộ thẻ.</p>
        <Button onClick={onBack}>Quay lại danh sách</Button>
      </div>
    );
  }

  const totalInDeck = deck.cards.length;
  const masteredCount = deck.cards.filter((c) => c.mastered).length;
  const masteredPercent = totalInDeck > 0 ? Math.round((masteredCount / totalInDeck) * 100) : 0;
  const progressCurrent = cardOrder.length > 0 ? Math.min(currentIndex + 1, cardOrder.length) : 0;
  const progressPercent = cardOrder.length > 0 ? Math.round((progressCurrent / cardOrder.length) * 100) : 0;

  // Lấy nội dung hiển thị cho mặt trước và mặt sau
  const getFrontContent = (card: FlashcardItem) => {
    if (frontLang === "vietnamese") {
      return {
        main: card.vietnamese,
        sub: null,
        langLabel: "Tiếng Việt",
        speechLang: "vi-VN" as const,
      };
    }
    if (frontLang === "english") {
      return {
        main: card.english,
        sub: null,
        langLabel: "English",
        speechLang: "en-US" as const,
      };
    }
    return {
      main: card.japanese,
      sub: card.romaji,
      langLabel: "日本語 (Tiếng Nhật)",
      speechLang: "ja-JP" as const,
    };
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col pb-12">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground h-8 px-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Thoát
            </Button>
            <div className="border-l pl-3 hidden sm:block">
              <h1 className="font-bold text-sm text-foreground truncate max-w-xs">{deck.title}</h1>
              <p className="text-[11px] text-muted-foreground">
                Tổng cộng: {totalInDeck} thẻ • Đã thuộc {masteredCount}/{totalInDeck} ({masteredPercent}%)
              </p>
            </div>
          </div>

          {/* Front Language Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-muted rounded-xl border text-xs">
            <span className="text-[11px] font-semibold text-muted-foreground px-1.5 hidden md:inline">
              Mặt trước:
            </span>
            <button
              onClick={() => {
                setFrontLang("japanese");
                setIsFlipped(false);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                frontLang === "japanese"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              日本語
            </button>
            <button
              onClick={() => {
                setFrontLang("english");
                setIsFlipped(false);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                frontLang === "english"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              English
            </button>
            <button
              onClick={() => {
                setFrontLang("vietnamese");
                setIsFlipped(false);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                frontLang === "vietnamese"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tiếng Việt
            </button>
          </div>
        </div>
      </header>

      {/* Main Flashcard Container */}
      <main className="max-w-2xl mx-auto px-4 py-8 flex-1 w-full flex flex-col justify-center">
        {isFinished ? (
          /* Finished Screen */
          <div className="bg-card rounded-3xl border shadow-lg p-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-3xl bg-primary/20 text-primary flex items-center justify-center mx-auto shadow-xs">
              <Trophy className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-foreground">Tuyệt vời! Đã hoàn thành bộ thẻ</h2>
              <p className="text-sm text-muted-foreground">
                Bạn đã ôn tập xong <strong>{cardOrder.length}</strong> thẻ trong lần học này.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold block mb-1">
                  Đã thuộc
                </span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {masteredCount}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="text-xs text-amber-600 dark:text-amber-400 font-bold block mb-1">
                  Chưa thuộc
                </span>
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {totalInDeck - masteredCount}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentIndex(0);
                  setIsFlipped(false);
                  setIsFinished(false);
                }}
                className="w-full sm:w-auto rounded-xl gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Học lại toàn bộ
              </Button>

              {totalInDeck - masteredCount > 0 && (
                <Button
                  onClick={() => {
                    setOnlyUnmastered(true);
                    setCurrentIndex(0);
                    setIsFlipped(false);
                    setIsFinished(false);
                  }}
                  className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white rounded-xl gap-2 cursor-pointer shadow-xs"
                >
                  <Filter className="w-4 h-4" />
                  Học {totalInDeck - masteredCount} thẻ chưa thuộc
                </Button>
              )}

              <Button
                variant="ghost"
                onClick={onBack}
                className="w-full sm:w-auto rounded-xl cursor-pointer"
              >
                Về danh sách
              </Button>
            </div>
          </div>
        ) : (
          /* Active Card Screen */
          <div className="space-y-6">
            {/* Top Toolbar: Progress & Filter & Shuffle */}
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 font-mono font-bold">
                <Badge variant="outline" className="px-2.5 py-0.5 text-xs font-mono">
                  {progressCurrent} / {cardOrder.length}
                </Badge>
                <span>({progressPercent}%)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOnlyUnmastered(!onlyUnmastered)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    onlyUnmastered
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold"
                      : "bg-card hover:bg-muted text-muted-foreground border-border"
                  }`}
                  title="Chỉ học các thẻ chưa thuộc"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Chưa thuộc</span>
                </button>

                <button
                  onClick={handleShuffle}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card hover:bg-muted border text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  title="Xáo trộn thứ tự thẻ"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Trộn thẻ</span>
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* 3D Flip Card Container */}
            {currentCard && (
              <div
                onClick={handleFlip}
                style={{ perspective: "1000px" }}
                className="w-full min-h-[340px] sm:min-h-[380px] cursor-pointer select-none group"
              >
                <div
                  style={{
                    transformStyle: "preserve-3d",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  className="w-full h-full relative"
                >
                  {/* FRONT SIDE */}
                  <div
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                    }}
                    className={`absolute inset-0 w-full h-full rounded-3xl border-2 p-6 sm:p-8 flex flex-col justify-between shadow-md transition-all ${
                      currentCard.mastered
                        ? "bg-gradient-to-b from-emerald-500/5 via-card to-card border-emerald-500/40"
                        : "bg-gradient-to-b from-primary/5 via-card to-card border-border hover:border-primary/50"
                    }`}
                  >
                    {/* Card Top Metadata */}
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[11px] font-semibold text-muted-foreground">
                        {getFrontContent(currentCard).langLabel}
                      </Badge>

                      <div className="flex items-center gap-2">
                        {currentCard.mastered && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Đã thuộc
                          </Badge>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speakText(
                              getFrontContent(currentCard).main,
                              getFrontContent(currentCard).speechLang
                            );
                          }}
                          className="w-9 h-9 rounded-full bg-muted/80 hover:bg-primary hover:text-primary-foreground text-foreground flex items-center justify-center transition-all cursor-pointer shadow-xs"
                          title="Phát âm"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Card Center Content */}
                    <div className="text-center py-6 space-y-3">
                      <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-snug">
                        {getFrontContent(currentCard).main}
                      </div>
                      {getFrontContent(currentCard).sub && (
                        <div className="text-sm sm:text-base font-mono text-muted-foreground">
                          {getFrontContent(currentCard).sub}
                        </div>
                      )}
                    </div>

                    {/* Card Bottom Hint */}
                    <div className="text-center">
                      <span className="text-xs text-muted-foreground/80 flex items-center justify-center gap-1.5 group-hover:text-primary transition-colors">
                        <RotateCw className="w-3.5 h-3.5" />
                        Chạm hoặc bấm <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border">Space</kbd> để lật xem mặt sau
                      </span>
                    </div>
                  </div>

                  {/* BACK SIDE (Rotated 180deg) */}
                  <div
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                    className="absolute inset-0 w-full h-full rounded-3xl border-2 border-primary/50 bg-gradient-to-b from-primary/10 via-card to-card p-6 sm:p-8 flex flex-col justify-between shadow-lg"
                  >
                    {/* Top */}
                    <div className="flex items-center justify-between">
                      <Badge className="bg-primary text-primary-foreground text-[11px] font-semibold">
                        Mặt sau (Giải nghĩa & Phiên âm)
                      </Badge>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakText(currentCard.japanese, "ja-JP");
                        }}
                        className="w-9 h-9 rounded-full bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground flex items-center justify-center transition-all cursor-pointer shadow-xs"
                        title="Phát âm tiếng Nhật"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Multi-language details */}
                    <div className="space-y-4 py-4">
                      {/* Tiếng Nhật */}
                      <div className="p-3 rounded-2xl bg-card border shadow-xs space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                          日本語 (Tiếng Nhật)
                        </span>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xl sm:text-2xl font-bold text-primary">
                            {currentCard.japanese}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              speakText(currentCard.japanese, "ja-JP");
                            }}
                            className="w-7 h-7 rounded-md hover:bg-muted text-muted-foreground hover:text-primary flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {currentCard.romaji && (
                          <span className="text-xs font-mono text-muted-foreground block">
                            {currentCard.romaji}
                          </span>
                        )}
                      </div>

                      {/* English & Tiếng Việt */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="p-3 rounded-2xl bg-card border shadow-xs">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                            English
                          </span>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {currentCard.english}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                speakText(currentCard.english, "en-US");
                              }}
                              className="w-6 h-6 rounded-md hover:bg-muted text-muted-foreground hover:text-blue-500 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Volume2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-card border shadow-xs">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                            Tiếng Việt
                          </span>
                          <span className="text-sm font-semibold text-foreground">
                            {currentCard.vietnamese}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom */}
                    <div className="text-center">
                      <span className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                        <RotateCw className="w-3.5 h-3.5" />
                        Chạm để lật lại mặt trước
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Action Controls */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="rounded-2xl h-12 gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs font-semibold">Thẻ trước</span>
              </Button>

              <Button
                onClick={() => handleMarkMastered(false)}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-2xl h-12 gap-1.5 font-bold cursor-pointer transition-all active:scale-[0.98]"
              >
                <XCircle className="w-4 h-4" />
                <span className="text-xs">Chưa thuộc [1]</span>
              </Button>

              <Button
                onClick={() => handleMarkMastered(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-12 gap-1.5 font-bold cursor-pointer shadow-xs transition-all active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs">Đã thuộc [2]</span>
              </Button>

              <Button
                variant="outline"
                onClick={handleNext}
                className="rounded-2xl h-12 gap-1.5 cursor-pointer"
              >
                <span className="text-xs font-semibold">Tiếp theo</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Keyboard shortcuts footer guide */}
            <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground pt-2 flex-wrap">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-card border font-mono text-[10px]">Space</kbd> Lật thẻ
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-card border font-mono text-[10px]">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-card border font-mono text-[10px]">→</kbd> Chuyển thẻ
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-card border font-mono text-[10px]">1</kbd> Chưa thuộc
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-card border font-mono text-[10px]">2</kbd> Đã thuộc
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-card border font-mono text-[10px]">R</kbd> Phát âm
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

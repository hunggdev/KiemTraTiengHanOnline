import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  Check,
  Play,
  Layers,
  Flame,
  Award,
  Timer,
  Lightbulb,
  Zap,
  BookOpen,
} from "lucide-react";
import type {
  FlashcardDeck,
  FlashcardItem,
  FrontLanguage,
  StudyMode,
  SRSRating,
} from "@/types/flashcard.types.ts";
import { useFlashcardStore } from "@/stores/useFlashcardStore.ts";
import { speakText } from "@/lib/speechUtils.ts";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { KoreanVirtualKeyboard } from "@/components/KoreanVirtualKeyboard.tsx";

interface FlashcardStudyPageProps {
  deckId: string | number;
  onBack: () => void;
}

export function FlashcardStudyPage({ deckId, onBack }: FlashcardStudyPageProps) {
  const { decks, reviewCardSRS, toggleCardMastered, resetDeckProgress, fetchDeckDetail } =
    useFlashcardStore();
  const deck = decks.find((d) => String(d.id) === String(deckId));

  // Tự động tải lại chi tiết deck nếu chưa có thẻ trong store
  useEffect(() => {
    if (!deck || !deck.cards || deck.cards.length === 0) {
      if (typeof deckId === "number" || !String(deckId).startsWith("sample-")) {
        fetchDeckDetail(deckId);
      }
    }
  }, [deckId, deck, fetchDeckDetail]);

  // Study Settings & Modes
  const [studyMode, setStudyMode] = useState<StudyMode>("flashcard");
  const [filterMode, setFilterMode] = useState<"all" | "due" | "unmastered">("all");
  const [frontLang, setFrontLang] = useState<FrontLanguage>("korean");

  // Navigation State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardOrder, setCardOrder] = useState<FlashcardItem[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  // Mode 2: Typing Mode State
  const [typingInput, setTypingInput] = useState("");
  const [typingResult, setTypingResult] = useState<"correct" | "wrong" | null>(null);
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(false);
  const typingInputRef = useRef<HTMLInputElement>(null);

  // Mode 3: Match Game State
  interface MatchCardItem {
    id: string;
    cardId: string | number;
    text: string;
    lang: "ko" | "vn";
    isMatched: boolean;
  }
  const [matchTiles, setMatchTiles] = useState<MatchCardItem[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<MatchCardItem[]>([]);
  const [matchScore, setMatchScore] = useState(0);
  const [matchSeconds, setMatchSeconds] = useState(0);
  const [isMatchTimerActive, setIsMatchTimerActive] = useState(false);

  // Mode 4: Quick Quiz State
  const [quizSelectedOption, setQuizSelectedOption] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswerChecked, setQuizAnswerChecked] = useState(false);

  // Tự động nhận diện ngôn ngữ mặt trước phù hợp với deck
  useEffect(() => {
    const cards = deck?.cards || [];
    if (deck?.language === "ko" || (!deck?.language && cards.some((c) => c.korean))) {
      setFrontLang("korean");
    } else if (deck?.language === "ja" || cards.some((c) => c.japanese)) {
      setFrontLang("japanese");
    }
  }, [deck]);

  // Khởi tạo danh sách thẻ theo bộ lọc
  useEffect(() => {
    if (!deck) return;
    let list = [...(deck.cards || [])];
    const now = new Date();

    if (filterMode === "due") {
      list = list.filter((c) => {
        if (!c.nextReviewDate) return true;
        return new Date(c.nextReviewDate) <= now;
      });
    } else if (filterMode === "unmastered") {
      list = list.filter((c) => !c.mastered);
    }

    setCardOrder(list);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(list.length === 0);
    setTypingInput("");
    setTypingResult(null);
  }, [deck, filterMode]);

  const currentCard: FlashcardItem | undefined = cardOrder[currentIndex];

  // Helper lấy từ mặt trước & mặt sau theo ngôn ngữ
  const getCardWord = useCallback(
    (card: FlashcardItem | undefined, lang: FrontLanguage): string => {
      if (!card) return "";
      if (lang === "korean") return card.korean || card.japanese || card.vietnamese || "";
      if (lang === "vietnamese") return card.vietnamese || "";
      if (lang === "english") return card.english || card.vietnamese || "";
      if (lang === "japanese") return card.japanese || card.korean || card.vietnamese || "";
      return card.vietnamese || "";
    },
    []
  );

  const frontWord = getCardWord(currentCard, frontLang);
  const backWord = currentCard?.vietnamese || "";

  // Phát âm chuẩn theo ngôn ngữ
  const handlePlayAudio = useCallback(
    (customText?: string) => {
      const textToSpeak = customText || (isFlipped ? backWord : frontWord);
      if (!textToSpeak) return;

      if (frontLang === "korean" || (!isFlipped && currentCard?.korean)) {
        speakText(customText || currentCard?.korean || frontWord, "ko-KR", 0.9);
      } else if (frontLang === "japanese" || currentCard?.japanese) {
        speakText(customText || currentCard?.japanese || frontWord, "ja-JP", 0.9);
      } else if (frontLang === "english") {
        speakText(customText || currentCard?.english || frontWord, "en-US", 0.9);
      } else {
        speakText(textToSpeak, "vi-VN", 0.9);
      }
    },
    [frontWord, backWord, isFlipped, frontLang, currentCard]
  );

  // Tự động phát âm khi chuyển thẻ hoặc lật thẻ ở mode flashcard
  useEffect(() => {
    if (studyMode === "flashcard" && currentCard && !isFlipped) {
      const timer = setTimeout(() => {
        handlePlayAudio(currentCard.korean || frontWord);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, studyMode]);

  // Điều hướng thẻ
  const handleNext = useCallback(() => {
    if (currentIndex < cardOrder.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      setTypingInput("");
      setTypingResult(null);
      setQuizSelectedOption(null);
      setQuizAnswerChecked(false);
    } else {
      setIsFinished(true);
    }
  }, [currentIndex, cardOrder.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
      setTypingInput("");
      setTypingResult(null);
      setQuizSelectedOption(null);
      setQuizAnswerChecked(false);
    }
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // Xử lý chấm điểm SRS theo thuật toán SuperMemo SM-2
  const handleReviewSRS = useCallback(
    (rating: SRSRating) => {
      if (!currentCard || !deck) return;
      reviewCardSRS(currentCard.id, rating, deck.id);
      handleNext();
    },
    [currentCard, deck, reviewCardSRS, handleNext]
  );

  // Xáo trộn thẻ
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
    setTypingInput("");
    setTypingResult(null);
  };

  // --- MODE 2: XỬ LÝ TYPING MODE ---
  const handleCheckTyping = () => {
    if (!currentCard) return;
    const target = (currentCard.korean || currentCard.japanese || "").trim().toLowerCase();
    const typed = typingInput.trim().toLowerCase();

    if (typed === target) {
      setTypingResult("correct");
      handlePlayAudio(currentCard.korean || frontWord);
      // Đánh giá Good trên SRS
      reviewCardSRS(currentCard.id, 3, deck?.id);
      setTimeout(() => {
        handleNext();
      }, 900);
    } else {
      setTypingResult("wrong");
      // Đánh giá Again trên SRS
      reviewCardSRS(currentCard.id, 1, deck?.id);
    }
  };

  const handleInsertVirtualKey = (char: string) => {
    setTypingInput((prev) => prev + char);
    if (typingInputRef.current) {
      typingInputRef.current.focus();
    }
  };

  const handleBackspaceVirtualKey = () => {
    setTypingInput((prev) => prev.slice(0, -1));
    if (typingInputRef.current) {
      typingInputRef.current.focus();
    }
  };

  // --- MODE 3: XỬ LÝ SPEED MATCH GAME ---
  const initializeMatchGame = useCallback(() => {
    const cards = deck?.cards || [];
    if (!deck || cards.length === 0) return;
    // Chọn 6 thẻ bất kỳ để tạo 12 ô ghép
    const shuffledCards = [...cards].sort(() => 0.5 - Math.random()).slice(0, 6);
    const tiles: MatchCardItem[] = [];

    shuffledCards.forEach((c) => {
      tiles.push({
        id: `ko-${c.id}`,
        cardId: c.id,
        text: c.korean || c.japanese || "",
        lang: "ko",
        isMatched: false,
      });
      tiles.push({
        id: `vn-${c.id}`,
        cardId: c.id,
        text: c.vietnamese,
        lang: "vn",
        isMatched: false,
      });
    });

    setMatchTiles(tiles.sort(() => 0.5 - Math.random()));
    setSelectedTiles([]);
    setMatchScore(0);
    setMatchSeconds(0);
    setIsMatchTimerActive(true);
  }, [deck]);

  useEffect(() => {
    if (studyMode === "match") {
      initializeMatchGame();
    } else {
      setIsMatchTimerActive(false);
    }
  }, [studyMode, initializeMatchGame]);

  // Bộ đếm thời gian cho game ghép từ
  useEffect(() => {
    let timer: any = null;
    if (isMatchTimerActive) {
      timer = setInterval(() => {
        setMatchSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isMatchTimerActive]);

  const handleSelectTile = (tile: MatchCardItem) => {
    if (tile.isMatched || selectedTiles.some((t) => t.id === tile.id)) return;

    if (selectedTiles.length === 0) {
      setSelectedTiles([tile]);
      if (tile.lang === "ko") speakText(tile.text, "ko-KR");
    } else if (selectedTiles.length === 1) {
      const first = selectedTiles[0];
      const second = tile;
      setSelectedTiles([first, second]);

      if (first.cardId === second.cardId && first.lang !== second.lang) {
        // MATCH ĐÚNG
        setTimeout(() => {
          setMatchTiles((prev) =>
            prev.map((t) =>
              t.cardId === first.cardId ? { ...t, isMatched: true } : t
            )
          );
          setSelectedTiles([]);
          setMatchScore((s) => s + 10);

          // Kiểm tra xem đã hoàn thành hết chưa
          setMatchTiles((latest) => {
            const allDone = latest.every((t) => t.isMatched || t.cardId === first.cardId);
            if (allDone) {
              setIsMatchTimerActive(false);
            }
            return latest;
          });
        }, 300);
      } else {
        // MATCH SAI
        setTimeout(() => {
          setSelectedTiles([]);
        }, 700);
      }
    }
  };

  // --- MODE 4: QUICK QUIZ ---
  const quizOptions = useMemo(() => {
    if (!currentCard || !deck) return [];
    const correctMeaning = currentCard.vietnamese;
    const others = (deck.cards || [])
      .filter((c) => c.id !== currentCard.id && c.vietnamese !== correctMeaning)
      .map((c) => c.vietnamese)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    return [correctMeaning, ...others].sort(() => 0.5 - Math.random());
  }, [currentCard, deck]);

  const handleSelectQuizOption = (option: string) => {
    if (quizAnswerChecked || !currentCard) return;
    setQuizSelectedOption(option);
    setQuizAnswerChecked(true);

    if (option === currentCard.vietnamese) {
      setQuizScore((s) => s + 1);
      reviewCardSRS(currentCard.id, 3, deck?.id);
      handlePlayAudio(currentCard.korean || frontWord);
    } else {
      reviewCardSRS(currentCard.id, 1, deck?.id);
    }
  };

  // Keyboard Shortcuts (Space lật thẻ, 1, 2, 3, 4 chọn mức SRS)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["input", "textarea", "select"].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }

      if (studyMode === "flashcard") {
        if (e.code === "Space") {
          e.preventDefault();
          handleFlip();
        } else if (e.code === "ArrowRight") {
          e.preventDefault();
          handleNext();
        } else if (e.code === "ArrowLeft") {
          e.preventDefault();
          handlePrev();
        } else if (isFlipped) {
          if (e.key === "1") handleReviewSRS(1);
          if (e.key === "2") handleReviewSRS(2);
          if (e.key === "3") handleReviewSRS(3);
          if (e.key === "4") handleReviewSRS(4);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [studyMode, isFlipped, handleFlip, handleNext, handlePrev, handleReviewSRS]);

  if (!deck) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Không tìm thấy bộ thẻ</h2>
        <Button onClick={onBack} variant="outline" className="rounded-xl">
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
        </Button>
      </div>
    );
  }

  const totalCards = cardOrder.length;
  const progressPercent = totalCards > 0 ? Math.round(((currentIndex + 1) / totalCards) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between pb-10">
      {/* Top Navbar */}
      <div className="border-b bg-card sticky top-0 z-30 shadow-2xs px-4 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-8 rounded-xl px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span>Thoát</span>
            </Button>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <h2 className="font-bold text-xs sm:text-sm text-foreground truncate max-w-[200px] sm:max-w-xs">
              {deck.title}
            </h2>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-0.5 rounded-xl bg-muted border text-xs">
            <button
              onClick={() => setStudyMode("flashcard")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                studyMode === "flashcard"
                  ? "bg-background text-primary shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🃏 Thẻ lật SRS
            </button>
            <button
              onClick={() => setStudyMode("typing")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                studyMode === "typing"
                  ? "bg-background text-primary shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ⌨️ Gõ chính tả
            </button>
            <button
              onClick={() => setStudyMode("match")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                studyMode === "match"
                  ? "bg-background text-primary shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ⚡ Ghép thẻ
            </button>
            <button
              onClick={() => setStudyMode("quiz")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                studyMode === "quiz"
                  ? "bg-background text-primary shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🎯 Trắc nghiệm
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 flex flex-col justify-center">
        {/* Màn hình hoàn thành (Finished View) */}
        {isFinished ? (
          <div className="bg-card border rounded-3xl p-8 text-center shadow-lg space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-foreground">
                Chúc mừng bạn đã hoàn thành phiên học!
              </h2>
              <p className="text-sm text-muted-foreground">
                Tiến độ của các từ vựng đã được cập nhật tự động vào thuật toán lặp lại ngắt quãng SRS.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-3 flex-wrap">
              <Button
                onClick={() => {
                  setCurrentIndex(0);
                  setIsFlipped(false);
                  setIsFinished(false);
                }}
                className="rounded-xl gap-2 font-semibold shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Học lại bộ thẻ này</span>
              </Button>
              <Button onClick={onBack} variant="outline" className="rounded-xl">
                <span>Quay về danh sách</span>
              </Button>
            </div>
          </div>
        ) : studyMode === "match" ? (
          /* ============================================================ */
          /* MODE 3: SPEED MATCH GAME                                     */
          /* ============================================================ */
          <div className="space-y-5">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">
                  {matchSeconds} giây
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold text-foreground">
                  Điểm: {matchScore}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={initializeMatchGame}
                className="h-8 rounded-xl text-xs gap-1"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Chơi ván mới
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {matchTiles.map((tile) => {
                const isSelected = selectedTiles.some((t) => t.id === tile.id);
                if (tile.isMatched) {
                  return (
                    <div
                      key={tile.id}
                      className="h-20 rounded-2xl border border-dashed border-emerald-500/20 bg-emerald-500/5 opacity-40 flex items-center justify-center text-xs font-semibold text-emerald-600 line-through"
                    >
                      {tile.text}
                    </div>
                  );
                }

                return (
                  <button
                    key={tile.id}
                    type="button"
                    onClick={() => handleSelectTile(tile)}
                    className={`h-20 rounded-2xl border p-3 flex items-center justify-center text-center font-bold transition-all shadow-xs active:scale-95 cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-md scale-102"
                        : "bg-card text-foreground hover:border-primary/50 hover:bg-muted/40"
                    } ${tile.lang === "ko" ? "text-base sm:text-lg" : "text-xs sm:text-sm font-medium"}`}
                  >
                    {tile.text}
                  </button>
                );
              })}
            </div>
          </div>
        ) : studyMode === "typing" ? (
          /* ============================================================ */
          /* MODE 2: TYPING & SPELLING MODE                               */
          /* ============================================================ */
          <div className="space-y-6">
            <div className="bg-card border rounded-3xl p-6 sm:p-8 shadow-md text-center space-y-4">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                Nghĩa tiếng Việt
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                {currentCard?.vietnamese}
              </h3>

              {currentCard?.exampleSentence && (
                <div className="p-3 bg-muted/40 rounded-2xl text-xs text-muted-foreground max-w-md mx-auto">
                  <span className="font-semibold text-foreground">Ví dụ: </span>
                  {currentCard.exampleSentence}
                  <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                    {currentCard.exampleTranslation}
                  </div>
                </div>
              )}

              {/* Ô gõ từ tiếng Hàn */}
              <div className="max-w-md mx-auto space-y-3 pt-2">
                <div className="relative">
                  <input
                    ref={typingInputRef}
                    type="text"
                    value={typingInput}
                    onChange={(e) => {
                      setTypingInput(e.target.value);
                      setTypingResult(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleCheckTyping();
                      }
                    }}
                    placeholder="Gõ từ tiếng Hàn tương ứng..."
                    className={`w-full h-12 px-4 text-center text-lg font-bold rounded-2xl border bg-background text-foreground transition-all shadow-inner focus:outline-hidden ${
                      typingResult === "correct"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                        : typingResult === "wrong"
                        ? "border-destructive bg-destructive/10 text-destructive"
                        : "focus:border-primary"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(currentCard?.korean)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary cursor-pointer p-1"
                    title="Nghe từ mẫu"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Kết quả chấm */}
                {typingResult === "correct" && (
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" /> Chính xác tuyệt đối!
                  </p>
                )}

                {typingResult === "wrong" && (
                  <div className="text-xs text-destructive space-y-1 animate-in fade-in">
                    <p className="font-bold">Chưa chính xác!</p>
                    <p className="text-foreground">
                      Đáp án đúng là:{" "}
                      <span className="font-extrabold text-primary text-sm">
                        {currentCard?.korean || currentCard?.japanese}
                      </span>
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <Button
                    onClick={handleCheckTyping}
                    className="rounded-xl px-6 font-semibold shadow-xs cursor-pointer"
                  >
                    <Check className="w-4 h-4 mr-1.5" />
                    Kiểm tra
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setShowVirtualKeyboard((prev) => !prev)}
                    className="rounded-xl text-xs gap-1.5 cursor-pointer"
                  >
                    <Keyboard className="w-4 h-4" />
                    <span>{showVirtualKeyboard ? "Ẩn bàn phím" : "Bàn phím ảo Hangeul"}</span>
                  </Button>
                </div>
              </div>

              {/* Bàn phím ảo tiếng Hàn */}
              {showVirtualKeyboard && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-150">
                  <KoreanVirtualKeyboard
                    onInsertChar={handleInsertVirtualKey}
                    onBackspace={handleBackspaceVirtualKey}
                    onSubmit={handleCheckTyping}
                  />
                </div>
              )}
            </div>
          </div>
        ) : studyMode === "quiz" ? (
          /* ============================================================ */
          /* MODE 4: QUICK QUIZ                                           */
          /* ============================================================ */
          <div className="space-y-6">
            <div className="bg-card border rounded-3xl p-6 sm:p-8 shadow-md text-center space-y-6">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Câu hỏi {currentIndex + 1}/{totalCards}</span>
                <span className="font-bold text-primary">Điểm: {quizScore}</span>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Chọn nghĩa tiếng Việt chính xác
                </span>
                <div className="flex items-center justify-center gap-3">
                  <h3 className="text-3xl sm:text-4xl font-black text-primary">
                    {currentCard?.korean || frontWord}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(currentCard?.korean || frontWord)}
                    className="w-9 h-9 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
                {currentCard?.romaji && (
                  <p className="text-xs text-muted-foreground font-mono">
                    [{currentCard.romaji}]
                  </p>
                )}
              </div>

              {/* 4 Phương án lựa chọn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto pt-2">
                {quizOptions.map((opt, i) => {
                  const isSelected = quizSelectedOption === opt;
                  const isCorrect = opt === currentCard?.vietnamese;

                  let btnStyle = "bg-muted/50 hover:bg-muted text-foreground border-border";
                  if (quizAnswerChecked) {
                    if (isCorrect) {
                      btnStyle = "bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold";
                    } else if (isSelected && !isCorrect) {
                      btnStyle = "bg-destructive/15 border-destructive text-destructive line-through";
                    }
                  }

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={quizAnswerChecked}
                      onClick={() => handleSelectQuizOption(opt)}
                      className={`p-3.5 rounded-2xl border text-left text-sm font-semibold transition-all shadow-2xs flex items-center justify-between cursor-pointer ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {quizAnswerChecked && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {quizAnswerChecked && (
                <div className="pt-2 animate-in fade-in">
                  <Button onClick={handleNext} className="rounded-xl px-6 font-semibold shadow-xs">
                    Câu tiếp theo <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* MODE 1: SMART SRS FLIP FLASHCARD                             */
          /* ============================================================ */
          <div className="space-y-6">
            {/* Thanh tiến độ */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold">
                Thẻ {currentIndex + 1} / {totalCards}
              </span>
              <div className="flex items-center gap-2">
                {currentCard?.state && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold ${
                      currentCard.state === "MASTERED"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : currentCard.state === "REVIEW"
                        ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    }`}
                  >
                    {currentCard.state === "MASTERED"
                      ? "Đã nắm vững"
                      : currentCard.state === "REVIEW"
                      ? "Đang ôn tập"
                      : "Từ mới"}
                  </Badge>
                )}
                <span>{progressPercent}%</span>
              </div>
            </div>

            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* 3D Flip Card Container */}
            <div
              onClick={handleFlip}
              className="relative w-full h-80 sm:h-96 rounded-3xl border shadow-lg bg-card cursor-pointer select-none transition-all duration-300 hover:shadow-xl hover:border-primary/40 flex flex-col justify-between p-6 sm:p-8"
            >
              {/* Card Top: Audio + Hint */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayAudio();
                  }}
                  className="w-10 h-10 rounded-2xl bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                  title="Nghe phát âm chuẩn"
                >
                  <Volume2 className="w-5 h-5" />
                </button>

                <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{isFlipped ? "Mặt sau (Nghĩa)" : "Mặt trước (Bấm để lật)"}</span>
                </span>
              </div>

              {/* Card Body */}
              <div className="my-auto text-center space-y-3">
                {!isFlipped ? (
                  <div className="space-y-2 animate-in fade-in duration-200">
                    <h3 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
                      {currentCard?.korean || frontWord}
                    </h3>
                    {currentCard?.romaji && (
                      <p className="text-sm font-mono text-muted-foreground">
                        [{currentCard.romaji}]
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <h3 className="text-2xl sm:text-4xl font-extrabold text-primary tracking-tight">
                      {backWord}
                    </h3>
                    {currentCard?.exampleSentence && (
                      <div className="p-3 bg-muted/50 rounded-2xl text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                        <p className="font-semibold text-foreground">
                          {currentCard.exampleSentence}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {currentCard.exampleTranslation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Bottom: Shortcut hint */}
              <div className="text-center text-[11px] text-muted-foreground">
                Nhấn <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono">Space</kbd> để lật thẻ
              </div>
            </div>

            {/* SRS Action Buttons (Hiển thị sau khi lật thẻ) */}
            {isFlipped ? (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <span className="text-xs text-center block text-muted-foreground font-semibold">
                  Mức độ ghi nhớ của bạn (Thuật toán SRS SM-2):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleReviewSRS(1)}
                    className="p-3 rounded-2xl border border-destructive/30 bg-destructive/10 hover:bg-destructive hover:text-destructive-foreground text-destructive flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <span className="font-extrabold text-sm">[1] Quên</span>
                    <span className="text-[10px] opacity-80">&lt; 10 phút</span>
                  </button>

                  <button
                    onClick={() => handleReviewSRS(2)}
                    className="p-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-600 dark:text-amber-400 flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <span className="font-extrabold text-sm">[2] Khó</span>
                    <span className="text-[10px] opacity-80">1 ngày</span>
                  </button>

                  <button
                    onClick={() => handleReviewSRS(3)}
                    className="p-3 rounded-2xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-600 dark:text-blue-400 flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <span className="font-extrabold text-sm">[3] Tốt</span>
                    <span className="text-[10px] opacity-80">3 ngày</span>
                  </button>

                  <button
                    onClick={() => handleReviewSRS(4)}
                    className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <span className="font-extrabold text-sm">[4] Dễ</span>
                    <span className="text-[10px] opacity-80">6 ngày</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="rounded-xl flex-1 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Thẻ trước
                </Button>

                <Button
                  onClick={handleFlip}
                  className="rounded-xl flex-1 font-semibold shadow-xs cursor-pointer"
                >
                  Lật xem nghĩa
                </Button>

                <Button
                  variant="outline"
                  onClick={handleNext}
                  className="rounded-xl flex-1 cursor-pointer"
                >
                  Thẻ tiếp theo <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls / Filter Bar */}
      <div className="max-w-3xl w-full mx-auto px-4 flex items-center justify-between gap-2 text-xs text-muted-foreground pt-4 border-t">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" />
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as any)}
            className="bg-transparent border rounded-lg px-2 py-1 text-foreground cursor-pointer"
          >
            <option value="all">Tất cả ({(deck.cards || []).length})</option>
            <option value="due">Cần ôn hôm nay</option>
            <option value="unmastered">Chưa thuộc</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShuffle}
            className="h-8 rounded-lg text-xs gap-1 cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Xáo trộn</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => resetDeckProgress(deck.id)}
            className="h-8 rounded-lg text-xs gap-1 text-muted-foreground hover:text-destructive cursor-pointer"
            title="Đặt lại toàn bộ tiến độ của bộ thẻ này"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

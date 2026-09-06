import { useState, useMemo } from "react";
import {
  X,
  Search,
  Volume2,
  CheckCircle2,
  XCircle,
  BookOpen,
  Filter,
  Play,
  RotateCcw,
} from "lucide-react";
import type { FlashcardDeck } from "@/types/flashcard.types.ts";
import { useFlashcardStore } from "@/stores/useFlashcardStore.ts";
import { speakText } from "@/lib/speechUtils.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";

interface DeckDetailModalProps {
  deck: FlashcardDeck | null;
  isOpen: boolean;
  onClose: () => void;
  onStartStudy: (deckId: string) => void;
}

export function DeckDetailModal({
  deck,
  isOpen,
  onClose,
  onStartStudy,
}: DeckDetailModalProps) {
  const { toggleCardMastered, resetDeckProgress } = useFlashcardStore();
  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState<"ALL" | "MASTERED" | "UNMASTERED">("ALL");

  if (!isOpen || !deck) return null;

  const filteredCards = deck.cards.filter((c) => {
    const matchesSearch =
      !search.trim() ||
      c.vietnamese.toLowerCase().includes(search.toLowerCase()) ||
      c.english.toLowerCase().includes(search.toLowerCase()) ||
      c.japanese.toLowerCase().includes(search.toLowerCase()) ||
      (c.romaji && c.romaji.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterState === "MASTERED") return c.mastered;
    if (filterState === "UNMASTERED") return !c.mastered;
    return true;
  });

  const masteredCount = deck.cards.filter((c) => c.mastered).length;
  const progressPercent =
    deck.cards.length > 0 ? Math.round((masteredCount / deck.cards.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/30">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-[10px] font-bold">
                {deck.type === "VOCABULARY" ? "Từ vựng" : "Mẫu câu"}
              </Badge>
              <h2 className="text-base font-bold text-foreground truncate max-w-md">
                {deck.title}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Đã thuộc {masteredCount}/{deck.cards.length} thẻ ({progressPercent}%)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                onClose();
                onStartStudy(deck.id);
              }}
              className="rounded-xl gap-1.5 font-semibold cursor-pointer shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Học thẻ ngay</span>
            </Button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b bg-background flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm từ vựng, câu, romaji..."
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
            <div className="flex items-center p-1 bg-muted rounded-xl border text-xs">
              <button
                onClick={() => setFilterState("ALL")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterState === "ALL" ? "bg-card shadow-xs text-foreground" : "text-muted-foreground"
                }`}
              >
                Tất cả ({deck.cards.length})
              </button>
              <button
                onClick={() => setFilterState("UNMASTERED")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterState === "UNMASTERED" ? "bg-card shadow-xs text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                }`}
              >
                Chưa thuộc ({deck.cards.length - masteredCount})
              </button>
              <button
                onClick={() => setFilterState("MASTERED")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterState === "MASTERED" ? "bg-card shadow-xs text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                }`}
              >
                Đã thuộc ({masteredCount})
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.confirm("Bạn có chắc muốn đặt lại toàn bộ tiến độ của bộ thẻ này?")) {
                  resetDeckProgress(deck.id);
                }
              }}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-xl"
              title="Đặt lại tiến độ"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Cards Table */}
        <div className="p-4 overflow-y-auto flex-1">
          {filteredCards.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              Không tìm thấy thẻ nào phù hợp với bộ lọc.
            </div>
          ) : (
            <div className="border rounded-2xl overflow-hidden bg-card text-xs">
              <table className="w-full text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b text-[11px]">
                  <tr>
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3">日本語 (Tiếng Nhật)</th>
                    <th className="p-3">English (Tiếng Anh)</th>
                    <th className="p-3">Tiếng Việt</th>
                    <th className="p-3 w-28 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCards.map((card, idx) => (
                    <tr key={card.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 text-center text-muted-foreground font-mono">
                        {idx + 1}
                      </td>
                      <td className="p-3 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="text-foreground text-sm font-semibold">
                            {card.japanese}
                          </span>
                          <button
                            onClick={() => speakText(card.japanese, "ja-JP")}
                            className="w-6 h-6 rounded-md hover:bg-muted text-muted-foreground hover:text-primary flex items-center justify-center transition-colors cursor-pointer"
                            title="Phát âm tiếng Nhật"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {card.romaji && (
                          <span className="text-[11px] text-muted-foreground font-mono block">
                            {card.romaji}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-foreground">
                        <div className="flex items-center gap-1.5">
                          <span>{card.english}</span>
                          <button
                            onClick={() => speakText(card.english, "en-US")}
                            className="w-6 h-6 rounded-md hover:bg-muted text-muted-foreground hover:text-blue-500 flex items-center justify-center transition-colors cursor-pointer"
                            title="Phát âm tiếng Anh"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="p-3 font-medium text-foreground">{card.vietnamese}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleCardMastered(deck.id, card.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-all ${
                            card.mastered
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {card.mastered ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Đã thuộc
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              Chưa thuộc
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import {
  Volume2,
  BookmarkPlus,
  Check,
  X,
  Sparkles,
  BookOpen,
  Loader2,
} from "lucide-react";
import { speakText } from "@/lib/speechUtils.ts";
import { flashcardService } from "@/services/flashcardService.ts";
import { useAuthStore } from "@/stores/useAuthStore.ts";
import { useFlashcardStore } from "@/stores/useFlashcardStore.ts";

// Từ điển nhanh các từ vựng tiếng Hàn phổ biến thông dụng
const QUICK_KO_DICT: Record<string, { vn: string; romaji?: string; ex?: string; exVn?: string }> = {
  음식: { vn: "Thức ăn, món ăn", romaji: "eumsik", ex: "음식이 맛있어요.", exVn: "Món ăn ngon." },
  요리: { vn: "Món ăn, nấu nướng", romaji: "yori" },
  요리하다: { vn: "Nấu ăn", romaji: "yorihada" },
  밥: { vn: "Cơm, bữa cơm", romaji: "bap" },
  물: { vn: "Nước uống", romaji: "mul" },
  불고기: { vn: "Thịt nướng Bulgogi", romaji: "bulgogi" },
  김치: { vn: "Kim chi", romaji: "gimchi" },
  김치찌개: { vn: "Canh kim chi", romaji: "gimchijjigae" },
  비빔밥: { vn: "Cơm trộn", romaji: "bibimbap" },
  맛있다: { vn: "Ngon", romaji: "masitta" },
  맛없다: { vn: "Dở, không ngon", romaji: "madeopda" },
  맵다: { vn: "Cay", romaji: "maepda" },
  달다: { vn: "Ngọt", romaji: "dalda" },
  짜다: { vn: "Mặn", romaji: "jjada" },
  싱겁다: { vn: "Nhạt, lạt", romaji: "singgeopda" },
  식당: { vn: "Nhà hàng, quán ăn", romaji: "sikdang" },
  메뉴: { vn: "Thực đơn", romaji: "menyu" },
  주문하다: { vn: "Gọi món, đặt hàng", romaji: "jumunhada" },
  계산하다: { vn: "Tính tiền, thanh toán", romaji: "gyesanhada" },
  숟가락: { vn: "Cái thìa, muỗng", romaji: "sutgarak" },
  젓가락: { vn: "Đôi đũa", romaji: "jeotgarak" },
  영수증: { vn: "Hóa đơn", romaji: "yeongsujeung" },
  안녕하세요: { vn: "Xin chào (lịch sự)", romaji: "annyeonghaseyo" },
  감사합니다: { vn: "Xin cảm ơn", romaji: "gamsahamnida" },
  죄송합니다: { vn: "Xin lỗi (trang trọng)", romaji: "joesonghamnida" },
  괜찮아요: { vn: "Không sao đâu", romaji: "gwaenchanayo" },
  얼마예요: { vn: "Bao nhiêu tiền ạ?", romaji: "eolmayeyo" },
  선생님: { vn: "Thầy giáo / Cô giáo", romaji: "seonsaengnim" },
  학생: { vn: "Học sinh, sinh viên", romaji: "haksaeng" },
  한국어: { vn: "Tiếng Hàn Quốc", romaji: "hangugeo" },
  한국: { vn: "Hàn Quốc", romaji: "hanguk" },
  베트남: { vn: "Việt Nam", romaji: "beteunam" },
  학교: { vn: "Trường học", romaji: "hakgyo" },
  친구: { vn: "Bạn bè", romaji: "chingu" },
  책: { vn: "Quyển sách", romaji: "chaek" },
  공부하다: { vn: "Học tập", romaji: "gongbuhada" },
  가다: { vn: "Đi", romaji: "gada" },
  오다: { vn: "Đến", romaji: "oda" },
  보다: { vn: "Xem, nhìn", romaji: "boda" },
  읽다: { vn: "Đọc", romaji: "ikda" },
  쓰다: { vn: "Viết, dùng, đắng", romaji: "sseuda" },
  듣다: { vn: "Nghe", romaji: "deutta" },
  말하다: { vn: "Nói", romaji: "malhada" },
};

export function KoreanWordInspector() {
  const { user } = useAuthStore();
  const { addCard } = useFlashcardStore();
  const [selectedWord, setSelectedWord] = useState<string>("");
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customMeaning, setCustomMeaning] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  // Lắng nghe sự kiện bôi đen văn bản trên trang
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // Nếu click bên trong popover -> không đóng
      if (popoverRef.current && popoverRef.current.contains(e.target as Node)) {
        return;
      }

      const selection = window.getSelection();
      const text = selection?.toString().trim();

      // Kiểm tra có ký tự tiếng Hàn không (Hangeul unicode range: AC00 - D7AF hoặc 1100 - 11FF)
      const hasKorean = text && /[\uac00-\ud7af\u1100-\u11ff]/.test(text);

      if (hasKorean && text.length <= 30) {
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();

        if (rect) {
          const cleanWord = text.replace(/^[^\uac00-\ud7af]+|[^\uac00-\ud7af]+$/g, "");
          setSelectedWord(cleanWord || text);

          // Lấy nghĩa sẵn nếu có trong từ điển nhanh
          const match = cleanWord && QUICK_KO_DICT[cleanWord];
          setCustomMeaning(match ? match.vn : "");
          setIsSaved(false);

          // Căn tọa độ an toàn không tràn màn hình
          const posX = Math.min(Math.max(10, rect.left + rect.width / 2 - 140), window.innerWidth - 300);
          const posY = rect.bottom + window.scrollY + 8;

          setPosition({ x: posX, y: posY });
        }
      } else {
        // Nếu không có selection hoặc không phải tiếng Hàn -> ẩn
        setPosition(null);
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  if (!position || !selectedWord) return null;

  const matchData = QUICK_KO_DICT[selectedWord];
  const meaningText = customMeaning || matchData?.vn || "Từ tiếng Hàn (bấm để thêm vào sổ từ)";

  const handleSpeak = () => {
    speakText(selectedWord, "ko-KR", 0.85);
  };

  const handleSaveToFlashcard = async () => {
    if (!selectedWord) return;
    setIsSaving(true);
    try {
      const finalMeaning = customMeaning || matchData?.vn || "Từ vựng tra nhanh trong đề thi";
      const romaji = matchData?.romaji || "";
      const ex = matchData?.ex || "";
      const exVn = matchData?.exVn || "";

      // Lưu lên Cloud hoặc Local qua useFlashcardStore
      await addCard("personal", {
        korean: selectedWord,
        vietnamese: finalMeaning,
        romaji: romaji,
        exampleSentence: ex,
        exampleTranslation: exVn,
      });

      setIsSaved(true);
    } catch (err) {
      console.error("Lỗi lưu từ:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      ref={popoverRef}
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999,
      }}
      className="w-72 bg-card/95 backdrop-blur-md border border-border shadow-xl rounded-2xl p-3.5 text-foreground animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            한
          </div>
          <span className="font-extrabold text-base tracking-tight text-primary">
            {selectedWord}
          </span>
          <button
            type="button"
            onClick={handleSpeak}
            className="w-7 h-7 rounded-full hover:bg-muted text-muted-foreground hover:text-primary flex items-center justify-center transition-all cursor-pointer"
            title="Nghe phát âm chuẩn"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setPosition(null)}
          className="w-5 h-5 rounded-full hover:bg-muted text-muted-foreground flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {matchData?.romaji && (
        <p className="text-[11px] text-muted-foreground mb-1 font-mono">
          [{matchData.romaji}]
        </p>
      )}

      {/* Nghĩa của từ */}
      <div className="bg-muted/50 rounded-xl p-2 mb-2.5 text-xs text-foreground/90 font-medium">
        <p>{meaningText}</p>
        {matchData?.ex && (
          <p className="text-[11px] text-muted-foreground mt-1 pt-1 border-t border-border/50">
            <span className="font-medium text-foreground">{matchData.ex}</span>
            <br />
            {matchData.exVn}
          </p>
        )}
      </div>

      {/* Nút 1-Click lưu vào Flashcard cá nhân */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={isSaving || isSaved}
          onClick={handleSaveToFlashcard}
          className={`flex-1 h-8 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            isSaved
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
              : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs active:scale-98"
          }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Đang lưu...</span>
            </>
          ) : isSaved ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Đã lưu vào Sổ từ vựng!</span>
            </>
          ) : (
            <>
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>+ Lưu vào Flashcard</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

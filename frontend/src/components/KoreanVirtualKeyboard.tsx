import React, { useState } from "react";
import { Delete, CornerDownLeft, Space } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

interface KoreanVirtualKeyboardProps {
  onInsertChar: (char: string) => void;
  onBackspace: () => void;
  onSubmit?: () => void;
}

export function KoreanVirtualKeyboard({
  onInsertChar,
  onBackspace,
  onSubmit,
}: KoreanVirtualKeyboardProps) {
  const [isShift, setIsShift] = useState(false);

  // Layout 2-beolsik chuẩn
  const row1Normal = ["ㅂ", "ㅈ", "ㄷ", "ㄱ", "ㅅ", "ㅛ", "ㅕ", "ㅑ", "ㅐ", "ㅔ"];
  const row1Shift = ["ㅃ", "ㅉ", "ㄸ", "ㄲ", "ㅆ", "ㅛ", "ㅕ", "ㅑ", "ㅒ", "ㅖ"];

  const row2 = ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"];
  const row3 = ["ㅋ", "ㅌ", "ㅊ", "ㅍ", "ㅠ", "ㅜ", "ㅡ"];

  const currentRow1 = isShift ? row1Shift : row1Normal;

  const handleKeyClick = (char: string) => {
    onInsertChar(char);
    if (isShift) setIsShift(false); // tự động hạ Shift sau khi nhấn
  };

  return (
    <div className="w-full max-w-xl mx-auto p-2 sm:p-3 bg-muted/60 dark:bg-card/80 backdrop-blur-md rounded-2xl border shadow-md flex flex-col gap-1.5 select-none transition-all">
      <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground font-medium">
        <span>Bàn phím ảo tiếng Hàn (2-Beolsik)</span>
        <button
          type="button"
          onClick={() => setIsShift((prev) => !prev)}
          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
            isShift
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-background/80 hover:bg-background border text-foreground"
          }`}
        >
          Shift: {isShift ? "BẬT (ㅃ, ㅉ...)" : "TẮT"}
        </button>
      </div>

      {/* Row 1 */}
      <div className="flex justify-center gap-1 sm:gap-1.5">
        {currentRow1.map((char) => (
          <button
            key={char}
            type="button"
            onClick={() => handleKeyClick(char)}
            className="flex-1 h-9 sm:h-10 rounded-lg bg-background hover:bg-primary hover:text-primary-foreground text-foreground border shadow-2xs font-semibold text-sm sm:text-base flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          >
            {char}
          </button>
        ))}
      </div>

      {/* Row 2 */}
      <div className="flex justify-center gap-1 sm:gap-1.5 px-2 sm:px-3">
        {row2.map((char) => (
          <button
            key={char}
            type="button"
            onClick={() => handleKeyClick(char)}
            className="flex-1 h-9 sm:h-10 rounded-lg bg-background hover:bg-primary hover:text-primary-foreground text-foreground border shadow-2xs font-semibold text-sm sm:text-base flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          >
            {char}
          </button>
        ))}
      </div>

      {/* Row 3 */}
      <div className="flex justify-center gap-1 sm:gap-1.5 px-3 sm:px-6">
        {row3.map((char) => (
          <button
            key={char}
            type="button"
            onClick={() => handleKeyClick(char)}
            className="flex-1 h-9 sm:h-10 rounded-lg bg-background hover:bg-primary hover:text-primary-foreground text-foreground border shadow-2xs font-semibold text-sm sm:text-base flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          >
            {char}
          </button>
        ))}
      </div>

      {/* Row 4: Controls (Space, Backspace, Submit) */}
      <div className="flex justify-center items-center gap-1.5 mt-0.5">
        <button
          type="button"
          onClick={() => setIsShift((prev) => !prev)}
          className={`h-9 px-3 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
            isShift ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-accent"
          }`}
        >
          ⇧ Shift
        </button>

        <button
          type="button"
          onClick={() => handleKeyClick(" ")}
          className="flex-1 h-9 rounded-lg bg-background hover:bg-accent text-foreground border shadow-2xs text-xs font-medium flex items-center justify-center gap-1 transition-all active:scale-98 cursor-pointer"
        >
          <Space className="w-3.5 h-3.5 opacity-60" />
          <span>Dấu cách</span>
        </button>

        <button
          type="button"
          onClick={onBackspace}
          className="h-9 px-3 rounded-lg bg-background hover:bg-destructive/10 hover:text-destructive text-foreground border shadow-2xs text-xs font-medium flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          title="Xóa ký tự cuối"
        >
          <Delete className="w-4 h-4" />
        </button>

        {onSubmit && (
          <Button
            type="button"
            size="sm"
            onClick={onSubmit}
            className="h-9 px-3.5 rounded-lg text-xs font-semibold gap-1 shadow-xs cursor-pointer"
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
            <span>Kiểm tra</span>
          </Button>
        )}
      </div>
    </div>
  );
}

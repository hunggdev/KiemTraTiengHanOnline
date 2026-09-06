import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Layers,
  HelpCircle,
  Download,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { parseFlashcardFile, guessColumnMapping } from "@/lib/fileParser.ts";
import { useFlashcardStore } from "@/stores/useFlashcardStore.ts";
import type { DeckType, ColumnMappingConfig, ParsedTableData, FlashcardItem } from "@/types/flashcard.types.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";

interface ImportDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deckId: string) => void;
}

export function ImportDeckModal({ isOpen, onClose, onSuccess }: ImportDeckModalProps) {
  const { addDeck } = useFlashcardStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deckType, setDeckType] = useState<DeckType>("VOCABULARY");
  const [deckTitle, setDeckTitle] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  const [hasHeader, setHasHeader] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedTableData | null>(null);

  const [mapping, setMapping] = useState<ColumnMappingConfig>({
    vietnameseColIndex: 0,
    englishColIndex: 1,
    japaneseColIndex: 2,
    romajiColIndex: 3,
  });

  if (!isOpen) return null;

  const handleFileChange = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await parseFlashcardFile(file);
      setParsedData(data);
      setHasHeader(data.hasHeader);

      // Tự động đặt tên bộ thẻ từ tên file nếu chưa nhập
      if (!deckTitle.trim()) {
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        setDeckTitle(baseName);
      }

      // Đoán cột tự động
      const guessed = guessColumnMapping(data.headers);
      setMapping(guessed);
    } catch (err: any) {
      console.error("File parse error:", err);
      setError(err?.message || "Không thể đọc file. Vui lòng kiểm tra định dạng!");
      setParsedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleCreateDeck = () => {
    if (!parsedData) {
      setError("Vui lòng tải lên file dữ liệu trước khi tạo bộ thẻ.");
      return;
    }

    if (!deckTitle.trim()) {
      setError("Vui lòng nhập tên cho bộ thẻ.");
      return;
    }

    // Lấy danh sách dòng dữ liệu
    const effectiveRows = hasHeader ? parsedData.rows : [parsedData.headers, ...parsedData.rows];

    if (effectiveRows.length === 0) {
      setError("Không có dòng dữ liệu nào để nhập.");
      return;
    }

    const cards: FlashcardItem[] = [];

    for (let i = 0; i < effectiveRows.length; i++) {
      const row = effectiveRows[i];
      const vi = row[mapping.vietnameseColIndex] || "";
      const en = row[mapping.englishColIndex] || "";
      const ja = row[mapping.japaneseColIndex] || "";
      const roma =
        mapping.romajiColIndex !== undefined && mapping.romajiColIndex >= 0
          ? row[mapping.romajiColIndex] || ""
          : "";

      // Bỏ qua dòng hoàn toàn trống
      if (!vi && !en && !ja) continue;

      cards.push({
        id: `card-${i + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        vietnamese: vi.trim(),
        english: en.trim(),
        japanese: ja.trim(),
        romaji: roma ? roma.trim() : undefined,
        mastered: false,
      });
    }

    if (cards.length === 0) {
      setError("Không thể trích xuất thẻ nào từ dữ liệu đã chọn. Hãy kiểm tra lại cấu hình gán cột.");
      return;
    }

    const created = addDeck({
      title: deckTitle.trim(),
      description: deckDescription.trim() || undefined,
      type: deckType,
      cards,
    });

    onClose();
    onSuccess(created.id);
  };

  const downloadSampleCsv = () => {
    let content = "";
    if (deckType === "VOCABULARY") {
      content =
        "Tiếng Việt,English,日本語,Romaji\n" +
        "Xin chào,Hello,こんにちは,Konnichiwa\n" +
        "Cảm ơn,Thank you,ありがとう,Arigatou\n" +
        "Tạm biệt,Goodbye,さようなら,Sayounara\n" +
        "Học sinh,Student,学生,Gakusei\n" +
        "Sách,Book,本,Hon";
    } else {
      content =
        "Tiếng Việt,English,日本語,Romaji\n" +
        "Cái này giá bao nhiêu?,How much is this?,これはいくらですか？,Kore wa ikura desu ka?\n" +
        "Cho tôi xin một cốc nước.,Please give me water.,お水をください。,Omizu o kudasai.\n" +
        "Rất vui được gặp bạn.,Nice to meet you.,はじめまして。,Hajimemashite.";
    }

    const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Mau_Flashcard_${deckType === "VOCABULARY" ? "TuVung" : "MauCau"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Xem trước các cột của 5 dòng đầu
  const effectiveRows = parsedData
    ? hasHeader
      ? parsedData.rows
      : [parsedData.headers, ...parsedData.rows]
    : [];
  const previewRows = effectiveRows.slice(0, 5);
  const columnOptions = parsedData ? (hasHeader ? parsedData.headers : parsedData.headers.map((_, i) => `Cột ${i + 1}`)) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Nhập bộ thẻ Flashcard mới</h2>
              <p className="text-xs text-muted-foreground">
                Hỗ trợ file .xlsx, .csv, .txt với cơ chế gán cột thông minh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* 1. Chọn loại bộ thẻ */}
          <div>
            <label className="text-xs font-bold text-foreground block mb-2">
              1. Loại bộ thẻ
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setDeckType("VOCABULARY")}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  deckType === "VOCABULARY"
                    ? "border-primary bg-primary/5 text-foreground shadow-xs"
                    : "border-border hover:border-primary/40 bg-card"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">Từ vựng (Vocabulary)</span>
                  {deckType === "VOCABULARY" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  Gồm 4 trường: Tiếng Việt, English, 日本語, Romaji.
                </p>
              </div>

              <div
                onClick={() => setDeckType("SENTENCE")}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  deckType === "SENTENCE"
                    ? "border-primary bg-primary/5 text-foreground shadow-xs"
                    : "border-border hover:border-primary/40 bg-card"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">Mẫu câu (Sentences)</span>
                  {deckType === "SENTENCE" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  Mẫu câu giao tiếp: VI – EN – JA (Romaji tuỳ chọn).
                </p>
              </div>
            </div>
          </div>

          {/* 2. Tải file */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-foreground">
                2. Tải file dữ liệu (.xlsx, .csv, .txt)
              </label>
              <button
                type="button"
                onClick={downloadSampleCsv}
                className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                Tải file mẫu .CSV
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.txt"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                parsedData
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-border hover:border-primary hover:bg-muted/30"
              }`}
            >
              {parsedData ? (
                <div className="space-y-1">
                  <FileSpreadsheet className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="font-bold text-sm text-foreground">{parsedData.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    Đã đọc thành công {parsedData.rows.length + (hasHeader ? 0 : 1)} dòng dữ liệu. Nhấn để đổi file khác.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <UploadCloud className="w-8 h-8 text-primary mx-auto opacity-80" />
                  <p className="font-semibold text-sm text-foreground">
                    Kéo thả file vào đây hoặc <span className="text-primary underline">chọn từ máy tính</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Chấp nhận file Excel (.xlsx, .xls), CSV hoặc TXT (phân cách bằng tab hoặc dấu phẩy)
                  </p>
                </div>
              )}
            </div>

            {/* Checkbox Dòng đầu là tiêu đề */}
            {parsedData && (
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  id="hasHeader"
                  checked={hasHeader}
                  onChange={(e) => setHasHeader(e.target.checked)}
                  className="rounded border-border cursor-pointer w-4 h-4 text-primary focus:ring-primary"
                />
                <label htmlFor="hasHeader" className="cursor-pointer font-medium select-none">
                  Dòng đầu tiên của file là Tiêu đề cột (Header)
                </label>
              </div>
            )}
          </div>

          {/* 3. Gán cột thông minh (Column Mapping) */}
          {parsedData && (
            <div className="space-y-3 p-4 rounded-2xl bg-muted/40 border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-primary" />
                  3. Gán cột dữ liệu vào các trường ngôn ngữ
                </label>
                <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                  Tự động đoán sẵn
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tiếng Việt */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Cột Tiếng Việt <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={mapping.vietnameseColIndex}
                    onChange={(e) =>
                      setMapping((prev) => ({ ...prev, vietnameseColIndex: Number(e.target.value) }))
                    }
                    className="w-full h-9 px-3 text-xs font-medium rounded-xl border bg-background"
                  >
                    {columnOptions.map((h, idx) => (
                      <option key={idx} value={idx}>
                        Cột {idx + 1}: {h || `(Cột ${idx + 1})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* English */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Cột English <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={mapping.englishColIndex}
                    onChange={(e) =>
                      setMapping((prev) => ({ ...prev, englishColIndex: Number(e.target.value) }))
                    }
                    className="w-full h-9 px-3 text-xs font-medium rounded-xl border bg-background"
                  >
                    {columnOptions.map((h, idx) => (
                      <option key={idx} value={idx}>
                        Cột {idx + 1}: {h || `(Cột ${idx + 1})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 日本語 */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Cột 日本語 (Tiếng Nhật) <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={mapping.japaneseColIndex}
                    onChange={(e) =>
                      setMapping((prev) => ({ ...prev, japaneseColIndex: Number(e.target.value) }))
                    }
                    className="w-full h-9 px-3 text-xs font-medium rounded-xl border bg-background"
                  >
                    {columnOptions.map((h, idx) => (
                      <option key={idx} value={idx}>
                        Cột {idx + 1}: {h || `(Cột ${idx + 1})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Romaji (tuỳ chọn) */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Cột Romaji / Phiên âm (Tuỳ chọn)
                  </label>
                  <select
                    value={mapping.romajiColIndex !== undefined ? mapping.romajiColIndex : -1}
                    onChange={(e) =>
                      setMapping((prev) => ({
                        ...prev,
                        romajiColIndex: Number(e.target.value) >= 0 ? Number(e.target.value) : undefined,
                      }))
                    }
                    className="w-full h-9 px-3 text-xs font-medium rounded-xl border bg-background"
                  >
                    <option value={-1}>-- Không có cột này --</option>
                    {columnOptions.map((h, idx) => (
                      <option key={idx} value={idx}>
                        Cột {idx + 1}: {h || `(Cột ${idx + 1})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bảng xem trước 5 dòng */}
              {previewRows.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-muted-foreground block mb-1.5">
                    Xem trước kết quả ánh xạ ({previewRows.length} dòng đầu):
                  </span>
                  <div className="border rounded-xl overflow-x-auto bg-card text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-muted/60 text-muted-foreground border-b text-[11px]">
                        <tr>
                          <th className="p-2 font-semibold">#</th>
                          <th className="p-2 font-semibold">Tiếng Việt</th>
                          <th className="p-2 font-semibold">English</th>
                          <th className="p-2 font-semibold">日本語</th>
                          <th className="p-2 font-semibold">Romaji</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {previewRows.map((r, i) => (
                          <tr key={i} className="hover:bg-muted/20">
                            <td className="p-2 text-muted-foreground">{i + 1}</td>
                            <td className="p-2 font-medium">{r[mapping.vietnameseColIndex] || "-"}</td>
                            <td className="p-2">{r[mapping.englishColIndex] || "-"}</td>
                            <td className="p-2 font-medium text-primary">{r[mapping.japaneseColIndex] || "-"}</td>
                            <td className="p-2 text-muted-foreground">
                              {mapping.romajiColIndex !== undefined && mapping.romajiColIndex >= 0
                                ? r[mapping.romajiColIndex] || "-"
                                : "(Trống)"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Thông tin bộ thẻ */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-foreground block">
              4. Đặt tên bộ thẻ
            </label>
            <div className="space-y-2">
              <Input
                placeholder="Ví dụ: Từ vựng N5 bài 1, Mẫu câu du lịch..."
                value={deckTitle}
                onChange={(e) => setDeckTitle(e.target.value)}
                className="h-10 rounded-xl"
              />
              <Input
                placeholder="Mô tả ghi chú (tuỳ chọn)..."
                value={deckDescription}
                onChange={(e) => setDeckDescription(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between bg-muted/20">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">
            Huỷ bỏ
          </Button>
          <Button
            onClick={handleCreateDeck}
            disabled={!parsedData || !deckTitle.trim()}
            className="rounded-xl gap-2 font-semibold shadow-xs cursor-pointer"
          >
            <span>Tạo bộ thẻ & Học ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

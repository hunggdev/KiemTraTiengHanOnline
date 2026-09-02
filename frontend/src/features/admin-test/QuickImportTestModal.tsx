import React, { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  Code2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Download,
  Copy,
  Check,
  Eye,
  Plus,
  Loader2,
  Clock,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog.tsx";
import { useCreateTest } from "@/stores/useTestStore.ts";
import type { CreateTestPayload, CreateQuestionPayload } from "@/types/admin-test.types.ts";

interface QuickImportTestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newTestId?: string | number) => void;
}

const SAMPLE_TEXT_TEMPLATE = `[TIÊU ĐỀ]: Bài kiểm tra Từ vựng & Ngữ pháp Tiếng Hàn Sơ Cấp
[THỜI GIAN]: 45
[KỸ NĂNG]: READING

Câu 1: Từ "선생님" trong tiếng Hàn có nghĩa là gì?
A. Học sinh
B. Giáo viên
C. Bác sĩ
D. Nhân viên công ty
Đáp án: B

Câu 2: Chọn từ thích hợp điền vào chỗ trống: "저는 베트남 사람____."
A. 입니다
B. 입니까
C. 은
D. 가
Đáp án: A

Câu 3: "안녕하세요" dùng trong trường hợp nào?
A. Chào hỏi khi gặp mặt
B. Tạm biệt khi về
C. Cảm ơn khi nhận quà
D. Xin lỗi khi làm sai
Đáp án: A

Câu 4: Nghĩa của từ "사과" là gì?
A. Quả chuối
B. Quả dâu
C. Quả táo / Lời xin lỗi
D. Quả dưa hấu
Đáp án: C

Câu 5: Chọn câu đúng ngữ pháp:
A. 저는 밥을 먹어요.
B. 저는 밥이 먹어요.
C. 저는 밥에 먹어요.
D. 저는 밥으로 먹어요.
Đáp án: A`;

const SAMPLE_JSON_TEMPLATE = JSON.stringify(
  {
    title: "Bài kiểm tra Tiếng Hàn 100 câu (Mẫu JSON)",
    description: "Bộ câu hỏi trắc nghiệm tiếng Hàn tổng hợp",
    durationMin: 60,
    isPublished: true,
    sections: [
      {
        skill: "READING",
        order: 1,
        durationMin: 60,
        questions: [
          {
            type: "MULTIPLE_CHOICE",
            order: 1,
            content: "Từ nào sau đây có nghĩa là 'Học sinh'?",
            score: 1,
            correctAnswer: "A",
            options: [
              { label: "A", content: "학생" },
              { label: "B", content: "선생님" },
              { label: "C", content: "의사" },
              { label: "D", content: "회사원" },
            ],
          },
          {
            type: "MULTIPLE_CHOICE",
            order: 2,
            content: "가: 반갑습니다.\n나: 네, ____________.",
            score: 1,
            correctAnswer: "C",
            options: [
              { label: "A", content: "안녕히 가세요" },
              { label: "B", content: "죄송합니다" },
              { label: "C", content: "반갑습니다" },
              { label: "D", content: "감사합니다" },
            ],
          },
        ],
      },
    ],
  },
  null,
  2
);

/**
 * Hàm phân tích cú pháp văn bản Text thô thành cấu trúc đề thi chuẩn
 */
export function parseTextToTestPayload(rawText: string): {
  payload: CreateTestPayload | null;
  questionsCount: number;
  errors: string[];
} {
  const errors: string[] = [];
  if (!rawText.trim()) {
    return { payload: null, questionsCount: 0, errors: ["Nội dung văn bản trống"] };
  }

  const lines = rawText.split(/\r?\n/);
  let title = "Bài kiểm tra nhanh tiếng Hàn";
  let durationMin = 45;
  let skill: "LISTENING" | "SPEAKING" | "READING" | "WRITING" = "READING";

  // Đọc metadata phần đầu
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("[TIÊU ĐỀ]:") || trimmed.startsWith("[TITLE]:")) {
      title = trimmed.replace(/^\[(TIÊU ĐỀ|TITLE)\]:\s*/i, "").trim() || title;
    } else if (trimmed.startsWith("[THỜI GIAN]:") || trimmed.startsWith("[DURATION]:")) {
      const num = parseInt(trimmed.replace(/^\[(THỜI GIAN|DURATION)\]:\s*/i, ""), 10);
      if (!isNaN(num) && num > 0) durationMin = num;
    } else if (trimmed.startsWith("[KỸ NĂNG]:") || trimmed.startsWith("[SKILL]:")) {
      const s = trimmed.replace(/^\[(KỸ NĂNG|SKILL)\]:\s*/i, "").toUpperCase();
      if (["LISTENING", "SPEAKING", "READING", "WRITING"].includes(s)) {
        skill = s as any;
      }
    }
  }

  // Tách câu hỏi dựa trên pattern "Câu 1:", "1.", "Câu 1." hoặc "Q1:"
  const rawQuestionsBlocks: string[] = [];
  let currentBlock: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Bỏ qua dòng header metadata
    if (
      trimmed.startsWith("[TIÊU ĐỀ]:") ||
      trimmed.startsWith("[THỜI GIAN]:") ||
      trimmed.startsWith("[KỸ NĂNG]:") ||
      trimmed.startsWith("[TITLE]:") ||
      trimmed.startsWith("[DURATION]:") ||
      trimmed.startsWith("[SKILL]:")
    ) {
      continue;
    }

    const isQuestionStart = /^(câu\s*\d+[:.]|\d+[:.]|q\d+[:.])/i.test(trimmed);

    if (isQuestionStart) {
      if (currentBlock.length > 0) {
        rawQuestionsBlocks.push(currentBlock.join("\n"));
        currentBlock = [];
      }
    }
    currentBlock.push(line);
  }

  if (currentBlock.length > 0) {
    rawQuestionsBlocks.push(currentBlock.join("\n"));
  }

  const parsedQuestions: CreateQuestionPayload[] = [];

  rawQuestionsBlocks.forEach((block, index) => {
    const bLines = block
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (bLines.length === 0) return;

    let content = "";
    const options: { label: string; content: string }[] = [];
    let correctAnswer = "";

    const contentLines: string[] = [];

    for (const line of bLines) {
      // Nhận diện dòng Đáp án: A hoặc ANSWER: A
      const answerMatch = line.match(/^(đáp án|answer|da|ans)[:.\s]+([A-D])/i);
      if (answerMatch) {
        correctAnswer = answerMatch[2].toUpperCase();
        continue;
      }

      // Nhận diện dòng Option: A. ... hoặc A) ... hoặc A: ...
      const optionMatch = line.match(/^([A-D])[\.\):]\s*(.*)$/i);
      if (optionMatch) {
        options.push({
          label: optionMatch[1].toUpperCase(),
          content: optionMatch[2].trim(),
        });
        continue;
      }

      contentLines.push(line);
    }

    // Làm sạch tiêu đề câu hỏi: bỏ tiền tố "Câu 1:", "1."
    if (contentLines.length > 0) {
      content = contentLines
        .join("\n")
        .replace(/^(câu\s*\d+[:.]|\d+[:.]|q\d+[:.])\s*/i, "")
        .trim();
    }

    if (!content) {
      errors.push(`Câu ${index + 1}: Không tìm thấy nội dung câu hỏi`);
      return;
    }

    if (options.length < 2) {
      errors.push(`Câu ${index + 1} (${content.slice(0, 25)}...): Cần ít nhất 2 phương án (A, B...)`);
      return;
    }

    if (!correctAnswer) {
      correctAnswer = options[0].label; // Mặc định A nếu chưa điền
    }

    parsedQuestions.push({
      type: "MULTIPLE_CHOICE",
      order: index + 1,
      content,
      score: 1,
      correctAnswer,
      options,
    });
  });

  if (parsedQuestions.length === 0) {
    return {
      payload: null,
      questionsCount: 0,
      errors: errors.length > 0 ? errors : ["Không nhận diện được câu hỏi nào theo định dạng hợp lệ."],
    };
  }

  const payload: CreateTestPayload = {
    title,
    description: `Đề thi tạo nhanh từ văn bản gồm ${parsedQuestions.length} câu hỏi`,
    durationMin,
    isPublished: true,
    sections: [
      {
        skill,
        order: 1,
        durationMin,
        questions: parsedQuestions,
      },
    ],
  };

  return {
    payload,
    questionsCount: parsedQuestions.length,
    errors,
  };
}

export function QuickImportTestModal({
  open,
  onOpenChange,
  onSuccess,
}: QuickImportTestModalProps) {
  const [tab, setTab] = useState<"text" | "json">("text");
  const [textContent, setTextContent] = useState(SAMPLE_TEXT_TEMPLATE);
  const [jsonContent, setJsonContent] = useState(SAMPLE_JSON_TEMPLATE);
  const [copied, setCopied] = useState(false);
  const [previewData, setPreviewData] = useState<CreateTestPayload | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [questionsCount, setQuestionsCount] = useState(0);

  const createTestMutation = useCreateTest();

  // Tự động phân tích nội dung khi mở modal hoặc thay đổi nội dung
  const runParser = (currentTab: "text" | "json", text: string, json: string) => {
    if (currentTab === "text") {
      const res = parseTextToTestPayload(text);
      setPreviewData(res.payload);
      setParseErrors(res.errors);
      setQuestionsCount(res.questionsCount);
    } else {
      try {
        const parsed = JSON.parse(json);
        if (!parsed.title || !parsed.sections) {
          throw new Error("JSON phải chứa thuộc tính 'title' và mảng 'sections'");
        }
        let totalQ = 0;
        parsed.sections.forEach((sec: any) => {
          totalQ += (sec.questions || []).length;
        });
        setPreviewData(parsed);
        setParseErrors([]);
        setQuestionsCount(totalQ);
      } catch (err: any) {
        setPreviewData(null);
        setParseErrors([`Lỗi cú pháp JSON: ${err.message}`]);
        setQuestionsCount(0);
      }
    }
  };

  useEffect(() => {
    if (open) {
      runParser(tab, textContent, jsonContent);
    }
  }, [open, tab, textContent, jsonContent]);

  // Upload file từ máy tính
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      if (file.name.endsWith(".json")) {
        setTab("json");
        setJsonContent(content);
        runParser("json", textContent, content);
      } else {
        setTab("text");
        setTextContent(content);
        runParser("text", content, jsonContent);
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  // Tải file mẫu về máy
  const handleDownloadTemplate = (type: "text" | "json") => {
    const content = type === "text" ? SAMPLE_TEXT_TEMPLATE : SAMPLE_JSON_TEMPLATE;
    const filename = type === "text" ? "mau_de_thi_tieng_han.txt" : "mau_de_thi_tieng_han.json";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySample = () => {
    const text = tab === "text" ? SAMPLE_TEXT_TEMPLATE : SAMPLE_JSON_TEMPLATE;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Tiến hành tạo bài thi
  const handleSubmit = async () => {
    let finalPayload = previewData;
    if (!finalPayload) {
      if (tab === "text") {
        const res = parseTextToTestPayload(textContent);
        finalPayload = res.payload;
      } else {
        try {
          finalPayload = JSON.parse(jsonContent);
        } catch {
          alert("File JSON không hợp lệ!");
          return;
        }
      }
    }

    if (!finalPayload) {
      alert("Chưa có dữ liệu bài thi hợp lệ để tạo!");
      return;
    }

    try {
      const res = await createTestMutation.mutateAsync(finalPayload);
      if (res.success) {
        onOpenChange(false);
        onSuccess?.(res.data?.id);
      }
    } catch (err: any) {
      console.error("Create test failed:", err);
      alert(err?.response?.data?.message || err?.message || "Lỗi khi tạo bài thi");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="w-[95vw] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl max-h-[92vh] flex flex-col p-4 sm:p-6 overflow-hidden rounded-2xl"
      >
        <DialogHeader className="pb-3 border-b space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary shrink-0" />
                <span>Tạo nhanh Đề thi từ Văn bản / File</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Dán nội dung câu hỏi trắc nghiệm hoặc tải file .txt / .json để hệ thống tự động nhận diện và tạo bài thi ngay lập tức.
              </DialogDescription>
            </div>

            {/* Template Download Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadTemplate(tab)}
                className="h-8 text-xs gap-1.5 rounded-lg cursor-pointer whitespace-nowrap"
                title="Tải file mẫu về máy"
              >
                <Download className="w-3.5 h-3.5" />
                Tải file mẫu ({tab === "text" ? ".txt" : ".json"})
              </Button>
            </div>
          </div>

          {/* Mode Tabs and Upload button */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl border text-xs">
              <button
                type="button"
                onClick={() => {
                  setTab("text");
                  setParseErrors([]);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  tab === "text"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-primary" />
                Dán Văn bản (.txt / word)
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab("json");
                  setParseErrors([]);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  tab === "json"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                Cấu trúc JSON (.json)
              </button>
            </div>

            {/* Upload file button */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-primary" />
              <span>Tải file từ máy tính</span>
              <input
                type="file"
                accept=".txt,.json,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </DialogHeader>

        {/* Modal Body: 2 Columns with independent scrolling */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-3 flex-1 overflow-hidden min-h-0">
          {/* Left Column: Editor */}
          <div className="md:col-span-7 flex flex-col space-y-2 min-h-[260px] md:min-h-0 overflow-hidden">
            <div className="flex items-center justify-between text-xs shrink-0">
              <span className="font-semibold text-foreground">
                {tab === "text" ? "Nhập nội dung câu hỏi trắc nghiệm:" : "Nội dung JSON bài thi:"}
              </span>
              <button
                type="button"
                onClick={handleCopySample}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Đã copy mẫu" : "Copy mẫu chuẩn"}</span>
              </button>
            </div>

            <div className="relative flex-1 min-h-0 border rounded-xl overflow-hidden bg-background">
              <textarea
                value={tab === "text" ? textContent : jsonContent}
                onChange={(e) => {
                  if (tab === "text") setTextContent(e.target.value);
                  else setJsonContent(e.target.value);
                }}
                placeholder={
                  tab === "text"
                    ? "Dán nội dung câu hỏi tại đây theo mẫu:\n\nCâu 1: Câu hỏi là gì?\nA. Đáp án 1\nB. Đáp án 2\nĐáp án: A"
                    : "Dán cấu trúc JSON tại đây..."
                }
                className="w-full h-full p-3 font-mono text-xs bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 leading-relaxed overflow-y-auto"
              />
            </div>
          </div>

          {/* Right Column: Live Preview */}
          <div className="md:col-span-5 flex flex-col space-y-3 bg-muted/20 border rounded-xl p-3 sm:p-4 overflow-hidden min-h-0">
            <div className="flex items-center justify-between pb-2 border-b shrink-0">
              <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-primary" />
                Xem trước nhận diện
              </span>
              <Badge
                variant={questionsCount > 0 ? "default" : "secondary"}
                className={`text-xs ${questionsCount > 0 ? "bg-emerald-600 text-white font-semibold" : ""}`}
              >
                {questionsCount} câu hỏi
              </Badge>
            </div>

            {/* Error alerts if any */}
            {parseErrors.length > 0 && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1 shrink-0">
                <div className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Cần lưu ý định dạng:
                </div>
                {parseErrors.slice(0, 3).map((err, i) => (
                  <div key={i} className="text-[11px] leading-tight">
                    • {err}
                  </div>
                ))}
              </div>
            )}

            {/* Preview Test Details */}
            {previewData ? (
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-0">
                <div className="p-3 rounded-xl bg-card border space-y-1.5 shadow-2xs">
                  <div className="font-bold text-foreground text-xs sm:text-sm line-clamp-2">
                    {previewData.title}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-[11px] flex-wrap">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {previewData.durationMin} phút
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium">
                      <BookOpen className="w-3 h-3" />
                      {previewData.sections?.[0]?.skill || "READING"}
                    </span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      Tự động xuất bản
                    </span>
                  </div>
                </div>

                {/* Sample questions preview */}
                <div className="space-y-2">
                  {previewData.sections
                    ?.flatMap((s) => s.questions || [])
                    .map((q, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-card border space-y-1.5 text-[11px] shadow-2xs"
                      >
                        <div className="font-semibold text-foreground leading-snug">
                          <span className="text-primary font-bold">Câu {q.order || idx + 1}: </span>
                          {q.content}
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground pt-0.5">
                          {q.options?.map((opt: any) => (
                            <div
                              key={opt.label}
                              className={`p-1.5 rounded border truncate ${
                                opt.label === q.correctAnswer
                                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold"
                                  : "bg-muted/30"
                              }`}
                            >
                              <span className="font-bold mr-1">{opt.label}.</span>
                              {opt.content}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                <FileText className="w-8 h-8 mb-2 text-muted-foreground/40" />
                <p className="text-xs">
                  Nhập nội dung câu hỏi hoặc dán dữ liệu để xem trước danh sách câu hỏi.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Đề thi sẽ được tạo ngay với <strong>{questionsCount}</strong> câu hỏi trắc nghiệm
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs rounded-xl cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createTestMutation.isPending || questionsCount === 0 || !previewData}
              className="bg-primary text-primary-foreground font-semibold text-xs rounded-xl gap-1.5 cursor-pointer shadow-xs"
            >
              {createTestMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang tạo đề thi...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Tạo bài thi ngay ({questionsCount} câu)
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

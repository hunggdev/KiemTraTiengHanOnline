import { useState, useEffect, useMemo, useRef } from "react";
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  Send,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Headphones,
  Mic,
  BookOpen,
  PenLine,
  Loader2,
  AlertCircle,
  Menu,
} from "lucide-react";
import { useTestForTaking, useSubmitTestAttempt } from "@/stores/useTestStore.ts";
import { useAuthStore } from "@/stores/useAuthStore.ts";
import type { SkillType } from "@/types/test.types.ts";
import type { TestResultDTO } from "@/types/user-test.types.ts";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx";

interface TakeTestPageProps {
  testId: string;
  onExit: () => void;
  onFinish: (result: TestResultDTO) => void;
}

const SKILL_META: Record<SkillType, { label: string; icon: React.FC<{ className?: string }> }> = {
  LISTENING: { label: "Nghe", icon: ({ className }) => <Headphones className={className} /> },
  SPEAKING: { label: "Nói", icon: ({ className }) => <Mic className={className} /> },
  READING: { label: "Đọc", icon: ({ className }) => <BookOpen className={className} /> },
  WRITING: { label: "Viết", icon: ({ className }) => <PenLine className={className} /> },
};

export function TakeTestPage({ testId, onExit, onFinish }: TakeTestPageProps) {
  const { data, isLoading, isError, refetch } = useTestForTaking(testId);
  const submitMutation = useSubmitTestAttempt(testId);
  const { user } = useAuthStore();

  const test = data?.data as any;

  // Flatten toàn bộ câu hỏi kèm section info
  const questionsList = useMemo(() => {
    if (!test?.sections) return [];
    return test.sections.flatMap((sec: any, sIdx: number) =>
      (sec.questions || []).map((q: any, qIdx: number) => ({
        ...q,
        sectionTitle: `Phần ${sec.order ?? sIdx + 1}: ${sec.skill}`,
        sectionSkill: sec.skill,
        globalIndex: 0, // sẽ gán sau
      }))
    ).map((q: any, idx: number) => ({ ...q, globalIndex: idx }));
  }, [test]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> answerText ('A', 'B', etc.)
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const hasAutoSubmitted = useRef(false);

  // Khởi tạo thời gian làm bài khi có dữ liệu
  useEffect(() => {
    if (test?.durationMin && timeLeft === null) {
      setTimeLeft(test.durationMin * 60);
    }
  }, [test, timeLeft]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Tự động nộp bài khi hết giờ
  useEffect(() => {
    if (timeLeft === 0 && !hasAutoSubmitted.current && questionsList.length > 0) {
      hasAutoSubmitted.current = true;
      handleAutoSubmit();
    }
  }, [timeLeft, questionsList]);

  const currentQuestion = questionsList[currentIndex];

  const handleSelectOption = (questionId: number | string, optionLabel: string) => {
    setAnswers((prev) => ({
      ...prev,
      [String(questionId)]: optionLabel,
    }));
  };

  const handleTextAnswer = (questionId: number | string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [String(questionId)]: text,
    }));
  };

  const handleAutoSubmit = async () => {
    await performSubmit();
  };

  const performSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Lấy userId chắc chắn từ store hoặc localStorage
      let currentUserId: string | undefined = user?.id !== undefined ? String(user.id) : undefined;
      if (!currentUserId) {
        const stored = localStorage.getItem("user");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.id) currentUserId = String(parsed.id);
          } catch {}
        }
      }

      const payloadAnswers = Object.entries(answers).map(([questionId, answerText]) => ({
        questionId,  // string key từ state — backend sẽ parseInt
        answerText,
      }));

      const res = await submitMutation.mutateAsync({
        testId,
        userId: currentUserId,
        answers: payloadAnswers,
      });

      if (res.data) {
        setIsSubmitDialogOpen(false);
        onFinish(res.data);
      }
    } catch (err: any) {
      console.error("Submit test failed:", err);
      const errorMsg = err?.response?.data?.message || err?.message || "Không thể nộp bài. Vui lòng kiểm tra kết nối mạng!";
      setSubmitError(errorMsg);
      alert(`Lỗi nộp bài: ${errorMsg}`);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Đang tải đề thi…</p>
      </div>
    );
  }

  if (isError || !test) {
    return (
      <div className="min-h-screen bg-background max-w-xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
        <h2 className="text-xl font-bold mb-2">Không thể tải đề thi</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Đề thi không tồn tại, chưa được xuất bản hoặc có lỗi kết nối.
        </p>
        <Button variant="outline" onClick={onExit}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const totalCount = questionsList.length;
  const progressPercent = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;
  const isLastQuestion = currentIndex === questionsList.length - 1;

  // Format MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remSecs.toString().padStart(2, "0")}`;
  };

  const isTimeRunningLow = timeLeft !== null && timeLeft < 300; // < 5 mins

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      {/* Top Examination Navigation Bar */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground h-8 px-2 cursor-pointer">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Thoát
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Rời khỏi bài kiểm tra?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Kết quả làm bài của bạn sẽ không được lưu nếu bạn thoát bây giờ. Bạn có chắc chắn muốn thoát?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Ở lại làm bài</AlertDialogCancel>
                  <AlertDialogAction onClick={onExit} className="bg-destructive text-white hover:bg-destructive/90 cursor-pointer">
                    Xác nhận thoát
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="border-l pl-3 hidden sm:block truncate">
              <h2 className="font-bold text-sm text-foreground truncate">{test.title}</h2>
              <span className="text-xs text-muted-foreground">
                Đã làm {answeredCount}/{totalCount} câu ({progressPercent}%)
              </span>
            </div>
          </div>

          {/* Timer & Submit Button */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {timeLeft !== null && (
              <div
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-mono font-bold tracking-wider ${
                  isTimeRunningLow
                    ? "border-destructive/40 bg-destructive/10 text-destructive animate-pulse"
                    : "border-border bg-card text-foreground"
                }`}
              >
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}

            <Button
              onClick={() => setIsSubmitDialogOpen(true)}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 rounded-xl h-9 px-3 sm:px-4 font-semibold shadow-xs cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Nộp bài</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Confirmation Dialog for Submission */}
      <AlertDialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận nộp bài kiểm tra?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Bạn đã hoàn thành <strong>{answeredCount}</strong> trên tổng số <strong>{totalCount}</strong> câu hỏi.
              </p>
              {answeredCount < totalCount && (
                <p className="text-amber-600 dark:text-amber-400 text-xs flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Còn {totalCount - answeredCount} câu hỏi bạn chưa chọn đáp án!
                </p>
              )}
              {submitError && (
                <p className="text-destructive text-xs font-semibold">
                  ⚠️ {submitError}
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting} onClick={() => setIsSubmitDialogOpen(false)}>
              Tiếp tục làm bài
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                performSubmit();
              }}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Đang nộp bài...
                </>
              ) : (
                "Đồng ý nộp bài"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main Layout: Question Area + Question Navigator */}
      <main className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Question Box */}
        <div className="lg:col-span-8 space-y-4">
          {currentQuestion ? (
            <div className="bg-card rounded-2xl border shadow-sm p-4 sm:p-6 space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between gap-3 border-b pb-4">
                <div className="flex items-center gap-2">
                  <Badge className="px-2.5 py-1 text-xs font-bold rounded-lg">
                    Câu {currentQuestion.globalIndex + 1}
                  </Badge>
                  <span className="text-xs font-medium text-muted-foreground">
                    {currentQuestion.sectionTitle}
                  </span>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  {currentQuestion.score ?? 1} điểm
                </span>
              </div>

              {/* Question Content */}
              <div className="text-base sm:text-lg font-medium text-foreground whitespace-pre-wrap leading-relaxed">
                {currentQuestion.content}
              </div>

              {/* Multiple Choice Options */}
              {currentQuestion.type === "MULTIPLE_CHOICE" && currentQuestion.options && (
                <div className="space-y-3 pt-2">
                  {currentQuestion.options.map((opt: any) => {
                    const isSelected = answers[String(currentQuestion.id)] === opt.label;
                    return (
                      <div
                        key={opt.id || opt.label}
                        onClick={() => handleSelectOption(currentQuestion.id, opt.label)}
                        className={`group flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl border-2 cursor-pointer transition-all active:scale-[0.99] select-none ${
                          isSelected
                            ? "border-primary bg-primary/5 text-foreground shadow-xs"
                            : "border-border/60 hover:border-primary/40 hover:bg-muted/30 text-foreground"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all ${
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "bg-muted text-muted-foreground group-hover:border-primary/50"
                          }`}
                        >
                          {opt.label}
                        </div>
                        <div className="text-sm font-medium leading-normal flex-1">
                          {opt.content}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Essay Answer Textarea */}
              {currentQuestion.type === "ESSAY" && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Nhập câu trả lời của bạn:
                  </label>
                  <textarea
                    value={answers[String(currentQuestion.id)] || ""}
                    onChange={(e) => handleTextAnswer(currentQuestion.id, e.target.value)}
                    placeholder="Viết câu trả lời tự luận tại đây…"
                    rows={6}
                    className="w-full p-3 rounded-xl border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              )}

              {/* Audio Response Answer */}
              {currentQuestion.type === "AUDIO_RESPONSE" && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Câu trả lời ghi âm / ghi chú:
                  </label>
                  <textarea
                    value={answers[String(currentQuestion.id)] || ""}
                    onChange={(e) => handleTextAnswer(currentQuestion.id, e.target.value)}
                    placeholder="Nhập ghi chú hoặc link ghi âm câu trả lời…"
                    rows={4}
                    className="w-full p-3 rounded-xl border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              )}

              {/* Bottom navigation buttons */}
              <div className="flex items-center justify-between pt-4 border-t gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="rounded-xl h-10 px-4 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Câu trước
                </Button>

                {isLastQuestion ? (
                  <Button
                    onClick={() => setIsSubmitDialogOpen(true)}
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-5 font-semibold gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                    Hoàn thành & Nộp bài
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentIndex((prev) => Math.min(questionsList.length - 1, prev + 1))}
                    disabled={currentIndex === questionsList.length - 1}
                    className="rounded-xl h-10 px-4 cursor-pointer"
                  >
                    Câu tiếp
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Không có câu hỏi trong bài thi này.
            </div>
          )}
        </div>

        {/* Right: Question Navigation Matrix */}
        <div className="lg:col-span-4 bg-card rounded-2xl border shadow-sm p-4 sm:p-5 space-y-5 sticky top-20">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground">Bảng câu hỏi</h3>
              <Badge variant="outline" className="text-xs">
                {answeredCount}/{totalCount} đã làm
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1.5">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-primary inline-block" />
                Đã chọn ({answeredCount})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-muted border inline-block" />
                Chưa chọn ({totalCount - answeredCount})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-72 overflow-y-auto pr-1">
            {questionsList.map((q: any, idx: number) => {
              const isAnswered = !!answers[String(q.id)];
              const isCurrent = idx === currentIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-10 rounded-xl font-bold text-xs transition-all flex items-center justify-center cursor-pointer ${
                    isCurrent
                      ? "ring-2 ring-primary ring-offset-2 bg-primary text-primary-foreground shadow-xs"
                      : isAnswered
                      ? "bg-primary/20 text-primary border border-primary/30 font-extrabold"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Quick Submit button at bottom of matrix for mobile */}
          <div className="pt-2 border-t">
            <Button
              onClick={() => setIsSubmitDialogOpen(true)}
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 font-semibold gap-1.5 cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Nộp bài thi ({answeredCount}/{totalCount})
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}


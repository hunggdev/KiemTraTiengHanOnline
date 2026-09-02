import {
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  ArrowLeft,
  Award,
  HelpCircle,
} from "lucide-react";
import type { TestResultDTO } from "@/types/user-test.types.ts";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Separator } from "@/components/ui/separator.tsx";

interface TestResultPageProps {
  result: TestResultDTO;
  onBackToList: () => void;
  onRetakeTest?: () => void;
}

const formatScore = (val: number | null | undefined) => {
  if (val === null || val === undefined || isNaN(Number(val))) return "0";
  return Number(Number(val).toFixed(2)).toString();
};

export function TestResultPage({
  result,
  onBackToList,
  onRetakeTest,
}: TestResultPageProps) {
  const percentage = result.percentage;
  const isPassed = percentage >= 50;

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Navigation back */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToList}
            className="text-muted-foreground hover:text-foreground gap-1.5 pl-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách bài thi
          </Button>
        </div>

        {/* Hero Result Banner */}
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-b from-primary/10 via-card to-card p-6 sm:p-10 shadow-sm text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-primary/20 text-primary flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Trophy className="w-10 h-10" />
          </div>

          <Badge
            variant={isPassed ? "default" : "destructive"}
            className="mb-3 px-3 py-1 text-xs uppercase tracking-wider font-bold"
          >
            {percentage >= 80
              ? "Xuất sắc 🎉"
              : percentage >= 50
              ? "Đạt yêu cầu 👍"
              : "Cần cố gắng thêm 💪"}
          </Badge>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-1">
            Kết quả: {result.testTitle}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Bài thi đã được nộp và chấm điểm tự động thành công.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-w-2xl mx-auto text-center">
            <div className="p-4 rounded-2xl bg-card border shadow-xs">
              <span className="text-xs text-muted-foreground font-medium block mb-1">
                Điểm tổng kết
              </span>
              <span className="text-2xl sm:text-3xl font-black text-primary">
                {formatScore(result.totalScore)}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  /{formatScore(result.maxScore)}đ
                </span>
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-card border shadow-xs">
              <span className="text-xs text-muted-foreground font-medium block mb-1">
                Tỷ lệ chính xác
              </span>
              <span className="text-2xl sm:text-3xl font-black text-foreground">
                {result.percentage}%
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-card border shadow-xs">
              <span className="text-xs text-muted-foreground font-medium block mb-1">
                Số câu đúng
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {result.correctCount}
                <span className="text-sm font-normal text-muted-foreground">
                  /{result.totalQuestions}
                </span>
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-card border shadow-xs">
              <span className="text-xs text-muted-foreground font-medium block mb-1">
                Số câu sai / bỏ qua
              </span>
              <span className="text-2xl sm:text-3xl font-black text-destructive">
                {result.totalQuestions - result.correctCount}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <Button variant="outline" onClick={onBackToList} className="rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Danh sách bài thi
            </Button>
            {onRetakeTest && (
              <Button onClick={onRetakeTest} className="rounded-xl">
                <RotateCcw className="w-4 h-4 mr-2" />
                Làm lại bài này
              </Button>
            )}
          </div>
        </div>

        {/* Detailed Question Review */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              Chi tiết câu hỏi & đáp án
            </h2>
            <span className="text-xs text-muted-foreground">
              {result.totalQuestions} câu hỏi
            </span>
          </div>

          <div className="space-y-4">
            {result.questionReview.map((q, idx) => {
              const isCorrect = q.isCorrect;
              const hasAnswered = !!q.userAnswer;

              return (
                <div
                  key={q.questionId || idx}
                  className={`rounded-2xl border p-5 space-y-4 transition-all ${
                    isCorrect === true
                      ? "bg-emerald-50/20 border-emerald-300 dark:border-emerald-950 dark:bg-emerald-950/10"
                      : isCorrect === false
                      ? "bg-destructive/5 border-destructive/20"
                      : "bg-card border-border"
                  }`}
                >
                  {/* Question header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs px-2.5 py-1 rounded-lg bg-muted">
                        Câu {idx + 1}
                      </span>
                      {isCorrect === true && (
                        <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đúng (+{q.scoreGiven ?? q.score}đ)
                        </Badge>
                      )}
                      {isCorrect === false && (
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <XCircle className="w-3.5 h-3.5" /> Sai (0đ)
                        </Badge>
                      )}
                      {isCorrect === null && (
                        <Badge variant="secondary" className="text-xs">
                          Chờ chấm tự luận
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {q.score} điểm
                    </span>
                  </div>

                  {/* Question content */}
                  <div className="text-base font-medium text-foreground whitespace-pre-wrap">
                    {q.content}
                  </div>

                  {/* Multiple Choice Options comparison */}
                  {q.type === "MULTIPLE_CHOICE" && q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {q.options.map((opt) => {
                        const isUserChoice = q.userAnswer === opt.label;
                        const isAnswerKey = q.correctAnswer === opt.label;

                        let style = "border-border/60 bg-muted/10 text-muted-foreground";
                        if (isAnswerKey) {
                          style = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 font-semibold";
                        } else if (isUserChoice && !isAnswerKey) {
                          style = "border-destructive bg-destructive/10 text-destructive line-through";
                        }

                        return (
                          <div
                            key={opt.label}
                            className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs ${style}`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                isAnswerKey
                                  ? "bg-emerald-600 text-white"
                                  : isUserChoice
                                  ? "bg-destructive text-white"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {opt.label}
                            </span>
                            <span className="flex-1 break-words leading-relaxed">{opt.content}</span>
                            {isAnswerKey && (
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                Đáp án đúng ✓
                              </span>
                            )}
                            {isUserChoice && !isAnswerKey && (
                              <span className="text-xs font-bold text-destructive shrink-0">
                                Bạn chọn ✗
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Essay answer review */}
                  {q.type === "ESSAY" && (
                    <div className="p-3.5 rounded-xl bg-muted/30 border space-y-1.5 text-xs">
                      <span className="font-semibold text-muted-foreground block">
                        Câu trả lời của bạn:
                      </span>
                      <p className="text-foreground whitespace-pre-wrap">
                        {q.userAnswer || <span className="italic text-muted-foreground">Chưa nhập câu trả lời</span>}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

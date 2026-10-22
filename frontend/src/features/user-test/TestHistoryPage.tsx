import { useState } from "react";
import {
  History,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  BookOpen,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Calendar,
  Sparkles,
  Eye,
  AudioLines,
  AlignLeft,
  ListOrdered,
  X,
  Volume2,
} from "lucide-react";
import { useMyAttempts, useMyAttemptDetail } from "@/stores/useTestStore.ts";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Separator } from "@/components/ui/separator.tsx";

interface Props {
  onBackToTests?: () => void;
}

export function TestHistoryPage({ onBackToTests }: Props) {
  const { data, isLoading, isError, refetch } = useMyAttempts();
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);

  const attempts = data?.data?.attempts ?? [];
  const summary = data?.data?.summary ?? {
    totalAttempts: 0,
    avgScore: 0,
    highestScore: 0,
    pendingCount: 0,
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header Banner */}
      <div className="border-b bg-gradient-to-b from-primary/5 via-muted/30 to-background py-8 px-4">
        <div className="max-w-5xl mx-auto">
          {onBackToTests && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToTests}
              className="mb-3 text-muted-foreground hover:text-foreground gap-1.5 pl-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại danh sách bài thi
            </Button>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
                <History className="w-3.5 h-3.5" />
                Kết quả học tập cá nhân
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Lịch sử làm bài thi
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Xem lại kết quả, điểm số và chi tiết bài làm đã nộp của bạn
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6">
            <div className="p-4 rounded-2xl bg-card border shadow-xs">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
                <FileCheck className="w-4 h-4 text-primary" /> Tổng số bài đã nộp
              </div>
              <div className="text-2xl font-black text-foreground">
                {summary.totalAttempts}{" "}
                <span className="text-xs font-normal text-muted-foreground">lượt</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-card border shadow-xs">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> Điểm trung bình
              </div>
              <div className="text-2xl font-black text-foreground">
                {summary.avgScore}{" "}
                <span className="text-xs font-normal text-muted-foreground">điểm</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-card border shadow-xs">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
                <Award className="w-4 h-4 text-amber-500" /> Điểm cao nhất
              </div>
              <div className="text-2xl font-black text-foreground">
                {summary.highestScore}{" "}
                <span className="text-xs font-normal text-muted-foreground">điểm</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-card border shadow-xs">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
                <Clock className="w-4 h-4 text-blue-500" /> Đang chờ chấm
              </div>
              <div className="text-2xl font-black text-foreground">
                {summary.pendingCount}{" "}
                <span className="text-xs font-normal text-muted-foreground">bài</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Attempts List */}
      <div className="max-w-5xl mx-auto px-4 pt-8">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-muted/40 animate-pulse border" />
            ))}
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-40 text-destructive" />
            <p className="font-medium">Không thể tải lịch sử làm bài</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
              Thử lại
            </Button>
          </div>
        ) : attempts.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">Chưa có bài thi nào</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Bạn chưa tham gia bài kiểm tra nào. Hãy chọn một bài thi để bắt đầu làm bài và tích lũy điểm số nhé!
            </p>
            {onBackToTests && (
              <Button onClick={onBackToTests} className="rounded-xl gap-2 font-semibold shadow-xs">
                Xem danh sách bài thi
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            {attempts.map((att: any) => {
              const isGraded = att.status === "GRADED";
              const percent =
                att.maxScore > 0 && att.totalScore !== null
                  ? Math.round((att.totalScore / att.maxScore) * 100)
                  : null;

              const submittedDateStr = att.submittedAt
                ? new Date(att.submittedAt).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "–";

              return (
                <div
                  key={att.id}
                  className="group bg-card rounded-2xl border p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                        {att.testTitle}
                      </h3>
                      <Badge
                        variant={isGraded ? "default" : "secondary"}
                        className={`text-[10px] font-semibold gap-1 ${
                          isGraded
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {isGraded ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Đã chấm điểm
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" /> Đang chờ chấm
                          </>
                        )}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
                        Nộp lúc: {submittedDateStr}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
                        Thời lượng: {att.durationMin} phút
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Đúng {att.correctQuestions}/{att.totalQuestions} câu
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                    {/* Score display */}
                    <div className="text-right">
                      {att.totalScore !== null ? (
                        <div>
                          <div className="text-xl font-black text-foreground">
                            {att.totalScore}{" "}
                            <span className="text-xs text-muted-foreground font-normal">
                              / {att.maxScore}đ
                            </span>
                          </div>
                          {percent !== null && (
                            <span
                              className={`text-[11px] font-bold ${
                                percent >= 80
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : percent >= 50
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              Đạt {percent}%
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm font-semibold text-muted-foreground">
                          Chờ điểm
                        </div>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAttemptId(String(att.id))}
                      className="rounded-xl gap-1 text-xs font-semibold group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Chi tiết
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal / Slide-over: Chi tiết bài làm */}
      {selectedAttemptId && (
        <AttemptDetailModal
          attemptId={selectedAttemptId}
          onClose={() => setSelectedAttemptId(null)}
        />
      )}
    </div>
  );
}

// ─── Modal / Panel Chi tiết bài thi ──────────────────────────────────────────
function AttemptDetailModal({
  attemptId,
  onClose,
}: {
  attemptId: string;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = useMyAttemptDetail(attemptId);
  const detail = data?.data;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-card w-full max-w-4xl rounded-2xl border shadow-xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in fade-in-50 zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b bg-muted/20">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg text-foreground">
                {detail?.testTitle || "Chi tiết bài làm"}
              </h2>
              {detail?.status === "GRADED" && (
                <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px]">
                  Đã chấm điểm
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Xem lại các câu hỏi, đáp án đã chọn và nhận xét của giáo viên
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full w-8 h-8 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="py-20 text-center text-muted-foreground">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Đang tải chi tiết bài làm…</p>
            </div>
          ) : isError || !detail ? (
            <div className="py-12 text-center text-muted-foreground">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 text-destructive" />
              <p className="font-medium text-foreground">Không thể tải thông tin bài thi</p>
            </div>
          ) : (
            <>
              {/* Score Highlight Box */}
              <div className="p-4 rounded-xl bg-muted/40 border flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Tổng điểm đạt được
                  </div>
                  <div className="text-2xl font-black text-foreground">
                    {detail.totalScore !== null ? detail.totalScore : "–"}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      / {detail.maxScore} điểm
                    </span>
                  </div>
                </div>

                <div className="text-right text-xs text-muted-foreground">
                  <div>Thời lượng: {detail.durationMin} phút</div>
                  <div>Trạng thái: {detail.status}</div>
                </div>
              </div>

              {/* Sections & Questions */}
              {detail.sections?.map((sec: any, sIdx: number) => (
                <div key={sec.id} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                      Phần {sIdx + 1}: {sec.skill}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {sec.questions?.map((q: any, qIdx: number) => {
                      const isMC = q.type === "MULTIPLE_CHOICE";
                      const isCorrect = q.isCorrect === true;

                      return (
                        <div
                          key={q.id}
                          className={`p-4 rounded-xl border transition-all ${
                            isMC
                              ? isCorrect
                                ? "border-emerald-500/30 bg-emerald-500/5"
                                : "border-red-500/30 bg-red-500/5"
                              : "border-muted bg-card"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <span className="text-xs font-bold text-muted-foreground">
                              Câu {qIdx + 1} ({q.score}đ)
                            </span>

                            {isMC ? (
                              <Badge
                                variant={isCorrect ? "default" : "destructive"}
                                className={`text-[10px] gap-1 ${
                                  isCorrect ? "bg-emerald-600 hover:bg-emerald-600" : ""
                                }`}
                              >
                                {isCorrect ? "Chính xác" : "Chưa chính xác"}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">
                                {q.scoreGiven !== null
                                  ? `Đã chấm: ${q.scoreGiven}/${q.score}đ`
                                  : "Chờ giáo viên chấm"}
                              </Badge>
                            )}
                          </div>

                          {/* Question text */}
                          <p className="font-semibold text-sm text-foreground mb-3 whitespace-pre-wrap">
                            {q.content}
                          </p>

                          {/* Audio player if audio question */}
                          {q.audioUrl && (
                            <div className="mb-3">
                              <audio controls src={q.audioUrl} className="w-full h-9 rounded-lg" />
                            </div>
                          )}

                          {/* Options for Multiple Choice */}
                          {isMC && q.options && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                              {q.options.map((opt: any) => {
                                const isUserChoice = String(opt.id) === String(q.studentAnswer);
                                const isCorrectOpt = String(opt.id) === String(q.correctAnswer);

                                return (
                                  <div
                                    key={opt.id}
                                    className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border font-medium ${
                                      isCorrectOpt
                                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-bold"
                                        : isUserChoice && !isCorrect
                                        ? "bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-400 line-through"
                                        : "bg-muted/20 border-transparent text-muted-foreground"
                                    }`}
                                  >
                                    <span className="w-5 h-5 rounded-full flex items-center justify-center bg-background border text-[10px] font-bold shrink-0">
                                      {opt.label}
                                    </span>
                                    <span>{opt.content}</span>
                                    {isCorrectOpt && (
                                      <span className="ml-auto text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                        (Đáp án đúng)
                                      </span>
                                    )}
                                    {isUserChoice && !isCorrectOpt && (
                                      <span className="ml-auto text-[10px] text-red-600 dark:text-red-400 font-bold">
                                        (Bạn chọn)
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Essay / Audio Answer review */}
                          {!isMC && (
                            <div className="mt-2 space-y-2 text-xs">
                              <div className="p-3 rounded-lg bg-muted/30 border">
                                <span className="font-semibold text-muted-foreground block mb-1">
                                  Bài làm của bạn:
                                </span>
                                {q.studentAudioUrl ? (
                                  <audio controls src={q.studentAudioUrl} className="w-full h-9" />
                                ) : (
                                  <p className="text-foreground whitespace-pre-wrap">
                                    {q.studentAnswer || "(Chưa có câu trả lời)"}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t bg-muted/10 flex justify-end">
          <Button onClick={onClose} variant="outline" className="rounded-xl">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}

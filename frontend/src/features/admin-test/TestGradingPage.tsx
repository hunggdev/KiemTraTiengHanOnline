import React, { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  PenLine,
  Headphones,
  Mic,
  BookOpen,
  HelpCircle,
  Loader2,
  Save,
  Sparkles,
  BarChart3,
  X,
  ChevronRight,
  RefreshCw,
  Award,
  AlertTriangle,
  Eye,
  FileCheck,
  Check,
} from "lucide-react";
import {
  useTestAttempts,
  useAttemptDetail,
  useGradeAttempt,
} from "@/stores/useTestStore.ts";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import type {
  AttemptListItemDTO,
  AttemptDetailDTO,
  AttemptQuestionDTO,
} from "@/types/admin-test.types.ts";

interface TestGradingPageProps {
  testId: string;
  onBack: () => void;
  onViewStats?: (testId: string) => void;
  initialAttemptId?: string | null;
}

const SKILL_ICONS: Record<string, React.FC<{ className?: string }>> = {
  LISTENING: ({ className }) => <Headphones className={className} />,
  SPEAKING: ({ className }) => <Mic className={className} />,
  READING: ({ className }) => <BookOpen className={className} />,
  WRITING: ({ className }) => <PenLine className={className} />,
};

const SKILL_NAMES: Record<string, string> = {
  LISTENING: "Nghe",
  SPEAKING: "Nói",
  READING: "Đọc",
  WRITING: "Viết",
};

export function TestGradingPage({
  testId,
  onBack,
  onViewStats,
  initialAttemptId,
}: TestGradingPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "NEEDS_GRADING" | "GRADED">("ALL");
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(initialAttemptId || null);

  const { data, isLoading, isError, refetch, isRefetching } = useTestAttempts(testId);

  const testInfo = data?.data?.test;
  const summary = data?.data?.summary;
  const attempts = data?.data?.attempts || [];

  // Lọc danh sách bài làm
  const filteredAttempts = useMemo(() => {
    return attempts.filter((att) => {
      const matchSearch =
        att.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        att.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        att.className.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "NEEDS_GRADING" && att.needsGrading) ||
        (statusFilter === "GRADED" && !att.needsGrading);

      return matchSearch && matchStatus;
    });
  }, [attempts, searchTerm, statusFilter]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">
          Đang tải danh sách bài làm của học sinh…
        </p>
      </div>
    );
  }

  if (isError || !testInfo) {
    return (
      <div className="min-h-screen bg-background max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Không thể tải danh sách bài làm</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Có thể bài kiểm tra không tồn tại hoặc phiên đăng nhập đã hết hạn.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <Button onClick={() => refetch()}>Thử lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/50 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Top Header & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-muted-foreground hover:text-foreground gap-1.5 pl-0 cursor-pointer h-8"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </Button>
              <span className="text-muted-foreground">/</span>
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Chấm điểm bài làm học sinh
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <PenLine className="w-7 h-7 text-primary" />
              {testInfo.title}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Tổng {testInfo.totalQuestions} câu ({testInfo.maxScore}đ)
              {testInfo.hasEssay && (
                <span className="text-amber-600 dark:text-amber-400 font-semibold ml-1.5">
                  • Có {testInfo.essayCount} câu tự luận cần chấm
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="h-9 gap-1.5 text-xs rounded-xl cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
              Làm mới
            </Button>
            {onViewStats && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewStats(testId)}
                className="h-9 gap-1.5 text-xs rounded-xl cursor-pointer text-primary hover:text-primary hover:bg-primary/5 border-primary/30"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Xem Thống kê
              </Button>
            )}
          </div>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card rounded-2xl border p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-muted-foreground block mb-1">
                Tổng số bài nộp
              </span>
              <span className="text-2xl sm:text-3xl font-black text-foreground">
                {summary?.totalAttempts ?? 0}
              </span>
              <span className="text-xs text-muted-foreground ml-1.5">lượt</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-card rounded-2xl border p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-muted-foreground block mb-1">
                Cần chấm tự luận
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                {summary?.pendingGradingCount ?? 0}
              </span>
              <span className="text-xs text-muted-foreground ml-1.5">bài chờ chấm</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-card rounded-2xl border p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-muted-foreground block mb-1">
                Đã chấm xong
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {summary?.gradedCount ?? 0}
              </span>
              <span className="text-xs text-muted-foreground ml-1.5">bài hoàn tất</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Submissions Table & Management Card */}
        <div className="bg-card rounded-2xl border shadow-xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-5 border-b bg-muted/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-primary" />
                  Danh sách bài làm của học sinh ({filteredAttempts.length}/{attempts.length})
                </h3>
                <p className="text-xs text-muted-foreground">
                  Chọn học sinh để chấm điểm tự luận và hệ thống sẽ tự động tổng kết điểm số
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center flex-wrap gap-1.5">
                {[
                  { key: "ALL", label: `Tất cả (${attempts.length})` },
                  { key: "NEEDS_GRADING", label: `Cần chấm (${summary?.pendingGradingCount ?? 0})` },
                  { key: "GRADED", label: `Đã chấm (${summary?.gradedCount ?? 0})` },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(f.key as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      statusFilter === f.key
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Tìm theo tên học sinh, tài khoản, lớp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase text-[10px] border-b">
                <tr>
                  <th className="py-3 px-4">STT</th>
                  <th className="py-3 px-4">Học sinh</th>
                  <th className="py-3 px-4">Lớp</th>
                  <th className="py-3 px-4 text-center">Trắc nghiệm</th>
                  <th className="py-3 px-4 text-center">Tự luận</th>
                  <th className="py-3 px-4 text-center">Tổng điểm</th>
                  <th className="py-3 px-4 text-center">Thang 10</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thời gian nộp</th>
                  <th className="py-3 px-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-muted-foreground">
                      {attempts.length === 0
                        ? "Chưa có học sinh nào nộp bài kiểm tra này."
                        : "Không tìm thấy bài làm nào khớp với bộ lọc."}
                    </td>
                  </tr>
                ) : (
                  filteredAttempts.map((att, idx) => {
                    const submitDate = new Date(att.submittedAt).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <tr key={att.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4 text-muted-foreground font-medium text-center">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-foreground">{att.fullName}</div>
                          <div className="text-[11px] text-muted-foreground">@{att.username}</div>
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground font-medium">
                          {att.className}
                        </td>
                        <td className="py-3.5 px-4 text-center font-medium">
                          <span className="text-foreground">{att.multipleChoiceScore}đ</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {att.essayQuestionsCount > 0 ? (
                            <span
                              className={`font-semibold ${
                                att.needsGrading
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {att.essayScore}đ{" "}
                              <span className="text-[10px] text-muted-foreground">
                                ({att.gradedEssayCount}/{att.essayQuestionsCount} câu)
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">Không có</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-bold text-foreground text-sm">
                            {att.totalScore}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-1">
                            /{att.maxScore}đ
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-extrabold text-primary text-sm">
                            {att.scoreOn10}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-0.5">/10</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {att.needsGrading ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 font-semibold"
                            >
                              <Clock className="w-2.5 h-2.5" />
                              Cần chấm ({att.essayQuestionsCount - att.gradedEssayCount} câu)
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 font-semibold"
                            >
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Đã hoàn tất
                            </Badge>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right text-muted-foreground text-[11px]">
                          {submitDate}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Button
                            size="sm"
                            variant={att.needsGrading ? "default" : "outline"}
                            onClick={() => setSelectedAttemptId(String(att.id))}
                            className={`h-8 px-3 rounded-lg text-xs gap-1.5 font-semibold cursor-pointer ${
                              att.needsGrading
                                ? "bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                                : "text-primary hover:bg-primary/5 border-primary/30"
                            }`}
                          >
                            {att.needsGrading ? (
                              <>
                                <PenLine className="w-3 h-3" />
                                Chấm bài
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3" />
                                Xem / Sửa điểm
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Grading Detail Modal */}
      {selectedAttemptId && (
        <GradingModal
          attemptId={selectedAttemptId}
          testId={testId}
          onClose={() => setSelectedAttemptId(null)}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal Chấm điểm chi tiết của 1 bài làm
// ─────────────────────────────────────────────────────────────────────────────
interface GradingModalProps {
  attemptId: string;
  testId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function GradingModal({ attemptId, testId, onClose, onSuccess }: GradingModalProps) {
  const { data, isLoading, isError } = useAttemptDetail(attemptId);
  const gradeMutation = useGradeAttempt(testId);

  const attempt = data?.data;

  // State lưu điểm chấm cho từng câu tự luận: questionId -> scoreGiven (number)
  const [essayScores, setEssayScores] = useState<Record<string, number>>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Khởi tạo điểm từ dữ liệu có sẵn
  useEffect(() => {
    if (attempt) {
      const initialScores: Record<string, number> = {};
      attempt.sections.forEach((sec) => {
        sec.questions.forEach((q) => {
          if (q.type === "ESSAY" || q.type === "AUDIO_RESPONSE") {
            const currentScore = q.response?.scoreGiven;
            if (currentScore !== null && currentScore !== undefined) {
              initialScores[String(q.id)] = Number(currentScore);
            }
          }
        });
      });
      setEssayScores(initialScores);
    }
  }, [attempt]);

  // Tính tổng điểm real-time khi giáo viên nhập điểm
  const { liveTotalScore, liveEssayScore, liveScoreOn10 } = useMemo(() => {
    if (!attempt) return { liveTotalScore: 0, liveEssayScore: 0, liveScoreOn10: 0 };

    let totalEssay = 0;
    Object.values(essayScores).forEach((sc) => {
      totalEssay += Number(sc) || 0;
    });

    const total = Math.round((attempt.autoMcScore + totalEssay) * 100) / 100;
    const on10 =
      attempt.maxScore > 0 ? Math.round((total / attempt.maxScore) * 10 * 10) / 10 : 0;

    return {
      liveTotalScore: total,
      liveEssayScore: Math.round(totalEssay * 100) / 100,
      liveScoreOn10: on10,
    };
  }, [attempt, essayScores]);

  const handleScoreChange = (questionId: string | number, maxScore: number, value: string) => {
    let numVal = parseFloat(value);
    if (isNaN(numVal) || numVal < 0) numVal = 0;
    if (numVal > maxScore) numVal = maxScore;
    numVal = Math.round(numVal * 100) / 100;

    setEssayScores((prev) => ({
      ...prev,
      [String(questionId)]: numVal,
    }));
  };

  const handleSetQuickScore = (questionId: string | number, score: number) => {
    setEssayScores((prev) => ({
      ...prev,
      [String(questionId)]: score,
    }));
  };

  const handleSubmitGrades = async () => {
    if (!attempt) return;

    try {
      setSaveSuccessMsg(null);
      const gradesPayload = Object.entries(essayScores).map(([qId, score]) => ({
        questionId: qId,
        scoreGiven: score,
      }));

      const res = await gradeMutation.mutateAsync({
        attemptId,
        payload: { grades: gradesPayload },
      });

      if (res.success) {
        setSaveSuccessMsg(res.message || "Đã lưu kết quả chấm điểm thành công!");
        onSuccess();
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      console.error("Grade submit failed:", err);
      alert(`Lỗi khi lưu điểm: ${err?.response?.data?.message || err?.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-card rounded-2xl border shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Top Header */}
        <div className="p-4 sm:px-6 border-b bg-muted/20 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <h2 className="font-bold text-base sm:text-lg text-foreground">
                Chấm bài thi: {attempt?.user.fullName || "Học sinh"}
              </h2>
              {attempt?.user.className && (
                <Badge variant="outline" className="text-xs">
                  {attempt.user.className}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Đề thi: {attempt?.test.title} • Thời gian nộp:{" "}
              {attempt?.submittedAt
                ? new Date(attempt.submittedAt).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "–"}
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-8 h-8 p-0 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs">Đang tải chi tiết bài làm…</p>
            </div>
          ) : isError || !attempt ? (
            <div className="py-12 text-center text-destructive">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-semibold">Không thể tải chi tiết bài làm</p>
            </div>
          ) : (
            <>
              {/* Alert thông báo lưu thành công */}
              {saveSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {saveSuccessMsg}
                </div>
              )}

              {/* Sections & Questions Review & Scoring */}
              <div className="space-y-6">
                {attempt.sections.map((sec, sIdx) => {
                  const SkillIcon = SKILL_ICONS[sec.skill] || BookOpen;
                  const skillName = SKILL_NAMES[sec.skill] || sec.skill;

                  return (
                    <div
                      key={sec.id || sIdx}
                      className="rounded-2xl border bg-card/60 shadow-xs overflow-hidden"
                    >
                      {/* Section Title */}
                      <div className="p-3.5 sm:px-5 bg-muted/30 border-b flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-background border text-primary">
                            <SkillIcon className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-xs sm:text-sm text-foreground">
                            Phần {sec.order}: {skillName}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {sec.questions.length} câu hỏi
                        </span>
                      </div>

                      {/* Question list */}
                      <div className="p-4 sm:p-5 space-y-5">
                        {sec.questions.map((q, qIdx) => {
                          const isEssay = q.type === "ESSAY" || q.type === "AUDIO_RESPONSE";
                          const resp = q.response;
                          const currentScore = essayScores[String(q.id)] ?? resp?.scoreGiven ?? 0;

                          return (
                            <div
                              key={q.id}
                              className={`p-4 rounded-xl border space-y-3.5 transition-all ${
                                isEssay
                                  ? "bg-amber-50/20 dark:bg-amber-950/10 border-amber-300/60 dark:border-amber-900/40"
                                  : resp?.isCorrect
                                  ? "bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-300/40"
                                  : "bg-background border-border/70"
                              }`}
                            >
                              {/* Question Header */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                      isEssay
                                        ? "bg-amber-600 text-white"
                                        : "bg-primary/15 text-primary border border-primary/20"
                                    }`}
                                  >
                                    Câu {q.order ?? qIdx + 1}
                                  </Badge>

                                  <span className="text-xs text-muted-foreground font-medium">
                                    {isEssay ? (
                                      <span className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                                        <PenLine className="w-3 h-3" />
                                        {q.type === "ESSAY" ? "Tự luận" : "Ghi âm"}
                                      </span>
                                    ) : (
                                      "Trắc nghiệm"
                                    )}
                                  </span>

                                  {/* Auto Grade Badge for MC */}
                                  {!isEssay && (
                                    <Badge
                                      variant={resp?.isCorrect ? "default" : "destructive"}
                                      className={`text-[10px] ${
                                        resp?.isCorrect
                                          ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                                          : ""
                                      }`}
                                    >
                                      {resp?.isCorrect
                                        ? `Đúng (+${q.score}đ)`
                                        : `Sai (0/${q.score}đ)`}
                                    </Badge>
                                  )}
                                </div>

                                <div className="text-xs font-bold text-muted-foreground shrink-0">
                                  Tối đa: {q.score} điểm
                                </div>
                              </div>

                              {/* Question content */}
                              <div className="text-sm font-medium text-foreground whitespace-pre-wrap leading-relaxed">
                                {q.content}
                              </div>

                              {/* Multiple Choice Preview */}
                              {!isEssay && q.options && q.options.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                                  {q.options.map((opt) => {
                                    const isUserChoice = resp?.answerText === opt.label;
                                    const isKey = q.correctAnswer === opt.label;

                                    let style = "border-border/60 bg-muted/10 text-muted-foreground";
                                    if (isKey) {
                                      style =
                                        "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 font-semibold";
                                    } else if (isUserChoice && !isKey) {
                                      style =
                                        "border-destructive/60 bg-destructive/10 text-destructive line-through";
                                    }

                                    return (
                                      <div
                                        key={opt.label}
                                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${style}`}
                                      >
                                        <span
                                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                            isKey
                                              ? "bg-emerald-600 text-white"
                                              : isUserChoice
                                              ? "bg-destructive text-white"
                                              : "bg-muted text-muted-foreground"
                                          }`}
                                        >
                                          {opt.label}
                                        </span>
                                        <span className="flex-1 break-words">{opt.content}</span>
                                        {isKey && (
                                          <span className="text-[10px] text-emerald-600 font-bold shrink-0">
                                            Đáp án ✓
                                          </span>
                                        )}
                                        {isUserChoice && !isKey && (
                                          <span className="text-[10px] text-destructive font-bold shrink-0">
                                            Học sinh chọn ✗
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Student Essay Response & Score Input */}
                              {isEssay && (
                                <div className="space-y-3 pt-1">
                                  {/* Student's answer box */}
                                  <div className="p-3.5 rounded-xl bg-background border shadow-2xs space-y-1.5">
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                                      Bài làm của học sinh:
                                    </span>
                                    <p className="text-sm font-medium text-foreground whitespace-pre-wrap leading-relaxed">
                                      {resp?.answerText || (
                                        <span className="italic text-muted-foreground">
                                          (Học sinh không để lại câu trả lời)
                                        </span>
                                      )}
                                    </p>
                                  </div>

                                  {/* Teacher Score Input Box */}
                                  <div className="p-3.5 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                                        <PenLine className="w-3.5 h-3.5 text-amber-600" />
                                        Nhập điểm chấm (0 - {q.score}đ):
                                      </span>
                                      {resp?.gradedBy && (
                                        <span className="text-[10px] text-muted-foreground italic">
                                          (Đã chấm bởi {resp.gradedBy})
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                      {/* Quick score buttons */}
                                      <div className="flex items-center gap-1">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleSetQuickScore(q.id, 0)}
                                          className="h-7 px-2 text-[10px] rounded-lg cursor-pointer"
                                        >
                                          0đ
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleSetQuickScore(
                                              q.id,
                                              Math.round((q.score / 2) * 100) / 100
                                            )
                                          }
                                          className="h-7 px-2 text-[10px] rounded-lg cursor-pointer"
                                        >
                                          50% ({Math.round((q.score / 2) * 100) / 100}đ)
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleSetQuickScore(q.id, q.score)}
                                          className="h-7 px-2 text-[10px] rounded-lg cursor-pointer bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                        >
                                          Tối đa ({q.score}đ)
                                        </Button>
                                      </div>

                                      {/* Direct Number Input */}
                                      <div className="flex items-center gap-1.5">
                                        <Input
                                          type="number"
                                          min={0}
                                          max={q.score}
                                          step={0.25}
                                          value={currentScore}
                                          onChange={(e) =>
                                            handleScoreChange(q.id, q.score, e.target.value)
                                          }
                                          className="w-20 h-8 text-center text-sm font-bold rounded-lg border-amber-400 dark:border-amber-700 bg-background"
                                        />
                                        <span className="text-xs font-semibold text-muted-foreground">
                                          /{q.score}đ
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Modal Bottom Fixed Scoring Bar */}
        {attempt && (
          <div className="p-4 sm:px-6 border-t bg-muted/40 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Real-time Score Breakdown */}
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Trắc nghiệm
                </span>
                <span className="text-sm font-extrabold text-foreground">
                  {attempt.autoMcScore}đ
                </span>
              </div>

              <div className="text-muted-foreground font-bold">+</div>

              <div>
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">
                  Tự luận (Đang chấm)
                </span>
                <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
                  {liveEssayScore}đ
                </span>
              </div>

              <div className="text-muted-foreground font-bold">=</div>

              <div className="bg-primary/10 border border-primary/20 px-3 py-1 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-primary block">
                  Tổng điểm bài thi
                </span>
                <span className="text-base font-black text-primary">
                  {liveTotalScore}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    /{attempt.maxScore}đ ({liveScoreOn10}/10đ)
                  </span>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={gradeMutation.isPending}
                className="h-10 text-xs rounded-xl cursor-pointer"
              >
                Hủy / Đóng
              </Button>

              <Button
                onClick={handleSubmitGrades}
                disabled={gradeMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-10 px-5 text-xs rounded-xl gap-2 shadow-xs cursor-pointer"
              >
                {gradeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang lưu điểm…
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Lưu điểm & Hoàn thành
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

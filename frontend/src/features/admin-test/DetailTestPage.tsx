import { useState } from "react";
import {
  ArrowLeft,
  Clock,
  BookOpen,
  Users,
  Globe,
  Lock,
  Headphones,
  Mic,
  PenLine,
  ListOrdered,
  AlignLeft,
  AudioLines,
  CheckCircle2,
  Calendar,
  Loader2,
  Trash2,
  AlertCircle,
  HelpCircle,
  Pencil,
} from "lucide-react";
import {
  useTestById,
  useTogglePublishTest,
  useDeleteTest,
} from "@/stores/useTestStore.ts";
import type { SkillType, QuestionType } from "@/types/test.types.ts";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Separator } from "@/components/ui/separator.tsx";
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

interface DetailTestPageProps {
  testId: string;
  onBack: () => void;
  onEdit?: (testId: string) => void;
}

const SKILL_META: Record<
  SkillType,
  { label: string; icon: React.FC<{ className?: string }>; color: string }
> = {
  LISTENING: {
    label: "Nghe (Listening)",
    icon: ({ className }) => <Headphones className={className} />,
    color: "border-l-blue-500 bg-blue-50/40 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400",
  },
  SPEAKING: {
    label: "Nói (Speaking)",
    icon: ({ className }) => <Mic className={className} />,
    color: "border-l-purple-500 bg-purple-50/40 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400",
  },
  READING: {
    label: "Đọc (Reading)",
    icon: ({ className }) => <BookOpen className={className} />,
    color: "border-l-amber-500 bg-amber-50/40 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400",
  },
  WRITING: {
    label: "Viết (Writing)",
    icon: ({ className }) => <PenLine className={className} />,
    color: "border-l-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400",
  },
};

const QTYPE_META: Record<
  QuestionType,
  { label: string; icon: React.FC<{ className?: string }> }
> = {
  MULTIPLE_CHOICE: {
    label: "Trắc nghiệm",
    icon: ({ className }) => <ListOrdered className={className} />,
  },
  ESSAY: {
    label: "Tự luận",
    icon: ({ className }) => <AlignLeft className={className} />,
  },
  AUDIO_RESPONSE: {
    label: "Ghi âm",
    icon: ({ className }) => <AudioLines className={className} />,
  },
};

export function DetailTestPage({ testId, onBack, onEdit }: DetailTestPageProps) {
  const { data, isLoading, isError, refetch } = useTestById(testId);
  const togglePublishMutation = useTogglePublishTest();
  const deleteMutation = useDeleteTest();
  const [isDeleting, setIsDeleting] = useState(false);

  const test = data?.data as any;

  const handleTogglePublish = async () => {
    if (!test) return;
    await togglePublishMutation.mutateAsync(test.id);
  };

  const handleDelete = async () => {
    if (!test) return;
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(test.id);
      onBack();
    } catch (err) {
      console.error("Delete failed:", err);
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Đang tải chi tiết bài kiểm tra…</p>
      </div>
    );
  }

  if (isError || !test) {
    return (
      <div className="min-h-screen bg-background max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Không tìm thấy bài kiểm tra</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Bài kiểm tra có thể đã bị xóa hoặc xảy ra lỗi kết nối đến server.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách
          </Button>
          <Button onClick={() => refetch()}>Thử lại</Button>
        </div>
      </div>
    );
  }

  const sections = test.sections ?? [];
  const totalQuestions = sections.reduce(
    (sum: number, sec: any) => sum + (sec.questions?.length ?? 0),
    0
  );
  const totalScore = sections.reduce(
    (sum: number, sec: any) =>
      sum +
      (sec.questions ?? []).reduce(
        (qSum: number, q: any) => qSum + (q.score ?? 1),
        0
      ),
    0
  );

  const createdAt = test.createdAt
    ? new Date(test.createdAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "–";

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground gap-1.5 pl-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </Button>

          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(test.id)}
                className="h-8 gap-1.5 text-xs"
              >
                <Pencil className="w-3.5 h-3.5" />
                Sửa bài thi
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePublish}
              disabled={togglePublishMutation.isPending}
              className="h-8 gap-1.5 text-xs"
            >
              {togglePublishMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : test.isPublished ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  Hủy xuất bản
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5" />
                  Xuất bản ngay
                </>
              )}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Xóa
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận xóa bài kiểm tra</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc muốn xóa bài thi <strong>"{test.title}"</strong>?
                    Toàn bộ câu hỏi, phần thi và kết quả liên quan sẽ bị xóa vĩnh viễn.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Test Overview Card */}
        <div className="bg-card rounded-2xl border shadow-sm p-6 mb-8 relative overflow-hidden">
          <div
            className={`absolute top-0 left-0 right-0 h-1.5 ${
              test.isPublished ? "bg-emerald-500" : "bg-muted"
            }`}
          />

          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">
                  {test.title}
                </h1>
                <Badge
                  variant={test.isPublished ? "default" : "secondary"}
                  className={`text-xs gap-1 ${
                    test.isPublished
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200"
                      : ""
                  }`}
                >
                  {test.isPublished ? (
                    <>
                      <Globe className="w-3 h-3" /> Đã xuất bản
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3" /> Bản nháp
                    </>
                  )}
                </Badge>
              </div>
              {test.description && (
                <p className="text-sm text-muted-foreground">
                  {test.description}
                </p>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-xl bg-muted/30 border">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs font-medium mb-1">
                <Clock className="w-3.5 h-3.5" /> Thời gian
              </div>
              <div className="text-lg font-bold text-foreground">
                {test.durationMin} <span className="text-xs font-normal text-muted-foreground">phút</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/30 border">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs font-medium mb-1">
                <BookOpen className="w-3.5 h-3.5" /> Phần thi
              </div>
              <div className="text-lg font-bold text-foreground">
                {sections.length} <span className="text-xs font-normal text-muted-foreground">phần</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/30 border">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs font-medium mb-1">
                <HelpCircle className="w-3.5 h-3.5" /> Câu hỏi / Điểm
              </div>
              <div className="text-lg font-bold text-foreground">
                {totalQuestions} <span className="text-xs font-normal text-muted-foreground">câu ({Number(Number(totalScore).toFixed(2))}đ)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/30 border">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs font-medium mb-1">
                <Users className="w-3.5 h-3.5" /> Lượt làm bài
              </div>
              <div className="text-lg font-bold text-foreground">
                {test._count?.attempts ?? 0} <span className="text-xs font-normal text-muted-foreground">lượt</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>Ngày tạo: {createdAt}</span>
          </div>
        </div>

        {/* Section List & Questions */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              Nội dung bài thi ({sections.length} phần, {totalQuestions} câu hỏi)
            </h2>
          </div>

          {sections.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border bg-card text-muted-foreground">
              Chưa có phần thi hoặc câu hỏi nào trong bài kiểm tra này.
            </div>
          ) : (
            sections.map((sec: any, sIdx: number) => {
              const skillMeta = SKILL_META[sec.skill as SkillType] || {
                label: sec.skill,
                icon: () => <BookOpen className="w-4 h-4" />,
                color: "border-l-primary bg-muted/30 text-primary",
              };
              const SkillIcon = skillMeta.icon;
              const questions = sec.questions ?? [];

              return (
                <div
                  key={sec.id || sIdx}
                  className="rounded-2xl border bg-card shadow-sm overflow-hidden"
                >
                  {/* Section Header */}
                  <div className="p-4 sm:px-6 bg-muted/20 border-b flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-background border shadow-xs">
                        <SkillIcon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm sm:text-base">
                            Phần {sec.order ?? sIdx + 1}: {skillMeta.label}
                          </span>
                        </div>
                        {sec.durationMin && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> Giới hạn phần này: {sec.durationMin} phút
                          </span>
                        )}
                      </div>
                    </div>

                    <Badge variant="outline" className="text-xs">
                      {questions.length} câu hỏi
                    </Badge>
                  </div>

                  {/* Question List */}
                  <div className="p-4 sm:p-6 space-y-5">
                    {questions.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        Không có câu hỏi trong phần này.
                      </p>
                    ) : (
                      questions.map((q: any, qIdx: number) => {
                        const qMeta = QTYPE_META[q.type as QuestionType] || {
                          label: q.type,
                          icon: () => <HelpCircle className="w-3.5 h-3.5" />,
                        };
                        const QIcon = qMeta.icon;

                        return (
                          <div
                            key={q.id || qIdx}
                            className="rounded-xl border bg-background/50 p-4 space-y-3"
                          >
                            {/* Question Meta */}
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                                  Câu {q.order ?? qIdx + 1}
                                </span>
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <QIcon className="w-3 h-3" /> {qMeta.label}
                                </span>
                              </div>
                              <span className="font-semibold text-muted-foreground">
                                {q.score ?? 1} điểm
                              </span>
                            </div>

                            {/* Question Content */}
                            <div className="text-sm font-medium text-foreground whitespace-pre-wrap">
                              {q.content || <span className="italic text-muted-foreground">Chưa nhập nội dung</span>}
                            </div>

                            {/* Options if MULTIPLE_CHOICE */}
                            {q.type === "MULTIPLE_CHOICE" && q.options && q.options.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                {q.options.map((opt: any) => {
                                  const isCorrect = q.correctAnswer === opt.label;
                                  return (
                                    <div
                                      key={opt.id || opt.label}
                                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs transition-colors ${
                                        isCorrect
                                          ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 font-medium"
                                          : "border-border/60 bg-muted/10 text-muted-foreground"
                                      }`}
                                    >
                                      <span
                                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                          isCorrect
                                            ? "bg-emerald-500 text-white"
                                            : "bg-muted text-muted-foreground"
                                        }`}
                                      >
                                        {opt.label}
                                      </span>
                                      <span className="flex-1 break-words">{opt.content}</span>
                                      {isCorrect && (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Essay note */}
                            {q.type === "ESSAY" && (
                              <div className="p-2.5 rounded-lg bg-muted/20 border text-xs text-muted-foreground italic">
                                Học sinh nhập câu trả lời tự luận.
                              </div>
                            )}

                            {/* Audio Response note */}
                            {q.type === "AUDIO_RESPONSE" && (
                              <div className="p-2.5 rounded-lg bg-muted/20 border text-xs text-muted-foreground italic">
                                Học sinh ghi âm câu trả lời.
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

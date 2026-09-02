import { useState, useEffect } from "react";
import {
  X,
  Clock,
  Pencil,
  Loader2,
  CheckCircle2,
  ChevronRight,
  Info,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import type {
  UpdateTestPayload,
  CreateSectionPayload,
} from "@/types/admin-test.types.ts";
import { useTestById, useUpdateTest } from "@/stores/useTestStore.ts";
import { SectionBuilder } from "./SectionBuilder.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Label } from "@/components/ui/label.tsx";

interface EditTestPageProps {
  testId: string;
  onBack: () => void;
  onSuccess?: () => void;
}

const STEPS = [
  { id: 1, label: "Thông tin chung" },
  { id: 2, label: "Nội dung đề thi" },
  { id: 3, label: "Xác nhận & Cập nhật" },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all
              ${
                current === step.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : current > step.id
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground"
              }
            `}
          >
            <span
              className={`
                w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border
                ${
                  current === step.id
                    ? "border-primary-foreground bg-primary-foreground/20"
                    : current > step.id
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-muted-foreground/40"
                }
              `}
            >
              {current > step.id ? <CheckCircle2 className="w-3 h-3" /> : step.id}
            </span>
            {step.label}
          </div>
          {i < STEPS.length - 1 && (
            <ChevronRight className="w-4 h-4 text-muted-foreground/40 mx-1" />
          )}
        </div>
      ))}
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        {hint && (
          <span className="text-muted-foreground" title={hint}>
            <Info className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export function EditTestPage({ testId, onBack, onSuccess }: EditTestPageProps) {
  const { data, isLoading, isError, refetch } = useTestById(testId);
  const updateMutation = useUpdateTest(testId);

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [sections, setSections] = useState<CreateSectionPayload[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUpdated, setIsUpdated] = useState(false);

  // Khi có dữ liệu test, nạp vào state
  useEffect(() => {
    if (data?.data) {
      const test = data.data as any;
      setTitle(test.title || "");
      setDescription(test.description || "");
      setDurationMin(String(test.durationMin || ""));
      setIsPublished(Boolean(test.isPublished));

      if (Array.isArray(test.sections) && test.sections.length > 0) {
        setSections(
          test.sections.map((sec: any) => ({
            skill: sec.skill,
            order: sec.order,
            durationMin: sec.durationMin,
            questions: Array.isArray(sec.questions)
              ? sec.questions.map((q: any) => ({
                  type: q.type,
                  order: q.order,
                  content: q.content,
                  audioUrl: q.audioUrl,
                  imageUrl: q.imageUrl,
                  correctAnswer: q.correctAnswer,
                  score: q.score,
                  options: Array.isArray(q.options)
                    ? q.options.map((opt: any) => ({
                        label: opt.label,
                        content: opt.content,
                      }))
                    : [],
                }))
              : [],
          }))
        );
      } else {
        setSections([
          {
            skill: "LISTENING",
            durationMin: null,
            questions: [
              {
                type: "MULTIPLE_CHOICE",
                content: "",
                score: 1,
                correctAnswer: null,
                options: [
                  { label: "A", content: "" },
                  { label: "B", content: "" },
                  { label: "C", content: "" },
                  { label: "D", content: "" },
                ],
              },
            ],
          },
        ]);
      }
    }
  }, [data]);

  const canGoNext = () => {
    if (step === 1) return title.trim() !== "" && Number(durationMin) > 0;
    if (step === 2) return sections.length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    try {
      const payload: UpdateTestPayload = {
        title: title.trim(),
        description: description.trim() || null,
        durationMin: Number(durationMin),
        isPublished,
        sections,
      };

      await updateMutation.mutateAsync(payload);
      setIsUpdated(true);

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          onBack();
        }
      }, 1500);
    } catch (err: any) {
      console.error("Update test failed:", err);
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          "Lỗi khi cập nhật bài kiểm tra. Vui lòng thử lại!"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Đang tải dữ liệu bài thi để chỉnh sửa…</p>
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="min-h-screen bg-background max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Không tìm thấy bài kiểm tra</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Không thể lấy thông tin bài thi để chỉnh sửa.
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

  const totalQuestions = sections.reduce(
    (sum, sec) => sum + (sec.questions?.length ?? 0),
    0
  );
  const totalScore = sections.reduce(
    (sum, sec) =>
      sum + (sec.questions ?? []).reduce((s, q) => s + (q.score ?? 1), 0),
    0
  );

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Navigation & Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground gap-1.5 pl-0 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </Button>

          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Pencil className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Chỉnh sửa bài kiểm tra
              </h1>
              <p className="text-sm text-muted-foreground">
                Cập nhật thông tin và các câu hỏi trong đề thi
              </p>
            </div>
          </div>
        </div>

        {/* Step bar */}
        <div className="mb-6">
          <StepBar current={step} />
        </div>

        <Separator className="mb-8" />

        {/* Content card */}
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden relative">
          {/* Success overlay */}
          {isUpdated && (
            <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl gap-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">
                  Cập nhật bài thi thành công!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Đang chuyển hướng về trang trước…
                </p>
              </div>
            </div>
          )}

          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                {STEPS[step - 1].label}
              </h2>
              <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                {step} / {STEPS.length}
              </span>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm flex items-center justify-between">
                <span>{errorMsg}</span>
                <button
                  type="button"
                  onClick={() => setErrorMsg(null)}
                  className="text-xs underline ml-3 shrink-0"
                >
                  Đóng
                </button>
              </div>
            )}

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-5">
                <Field label="Tên bài kiểm tra" required>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Đề kiểm tra Tiếng Anh lớp 10 – HK1"
                    className="text-base"
                    autoFocus
                  />
                </Field>

                <Field label="Mô tả" hint="Hiển thị cho học sinh trước khi làm bài">
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả ngắn về bài kiểm tra…"
                    rows={3}
                    className="resize-none"
                  />
                </Field>

                <Field label="Thời gian làm bài (phút)" required>
                  <div className="flex items-center gap-2 max-w-[160px]">
                    <div className="relative flex-1">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min={1}
                        value={durationMin}
                        onChange={(e) => setDurationMin(e.target.value)}
                        className="pl-9 text-center"
                        placeholder="90"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground shrink-0">phút</span>
                  </div>
                </Field>

                <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">Trạng thái xuất bản</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Bật để học sinh có thể thấy và làm bài thi
                    </p>
                  </div>
                  <Switch
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Content & Questions */}
            {step === 2 && (
              <SectionBuilder sections={sections} onChange={setSections} />
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-xl border overflow-hidden">
                  {[
                    ["Tên bài thi", title || "–"],
                    ["Mô tả", description || "–"],
                    ["Thời gian", `${durationMin} phút`],
                    ["Số phần thi", `${sections.length} phần`],
                    ["Tổng câu hỏi", `${totalQuestions} câu`],
                    ["Tổng điểm", `${totalScore.toFixed(1)} điểm`],
                    ["Trạng thái", isPublished ? "Đã xuất bản" : "Bản nháp"],
                  ].map(([label, val], i) => (
                    <div
                      key={label}
                      className={`flex items-start gap-4 px-4 py-3 ${
                        i % 2 === 0 ? "bg-muted/20" : "bg-background"
                      }`}
                    >
                      <span className="text-sm text-muted-foreground w-36 shrink-0">
                        {label}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {val}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border p-4 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    Chi tiết các phần thi
                  </p>
                  {sections.map((sec, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm py-1.5 border-b last:border-0"
                    >
                      <span className="font-medium">
                        Phần {i + 1} — {sec.skill}
                        {sec.durationMin && (
                          <span className="text-muted-foreground ml-1.5">
                            ({sec.durationMin} phút)
                          </span>
                        )}
                      </span>
                      <span className="text-muted-foreground">
                        {sec.questions?.length ?? 0} câu
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between px-6 md:px-8 py-4 border-t bg-muted/20">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 1}
            >
              <X className="w-4 h-4 mr-1.5" />
              Quay lại
            </Button>

            {step < STEPS.length ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canGoNext()}
              >
                Tiếp theo
                <ChevronRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={updateMutation.isPending || isUpdated}
                className="min-w-[150px]"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang lưu…
                  </>
                ) : isUpdated ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Đã cập nhật!
                  </>
                ) : (
                  <>
                    <Pencil className="w-4 h-4 mr-2" />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

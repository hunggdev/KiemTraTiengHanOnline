import { useEffect } from "react";
import { useTestAttemptStore } from "@/store/useTestAttemptStore";
import { TestTimer } from "./TestTimer";
import { QuestionNavigator } from "./QuestionNavigator";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MultipleChoiceTestProps {
  testId: string;
}

export function MultipleChoiceTest({ testId }: MultipleChoiceTestProps) {
  const {
    test,
    attempt,
    currentSectionIndex,
    currentQuestionIndex,
    answers,
    saveStatus,
    isLoading,
    isSubmitting,
    error,
    loadTest,
    selectAnswer,
    retrySave,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    submitAttempt,
    getCurrentQuestion,
    getAnsweredCount,
    getTotalQuestionCount,
  } = useTestAttemptStore();

  useEffect(() => {
    loadTest(testId);
  }, [testId, loadTest]);

  if (isLoading) {
    return (
      <p className="p-6 text-center text-muted-foreground">
        Đang tải đề thi...
      </p>
    );
  }

  if (error) {
    return <p className="p-6 text-center text-destructive">{error}</p>;
  }

  if (!test || !attempt) return null;

  const isFinished =
    attempt.status === "SUBMITTED" ||
    attempt.status === "GRADED" ||
    attempt.status === "EXPIRED";

  if (isFinished) {
    return (
      <div className="mx-auto max-w-md space-y-2 p-6 text-center">
        <h2 className="text-lg font-semibold">Bạn đã nộp bài</h2>
        <p className="text-muted-foreground">
          {attempt.totalScore != null
            ? `Điểm hiện tại: ${attempt.totalScore}`
            : "Bài làm đang chờ giáo viên chấm."}
        </p>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();
  const answeredCount = getAnsweredCount();
  const totalCount = getTotalQuestionCount();
  const answeredQuestionIds = new Set(Object.keys(answers));

  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-4 lg:grid-cols-[1fr_260px]">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">{test.title}</h1>
            <p className="text-sm text-muted-foreground">
              Đã trả lời {answeredCount}/{totalCount} câu
            </p>
          </div>
          <TestTimer deadline={attempt.deadline} onExpire={submitAttempt} />
        </div>

        <Progress value={(answeredCount / Math.max(totalCount, 1)) * 100} />

        {currentQuestion && (
          <MultipleChoiceQuestion
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            selectedOptionId={answers[String(currentQuestion.id)]}
            saveStatus={saveStatus[String(currentQuestion.id)]}
            onSelect={(optionId) => selectAnswer(String(currentQuestion.id), optionId)}
            onRetrySave={() => retrySave(String(currentQuestion.id))}
          />
        )}

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={prevQuestion}>
            Câu trước
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={nextQuestion}>
              Câu tiếp theo
            </Button>
            <SubmitDialog
              isSubmitting={isSubmitting}
              answeredCount={answeredCount}
              totalCount={totalCount}
              onConfirm={submitAttempt}
            />
          </div>
        </div>
      </div>

      <aside className="h-fit rounded-lg border p-4">
        <QuestionNavigator
          sections={test.sections}
          currentSectionIndex={currentSectionIndex}
          currentQuestionIndex={currentQuestionIndex}
          answeredQuestionIds={answeredQuestionIds}
          onSelect={goToQuestion}
        />
      </aside>
    </div>
  );
}

function SubmitDialog({
  isSubmitting,
  answeredCount,
  totalCount,
  onConfirm,
}: {
  isSubmitting: boolean;
  answeredCount: number;
  totalCount: number;
  onConfirm: () => void;
}) {
  const unanswered = totalCount - answeredCount;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button disabled={isSubmitting}>Nộp bài</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận nộp bài</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {unanswered > 0
            ? `Bạn còn ${unanswered} câu chưa trả lời. Bạn có chắc muốn nộp bài không?`
            : "Bạn đã trả lời tất cả các câu. Nộp bài ngay?"}
        </p>
        <DialogFooter>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Đang nộp..." : "Xác nhận nộp bài"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

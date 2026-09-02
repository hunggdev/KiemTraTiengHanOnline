import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { QuestionDTO, OptionDTO, SaveStatus } from "@/types/test.types";

interface MultipleChoiceQuestionProps {
  question: QuestionDTO;
  questionNumber: number;
  selectedOptionId?: string;
  saveStatus?: SaveStatus;
  onSelect: (optionId: string) => void;
  onRetrySave?: () => void;
}

export function MultipleChoiceQuestion({
  question,
  questionNumber,
  selectedOptionId,
  saveStatus,
  onSelect,
  onRetrySave,
}: MultipleChoiceQuestionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <p className="text-base font-medium leading-relaxed">
          <span className="text-muted-foreground">Câu {questionNumber}. </span>
          {question.content}
        </p>
        <SaveIndicator status={saveStatus} onRetry={onRetrySave} />
      </CardHeader>

      <CardContent className="space-y-4">
        {question.audioUrl && (
          <audio controls className="w-full">
            <source src={question.audioUrl} />
          </audio>
        )}

        {question.imageUrl && (
          <img
            src={question.imageUrl}
            alt="Hình minh hoạ câu hỏi"
            className="max-h-64 rounded-md border object-contain"
          />
        )}

        <RadioGroup
          value={selectedOptionId}
          onValueChange={onSelect}
          className="space-y-2"
        >
          {question.options.map((option: OptionDTO) => {
            const isSelected = option.id === selectedOptionId;
            const inputId = `${question.id}-${option.id}`;

            return (
              <Label
                key={option.id}
                htmlFor={inputId}
                className={[
                  "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted",
                ].join(" ")}
              >
                <RadioGroupItem value={String(option.id)} id={inputId} className="mt-0.5" />
                <span className="font-medium text-muted-foreground">
                  {option.label}.
                </span>
                <span>{option.content}</span>
              </Label>
            );
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}

function SaveIndicator({
  status,
  onRetry,
}: {
  status?: SaveStatus;
  onRetry?: () => void;
}) {
  if (!status || status === "idle") return null;

  if (status === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 text-xs font-medium text-destructive underline underline-offset-2 cursor-pointer"
      >
        Lỗi khi lưu, bấm để thử lại
      </button>
    );
  }

  const label = status === "saving" ? "Đang lưu..." : "Đã lưu";
  const className =
    status === "saving" ? "text-muted-foreground" : "text-emerald-600";

  return <span className={`shrink-0 text-xs ${className}`}>{label}</span>;
}

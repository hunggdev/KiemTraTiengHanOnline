import { cn } from "@/lib/utils";
import type { TestSectionDTO, QuestionDTO } from "@/types/test.types";

interface QuestionNavigatorProps {
  sections: TestSectionDTO[];
  currentSectionIndex: number;
  currentQuestionIndex: number;
  answeredQuestionIds: Set<string>;
  onSelect: (sectionIndex: number, questionIndex: number) => void;
}

const SKILL_LABEL: Record<string, string> = {
  LISTENING: "Nghe",
  SPEAKING: "Nói",
  READING: "Đọc",
  WRITING: "Viết",
};

export function QuestionNavigator({
  sections,
  currentSectionIndex,
  currentQuestionIndex,
  answeredQuestionIds,
  onSelect,
}: QuestionNavigatorProps) {
  return (
    <div className="space-y-5">
      {sections.map((section: TestSectionDTO, sectionIndex: number) => (
        <div key={section.id}>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            {SKILL_LABEL[section.skill] ?? section.skill}
          </p>
          <div className="grid grid-cols-5 gap-2">
            {section.questions.map((question: QuestionDTO, questionIndex: number) => {
              const isCurrent =
                sectionIndex === currentSectionIndex &&
                questionIndex === currentQuestionIndex;
              const isAnswered = answeredQuestionIds.has(String(question.id));

              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => onSelect(sectionIndex, questionIndex)}
                  aria-current={isCurrent}
                  aria-label={`Câu ${questionIndex + 1}${isAnswered ? " (đã trả lời)" : ""}`}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium transition-colors cursor-pointer",
                    isCurrent &&
                      "border-primary bg-primary text-primary-foreground",
                    !isCurrent &&
                      isAnswered &&
                      "border-emerald-500/40 bg-emerald-500/10 text-emerald-700",
                    !isCurrent &&
                      !isAnswered &&
                      "border-border bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  {questionIndex + 1}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

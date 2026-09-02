import { useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Headphones,
  Mic,
  BookOpen,
  PenLine,
  AlignLeft,
  ListOrdered,
  AudioLines,
} from "lucide-react";
import type {
  CreateSectionPayload,
  CreateQuestionPayload,
  CreateOptionPayload,
} from "@/types/admin-test.types.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Separator } from "@/components/ui/separator.tsx";

// ──────────────────── helpers ────────────────────
type SkillType = "LISTENING" | "SPEAKING" | "READING" | "WRITING";
type QuestionType = "MULTIPLE_CHOICE" | "ESSAY" | "AUDIO_RESPONSE";

const SKILL_META: Record<SkillType, { label: string; Icon: React.FC<{ className?: string }> }> = {
  LISTENING: { label: "Nghe", Icon: ({ className }) => <Headphones className={className} /> },
  SPEAKING: { label: "Nói", Icon: ({ className }) => <Mic className={className} /> },
  READING: { label: "Đọc", Icon: ({ className }) => <BookOpen className={className} /> },
  WRITING: { label: "Viết", Icon: ({ className }) => <PenLine className={className} /> },
};

const QTYPE_META: Record<QuestionType, { label: string; Icon: React.FC<{ className?: string }> }> = {
  MULTIPLE_CHOICE: { label: "Trắc nghiệm", Icon: ({ className }) => <ListOrdered className={className} /> },
  ESSAY: { label: "Tự luận", Icon: ({ className }) => <AlignLeft className={className} /> },
  AUDIO_RESPONSE: { label: "Ghi âm", Icon: ({ className }) => <AudioLines className={className} /> },
};

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

const newOption = (label: string): CreateOptionPayload => ({ label, content: "" });
const newQuestion = (): CreateQuestionPayload => ({
  type: "MULTIPLE_CHOICE",
  content: "",
  score: 1,
  correctAnswer: null,
  options: [newOption("A"), newOption("B"), newOption("C"), newOption("D")],
});
const newSection = (): CreateSectionPayload => ({
  skill: "LISTENING",
  durationMin: null,
  questions: [newQuestion()],
});

// ──────────────────── Option row ────────────────────
interface OptionRowProps {
  option: CreateOptionPayload;
  isCorrect: boolean;
  onContentChange: (val: string) => void;
  onSetCorrect: () => void;
  onRemove: () => void;
  canRemove: boolean;
}

function OptionRow({ option, isCorrect, onContentChange, onSetCorrect, onRemove, canRemove }: OptionRowProps) {
  return (
    <div className="flex items-center gap-2 group">
      <button
        type="button"
        onClick={onSetCorrect}
        title={isCorrect ? "Đáp án đúng" : "Chọn làm đáp án đúng"}
        className={`
          w-7 h-7 rounded-full border-2 text-xs font-bold shrink-0 transition-all
          ${isCorrect
            ? "border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-200"
            : "border-border text-muted-foreground hover:border-emerald-400 hover:text-emerald-500"}
        `}
      >
        {option.label}
      </button>
      <Input
        value={option.content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder={`Nội dung đáp án ${option.label}…`}
        className="flex-1 h-9 text-sm"
      />
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ──────────────────── Question card ────────────────────
interface QuestionCardProps {
  question: CreateQuestionPayload;
  index: number;
  onChange: (q: CreateQuestionPayload) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function QuestionCard({ question, index, onChange, onRemove, canRemove }: QuestionCardProps) {
  const updateOption = (i: number, content: string) => {
    const options = [...(question.options ?? [])];
    options[i] = { ...options[i], content };
    onChange({ ...question, options });
  };

  const setCorrectOption = (label: string) => {
    onChange({ ...question, correctAnswer: label });
  };

  const addOption = () => {
    const opts = question.options ?? [];
    if (opts.length >= OPTION_LABELS.length) return;
    const label = OPTION_LABELS[opts.length];
    onChange({ ...question, options: [...opts, newOption(label)] });
  };

  const removeOption = (i: number) => {
    const opts = (question.options ?? []).filter((_, idx) => idx !== i);
    onChange({ ...question, options: opts });
  };

  const QIcon = QTYPE_META[question.type].Icon;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b">
        <GripVertical className="w-4 h-4 text-muted-foreground shrink-0 cursor-grab" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Câu {index + 1}
        </span>

        <div className="flex items-center gap-1.5 ml-auto">
          <QIcon className="w-3.5 h-3.5 text-muted-foreground" />
          <Select
            value={question.type}
            onValueChange={(v) =>
              onChange({ ...question, type: v as QuestionType, options: v === "MULTIPLE_CHOICE" ? [newOption("A"), newOption("B"), newOption("C"), newOption("D")] : [] })
            }
          >
            <SelectTrigger className="h-7 text-xs w-40 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(QTYPE_META).map(([val, { label, Icon }]) => (
                <SelectItem key={val} value={val}>
                  <span className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="number"
            min={0.25}
            step={0.25}
            value={question.score ?? 1}
            onChange={(e) => onChange({ ...question, score: Number(e.target.value) })}
            className="h-7 w-20 text-xs text-center"
            title="Điểm câu hỏi"
          />
          <span className="text-xs text-muted-foreground">đ</span>
        </div>

        {canRemove && (
          <button type="button" onClick={onRemove} className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* body */}
      <div className="p-4 space-y-3">
        <Textarea
          value={question.content}
          onChange={(e) => onChange({ ...question, content: e.target.value })}
          placeholder="Nhập nội dung câu hỏi…"
          className="text-sm resize-none min-h-[72px]"
          rows={3}
        />

        {question.type === "MULTIPLE_CHOICE" && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Các đáp án — click vào chữ cái để chọn đáp án đúng
            </p>
            {(question.options ?? []).map((opt, i) => (
              <OptionRow
                key={opt.label}
                option={opt}
                isCorrect={question.correctAnswer === opt.label}
                onContentChange={(val) => updateOption(i, val)}
                onSetCorrect={() => setCorrectOption(opt.label)}
                onRemove={() => removeOption(i)}
                canRemove={(question.options?.length ?? 0) > 2}
              />
            ))}
            {(question.options?.length ?? 0) < OPTION_LABELS.length && (
              <button
                type="button"
                onClick={addOption}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mt-1"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm đáp án
              </button>
            )}
          </div>
        )}

        {question.type === "ESSAY" && (
          <p className="text-xs text-muted-foreground italic">
            Câu tự luận — học sinh sẽ nhập văn bản trả lời
          </p>
        )}
        {question.type === "AUDIO_RESPONSE" && (
          <p className="text-xs text-muted-foreground italic">
            Câu ghi âm — học sinh sẽ ghi âm câu trả lời
          </p>
        )}
      </div>
    </div>
  );
}

// ──────────────────── Section panel ────────────────────
interface SectionPanelProps {
  section: CreateSectionPayload;
  index: number;
  onChange: (s: CreateSectionPayload) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function SectionPanel({ section, index, onChange, onRemove, canRemove }: SectionPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { label, Icon } = SKILL_META[section.skill];

  const updateQuestion = useCallback(
    (i: number, q: CreateQuestionPayload) => {
      const questions = [...(section.questions ?? [])];
      questions[i] = q;
      onChange({ ...section, questions });
    },
    [section, onChange]
  );

  const removeQuestion = (i: number) => {
    const questions = (section.questions ?? []).filter((_, idx) => idx !== i);
    onChange({ ...section, questions });
  };

  const addQuestion = () => {
    onChange({ ...section, questions: [...(section.questions ?? []), newQuestion()] });
  };

  const SKILL_COLORS: Record<SkillType, string> = {
    LISTENING: "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20",
    SPEAKING: "border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/20",
    READING: "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20",
    WRITING: "border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20",
  };

  return (
    <div className={`rounded-xl border-l-4 border border-border shadow-sm overflow-hidden ${SKILL_COLORS[section.skill]}`}>
      {/* section header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60">
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">{label}</span>
          <span className="text-xs text-muted-foreground">Phần {index + 1}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Select
            value={section.skill}
            onValueChange={(v) => onChange({ ...section, skill: v as SkillType })}
          >
            <SelectTrigger className="h-7 text-xs w-36 bg-background/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SKILL_META).map(([val, { label: l, Icon: I }]) => (
                <SelectItem key={val} value={val}>
                  <span className="flex items-center gap-1.5">
                    <I className="w-3.5 h-3.5" />
                    {l}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={1}
              placeholder="Phút"
              value={section.durationMin ?? ""}
              onChange={(e) => onChange({ ...section, durationMin: e.target.value ? Number(e.target.value) : null })}
              className="h-7 w-20 text-xs text-center bg-background/80"
              title="Giới hạn thời gian phần này (tùy chọn)"
            />
            <span className="text-xs text-muted-foreground">phút</span>
          </div>

          {canRemove && (
            <button type="button" onClick={onRemove} className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* questions */}
      {!collapsed && (
        <div className="p-4 space-y-3">
          {(section.questions ?? []).map((q, i) => (
            <QuestionCard
              key={i}
              index={i}
              question={q}
              onChange={(updated) => updateQuestion(i, updated)}
              onRemove={() => removeQuestion(i)}
              canRemove={(section.questions?.length ?? 0) > 1}
            />
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addQuestion}
            className="w-full mt-2 border-dashed text-muted-foreground hover:text-foreground"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Thêm câu hỏi
          </Button>
        </div>
      )}
    </div>
  );
}

// ──────────────────── Main export: SectionBuilder ────────────────────
interface SectionBuilderProps {
  sections: CreateSectionPayload[];
  onChange: (sections: CreateSectionPayload[]) => void;
}

export function SectionBuilder({ sections, onChange }: SectionBuilderProps) {
  const updateSection = (i: number, s: CreateSectionPayload) => {
    const next = [...sections];
    next[i] = s;
    onChange(next);
  };

  const removeSection = (i: number) => {
    onChange(sections.filter((_, idx) => idx !== i));
  };

  const addSection = () => {
    onChange([...sections, newSection()]);
  };

  return (
    <div className="space-y-4">
      {sections.map((sec, i) => (
        <SectionPanel
          key={i}
          index={i}
          section={sec}
          onChange={(updated) => updateSection(i, updated)}
          onRemove={() => removeSection(i)}
          canRemove={sections.length > 1}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addSection}
        className="w-full border-dashed text-muted-foreground hover:text-foreground"
      >
        <Plus className="w-4 h-4 mr-2" />
        Thêm phần thi
      </Button>
    </div>
  );
}

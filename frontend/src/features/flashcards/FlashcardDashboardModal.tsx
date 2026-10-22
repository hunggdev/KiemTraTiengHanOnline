import React, { useMemo } from "react";
import {
  Flame,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Clock,
  Sparkles,
  Layers,
  X,
  Play,
  RotateCcw,
} from "lucide-react";
import { useFlashcardStore, type StudyStats } from "@/stores/useFlashcardStore.ts";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onStartStudy?: (deckId: string | number) => void;
}

export function FlashcardDashboardModal({ isOpen, onClose, onStartStudy }: Props) {
  const { decks, studyStats } = useFlashcardStore();

  const stats = studyStats || {
    streak: 0,
    lastStudyDate: "",
    totalReviews: 0,
    dailyReviews: {},
  };

  // 1. Phân loại toàn bộ thẻ theo trạng thái SRS
  const srsDistribution = useMemo(() => {
    let newCount = 0;
    let learningCount = 0;
    let reviewCount = 0;
    let masteredCount = 0;
    let total = 0;
    const now = new Date();

    decks.forEach((deck) => {
      if (!deck.cards) return;
      deck.cards.forEach((c) => {
        total++;
        if (c.mastered) {
          masteredCount++;
        } else if (c.state === "NEW" || (!c.repetition && !c.lastReviewedAt)) {
          newCount++;
        } else if (c.nextReviewDate && new Date(c.nextReviewDate) <= now) {
          reviewCount++;
        } else {
          learningCount++;
        }
      });
    });

    return {
      newCount,
      learningCount,
      reviewCount,
      masteredCount,
      total,
    };
  }, [decks]);

  // 2. Dữ liệu hoạt động 7 ngày qua
  const past7Days = useMemo(() => {
    const days: { label: string; dateStr: string; count: number }[] = [];
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const pad = (n: number) => String(n).padStart(2, "0");
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const label = i === 0 ? "Hôm nay" : dayNames[d.getDay()];
      const count = stats.dailyReviews?.[dateStr] || 0;
      days.push({ label, dateStr, count });
    }

    const maxCount = Math.max(...days.map((d) => d.count), 10);
    return { days, maxCount };
  }, [stats.dailyReviews]);

  // Huy hiệu danh hiệu dựa theo streak & reviews
  const badgeTitle = useMemo(() => {
    if (stats.streak >= 30) return { title: "Huyền thoại TOPIK", color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/30" };
    if (stats.streak >= 14) return { title: "Chiến binh kiên trì", color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/30" };
    if (stats.streak >= 7) return { title: "Ong chăm chỉ", color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/30" };
    if (stats.totalReviews >= 20) return { title: "Người học tích cực", color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/30" };
    return { title: "Tân binh tiếng Hàn", color: "text-primary", bg: "bg-primary/10 border-primary/30" };
  }, [stats.streak, stats.totalReviews]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-card w-full max-w-2xl rounded-3xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-primary/10 via-amber-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
              <Flame className="w-6 h-6 fill-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-foreground">
                  Tiến độ & Chuỗi học tập (SRS)
                </h2>
                <Badge variant="outline" className={`text-[10px] font-bold ${badgeTitle.bg} ${badgeTitle.color}`}>
                  {badgeTitle.title}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Theo dõi hiệu quả ghi nhớ theo thuật toán ngắt quãng SuperMemo SM-2
              </p>
            </div>
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

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Top Key Metrics */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/20 shadow-xs">
              <span className="flex items-center justify-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                Streak ngày học
              </span>
              <div className="text-3xl font-black text-foreground">
                {stats.streak}{" "}
                <span className="text-xs font-normal text-muted-foreground">ngày</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-b from-primary/10 to-transparent border border-primary/20 shadow-xs">
              <span className="flex items-center justify-center gap-1 text-xs font-semibold text-primary mb-1">
                <RotateCcw className="w-4 h-4" />
                Tổng lượt ôn
              </span>
              <div className="text-3xl font-black text-foreground">
                {stats.totalReviews}{" "}
                <span className="text-xs font-normal text-muted-foreground">lượt</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-500/10 to-transparent border border-emerald-500/20 shadow-xs">
              <span className="flex items-center justify-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                Đã thành thạo
              </span>
              <div className="text-3xl font-black text-foreground">
                {srsDistribution.masteredCount}{" "}
                <span className="text-xs font-normal text-muted-foreground">từ</span>
              </div>
            </div>
          </div>

          {/* 7-Day Activity Chart */}
          <div className="p-4 rounded-2xl bg-muted/30 border space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" />
                Hoạt động ôn tập trong 7 ngày qua
              </span>
              <span className="text-muted-foreground font-normal text-[11px]">
                Hôm nay đã ôn:{" "}
                <strong className="text-foreground">
                  {stats.dailyReviews?.[past7Days.days[6]?.dateStr] || 0} thẻ
                </strong>
              </span>
            </div>

            {/* Bar chart columns */}
            <div className="flex items-end justify-between gap-2 h-28 pt-4 pb-1 px-2">
              {past7Days.days.map((d, idx) => {
                const heightPct = Math.min(100, Math.max(12, Math.round((d.count / past7Days.maxCount) * 100)));
                const isToday = idx === 6;

                return (
                  <div key={d.dateStr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {d.count > 0 ? d.count : ""}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[28px] rounded-lg transition-all ${
                        isToday
                          ? "bg-gradient-to-t from-primary to-primary/80 shadow-xs"
                          : d.count > 0
                          ? "bg-muted-foreground/30 hover:bg-primary/50"
                          : "bg-muted/60"
                      }`}
                    />
                    <span
                      className={`text-[10px] font-semibold ${
                        isToday ? "text-primary font-bold" : "text-muted-foreground"
                      }`}
                    >
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SRS Card State Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-primary" />
                Phân bố trạng thái bộ nhớ ({srsDistribution.total} thẻ)
              </h3>
            </div>

            {/* Progress Bar Stack */}
            <div className="h-3.5 w-full bg-muted/60 rounded-full overflow-hidden flex shadow-inner">
              {srsDistribution.total > 0 && (
                <>
                  <div
                    style={{ width: `${(srsDistribution.masteredCount / srsDistribution.total) * 100}%` }}
                    className="bg-emerald-500 transition-all"
                    title={`Đã thuộc: ${srsDistribution.masteredCount}`}
                  />
                  <div
                    style={{ width: `${(srsDistribution.reviewCount / srsDistribution.total) * 100}%` }}
                    className="bg-amber-500 transition-all"
                    title={`Cần ôn lại: ${srsDistribution.reviewCount}`}
                  />
                  <div
                    style={{ width: `${(srsDistribution.learningCount / srsDistribution.total) * 100}%` }}
                    className="bg-blue-500 transition-all"
                    title={`Đang học: ${srsDistribution.learningCount}`}
                  />
                  <div
                    style={{ width: `${(srsDistribution.newCount / srsDistribution.total) * 100}%` }}
                    className="bg-muted-foreground/30 transition-all"
                    title={`Thẻ mới: ${srsDistribution.newCount}`}
                  />
                </>
              )}
            </div>

            {/* 4 Card Status Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="p-2.5 rounded-xl border bg-card flex flex-col justify-between">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Đã thuộc (Mastered)
                </span>
                <span className="text-lg font-bold text-foreground mt-1">
                  {srsDistribution.masteredCount}
                </span>
              </div>

              <div className="p-2.5 rounded-xl border bg-card flex flex-col justify-between">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  Cần ôn (Due)
                </span>
                <span className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {srsDistribution.reviewCount}
                </span>
              </div>

              <div className="p-2.5 rounded-xl border bg-card flex flex-col justify-between">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  Đang học (Learning)
                </span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {srsDistribution.learningCount}
                </span>
              </div>

              <div className="p-2.5 rounded-xl border bg-card flex flex-col justify-between">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 inline-block" />
                  Thẻ mới (New)
                </span>
                <span className="text-lg font-bold text-muted-foreground mt-1">
                  {srsDistribution.newCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/10 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Ôn tập mỗi ngày tối thiểu 5-10 phút để duy trì chuỗi Streak!
          </p>

          <Button onClick={onClose} variant="outline" className="rounded-xl">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}

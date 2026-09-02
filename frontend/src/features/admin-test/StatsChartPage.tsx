import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Users,
  Trophy,
  TrendingUp,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Search,
  Filter,
  Download,
  RefreshCw,
  Sparkles,
  BarChart3,
  PieChart,
  Target,
  Medal,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  Headphones,
  Mic,
  PenLine,
} from "lucide-react";
import { useTestStats } from "@/stores/useTestStore.ts";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.tsx";
import type { ParticipantStatDTO, ScoreDistributionBucket } from "@/types/admin-test.types.ts";

interface StatsChartPageProps {
  testId: string;
  onBack: () => void;
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

export function StatsChartPage({ testId, onBack }: StatsChartPageProps) {
  const { data, isLoading, isError, refetch, isRefetching } = useTestStats(testId);
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("ALL");
  const [activeBarKey, setActiveBarKey] = useState<string | null>(null);

  const stats = data?.data;
  const test = stats?.test;
  const summary = stats?.summary;
  const distribution = stats?.distribution || [];
  const skillStats = stats?.skillStats || [];
  const participants = stats?.participants || [];

  // Lọc danh sách thí sinh
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const matchSearch =
        p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.className.toLowerCase().includes(searchTerm.toLowerCase());

      const matchGrade =
        gradeFilter === "ALL" ||
        (gradeFilter === "PASSED" && p.isPassed) ||
        (gradeFilter === "FAILED" && !p.isPassed) ||
        (gradeFilter === "EXCELLENT" && (p.grade === "Xuất sắc" || p.grade === "Giỏi")) ||
        p.grade === gradeFilter;

      return matchSearch && matchGrade;
    });
  }, [participants, searchTerm, gradeFilter]);

  // Tìm giá trị count lớn nhất cho Bar Chart SVG
  const maxBucketCount = useMemo(() => {
    if (!distribution.length) return 1;
    const max = Math.max(...distribution.map((d) => d.count));
    return max > 0 ? max : 1;
  }, [distribution]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Đang tổng hợp số liệu thống kê bài thi…</p>
      </div>
    );
  }

  if (isError || !stats || !test || !summary) {
    return (
      <div className="min-h-screen bg-background max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Không thể tải số liệu thống kê</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Chỉ tài khoản Giáo viên (TEACHER) mới có quyền truy cập số liệu phân tích của bài kiểm tra này.
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
                Báo cáo Thống kê & Phổ điểm
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <BarChart3 className="w-7 h-7 text-primary" />
              {test.title}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Tổng số {test.totalQuestions} câu hỏi ({test.maxScore}đ) • Thời gian {test.durationMin} phút • {test.sectionsCount} phần thi
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
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-9 gap-1.5 text-xs rounded-xl cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất / In báo cáo
            </Button>
          </div>
        </div>

        {/* Thống kê KPI tóm tắt */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* KPI 1: Thí sinh tham gia */}
          <div className="bg-card rounded-2xl border p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Thí sinh</span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-foreground">
                {summary.totalParticipants}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {summary.totalAttemptsCount} lượt nộp bài
              </p>
            </div>
          </div>

          {/* KPI 2: Điểm trung bình */}
          <div className="bg-card rounded-2xl border p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Điểm TB</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-foreground flex items-baseline gap-1">
                {summary.averageScore}
                <span className="text-xs font-normal text-muted-foreground">/{test.maxScore}đ</span>
              </div>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                Thang 10: {summary.averageScoreOn10}đ
              </p>
            </div>
          </div>

          {/* KPI 3: Điểm cao nhất */}
          <div className="bg-card rounded-2xl border p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Cao nhất</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                {summary.highestScore}
                <span className="text-xs font-normal text-muted-foreground ml-1">/{test.maxScore}đ</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Thấp nhất: {summary.lowestScore}đ
              </p>
            </div>
          </div>

          {/* KPI 4: Tỷ lệ Đạt */}
          <div className="bg-card rounded-2xl border p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Tỷ lệ Đạt</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {summary.passRate}%
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {summary.passCount}/{summary.totalParticipants} học sinh
              </p>
            </div>
          </div>

          {/* KPI 5: Tỷ lệ Giỏi/Xuất sắc */}
          <div className="bg-card rounded-2xl border p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Giỏi / Xuất sắc</span>
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
                {summary.excellenceRate}%
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {summary.excellenceCount} học sinh ≥ 8.0đ
              </p>
            </div>
          </div>

          {/* KPI 6: Chưa đạt */}
          <div className="bg-card rounded-2xl border p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Chưa đạt</span>
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                {summary.failCount}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {summary.totalParticipants > 0
                  ? Math.round(((summary.failCount / summary.totalParticipants) * 100) * 10) / 10
                  : 0}
                % tổng số
              </p>
            </div>
          </div>
        </div>

        {summary.totalParticipants === 0 ? (
          <div className="bg-card rounded-2xl border p-12 text-center max-w-xl mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">Chưa có dữ liệu bài làm</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Hiện tại chưa có học sinh nào hoàn thành bài kiểm tra này. Sau khi học sinh làm và nộp bài, toàn bộ biểu đồ phổ điểm và bảng xếp hạng sẽ hiển thị tại đây.
            </p>
            <Button variant="outline" onClick={onBack} className="rounded-xl cursor-pointer">
              ← Quay lại danh sách bài thi
            </Button>
          </div>
        ) : (
          <>
            {/* Phổ điểm & Phân tích kỹ năng */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Biểu đồ phân bố điểm số (SVG Bar Chart) */}
              <div className="lg:col-span-2 bg-card rounded-2xl border p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        Phổ điểm bài thi (Score Distribution)
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Phân bố điểm cao nhất của từng học sinh (Quy chuẩn thang điểm 10)
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20 font-semibold">
                      {summary.totalParticipants} học sinh
                    </Badge>
                  </div>

                  {/* SVG Bar Chart */}
                  <div className="pt-4 pb-2">
                    <div className="h-60 w-full flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-border/80 relative">
                      {/* Grid lines background */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 -z-0">
                        <div className="border-b border-dashed border-foreground w-full" />
                        <div className="border-b border-dashed border-foreground w-full" />
                        <div className="border-b border-dashed border-foreground w-full" />
                        <div className="border-b border-dashed border-foreground w-full" />
                      </div>

                      {distribution.map((bucket) => {
                        const heightPercent = maxBucketCount > 0 ? (bucket.count / maxBucketCount) * 80 + (bucket.count > 0 ? 12 : 2) : 2;
                        const isHovered = activeBarKey === bucket.key;

                        return (
                          <div
                            key={bucket.key}
                            className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer z-10"
                            onMouseEnter={() => setActiveBarKey(bucket.key)}
                            onMouseLeave={() => setActiveBarKey(null)}
                          >
                            {/* Hover Tooltip */}
                            {isHovered && (
                              <div className="absolute -top-12 bg-popover text-popover-foreground border shadow-md px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap z-30 animate-in fade-in zoom-in-95">
                                <span className="block">{bucket.label}</span>
                                <span className="text-primary">{bucket.count} học sinh ({bucket.percentage}%)</span>
                              </div>
                            )}

                            {/* Value on top of bar */}
                            <span className="text-[11px] font-bold text-foreground mb-1.5 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
                              {bucket.count > 0 ? bucket.count : ""}
                            </span>

                            {/* Bar Pillar */}
                            <div
                              className="w-full max-w-[52px] rounded-t-xl transition-all duration-300 relative overflow-hidden"
                              style={{
                                height: `${heightPercent}%`,
                                backgroundColor: bucket.color,
                                opacity: activeBarKey && !isHovered ? 0.45 : 0.9,
                              }}
                            >
                              <div className="absolute inset-0 bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* X-axis Labels */}
                    <div className="flex items-center justify-between gap-2 sm:gap-4 px-2 pt-2.5">
                      {distribution.map((bucket) => (
                        <div key={bucket.key} className="flex-1 text-center">
                          <span className="text-[11px] font-bold text-foreground block truncate">
                            {bucket.range}
                          </span>
                          <span className="text-[10px] text-muted-foreground block truncate">
                            {bucket.label.split(" ")[0]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Phân loại tóm tắt */}
                <div className="mt-4 pt-4 border-t grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                  {distribution.map((b) => (
                    <div key={b.key} className="p-2 rounded-xl bg-muted/20 border">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                        <span className="text-[11px] text-muted-foreground font-medium truncate">{b.label.split(" ")[0]}</span>
                      </div>
                      <span className="font-bold text-foreground text-sm">{b.count}</span>
                      <span className="text-[10px] text-muted-foreground ml-1">({b.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thống kê theo kỹ năng / Section */}
              <div className="bg-card rounded-2xl border p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-primary" />
                    Hiệu suất theo Phần thi
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Độ chính xác trung bình của học sinh ở từng kỹ năng
                  </p>

                  <div className="space-y-4">
                    {skillStats.map((sec) => {
                      const Icon = SKILL_ICONS[sec.skill] || BookOpen;
                      const skillName = SKILL_NAMES[sec.skill] || sec.skill;

                      let progressColor = "bg-emerald-500";
                      if (sec.accuracyRate < 50) progressColor = "bg-rose-500";
                      else if (sec.accuracyRate < 70) progressColor = "bg-amber-500";
                      else if (sec.accuracyRate < 85) progressColor = "bg-blue-500";

                      return (
                        <div key={sec.sectionId} className="p-3.5 rounded-xl bg-muted/20 border space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-background border text-primary">
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <span className="font-semibold text-xs text-foreground block">
                                  Phần {sec.order}: {skillName}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {sec.questionCount} câu hỏi ({sec.maxScore}đ)
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-extrabold text-foreground">
                              {sec.accuracyRate}%
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                              style={{ width: `${sec.accuracyRate}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>Đúng: {sec.correctAnswers}/{sec.totalAnswers} câu</span>
                            <span>{sec.accuracyRate >= 50 ? "Đạt yêu cầu" : "Cần củng cố"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Dữ liệu tính trên bài nộp có điểm cao nhất của mỗi học sinh.</span>
                </div>
              </div>
            </div>

            {/* Bảng xếp hạng & Danh sách thí sinh */}
            <div className="bg-card rounded-2xl border shadow-xs overflow-hidden">
              {/* Header & Controls */}
              <div className="p-5 border-b bg-muted/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Medal className="w-4 h-4 text-amber-500" />
                      Bảng xếp hạng & Danh sách Thí sinh ({filteredParticipants.length}/{participants.length})
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Hệ thống tự động lọc và ghi nhận <strong>kết quả cao nhất</strong> của mỗi thí sinh
                    </p>
                  </div>

                  {/* Filter Grade Buttons */}
                  <div className="flex items-center flex-wrap gap-1.5">
                    {[
                      { key: "ALL", label: "Tất cả" },
                      { key: "PASSED", label: "Đạt (≥5.0)" },
                      { key: "FAILED", label: "Chưa đạt" },
                      { key: "EXCELLENT", label: "Giỏi / Xuất sắc" },
                    ].map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setGradeFilter(f.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          gradeFilter === f.key
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search box */}
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
                      <th className="py-3 px-4 text-center w-16">Hạng</th>
                      <th className="py-3 px-4">Học sinh</th>
                      <th className="py-3 px-4">Lớp</th>
                      <th className="py-3 px-4 text-center">Điểm cao nhất</th>
                      <th className="py-3 px-4 text-center">Thang 10</th>
                      <th className="py-3 px-4 text-center">Xếp loại</th>
                      <th className="py-3 px-4 text-center">Số lần thi</th>
                      <th className="py-3 px-4 text-right">Thời gian nộp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredParticipants.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-muted-foreground">
                          Không tìm thấy thí sinh nào khớp với bộ lọc.
                        </td>
                      </tr>
                    ) : (
                      filteredParticipants.map((p) => {
                        const isTop1 = p.rank === 1;
                        const isTop2 = p.rank === 2;
                        const isTop3 = p.rank === 3;

                        let rankBadge = (
                          <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground font-bold flex items-center justify-center text-xs mx-auto">
                            {p.rank}
                          </span>
                        );

                        if (isTop1) {
                          rankBadge = (
                            <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-xs mx-auto shadow-xs" title="Hạng 1 - Quán quân">
                              🥇
                            </span>
                          );
                        } else if (isTop2) {
                          rankBadge = (
                            <span className="w-6 h-6 rounded-full bg-slate-400 text-white font-bold flex items-center justify-center text-xs mx-auto shadow-xs" title="Hạng 2 - Á quân">
                              🥈
                            </span>
                          );
                        } else if (isTop3) {
                          rankBadge = (
                            <span className="w-6 h-6 rounded-full bg-amber-700 text-white font-bold flex items-center justify-center text-xs mx-auto shadow-xs" title="Hạng 3 - Quý quân">
                              🥉
                            </span>
                          );
                        }

                        let gradeColor = "bg-muted text-muted-foreground";
                        if (p.grade === "Xuất sắc") gradeColor = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
                        else if (p.grade === "Giỏi") gradeColor = "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30";
                        else if (p.grade === "Khá") gradeColor = "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30";
                        else if (p.grade === "Trung bình") gradeColor = "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
                        else gradeColor = "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30";

                        const submitDate = new Date(p.submittedAt).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        return (
                          <tr
                            key={p.userId}
                            className={`hover:bg-muted/30 transition-colors ${
                              isTop1 ? "bg-amber-500/5" : ""
                            }`}
                          >
                            <td className="py-3 px-4 text-center">{rankBadge}</td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-foreground">{p.fullName}</div>
                              <div className="text-[11px] text-muted-foreground">@{p.username}</div>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground font-medium">
                              {p.className}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-bold text-foreground text-sm">{p.highestScore}</span>
                              <span className="text-[10px] text-muted-foreground ml-1">/{test.maxScore}đ</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-extrabold text-primary">{p.scoreOn10}</span>
                              <span className="text-[10px] text-muted-foreground ml-0.5">/10</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant="outline" className={`text-[10px] font-semibold border ${gradeColor}`}>
                                {p.grade}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-center text-muted-foreground font-medium">
                              {p.attemptsCount} lần
                            </td>
                            <td className="py-3 px-4 text-right text-muted-foreground text-[11px]">
                              {submitDate}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

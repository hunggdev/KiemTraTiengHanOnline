import { useState, useMemo } from "react";
import {
  BookOpen,
  Clock,
  Play,
  Search,
  Sparkles,
  Award,
  CheckCircle2,
  FileQuestion,
  GraduationCap,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { useAvailableTests } from "@/stores/useTestStore.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";

interface UserTestListPageProps {
  onStartTest: (testId: string) => void;
}

export function UserTestListPage({ onStartTest }: UserTestListPageProps) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "ASSIGNED" | "PUBLIC">("ALL");

  const { data, isLoading, isError, refetch } = useAvailableTests();
  const tests = (data?.data as any[]) ?? [];

  // Lọc theo search và filterType
  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      const matchSearch =
        !search.trim() ||
        test.title?.toLowerCase().includes(search.toLowerCase().trim()) ||
        test.description?.toLowerCase().includes(search.toLowerCase().trim());

      const isAssigned = Array.isArray(test.assignments) && test.assignments.length > 0;

      if (!matchSearch) return false;
      if (filterType === "ASSIGNED") return isAssigned;
      if (filterType === "PUBLIC") return !isAssigned;
      return true;
    });
  }, [tests, search, filterType]);

  const assignedCount = tests.filter(
    (t) => Array.isArray(t.assignments) && t.assignments.length > 0
  ).length;
  const publicCount = tests.length - assignedCount;

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Hero Banner */}
      <div className="border-b bg-gradient-to-b from-primary/5 via-muted/30 to-background py-10 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Hệ thống làm bài kiểm tra trực tuyến
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Danh sách bài kiểm tra
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Chọn bài kiểm tra bên dưới để bắt đầu làm bài. Hệ thống sẽ tự động tính giờ và chấm điểm ngay khi nộp bài.
          </p>

          {/* Search bar */}
          <div className="max-w-md mx-auto pt-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm bài kiểm tra theo tên..."
                className="pl-10 h-11 bg-background shadow-xs rounded-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 pt-8">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          <Button
            size="sm"
            variant={filterType === "ALL" ? "default" : "outline"}
            className="rounded-full text-xs h-8 gap-1.5"
            onClick={() => setFilterType("ALL")}
          >
            Tất cả bài thi
            <span className="opacity-70 text-[10px] font-bold">({tests.length})</span>
          </Button>

          <Button
            size="sm"
            variant={filterType === "ASSIGNED" ? "default" : "outline"}
            className="rounded-full text-xs h-8 gap-1.5"
            onClick={() => setFilterType("ASSIGNED")}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Bài tập theo lớp
            {assignedCount > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-primary/20 text-primary">
                {assignedCount}
              </Badge>
            )}
          </Button>

          <Button
            size="sm"
            variant={filterType === "PUBLIC" ? "default" : "outline"}
            className="rounded-full text-xs h-8 gap-1.5"
            onClick={() => setFilterType("PUBLIC")}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Luyện tập tự do
            <span className="opacity-70 text-[10px] font-bold">({publicCount})</span>
          </Button>
        </div>

        {/* Tests Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 rounded-2xl bg-muted/40 animate-pulse border" />
            ))}
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-muted-foreground">
            <FileQuestion className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Không thể tải danh sách bài kiểm tra</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
              Thử lại
            </Button>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <FileQuestion className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-foreground text-base">
              {search
                ? `Không tìm thấy bài thi nào với từ khóa "${search}"`
                : filterType === "ASSIGNED"
                ? "Hiện lớp của bạn chưa có bài kiểm tra nào được giao"
                : "Hiện chưa có bài kiểm tra nào"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Vui lòng quay lại sau khi giáo viên mở thêm bài thi mới.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTests.map((test) => {
              const assignment = test.assignments?.[0];
              const isAssigned = !!assignment;

              let deadlineText = "";
              let isNearDeadline = false;
              if (assignment?.closeAt) {
                const closeDate = new Date(assignment.closeAt);
                deadlineText = closeDate.toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const hoursLeft = (closeDate.getTime() - Date.now()) / (1000 * 60 * 60);
                if (hoursLeft > 0 && hoursLeft <= 24) {
                  isNearDeadline = true;
                }
              }

              return (
                <div
                  key={test.id}
                  className={`group relative bg-card rounded-2xl border shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden p-5 ${
                    isAssigned
                      ? "border-primary/40 ring-1 ring-primary/10 bg-gradient-to-b from-primary/5 to-card"
                      : "hover:border-primary/30"
                  }`}
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {isAssigned ? (
                        <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold gap-1 px-2">
                          <GraduationCap className="w-3 h-3" />
                          {assignment.class?.name || "Bài tập lớp"}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-[10px] font-normal gap-1">
                          <BookOpen className="w-3 h-3" />
                          Tự do
                        </Badge>
                      )}

                      {isNearDeadline && (
                        <Badge variant="destructive" className="text-[10px] animate-pulse gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Sắp hết hạn
                        </Badge>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-foreground text-base leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-1.5">
                      {test.title}
                    </h3>

                    {test.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                        {test.description}
                      </p>
                    )}

                    {/* Meta info */}
                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground mb-4 flex-wrap">
                      <span className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-md font-medium text-foreground">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        {test.durationMin} phút
                      </span>
                      <span className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-md font-medium text-foreground">
                        <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                        {test._count?.sections ?? 0} phần thi
                      </span>
                    </div>

                    {/* Deadline notice if assigned */}
                    {isAssigned && deadlineText && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 p-2 rounded-lg mb-4">
                        <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Hạn nộp: <strong className="text-foreground">{deadlineText}</strong></span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => onStartTest(String(test.id))}
                    className="w-full rounded-xl gap-2 font-semibold shadow-xs"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Bắt đầu làm bài
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

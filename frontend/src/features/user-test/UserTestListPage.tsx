import { useState } from "react";
import {
  BookOpen,
  Clock,
  Play,
  Search,
  Sparkles,
  Award,
  CheckCircle2,
  HelpCircle,
  FileQuestion,
} from "lucide-react";
import { useTests } from "@/stores/useTestStore.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";

interface UserTestListPageProps {
  onStartTest: (testId: string) => void;
}

export function UserTestListPage({ onStartTest }: UserTestListPageProps) {
  const [search, setSearch] = useState("");

  // Chỉ lấy các bài test đã xuất bản (isPublished: true)
  const { data, isLoading, isError, refetch } = useTests({
    isPublished: true,
    search: search.trim() || undefined,
    limit: 20,
  });

  const tests = data?.data ?? [];

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

      {/* Tests Grid */}
      <div className="max-w-5xl mx-auto px-4 pt-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-muted/40 animate-pulse" />
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
        ) : tests.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <FileQuestion className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-foreground text-base">
              {search ? `Không tìm thấy bài thi nào với từ khóa "${search}"` : "Hiện chưa có bài kiểm tra nào được mở"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Vui lòng quay lại sau khi giáo viên xuất bản bài thi mới.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tests.map((test) => (
              <div
                key={test.id}
                className="group relative bg-card rounded-2xl border shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between overflow-hidden p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <h3 className="font-bold text-foreground text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {test.title}
                    </h3>
                  </div>

                  {test.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                      {test.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-5 flex-wrap">
                    <span className="flex items-center gap-1 bg-muted/50 px-2.5 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      {test.durationMin} phút
                    </span>
                    <span className="flex items-center gap-1 bg-muted/50 px-2.5 py-1 rounded-lg">
                      <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                      {test._count.sections} phần thi
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => onStartTest(String(test.id))}
                  className="w-full rounded-xl gap-2 font-semibold shadow-xs"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Bắt đầu làm bài
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

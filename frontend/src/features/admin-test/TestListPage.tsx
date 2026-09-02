import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Clock,
  Users,
  BookOpen,
  Globe,
  Lock,
  Loader2,
  MoreHorizontal,
  FileText,
  BarChart3,
} from "lucide-react";
import {
  useTests,
  useDeleteTest,
  useTogglePublishTest,
} from "@/stores/useTestStore.ts";
import type { TestListItemDTO, TestListQueryParams } from "@/types/admin-test.types.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";

function useDebounce<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ──────────── TestCard ────────────
interface TestCardProps {
  test: TestListItemDTO;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string) => void;
  onStats?: (id: string) => void;
  isDeleting: boolean;
  isTogglingPublish: boolean;
}

function TestCard({ test, onView, onEdit, onDelete, onTogglePublish, onStats, isDeleting, isTogglingPublish }: TestCardProps) {
  const createdAt = new Date(test.createdAt).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",

    year: "numeric",
  });

  return (
    <div className="group relative bg-card rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* published indicator strip */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${test.isPublished ? "bg-emerald-500" : "bg-muted"}`} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm leading-tight truncate pr-2">
              {test.title}
            </h3>
            {test.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {test.description}
              </p>
            )}
          </div>
          <Badge
            variant={test.isPublished ? "default" : "secondary"}
            className={`shrink-0 text-xs gap-1 ${test.isPublished ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200" : ""}`}
          >
            {test.isPublished ? (
              <><Globe className="w-2.5 h-2.5" /> Xuất bản</>
            ) : (
              <><Lock className="w-2.5 h-2.5" /> Nháp</>
            )}
          </Badge>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {test.durationMin} phút
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {test._count.sections} phần
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {test._count.attempts} lượt
          </span>
        </div>

        <p className="text-xs text-muted-foreground mb-4">{createdAt}</p>

        {/* Actions */}
        <div className="grid grid-cols-4 gap-1.5 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 px-1.5"
            onClick={() => onView(String(test.id))}
            title="Xem chi tiết đề thi"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Xem
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 px-1.5 text-primary hover:text-primary hover:bg-primary/5"
            onClick={() => onStats?.(String(test.id))}
            title="Thống kê phổ điểm và học sinh làm bài"
          >
            <BarChart3 className="w-3.5 h-3.5 mr-1" />
            Thống kê
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 px-1.5"
            onClick={() => onEdit(String(test.id))}
            title="Chỉnh sửa đề thi"
          >
            <Pencil className="w-3.5 h-3.5 mr-1" />
            Sửa
          </Button>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTogglePublish(String(test.id))}
              disabled={isTogglingPublish}
              className="flex-1 text-xs h-8 px-1"
              title={test.isPublished ? "Hủy xuất bản" : "Xuất bản"}
            >
              {isTogglingPublish ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : test.isPublished ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <Globe className="w-3.5 h-3.5" />
              )}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/5 shrink-0">
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận xóa bài thi</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn sắp xóa bài thi <strong>"{test.title}"</strong>. Hành động này không thể hoàn tác và sẽ xóa toàn bộ phần thi, câu hỏi, và kết quả liên quan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(String(test.id))}
                    className="bg-destructive hover:bg-destructive/90 text-white"
                  >
                    Xóa bài thi
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────
// Main: TestListPage
// ──────────────────────────────────────────────────
interface TestListPageProps {
  onCreateNew?: () => void;
  onViewDetail?: (id: string) => void;
  onEditTest?: (id: string) => void;
  onViewStats?: (id: string) => void;
}

export function TestListPage({ onCreateNew, onViewDetail, onEditTest, onViewStats }: TestListPageProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [filterPublish, setFilterPublish] = useState<"all" | "published" | "draft">("all");
  const [page, setPage] = useState(1);

  const params: TestListQueryParams = useMemo(() => ({
    page,
    limit: 9,
    search: debouncedSearch.trim() || undefined,
    isPublished:
      filterPublish === "published"
        ? true
        : filterPublish === "draft"
          ? false
          : undefined,
  }), [page, debouncedSearch, filterPublish]);

  const { data, isLoading, isError } = useTests(params);
  const deleteMutation = useDeleteTest();
  const toggleMutation = useTogglePublishTest();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteMutation.mutateAsync(id).finally(() => setDeletingId(null));
  };

  const handleTogglePublish = async (id: string) => {
    setTogglingId(id);
    await toggleMutation.mutateAsync(id).finally(() => setTogglingId(null));
  };

  const tests = data?.data ?? [];
  const pagination = data?.pagination;


  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Quản lý bài thi</h1>
              <p className="text-sm text-muted-foreground">
                {pagination?.total ?? "–"} bài thi trong hệ thống
              </p>
            </div>
          </div>
          <Button onClick={onCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Tạo bài thi
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm theo tên bài thi…"
              className="pl-9"
            />
          </div>
          <Select value={filterPublish} onValueChange={(v) => { setFilterPublish(v as typeof filterPublish); setPage(1); }}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="published">Đã xuất bản</SelectItem>
              <SelectItem value="draft">Nháp</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MoreHorizontal className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Không thể tải danh sách bài thi</p>
            <p className="text-xs text-muted-foreground mt-1">Kiểm tra kết nối với server backend</p>
          </div>
        ) : tests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-foreground">Chưa có bài thi nào</p>
            <p className="text-sm text-muted-foreground mt-1 mb-5">
              {search ? `Không tìm thấy bài thi khớp với "${search}"` : "Tạo bài thi đầu tiên để bắt đầu"}
            </p>
            {!search && (
              <Button onClick={onCreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                Tạo bài thi đầu tiên
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tests.map((test) => (
                <TestCard
                  key={test.id}
                  test={test}
                  onView={(id) => onViewDetail?.(id)}
                  onEdit={(id) => onEditTest?.(id)}
                  onStats={(id) => onViewStats?.(id)}
                  onDelete={handleDelete}
                  onTogglePublish={handleTogglePublish}
                  isDeleting={deletingId === String(test.id)}
                  isTogglingPublish={togglingId === String(test.id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Trước
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Trang {page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sau
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

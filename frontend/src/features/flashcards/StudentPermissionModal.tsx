import { useState, useEffect } from "react";
import {
  X,
  Search,
  Users,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Sparkles,
  Loader2,
  Filter,
} from "lucide-react";
import { authService } from "@/services/authService.ts";
import type { StudentPermissionDTO } from "@/types/auth.types.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";

interface StudentPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StudentPermissionModal({ isOpen, onClose }: StudentPermissionModalProps) {
  const [students, setStudents] = useState<StudentPermissionDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState<"ALL" | "GRANTED" | "NOT_GRANTED">("ALL");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
    }
  }, [isOpen]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await authService.getStudentsList();
      if (res.data) {
        setStudents(res.data);
      }
    } catch (err) {
      console.error("Fetch students error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleToggle = async (student: StudentPermissionDTO) => {
    setUpdatingId(student.id);
    const newStatus = !student.canAccessFlashcard;
    try {
      await authService.updateFlashcardPermission(student.id, newStatus);
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, canAccessFlashcard: newStatus } : s))
      );
    } catch (err) {
      console.error("Toggle permission error:", err);
      alert("Lỗi khi cập nhật quyền học sinh. Vui lòng thử lại!");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBatchUpdate = async (grant: boolean) => {
    const targetStudents = filteredStudents.map((s) => s.id);
    if (targetStudents.length === 0) return;

    setIsBatchUpdating(true);
    try {
      await authService.batchUpdateFlashcardPermissions(targetStudents, grant);
      setStudents((prev) =>
        prev.map((s) => (targetStudents.includes(s.id) ? { ...s, canAccessFlashcard: grant } : s))
      );
    } catch (err) {
      console.error("Batch update error:", err);
      alert("Lỗi khi cập nhật quyền hàng loạt.");
    } finally {
      setIsBatchUpdating(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      !search.trim() ||
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.username.toLowerCase().includes(search.toLowerCase()) ||
      (s.class?.name && s.class.name.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterState === "GRANTED") return s.canAccessFlashcard;
    if (filterState === "NOT_GRANTED") return !s.canAccessFlashcard;
    return true;
  });

  const grantedCount = students.filter((s) => s.canAccessFlashcard).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Quản lý cấp quyền Flashcard cho học sinh
              </h2>
              <p className="text-xs text-muted-foreground">
                Chỉ những học sinh được giáo viên bật quyền mới có thể truy cập và học Flashcard
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-4 border-b bg-background flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên học sinh, tài khoản..."
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center p-1 bg-muted rounded-xl border text-xs">
              <button
                onClick={() => setFilterState("ALL")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterState === "ALL" ? "bg-card shadow-xs text-foreground" : "text-muted-foreground"
                }`}
              >
                Tất cả ({students.length})
              </button>
              <button
                onClick={() => setFilterState("GRANTED")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterState === "GRANTED" ? "bg-card shadow-xs text-emerald-600 dark:text-emerald-400 font-bold" : "text-muted-foreground"
                }`}
              >
                Được phép ({grantedCount})
              </button>
              <button
                onClick={() => setFilterState("NOT_GRANTED")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterState === "NOT_GRANTED" ? "bg-card shadow-xs text-amber-600 dark:text-amber-400 font-bold" : "text-muted-foreground"
                }`}
              >
                Chưa cấp ({students.length - grantedCount})
              </button>
            </div>

            {/* Batch buttons */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchUpdate(true)}
                disabled={isBatchUpdating || filteredStudents.length === 0}
                className="h-8 text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 rounded-xl"
                title="Cấp quyền cho tất cả học sinh đang hiển thị"
              >
                Cấp tất cả
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchUpdate(false)}
                disabled={isBatchUpdating || filteredStudents.length === 0}
                className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 rounded-xl"
                title="Thu hồi quyền của tất cả học sinh đang hiển thị"
              >
                Thu hồi
              </Button>
            </div>
          </div>
        </div>

        {/* Student List Table */}
        <div className="p-4 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs">Đang tải danh sách học sinh…</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              {students.length === 0
                ? "Chưa có tài khoản học sinh nào đăng ký trong hệ thống."
                : "Không tìm thấy học sinh nào phù hợp."}
            </div>
          ) : (
            <div className="border rounded-2xl overflow-hidden bg-card text-xs">
              <table className="w-full text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b text-[11px]">
                  <tr>
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3">Học sinh</th>
                    <th className="p-3">Lớp học</th>
                    <th className="p-3 text-center">Trạng thái quyền</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStudents.map((student, idx) => {
                    const isUpdating = updatingId === student.id;

                    return (
                      <tr key={student.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 text-center text-muted-foreground font-mono">
                          {idx + 1}
                        </td>
                        <td className="p-3 font-medium">
                          <div className="font-bold text-foreground">{student.fullName}</div>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            @{student.username}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {student.class?.name || "Chưa phân lớp"}
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold ${
                              student.canAccessFlashcard
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                : "bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            {student.canAccessFlashcard ? "Được phép học" : "Chưa cấp quyền"}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            variant={student.canAccessFlashcard ? "outline" : "default"}
                            onClick={() => handleToggle(student)}
                            disabled={isUpdating}
                            className={`h-8 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                              student.canAccessFlashcard
                                ? "text-destructive hover:bg-destructive/10 border-destructive/30"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                            }`}
                          >
                            {isUpdating ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : student.canAccessFlashcard ? (
                              "Thu hồi"
                            ) : (
                              "Cấp quyền"
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t flex items-center justify-between bg-muted/20 text-xs text-muted-foreground">
          <span>
            Đã cấp quyền: <strong className="text-foreground">{grantedCount}</strong> / {students.length} học sinh
          </span>
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classService } from "@/services/classService.ts";
import type { ClassDTO, ClassStudent } from "@/types/class.types.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  UserPlus,
  UserMinus,
  X,
  GraduationCap,
  BookOpen,
  Search,
  CheckSquare,
  Square,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

// ─── Query Keys ───────────────────────────────────────────────────────────────
const classKeys = {
  all: ["classes"] as const,
  list: () => [...classKeys.all, "list"] as const,
  detail: (id: number) => [...classKeys.all, "detail", id] as const,
};

// ─── Component ────────────────────────────────────────────────────────────────
export function ClassManagementPage() {
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState<ClassDTO | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<ClassDTO | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<ClassDTO | null>(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
  const [studentSearch, setStudentSearch] = useState("");
  const [className, setClassName] = useState("");
  const [classSearch, setClassSearch] = useState("");

  // ── Queries ──
  const { data: classesData, isLoading } = useQuery({
    queryKey: classKeys.list(),
    queryFn: () => classService.getAll(),
    staleTime: 30_000,
  });

  // Danh sách tất cả học sinh chưa vào lớp (từ authService.getStudentsList)
  const { data: studentsData } = useQuery({
    queryKey: ["students-no-class"],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:5000/api"}/auth/students`,
        { credentials: "include" }
      );
      return res.json() as Promise<{ success: boolean; data: ClassStudent[] }>;
    },
    staleTime: 15_000,
  });

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (name: string) => classService.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.list() });
      setShowCreateModal(false);
      setClassName("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => classService.update(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.list() });
      setShowEditModal(null);
      setClassName("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => classService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.list() });
      if (selectedClass?.id === showDeleteConfirm?.id) setSelectedClass(null);
      setShowDeleteConfirm(null);
    },
  });

  const addStudentsMutation = useMutation({
    mutationFn: ({ classId, ids }: { classId: number; ids: number[] }) =>
      classService.addStudents(classId, ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.list() });
      queryClient.invalidateQueries({ queryKey: ["students-no-class"] });
      setShowAddStudentModal(false);
      setSelectedStudentIds(new Set());
      setStudentSearch("");
    },
  });

  const removeStudentMutation = useMutation({
    mutationFn: ({ classId, ids }: { classId: number; ids: number[] }) =>
      classService.removeStudents(classId, ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.list() });
      queryClient.invalidateQueries({ queryKey: ["students-no-class"] });
    },
  });

  // ── Derived data ──
  const classes = classesData?.data ?? [];
  const allStudents = studentsData?.data ?? [];
  const filteredClasses = classes.filter((c) =>
    c.name.toLowerCase().includes(classSearch.toLowerCase())
  );

  // Học sinh chưa trong lớp đang chọn
  const studentIdsInSelectedClass = new Set(
    selectedClass?.users.map((u) => u.id) ?? []
  );
  const availableStudents = allStudents.filter(
    (s) => !studentIdsInSelectedClass.has(s.id)
  );
  const filteredAvailable = availableStudents.filter(
    (s) =>
      s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.username.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Cập nhật selectedClass khi data refetch
  const currentSelectedClass = classes.find((c) => c.id === selectedClass?.id) ?? null;
  if (currentSelectedClass && currentSelectedClass !== selectedClass) {
    setSelectedClass(currentSelectedClass);
  }

  const toggleStudent = (id: number) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleRemoveStudent = (student: ClassStudent) => {
    if (!selectedClass) return;
    removeStudentMutation.mutate({ classId: selectedClass.id, ids: [student.id] });
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-semibold mb-3">
            <GraduationCap className="w-3.5 h-3.5" />
            Quản lý lớp học
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Danh sách lớp học
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tạo lớp, gán học sinh và theo dõi tiến độ theo từng lớp.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6">
        {selectedClass ? (
          // ── CLASS DETAIL VIEW ──────────────────────────────────────────────
          <div>
            <button
              onClick={() => setSelectedClass(null)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại danh sách lớp
            </button>

            <div className="bg-card rounded-2xl border shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{currentSelectedClass?.name}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {currentSelectedClass?._count.users ?? 0} học sinh trong lớp
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-xl"
                    onClick={() => {
                      setClassName(currentSelectedClass?.name ?? "");
                      setShowEditModal(currentSelectedClass);
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Đổi tên
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 rounded-xl"
                    onClick={() => {
                      setSelectedStudentIds(new Set());
                      setStudentSearch("");
                      setShowAddStudentModal(true);
                    }}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Thêm học sinh
                  </Button>
                </div>
              </div>

              {/* Student list */}
              {(currentSelectedClass?.users.length ?? 0) === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Lớp này chưa có học sinh nào</p>
                  <p className="text-xs mt-1">Nhấn "Thêm học sinh" để gán học sinh vào lớp</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentSelectedClass?.users.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between gap-3 p-3.5 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                          {student.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {student.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">@{student.username}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveStudent(student)}
                        disabled={removeStudentMutation.isPending}
                        className="p-1.5 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                        title="Gỡ khỏi lớp"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // ── CLASS LIST VIEW ────────────────────────────────────────────────
          <div>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={classSearch}
                  onChange={(e) => setClassSearch(e.target.value)}
                  placeholder="Tìm kiếm lớp học..."
                  className="pl-10 rounded-xl h-10"
                />
              </div>
              <Button
                onClick={() => {
                  setClassName("");
                  setShowCreateModal(true);
                }}
                className="gap-2 rounded-xl px-4 shrink-0"
              >
                <Plus className="w-4 h-4" />
                Tạo lớp mới
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-36 rounded-2xl bg-muted/40 animate-pulse" />
                ))}
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium text-foreground">
                  {classSearch ? `Không tìm thấy lớp "${classSearch}"` : "Chưa có lớp học nào"}
                </p>
                <p className="text-xs mt-1">Nhấn "Tạo lớp mới" để bắt đầu</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClasses.map((cls) => (
                  <div
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    className="group bg-card rounded-2xl border shadow-sm hover:shadow-md hover:border-primary/40 p-5 cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setClassName(cls.name);
                            setShowEditModal(cls);
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Đổi tên"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(cls);
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Xóa lớp"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-bold text-foreground text-base mb-2 group-hover:text-primary transition-colors">
                      {cls.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {cls._count.users} học sinh
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {cls._count.tests} đề thi
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {cls.users.slice(0, 5).map((u) => (
                          <div
                            key={u.id}
                            className="w-6 h-6 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center border-2 border-background"
                            title={u.fullName}
                          >
                            {u.fullName.charAt(0)}
                          </div>
                        ))}
                        {cls._count.users > 5 && (
                          <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center border-2 border-background">
                            +{cls._count.users - 5}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}

      {/* Create / Edit Class Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">
                {showEditModal ? "Đổi tên lớp" : "Tạo lớp mới"}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(null);
                  setClassName("");
                }}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <Input
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="Tên lớp (vd: Lớp Hàn ngữ A1)"
              className="rounded-xl mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && className.trim()) {
                  if (showEditModal) {
                    updateMutation.mutate({ id: showEditModal.id, name: className });
                  } else {
                    createMutation.mutate(className);
                  }
                }
              }}
            />

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(null);
                  setClassName("");
                }}
                className="rounded-xl"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                disabled={
                  !className.trim() ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
                onClick={() => {
                  if (showEditModal) {
                    updateMutation.mutate({ id: showEditModal.id, name: className });
                  } else {
                    createMutation.mutate(className);
                  }
                }}
                className="rounded-xl"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Đang lưu..."
                  : showEditModal
                  ? "Lưu thay đổi"
                  : "Tạo lớp"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold">Xóa lớp học</h3>
                <p className="text-sm text-muted-foreground">Hành động này không thể hoàn tác</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Lớp <strong className="text-foreground">"{showDeleteConfirm.name}"</strong> sẽ bị xóa.
              Học sinh trong lớp sẽ không bị xóa, chỉ bị gỡ khỏi lớp.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(null)}
                className="rounded-xl"
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(showDeleteConfirm.id)}
                className="rounded-xl"
              >
                {deleteMutation.isPending ? "Đang xóa..." : "Xóa lớp"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Students Modal */}
      {showAddStudentModal && selectedClass && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-bold text-base">Thêm học sinh vào lớp</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Lớp: <strong>{selectedClass.name}</strong> — Đã chọn: {selectedStudentIds.size}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddStudentModal(false);
                  setSelectedStudentIds(new Set());
                }}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Tìm học sinh theo tên hoặc username..."
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredAvailable.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  {studentSearch
                    ? "Không tìm thấy học sinh phù hợp"
                    : "Tất cả học sinh đã ở trong lớp này"}
                </div>
              ) : (
                filteredAvailable.map((student) => {
                  const isSelected = selectedStudentIds.has(student.id);
                  return (
                    <div
                      key={student.id}
                      onClick={() => toggleStudent(student.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? "bg-primary/10 border-primary/40"
                          : "hover:bg-muted/50 border-transparent"
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                        {student.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{student.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">@{student.username}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddStudentModal(false);
                  setSelectedStudentIds(new Set());
                }}
                className="rounded-xl"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                disabled={selectedStudentIds.size === 0 || addStudentsMutation.isPending}
                onClick={() =>
                  addStudentsMutation.mutate({
                    classId: selectedClass.id,
                    ids: Array.from(selectedStudentIds),
                  })
                }
                className="rounded-xl gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {addStudentsMutation.isPending
                  ? "Đang thêm..."
                  : `Thêm ${selectedStudentIds.size} học sinh`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

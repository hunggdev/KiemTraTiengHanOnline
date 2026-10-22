import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  GraduationCap,
  Calendar,
  Clock,
  Trash2,
  Plus,
  X,
  Users,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { classService } from "@/services/classService.ts";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
  withCredentials: true,
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Types ────────────────────────────────────────────────────────────────────
interface Assignment {
  id: number;
  testId: number;
  classId: number;
  openAt: string;
  closeAt: string;
  class: {
    id: number;
    name: string;
    _count: { users: number };
  };
}

interface Props {
  testId: string;
  testTitle?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatLocalDatetime(isoStr: string): string {
  const d = new Date(isoStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toLocalISOInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getStatus(a: Assignment): "upcoming" | "active" | "closed" {
  const now = Date.now();
  const open = new Date(a.openAt).getTime();
  const close = new Date(a.closeAt).getTime();
  if (now < open) return "upcoming";
  if (now > close) return "closed";
  return "active";
}

// ─── Component ────────────────────────────────────────────────────────────────
export function TestAssignmentPanel({ testId, testTitle }: Props) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | "">("");
  const [openAt, setOpenAt] = useState(() => toLocalISOInput(new Date()));
  const [closeAt, setCloseAt] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 24);
    return toLocalISOInput(d);
  });
  const [error, setError] = useState("");

  // ── Queries ──
  const { data: assignmentsData, isLoading } = useQuery({
    queryKey: ["assignments", testId],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: Assignment[] }>(
        `/assignments/test/${testId}`
      );
      return data;
    },
    staleTime: 15_000,
    enabled: !!testId,
  });

  const { data: classesData } = useQuery({
    queryKey: ["classes", "list"],
    queryFn: () => classService.getAll(),
    staleTime: 60_000,
  });

  // ── Mutations ──
  const assignMutation = useMutation({
    mutationFn: () =>
      api.post("/assignments", {
        testId: parseInt(testId, 10),
        classId: selectedClassId,
        openAt: new Date(openAt).toISOString(),
        closeAt: new Date(closeAt).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments", testId] });
      setShowForm(false);
      setSelectedClassId("");
      setError("");
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || "Có lỗi xảy ra khi giao bài");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/assignments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments", testId] });
    },
  });

  const assignments = assignmentsData?.data ?? [];
  const classes = classesData?.data ?? [];
  const assignedClassIds = new Set(assignments.map((a) => a.classId));

  const handleSubmit = () => {
    if (!selectedClassId) {
      setError("Vui lòng chọn lớp học");
      return;
    }
    if (!openAt || !closeAt) {
      setError("Vui lòng nhập thời gian mở và đóng bài");
      return;
    }
    if (new Date(closeAt) <= new Date(openAt)) {
      setError("Thời gian đóng bài phải sau thời gian mở bài");
      return;
    }
    setError("");
    assignMutation.mutate();
  };

  const statusBadge = (a: Assignment) => {
    const s = getStatus(a);
    if (s === "active")
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-200 text-[10px] gap-1 font-semibold">
          <CheckCircle2 className="w-3 h-3" /> Đang mở
        </Badge>
      );
    if (s === "upcoming")
      return (
        <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 text-[10px] gap-1 font-semibold">
          <Clock className="w-3 h-3" /> Sắp mở
        </Badge>
      );
    return (
      <Badge className="bg-muted text-muted-foreground border-border text-[10px] gap-1 font-semibold">
        <AlertCircle className="w-3 h-3" /> Đã đóng
      </Badge>
    );
  };

  return (
    <div className="bg-card rounded-2xl border shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Giao bài theo lớp</h3>
            <p className="text-[11px] text-muted-foreground">
              {assignments.length} lớp được giao bài
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant={showForm ? "outline" : "default"}
          onClick={() => {
            setShowForm(!showForm);
            setError("");
          }}
          className="rounded-xl gap-1.5 text-xs"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Hủy" : "Giao bài"}
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-4 p-4 rounded-xl bg-muted/50 border space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Giao bài cho lớp mới
          </p>

          {/* Class select */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Chọn lớp học
            </label>
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value ? Number(e.target.value) : "")}
                className="w-full h-9 pl-3 pr-8 rounded-xl border bg-background text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                <option value="">-- Chọn lớp --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id} disabled={assignedClassIds.has(cls.id)}>
                    {cls.name} ({cls._count.users} HS)
                    {assignedClassIds.has(cls.id) ? " — Đã giao" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                <Calendar className="w-3 h-3 inline mr-1" />
                Thời gian mở bài
              </label>
              <Input
                type="datetime-local"
                value={openAt}
                onChange={(e) => setOpenAt(e.target.value)}
                className="rounded-xl text-xs h-9"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                <Calendar className="w-3 h-3 inline mr-1" />
                Thời gian đóng bài
              </label>
              <Input
                type="datetime-local"
                value={closeAt}
                onChange={(e) => setCloseAt(e.target.value)}
                className="rounded-xl text-xs h-9"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </p>
          )}

          <Button
            size="sm"
            disabled={assignMutation.isPending}
            onClick={handleSubmit}
            className="rounded-xl w-full gap-1.5"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            {assignMutation.isPending ? "Đang giao bài..." : "Xác nhận giao bài"}
          </Button>
        </div>
      )}

      {/* Assignment list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="py-6 text-center text-muted-foreground">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Bài thi chưa được giao cho lớp nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 p-3.5 rounded-xl border bg-muted/20 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold truncate">{a.class.name}</p>
                    {statusBadge(a)}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    <Clock className="w-3 h-3 inline mr-0.5" />
                    {new Date(a.openAt).toLocaleString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" → "}
                    {new Date(a.closeAt).toLocaleString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => deleteMutation.mutate(a.id)}
                disabled={deleteMutation.isPending}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                title="Hủy giao bài"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

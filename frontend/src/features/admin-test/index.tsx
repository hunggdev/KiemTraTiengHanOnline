import { Routes, Route, useNavigate, useParams, useSearchParams, Navigate } from "react-router-dom";
import { CreateTestPage } from "./CreateTestPage.tsx";
import { TestListPage } from "./TestListPage.tsx";
import { DetailTestPage } from "./DetailTestPage.tsx";
import { EditTestPage } from "./EditTestPage.tsx";
import { StatsChartPage } from "./StatsChartPage.tsx";
import { TestGradingPage } from "./TestGradingPage.tsx";
import { useSmartNavigate } from "@/lib/navigation.ts";

/**
 * AdminTestFeature — quản lý đề thi và bài thi của Quản trị viên/Giáo viên.
 * Định tuyến chi tiết theo URL để hỗ trợ Browser History (Back/Forward/Undo).
 */
export function AdminTestFeature() {
  const navigate = useNavigate();
  const { goBack } = useSmartNavigate();

  return (
    <Routes>
      {/* 1. Danh sách bài thi */}
      <Route
        index
        element={
          <TestListPage
            onCreateNew={() => navigate("/admin/create")}
            onViewDetail={(testId) => navigate(`/admin/tests/${testId}`)}
            onEditTest={(testId) => navigate(`/admin/tests/${testId}/edit`)}
            onViewStats={(testId) => navigate(`/admin/tests/${testId}/stats`)}
            onViewGrading={(testId, attemptId) =>
              navigate(
                attemptId
                  ? `/admin/tests/${testId}/grading?attemptId=${attemptId}`
                  : `/admin/tests/${testId}/grading`
              )
            }
          />
        }
      />

      {/* 2. Tạo đề thi mới */}
      <Route
        path="create"
        element={
          <div>
            <div className="max-w-3xl mx-auto px-4 pt-6">
              <button
                onClick={() => goBack("/admin")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                ← Quay lại danh sách bài thi
              </button>
            </div>
            <CreateTestPage />
          </div>
        }
      />

      {/* 3. Chi tiết bài thi */}
      <Route
        path="tests/:testId"
        element={<AdminDetailRoute onBack={() => goBack("/admin")} />}
      />

      {/* 4. Chỉnh sửa bài thi */}
      <Route
        path="tests/:testId/edit"
        element={<AdminEditRoute />}
      />

      {/* 5. Thống kê & Phổ điểm bài thi */}
      <Route
        path="tests/:testId/stats"
        element={<AdminStatsRoute />}
      />

      {/* 6. Chấm bài làm học sinh */}
      <Route
        path="tests/:testId/grading"
        element={<AdminGradingRoute />}
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-Route Wrapper Components
// ─────────────────────────────────────────────────────────────

function AdminDetailRoute({ onBack }: { onBack: () => void }) {
  const { testId } = useParams();
  const navigate = useNavigate();

  if (!testId) return <Navigate to="/admin" replace />;

  return (
    <DetailTestPage
      testId={testId}
      onBack={onBack}
      onEdit={(id) => navigate(`/admin/tests/${id}/edit`)}
      onViewStats={(id) => navigate(`/admin/tests/${id}/stats`)}
      onViewGrading={(id, attemptId) =>
        navigate(
          attemptId
            ? `/admin/tests/${id}/grading?attemptId=${attemptId}`
            : `/admin/tests/${id}/grading`
        )
      }
    />
  );
}

function AdminEditRoute() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { goBack } = useSmartNavigate();

  if (!testId) return <Navigate to="/admin" replace />;

  return (
    <EditTestPage
      testId={testId}
      onBack={() => goBack(`/admin/tests/${testId}`)}
      onSuccess={() => navigate(`/admin/tests/${testId}`)}
    />
  );
}

function AdminStatsRoute() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { goBack } = useSmartNavigate();

  if (!testId) return <Navigate to="/admin" replace />;

  return (
    <StatsChartPage
      testId={testId}
      onBack={() => goBack(`/admin/tests/${testId}`)}
      onViewGrading={(attemptId) =>
        navigate(`/admin/tests/${testId}/grading?attemptId=${attemptId}`)
      }
    />
  );
}

function AdminGradingRoute() {
  const { testId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { goBack } = useSmartNavigate();

  if (!testId) return <Navigate to="/admin" replace />;

  return (
    <TestGradingPage
      testId={testId}
      initialAttemptId={searchParams.get("attemptId")}
      onBack={() => goBack(`/admin/tests/${testId}/stats`)}
      onViewStats={(id) => navigate(`/admin/tests/${id}/stats`)}
    />
  );
}

// Named re-exports for backward compatibility
export { CreateTestPage } from "./CreateTestPage.tsx";
export { EditTestPage } from "./EditTestPage.tsx";
export { TestListPage } from "./TestListPage.tsx";
export { DetailTestPage } from "./DetailTestPage.tsx";
export { SectionBuilder } from "./SectionBuilder.tsx";
export { StatsChartPage } from "./StatsChartPage.tsx";
export { TestGradingPage } from "./TestGradingPage.tsx";
export { QuickImportTestModal } from "./QuickImportTestModal.tsx";

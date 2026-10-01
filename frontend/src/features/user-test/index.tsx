import { Routes, Route, useNavigate, useParams, useLocation, Navigate } from "react-router-dom";
import { UserTestListPage } from "./UserTestListPage.tsx";
import { TakeTestPage } from "./TakeTestPage.tsx";
import { TestResultPage } from "./TestResultPage.tsx";
import { useSmartNavigate } from "@/lib/navigation.ts";
import type { TestResultDTO } from "@/types/user-test.types.ts";

/**
 * UserTestFeature — giao diện làm bài thi và xem kết quả dành cho học sinh.
 * Sử dụng URL routes để hỗ trợ lịch sử duyệt trang, back/forward tự nhiên.
 */
export function UserTestFeature() {
  const navigate = useNavigate();
  const { goBack } = useSmartNavigate();

  return (
    <Routes>
      {/* 1. Danh sách bài thi */}
      <Route
        index
        element={
          <UserTestListPage
            onStartTest={(testId) => navigate(`/student/tests/${testId}`)}
          />
        }
      />

      {/* 2. Màn hình làm bài thi */}
      <Route
        path="tests/:testId"
        element={<UserTakeTestRoute onExit={() => goBack("/student")} />}
      />

      {/* 3. Màn hình kết quả sau khi nộp bài */}
      <Route
        path="tests/:testId/result"
        element={<UserTestResultRoute />}
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/student" replace />} />
    </Routes>
  );
}

function UserTakeTestRoute({ onExit }: { onExit: () => void }) {
  const { testId } = useParams();
  const navigate = useNavigate();

  if (!testId) return <Navigate to="/student" replace />;

  const handleFinish = (result: TestResultDTO) => {
    navigate(`/student/tests/${testId}/result`, { state: { result } });
  };

  return (
    <TakeTestPage
      testId={testId}
      onExit={onExit}
      onFinish={handleFinish}
    />
  );
}

function UserTestResultRoute() {
  const { testId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const result = (location.state as any)?.result;

  if (!result) {
    return <Navigate to="/student" replace />;
  }

  return (
    <TestResultPage
      result={result}
      onBackToList={() => navigate("/student")}
      onRetakeTest={() => navigate(`/student/tests/${testId}`)}
    />
  );
}

// Re-exports
export { UserTestListPage } from "./UserTestListPage.tsx";
export { TakeTestPage } from "./TakeTestPage.tsx";
export { TestResultPage } from "./TestResultPage.tsx";

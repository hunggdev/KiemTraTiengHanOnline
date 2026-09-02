import { useState } from "react";
import { CreateTestPage } from "./CreateTestPage.tsx";
import { TestListPage } from "./TestListPage.tsx";
import { DetailTestPage } from "./DetailTestPage.tsx";
import { EditTestPage } from "./EditTestPage.tsx";
import { StatsChartPage } from "./StatsChartPage.tsx";

type View = "list" | "create" | "detail" | "edit" | "stats";

/**
 * AdminTestFeature — entry point for admin test management.
 * Mount this in your router under the admin route.
 */
export function AdminTestFeature() {
  const [view, setView] = useState<View>("list");
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  const handleViewDetail = (testId: string) => {
    setSelectedTestId(testId);
    setView("detail");
  };

  const handleEditTest = (testId: string) => {
    setSelectedTestId(testId);
    setView("edit");
  };

  const handleViewStats = (testId: string) => {
    setSelectedTestId(testId);
    setView("stats");
  };

  const handleBackToList = () => {
    setSelectedTestId(null);
    setView("list");
  };

  return (
    <>
      {view === "list" && (
        <TestListPage
          onCreateNew={() => setView("create")}
          onViewDetail={handleViewDetail}
          onEditTest={handleEditTest}
          onViewStats={handleViewStats}
        />
      )}

      {view === "create" && (
        <div>
          {/* Back to list */}
          <div className="max-w-3xl mx-auto px-4 pt-6">
            <button
              onClick={handleBackToList}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              ← Quay lại danh sách bài thi
            </button>
          </div>
          <CreateTestPage />
        </div>
      )}

      {view === "detail" && selectedTestId && (
        <DetailTestPage
          testId={selectedTestId}
          onBack={handleBackToList}
          onEdit={handleEditTest}
          onViewStats={handleViewStats}
        />
      )}

      {view === "edit" && selectedTestId && (
        <EditTestPage
          testId={selectedTestId}
          onBack={handleBackToList}
          onSuccess={handleBackToList}
        />
      )}

      {view === "stats" && selectedTestId && (
        <StatsChartPage
          testId={selectedTestId}
          onBack={handleBackToList}
        />
      )}
    </>
  );
}

// Named re-exports for direct imports
export { CreateTestPage } from "./CreateTestPage.tsx";
export { EditTestPage } from "./EditTestPage.tsx";
export { TestListPage } from "./TestListPage.tsx";
export { DetailTestPage } from "./DetailTestPage.tsx";
export { SectionBuilder } from "./SectionBuilder.tsx";
export { StatsChartPage } from "./StatsChartPage.tsx";


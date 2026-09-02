import { useState } from "react";
import { UserTestListPage } from "./UserTestListPage.tsx";
import { TakeTestPage } from "./TakeTestPage.tsx";
import { TestResultPage } from "./TestResultPage.tsx";
import type { TestResultDTO } from "@/types/user-test.types.ts";

type UserView = "list" | "taking" | "result";

export function UserTestFeature() {
  const [view, setView] = useState<UserView>("list");
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResultDTO | null>(null);

  const handleStartTest = (testId: string) => {
    setSelectedTestId(testId);
    setTestResult(null);
    setView("taking");
  };

  const handleFinishTest = (result: TestResultDTO) => {
    setTestResult(result);
    setView("result");
  };

  const handleBackToList = () => {
    setSelectedTestId(null);
    setTestResult(null);
    setView("list");
  };

  const handleRetakeTest = () => {
    if (selectedTestId) {
      setTestResult(null);
      setView("taking");
    }
  };

  return (
    <>
      {view === "list" && (
        <UserTestListPage onStartTest={handleStartTest} />
      )}

      {view === "taking" && selectedTestId && (
        <TakeTestPage
          testId={selectedTestId}
          onExit={handleBackToList}
          onFinish={handleFinishTest}
        />
      )}

      {view === "result" && testResult && (
        <TestResultPage
          result={testResult}
          onBackToList={handleBackToList}
          onRetakeTest={handleRetakeTest}
        />
      )}
    </>
  );
}

// Re-exports
export { UserTestListPage } from "./UserTestListPage.tsx";
export { TakeTestPage } from "./TakeTestPage.tsx";
export { TestResultPage } from "./TestResultPage.tsx";

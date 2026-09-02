import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface TestTimerProps {
  /** ISO string tính từ server (startedAt + durationMin) — KHÔNG tự tính ở client */
  deadline: string;
  onExpire: () => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");

  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

export function TestTimer({ deadline, onExpire }: TestTimerProps) {
  const deadlineMs = useRef(new Date(deadline).getTime());
  const hasExpiredRef = useRef(false);
  const [remainingMs, setRemainingMs] = useState(
    () => deadlineMs.current - Date.now()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = deadlineMs.current - Date.now();
      setRemainingMs(remaining);

      if (remaining <= 0 && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        clearInterval(interval);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [onExpire]);

  const isWarning = remainingMs <= 5 * 60 * 1000; // còn dưới 5 phút
  const isCritical = remainingMs <= 60 * 1000; // còn dưới 1 phút

  return (
    <Badge
      variant={isCritical ? "destructive" : "outline"}
      className={[
        "px-3 py-1 font-mono text-base tabular-nums",
        isWarning && !isCritical ? "border-amber-500 text-amber-600" : "",
        isCritical ? "animate-pulse" : "",
      ].join(" ")}
    >
      {formatTime(remainingMs)}
    </Badge>
  );
}

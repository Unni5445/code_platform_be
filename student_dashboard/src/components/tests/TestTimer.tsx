import { Clock } from "lucide-react";
import clsx from "clsx";

interface TestTimerProps {
  formatted: string;
  timeLeft: number;
}

export function TestTimer({ formatted, timeLeft }: TestTimerProps) {
  const isWarning = timeLeft < 300; // Less than 5 minutes
  const isCritical = timeLeft < 60; // Less than 1 minute

  return (
    <div
      className={clsx(
        "flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold",
        isCritical
          ? "bg-red-100 text-red-700 animate-pulse"
          : isWarning
          ? "bg-amber-100 text-amber-700"
          : "bg-gray-100 text-gray-700"
      )}
    >
      <Clock className="h-5 w-5" />
      {formatted}
    </div>
  );
}

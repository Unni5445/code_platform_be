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
        "flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold border shadow-sm",
        isCritical
          ? "bg-red-50 text-red-700 border-red-100 animate-pulse"
          : isWarning
          ? "bg-amber-50 text-amber-700 border-amber-100"
          : "bg-white text-slate-700 border-slate-200"
      )}
    >
      <Clock className="h-5 w-5" />
      {formatted}
    </div>
  );
}

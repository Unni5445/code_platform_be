import { useMemo } from "react";
import clsx from "clsx";
import type { ActivityLogEntry } from "@/types";

interface ActivityHeatmapProps {
  data: ActivityLogEntry[];
  className?: string;
}

function getColorClass(count: number): string {
  if (count === 0) return "bg-slate-800";
  if (count <= 2) return "bg-emerald-500/40";
  if (count <= 5) return "bg-emerald-500/60";
  return "bg-emerald-500";
}

export function ActivityHeatmap({ data, className }: ActivityHeatmapProps) {
  const { grid, months } = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const dateMap = new Map<string, number>();
    for (const entry of data) {
      dateMap.set(entry.date.split("T")[0], entry.count);
    }

    const weeks: { date: Date; count: number; inRange: boolean }[][] = [];
    const current = new Date(startDate);

    current.setDate(current.getDate() - current.getDay());

    while (current <= endDate) {
      const week: { date: Date; count: number; inRange: boolean }[] = [];
      for (let day = 0; day < 7; day++) {
        const dateStr = current.toISOString().split("T")[0];
        const inRange =
          current >= startDate &&
          current <= endDate &&
          current <= today;
        week.push({
          date: new Date(current),
          count: inRange ? dateMap.get(dateStr) || 0 : 0,
          inRange,
        });
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
    }

    const monthLabels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const yearDay = week.find((d) => d.date.getFullYear() === year);
      if (!yearDay) return;
      const month = yearDay.date.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({
          label: yearDay.date.toLocaleString("en-US", { month: "short" }),
          col: i,
        });
        lastMonth = month;
      }
    });

    return { grid: weeks, months: monthLabels };
  }, [data]);

  const totalContributions = data.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <div className={className}>
      <div className="mb-1 ml-8 flex gap-[3px]">
        {months.map((m, i) => (
          <div
            key={i}
            className="text-xs text-slate-400"
            style={{ position: "relative", left: `${m.col * 10}px` }}
          >
            {m.label}
          </div>
        ))}
      </div>

      <div className="flex gap-1">
        <div className="flex flex-col gap-[3px] pr-1 text-xs text-slate-400">
          <div className="h-[13px]" />
          <div className="h-[13px] leading-[13px]">Mon</div>
          <div className="h-[13px]" />
          <div className="h-[13px] leading-[13px]">Wed</div>
          <div className="h-[13px]" />
          <div className="h-[13px] leading-[13px]">Fri</div>
          <div className="h-[13px]" />
        </div>

        <div className="flex gap-[3px]">
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => (
                <div
                  key={di}
                  className={clsx(
                    "h-[13px] w-[13px] rounded-sm",
                    day.inRange ? getColorClass(day.count) : "bg-slate-800/60"
                  )}
                  title={
                    day.inRange
                      ? `${day.date.toLocaleDateString()}: ${day.count} contribution${day.count !== 1 ? "s" : ""}`
                      : ""
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-slate-400">
          {totalContributions} contributions in the last year
        </span>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          Less
          <div className="h-[13px] w-[13px] rounded-sm bg-slate-800" />
          <div className="h-[13px] w-[13px] rounded-sm bg-emerald-500/40" />
          <div className="h-[13px] w-[13px] rounded-sm bg-emerald-500/60" />
          <div className="h-[13px] w-[13px] rounded-sm bg-emerald-500" />
          More
        </div>
      </div>
    </div>
  );
}

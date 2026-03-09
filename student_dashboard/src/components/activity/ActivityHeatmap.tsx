import { useMemo } from "react";
import clsx from "clsx";
import type { ActivityLogEntry } from "@/types";

interface ActivityHeatmapProps {
  data: ActivityLogEntry[];
  className?: string;
}

function getColorClass(count: number): string {
  if (count === 0) return "bg-gray-100";
  if (count <= 2) return "bg-emerald-200";
  if (count <= 5) return "bg-emerald-400";
  return "bg-emerald-600";
}

export function ActivityHeatmap({ data, className }: ActivityHeatmapProps) {
  const { grid, months } = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();

    // Start from Jan 1 of current year
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    // Build a map of date -> count
    const dateMap = new Map<string, number>();
    for (const entry of data) {
      dateMap.set(entry.date.split("T")[0], entry.count);
    }

    // Build grid: weeks from Jan 1 to Dec 31
    const weeks: { date: Date; count: number; inRange: boolean }[][] = [];
    const current = new Date(startDate);

    // Align to start of week (Sunday)
    current.setDate(current.getDate() - current.getDay());

    while (current <= endDate) {
      const week: { date: Date; count: number; inRange: boolean }[] = [];
      for (let day = 0; day < 7; day++) {
        const dateStr = current.toISOString().split("T")[0];
        const inRange = current >= startDate && current <= endDate && current <= today;
        week.push({
          date: new Date(current),
          count: inRange ? (dateMap.get(dateStr) || 0) : 0,
          inRange,
        });
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
    }

    // Month labels
    const monthLabels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      // Find first day in this week that belongs to current year
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
      {/* Month Labels */}
      <div className="flex gap-[3px] mb-1 ml-8">
        {months.map((m, i) => (
          <div
            key={i}
            className="text-xs text-gray-400"
            style={{ position: "relative", left: `${m.col * 10}px` }}
          >
            {m.label}
          </div>
        ))}
      </div>

      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] text-xs text-gray-400 pr-1">
          <div className="h-[13px]" />
          <div className="h-[13px] leading-[13px]">Mon</div>
          <div className="h-[13px]" />
          <div className="h-[13px] leading-[13px]">Wed</div>
          <div className="h-[13px]" />
          <div className="h-[13px] leading-[13px]">Fri</div>
          <div className="h-[13px]" />
        </div>

        {/* Grid */}
        <div className="flex gap-[3px]">
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => (
                <div
                  key={di}
                  className={clsx(
                    "h-[13px] w-[13px] rounded-sm",
                    day.inRange ? getColorClass(day.count) : " bg-gray-50"
                  )}
                  title={day.inRange ? `${day.date.toLocaleDateString()}: ${day.count} contribution${day.count !== 1 ? "s" : ""}` : ""}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-sm text-gray-500">{totalContributions} contributions in the last year</span>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          Less
          <div className="h-[13px] w-[13px] rounded-sm bg-gray-100" />
          <div className="h-[13px] w-[13px] rounded-sm bg-emerald-200" />
          <div className="h-[13px] w-[13px] rounded-sm bg-emerald-400" />
          <div className="h-[13px] w-[13px] rounded-sm bg-emerald-600" />
          More
        </div>
      </div>
    </div>
  );
}

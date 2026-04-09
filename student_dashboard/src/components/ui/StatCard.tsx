import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  color?: string;
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color = "bg-primary-50 text-primary-600",
  className,
}: StatCardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl shadow-sm border border-slate-200 bg-white p-5",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {trend && <p className="text-xs text-emerald-600 font-medium mt-1">{trend}</p>}
        </div>
        <div className={clsx("p-3 rounded-xl", color)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

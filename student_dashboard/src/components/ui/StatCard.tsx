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
  color = "bg-primary-500/20 text-primary-300",
  className,
}: StatCardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl shadow-card border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-sm",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {trend && <p className="text-xs text-emerald-400 mt-1">{trend}</p>}
        </div>
        <div className={clsx("p-3 rounded-xl", color)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

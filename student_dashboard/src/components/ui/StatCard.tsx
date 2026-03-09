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

export function StatCard({ icon: Icon, label, value, trend, color = "text-primary-600 bg-primary-50", className }: StatCardProps) {
  return (
    <div className={clsx("bg-surface rounded-xl shadow-card border border-surface-border p-5", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && <p className="text-xs text-emerald-600 mt-1">{trend}</p>}
        </div>
        <div className={clsx("p-3 rounded-xl", color)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

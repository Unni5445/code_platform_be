import { type ReactNode } from "react";
import clsx from "clsx";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
  iconBg?: string;
}

export function StatCard({ icon, label, value, trend, iconBg = "bg-primary-100" }: StatCardProps) {
  return (
    <div className="bg-surface rounded-xl shadow-card border border-surface-border p-5 hover:shadow-card-hover transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className={clsx("p-3 rounded-xl", iconBg)}>
          {icon}
        </div>
        {trend && (
          <span
            className={clsx(
              "inline-flex items-center text-xs font-medium px-2 py-1 rounded-full",
              trend.isPositive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            )}
          >
            {trend.isPositive ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

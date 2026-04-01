import { Target, Trophy, Globe2, Percent } from "lucide-react";

interface DashboardStatsProps {
  problemsSolved: number;
  totalXp: number;
  globalRank: number;
  acceptance: number;
  loading?: boolean;
}

export function DashboardStats({ problemsSolved, totalXp, globalRank, acceptance, loading }: DashboardStatsProps) {
  const stats = [
    {
      id: "problems",
      label: "Problems solved",
      value: problemsSolved.toLocaleString(),
      icon: Target,
      color: "text-blue-400",
      bgCol: "bg-blue-500/10",
      borderCol: "border-blue-500/20",
    },
    {
      id: "xp",
      label: "Total XP",
      value: totalXp.toLocaleString(),
      icon: Trophy,
      color: "text-amber-400",
      bgCol: "bg-amber-500/10",
      borderCol: "border-amber-500/20",
    },
    {
      id: "rank",
      label: "Global rank",
      value: `#${globalRank.toLocaleString()}`,
      icon: Globe2,
      color: "text-purple-400",
      bgCol: "bg-purple-500/10",
      borderCol: "border-purple-500/20",
    },
    {
      id: "acceptance",
      label: "Acceptance",
      value: `${acceptance}%`,
      icon: Percent,
      color: "text-emerald-400",
      bgCol: "bg-emerald-500/10",
      borderCol: "border-emerald-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
      {stats.map((stat, i) => {
        if (loading) {
          return (
            <div key={`skel-${i}`} className="flex items-center gap-4 rounded-xl border p-4 bg-slate-900/40 border-slate-800/60">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-800 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-6 w-16 bg-slate-800 animate-pulse rounded" />
                <div className="h-3 w-20 bg-slate-800/80 animate-pulse rounded" />
              </div>
            </div>
          );
        }

        const Icon = stat.icon;
        return (
          <div
            key={stat.id}
            className={`flex items-center gap-4 rounded-xl border p-4 transition-all duration-300 hover:-translate-y-1 bg-slate-900/40 hover:bg-slate-800/60 ${stat.borderCol}`}
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${stat.bgCol} ${stat.color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {stat.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

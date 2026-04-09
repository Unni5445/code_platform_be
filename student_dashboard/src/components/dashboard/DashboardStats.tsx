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
      color: "text-blue-600",
      bgCol: "bg-blue-50",
      borderCol: "border-blue-100",
    },
    {
      id: "xp",
      label: "Total XP",
      value: totalXp.toLocaleString(),
      icon: Trophy,
      color: "text-amber-600",
      bgCol: "bg-amber-50",
      borderCol: "border-amber-100",
    },
    {
      id: "rank",
      label: "Global rank",
      value: `#${globalRank.toLocaleString()}`,
      icon: Globe2,
      color: "text-purple-600",
      bgCol: "bg-purple-50",
      borderCol: "border-purple-100",
    },
    {
      id: "acceptance",
      label: "Acceptance",
      value: `${acceptance}%`,
      icon: Percent,
      color: "text-emerald-600",
      bgCol: "bg-emerald-50",
      borderCol: "border-emerald-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
      {stats.map((stat, i) => {
        if (loading) {
          return (
            <div key={`skel-${i}`} className="flex items-center gap-4 rounded-xl border p-4 bg-white border-slate-100">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-6 w-16 bg-slate-100 animate-pulse rounded" />
                <div className="h-3 w-20 bg-slate-100/80 animate-pulse rounded" />
              </div>
            </div>
          );
        }

        const Icon = stat.icon;
        return (
          <div
            key={stat.id}
            className={`flex items-center gap-4 rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 bg-white shadow-sm hover:shadow-xl ${stat.borderCol}`}
          >
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-inner ${stat.bgCol} ${stat.color}`}>
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 leading-none mb-1">{stat.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {stat.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

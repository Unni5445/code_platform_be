import { Flame, Calendar, TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Card, StatCard } from "@/components/ui";
import { ActivityHeatmap } from "@/components/activity/ActivityHeatmap";

export default function ActivityPage() {
  const { user } = useAuth();
  const activityLog = user?.activityLog || [];

  const totalActive = activityLog.filter((e) => e.count > 0).length;
  const totalContributions = activityLog.reduce((sum, e) => sum + e.count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Activity</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">Your learning activity over time</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Calendar}
          label="Active Days"
          value={totalActive}
          color="bg-primary-100 text-primary-700 border border-primary-200"
        />
        <StatCard
          icon={Flame}
          label="Current Streak"
          value={user?.streak || 0}
          trend={user?.maxStreak ? `Best: ${user.maxStreak} days` : undefined}
          color="bg-orange-50 text-orange-700 border border-orange-100"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Submissions"
          value={totalContributions}
          color="bg-emerald-50 text-emerald-700 border border-emerald-100"
        />
      </div>

      <Card
        className="w-fit"
        header={<h3 className="text-lg font-bold text-slate-900">Contribution Calendar</h3>}
      >
        <ActivityHeatmap data={activityLog} />
      </Card>
    </div>
  );
}

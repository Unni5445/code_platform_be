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
        <h1 className="text-xl font-bold text-gray-900">Activity</h1>
        <p className="text-sm text-gray-500 mt-1">Your learning activity over time</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Calendar}
          label="Active Days"
          value={totalActive}
          color="text-primary-600 bg-primary-50"
        />
        <StatCard
          icon={Flame}
          label="Current Streak"
          value={user?.streak || 0}
          trend={user?.maxStreak ? `Best: ${user.maxStreak} days` : undefined}
          color="text-orange-600 bg-orange-50"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Submissions"
          value={totalContributions}
          color="text-emerald-600 bg-emerald-50"
        />
      </div>

      {/* Heatmap */}
      <Card className={" w-fit"} header={<h3 className="text-lg font-semibold text-gray-900">Contribution Calendar</h3>}>
        <ActivityHeatmap data={activityLog}/>
      </Card>
    </div>
  );
}

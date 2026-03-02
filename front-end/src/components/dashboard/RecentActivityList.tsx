import { Card, Spinner } from "@/components/ui";
import { dashboardService } from "@/services";
import { useApi } from "@/hooks/useApi";
import { FileCheck, Award, Send, BookOpen, Flame, GraduationCap } from "lucide-react";
import clsx from "clsx";

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  test: { icon: <FileCheck className="h-4 w-4" />, color: "bg-primary-100 text-primary-600" },
  certificate: { icon: <Award className="h-4 w-4" />, color: "bg-secondary-100 text-secondary-600" },
  submission: { icon: <Send className="h-4 w-4" />, color: "bg-blue-100 text-blue-600" },
  enrollment: { icon: <BookOpen className="h-4 w-4" />, color: "bg-emerald-100 text-emerald-600" },
  streak: { icon: <Flame className="h-4 w-4" />, color: "bg-orange-100 text-orange-600" },
  module: { icon: <GraduationCap className="h-4 w-4" />, color: "bg-indigo-100 text-indigo-600" },
};

export function RecentActivityList() {
  const { data: activities, loading } = useApi(
    () => dashboardService.getRecentActivity(),
    []
  );

  return (
    <Card header={<h3 className="text-base font-semibold text-gray-900">Recent Activity</h3>} noPadding>
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Spinner />
        </div>
      ) : (
        <div className="divide-y divide-surface-border max-h-80 overflow-y-auto">
          {(activities || []).map((activity, index) => {
            const config = typeConfig[activity.type] || typeConfig.test;
            return (
              <div key={index} className="flex items-start gap-3 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                <div className={clsx("p-2 rounded-lg shrink-0", config.color)}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.user}</span>{" "}
                    <span className="text-gray-500">{activity.action}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                </div>
              </div>
            );
          })}
          {(!activities || activities.length === 0) && (
            <p className="text-sm text-gray-500 text-center py-8">No recent activity</p>
          )}
        </div>
      )}
    </Card>
  );
}

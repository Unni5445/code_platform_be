import { useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";
import { authService, enrollmentService } from "@/services";
import { Card, EmptyState, Badge, ProgressBar } from "@/components/ui";
import { XPProgressBar } from "@/components/dashboard/XPProgressBar";
import { DailyQuests } from "@/components/dashboard/DailyQuests";
import { StreakCalendar } from "@/components/dashboard/StreakCalendar";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import type { IEnrollment } from "@/types";

export default function DashboardPage() {
  const { user } = useAuth();

  const fetchEnrollments = useCallback(() => enrollmentService.getMyEnrollments(), []);
  const { data: enrollments, loading } = useApi<IEnrollment[]>(fetchEnrollments, []);

  const fetchStats = useCallback(() => authService.getStudentStats(), []);
  const { data: metrics, loading: statsLoading } = useApi<{ problemsSolved: number; totalXp: number; globalRank: number; acceptance: number }>(fetchStats, []);

  const totalCourses = enrollments?.length || 0;

  return (
    <div className="space-y-6">

      {/* Top Banner Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <XPProgressBar totalPoints={user?.points || 0} playerClass={user?.playerClass || "Apprentice"} />
          <DashboardStats
            problemsSolved={metrics?.problemsSolved || 0}
            totalXp={metrics?.totalXp || user?.points || 0}
            globalRank={metrics?.globalRank || 0}
            acceptance={metrics?.acceptance || 0}
            loading={statsLoading}
          />
        </div>
        <div className="lg:col-span-1">
          <StreakCalendar streak={user?.streak || 0} />
        </div>
      </div>



      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Col (Courses) */}
        <div className="lg:col-span-2">
          <Card
            header={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">My Courses</h3>
                  {totalCourses > 0 && (
                    <Badge variant="primary" className="bg-primary-500/10 text-primary-400 border-primary-500/20">
                      {totalCourses} Active
                    </Badge>
                  )}
                </div>
                <Link
                  to="/courses"
                  className="flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            }
          >
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-28 rounded-xl border border-slate-800 bg-slate-900/40 animate-pulse" />
                ))}
              </div>
            ) : !enrollments?.length ? (
              <EmptyState
                title="No Courses Yet"
                description="You haven't been enrolled in any courses yet. Contact your admin to get started."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enrollments.slice(0, 4).map((enrollment) => {
                  const course = typeof enrollment.course === "object" ? enrollment.course : null;
                  return (
                    <Link
                      key={enrollment._id}
                      to={`/courses/${typeof enrollment.course === "object" ? enrollment.course._id : enrollment.course}`}
                      className="block rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary-500/40 hover:bg-slate-800/60 hover:shadow-lg hover:shadow-primary-500/10"
                    >
                      <div className="mb-4 flex items-start justify-between">
                        <h4 className="line-clamp-1 font-bold text-white pr-2">
                          {course?.title || "Course"}
                        </h4>
                        <Badge
                          variant={
                            enrollment.status === "COMPLETED"
                              ? "success"
                              : enrollment.status === "ACTIVE"
                                ? "primary"
                                : "gray"
                          }
                        >
                          {enrollment.status}
                        </Badge>
                      </div>
                      <ProgressBar value={enrollment.overallProgress} showLabel />
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Sidebar (Quests) */}
        <div className="lg:col-span-1">
          <DailyQuests />
        </div>

      </div>
    </div>
  );
}

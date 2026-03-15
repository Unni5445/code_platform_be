import { useCallback } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Trophy, Flame, Star, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";
import { enrollmentService } from "@/services";
import { Card, Spinner, EmptyState, Badge, ProgressBar, StatCard } from "@/components/ui";
import type { IEnrollment } from "@/types";

export default function DashboardPage() {
  const { user } = useAuth();

  const fetchEnrollments = useCallback(() => enrollmentService.getMyEnrollments(), []);
  const { data: enrollments, loading } = useApi<IEnrollment[]>(fetchEnrollments, []);

  const totalCourses = enrollments?.length || 0;
  const avgProgress = enrollments?.length
    ? Math.round(enrollments.reduce((sum, e) => sum + e.overallProgress, 0) / enrollments.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 px-6 py-5 text-white backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {user?.name || "Student"}!
        </h1>
        <p className="mt-1 text-slate-300">
          Keep up the great work. Here&apos;s your learning overview.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          label="Enrolled Courses"
          value={totalCourses}
          color="bg-primary-500/20 text-primary-300"
        />
        <StatCard
          icon={Star}
          label="Average Progress"
          value={`${avgProgress}%`}
          color="bg-secondary-500/20 text-secondary-300"
        />
        <StatCard
          icon={Flame}
          label="Current Streak"
          value={user?.streak || 0}
          trend={user?.maxStreak ? `Max: ${user.maxStreak}` : undefined}
          color="bg-orange-500/20 text-orange-300"
        />
        <StatCard
          icon={Trophy}
          label="Total Points"
          value={user?.points || 0}
          color="bg-emerald-500/20 text-emerald-300"
        />
      </div>

      {/* Enrolled Courses */}
      <Card
        header={
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">My Courses</h3>
            <Link
              to="/courses"
              className="flex items-center gap-1 text-sm font-medium text-primary-400 hover:text-primary-300"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        }
      >
        {loading ? (
          <div className="py-8">
            <Spinner />
          </div>
        ) : !enrollments?.length ? (
          <EmptyState
            title="No Courses Yet"
            description="You haven't been enrolled in any courses yet. Contact your admin to get started."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrollments.slice(0, 6).map((enrollment) => {
              const course = typeof enrollment.course === "object" ? enrollment.course : null;
              return (
                <Link
                  key={enrollment._id}
                  to={`/courses/${typeof enrollment.course === "object" ? enrollment.course._id : enrollment.course}`}
                  className="block rounded-xl border border-slate-800/80 p-4 transition-all duration-200 hover:border-primary-500/40 hover:bg-slate-800/40"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <h4 className="line-clamp-1 font-semibold text-white">
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
                  {course?.description && (
                    <p className="mb-3 line-clamp-2 text-sm text-slate-400">{course.description}</p>
                  )}
                  <ProgressBar value={enrollment.overallProgress} showLabel />
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

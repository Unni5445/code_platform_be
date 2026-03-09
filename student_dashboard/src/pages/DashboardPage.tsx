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
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {user?.name || "Student"}!</h1>
        <p className="text-primary-200 mt-1">Keep up the great work. Here's your learning overview.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          label="Enrolled Courses"
          value={totalCourses}
          color="text-primary-600 bg-primary-50"
        />
        <StatCard
          icon={Star}
          label="Average Progress"
          value={`${avgProgress}%`}
          color="text-secondary-600 bg-secondary-50"
        />
        <StatCard
          icon={Flame}
          label="Current Streak"
          value={user?.streak || 0}
          trend={user?.maxStreak ? `Max: ${user.maxStreak}` : undefined}
          color="text-orange-600 bg-orange-50"
        />
        <StatCard
          icon={Trophy}
          label="Total Points"
          value={user?.points || 0}
          color="text-emerald-600 bg-emerald-50"
        />
      </div>

      {/* Enrolled Courses */}
      <Card header={
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">My Courses</h3>
          <Link to="/courses" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      }>
        {loading ? (
          <div className="py-8"><Spinner /></div>
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
                  className="block p-4 rounded-xl border border-surface-border hover:shadow-card-hover hover:border-primary-200 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 line-clamp-1">
                      {course?.title || "Course"}
                    </h4>
                    <Badge variant={enrollment.status === "COMPLETED" ? "success" : enrollment.status === "ACTIVE" ? "primary" : "gray"}>
                      {enrollment.status}
                    </Badge>
                  </div>
                  {course?.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{course.description}</p>
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

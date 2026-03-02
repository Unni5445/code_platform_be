import {
  Users,
  GraduationCap,
  ShieldCheck,
  BookOpen,
  FileQuestion,
  Award,
  TrendingUp,
  Flame,
} from "lucide-react";
import { dashboardService } from "@/services";
import { useApi } from "@/hooks/useApi";
import { StatCard } from "@/components/dashboard/StatCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { UserGrowthChart } from "@/components/dashboard/UserGrowthChart";
import { TestPerformanceChart } from "@/components/dashboard/TestPerformanceChart";
import { RecentActivityList } from "@/components/dashboard/RecentActivityList";
import { Spinner } from "@/components/ui";

export default function DashboardPage() {
  const { data: stats, loading } = useApi(
    () => dashboardService.getStats(),
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="h-6 w-6 text-primary-600" />}
          label="Total Users"
          value={stats?.totalUsers ?? 0}
          iconBg="bg-primary-100"
        />
        <StatCard
          icon={<GraduationCap className="h-6 w-6 text-blue-600" />}
          label="Students"
          value={stats?.totalStudents ?? 0}
          iconBg="bg-blue-100"
        />
        <StatCard
          icon={<ShieldCheck className="h-6 w-6 text-indigo-600" />}
          label="Admins"
          value={stats?.totalAdmins ?? 0}
          iconBg="bg-indigo-100"
        />
        <StatCard
          icon={<BookOpen className="h-6 w-6 text-emerald-600" />}
          label="Active Courses"
          value={stats?.totalCourses ?? 0}
          iconBg="bg-emerald-100"
        />
        <StatCard
          icon={<FileQuestion className="h-6 w-6 text-secondary-600" />}
          label="Active Tests"
          value={stats?.activeTests ?? 0}
          iconBg="bg-secondary-100"
        />
        <StatCard
          icon={<Award className="h-6 w-6 text-rose-600" />}
          label="Certificates"
          value={stats?.totalCertificates ?? 0}
          iconBg="bg-rose-100"
        />
        <StatCard
          icon={<TrendingUp className="h-6 w-6 text-cyan-600" />}
          label="Avg Points"
          value={stats?.avgPoints ?? 0}
          iconBg="bg-cyan-100"
        />
        <StatCard
          icon={<Flame className="h-6 w-6 text-orange-600" />}
          label="Avg Streak"
          value={`${stats?.avgStreak ?? 0} days`}
          iconBg="bg-orange-100"
        />
      </div>

      {/* Charts + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <UserGrowthChart />
        </div>
        <QuickActions />
      </div>

      {/* Performance + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TestPerformanceChart />
        <RecentActivityList />
      </div>
    </div>
  );
}

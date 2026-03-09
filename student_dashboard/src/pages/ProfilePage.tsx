import { useCallback } from "react";
import {
  Mail,
  Phone,
  Building2,
  GraduationCap,
  Calendar,
  Star,
  Flame,
  Trophy,
  BookOpen,
  User,
  Award,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";
import { enrollmentService } from "@/services";
import { Card, Avatar, Badge, StatCard, Spinner } from "@/components/ui";
import { ActivityHeatmap } from "@/components/activity/ActivityHeatmap";
import type { IEnrollment } from "@/types";
import type { ICertificate } from "@/services/enrollment.service";

export default function ProfilePage() {
  const { user } = useAuth();

  const fetchEnrollments = useCallback(() => enrollmentService.getMyEnrollments(), []);
  const { data: enrollments } = useApi<IEnrollment[]>(fetchEnrollments, []);

  const fetchCertificates = useCallback(() => enrollmentService.getMyCertificates(), []);
  const { data: certificates, loading: certsLoading } = useApi<ICertificate[]>(fetchCertificates, []);

  const orgName = user?.organisation && typeof user.organisation === "object" ? user.organisation.name : user?.organisation;

  const completedCount = enrollments?.filter((e) => e.status === "COMPLETED").length || 0;
  const activeCount = enrollments?.filter((e) => e.status === "ACTIVE").length || 0;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return undefined;
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  };

  const infoItems = [
    { icon: Mail, label: "Email", value: user?.email },
    { icon: Phone, label: "Phone", value: user?.phone },
    { icon: User, label: "Gender", value: user?.gender },
    { icon: Calendar, label: "Date of Birth", value: formatDate(user?.dob) },
    { icon: Building2, label: "College", value: orgName },
    { icon: GraduationCap, label: "Department", value: user?.department },
    { icon: Calendar, label: "Passout Year", value: user?.passoutYear?.toString() },
    { icon: Clock, label: "Member Since", value: formatDate(user?.createdAt) },
  ].filter((item) => item.value);

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <div className="flex items-center gap-6">
          <Avatar name={user?.name} size="lg" className="h-20 w-20 text-2xl" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user?.name || "Student"}</h1>
            <p className="text-gray-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="primary">{user?.role}</Badge>
              {orgName && <Badge variant="gray">{orgName}</Badge>}
              {user?.isActive && <Badge variant="success">Active</Badge>}
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={Star}
          label="Points"
          value={user?.points || 0}
          color="text-primary-600 bg-primary-50"
        />
        <StatCard
          icon={Flame}
          label="Streak"
          value={user?.streak || 0}
          color="text-orange-600 bg-orange-50"
        />
        <StatCard
          icon={Trophy}
          label="Max Streak"
          value={user?.maxStreak || 0}
          color="text-amber-600 bg-amber-50"
        />
        <StatCard
          icon={BookOpen}
          label="Enrolled"
          value={enrollments?.length || 0}
          color="text-blue-600 bg-blue-50"
        />
        <StatCard
          icon={Clock}
          label="Active"
          value={activeCount}
          color="text-emerald-600 bg-emerald-50"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={completedCount}
          color="text-green-600 bg-green-50"
        />
      </div>

      {/* Personal Info */}
      <Card header={<h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>}>
        {infoItems.length === 0 ? (
          <p className="text-sm text-gray-400">No personal information available</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {infoItems.map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <item.icon className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-sm font-medium text-gray-900">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Certificates */}
      <Card header={<h3 className="text-lg font-semibold text-gray-900">Certificates</h3>}>
        {certsLoading ? (
          <div className="flex justify-center py-6">
            <Spinner size="md" />
          </div>
        ) : !certificates?.length ? (
          <p className="text-sm text-gray-400">No certificates earned yet. Complete a course to earn one!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.map((cert) => {
              const courseTitle = typeof cert.course === "object" ? cert.course.title : "Course";
              const courseId = typeof cert.course === "object" ? cert.course._id : cert.course;
              return (
                <Link
                  key={cert._id}
                  to={`/certificates/${courseId}`}
                  className="flex items-center gap-3 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Award className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{cert.title}</p>
                    <p className="text-xs text-gray-500">{courseTitle} - {formatDate(cert.issuedAt)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      {/* Activity Heatmap */}
      <Card header={<h3 className="text-lg font-semibold text-gray-900">Activity</h3>}>
        <ActivityHeatmap data={user?.activityLog || []} />
      </Card>
    </div>
  );
}

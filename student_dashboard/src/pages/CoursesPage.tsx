import { useCallback } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ArrowRight, Award } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { enrollmentService } from "@/services";
import { Card, Spinner, EmptyState, Badge, ProgressBar } from "@/components/ui";
import type { IEnrollment } from "@/types";

export default function CoursesPage() {
  const fetchEnrollments = useCallback(() => enrollmentService.getMyEnrollments(), []);
  const { data: enrollments, loading } = useApi<IEnrollment[]>(fetchEnrollments, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!enrollments?.length) {
    return (
      <Card>
        <EmptyState
          icon={<BookOpen className="h-10 w-10 text-primary-400" />}
          title="No Courses Enrolled"
          description="You haven't been enrolled in any courses yet. Contact your admin to get started."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Courses</h1>
          <p className="text-sm text-gray-500 mt-1">{enrollments.length} course{enrollments.length !== 1 ? "s" : ""} enrolled</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {enrollments.map((enrollment) => {
          const course = typeof enrollment.course === "object" ? enrollment.course : null;
          const courseId = typeof enrollment.course === "object" ? enrollment.course._id : enrollment.course;

          return (
            <Card key={enrollment._id} className="hover:shadow-card-hover transition-shadow duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-primary-50 rounded-lg">
                  <BookOpen className="h-5 w-5 text-primary-600" />
                </div>
                <Badge variant={enrollment.status === "COMPLETED" ? "success" : enrollment.status === "ACTIVE" ? "primary" : "gray"}>
                  {enrollment.status}
                </Badge>
              </div>

              <h3 className="font-semibold text-gray-900 text-lg mb-1">
                {course?.title || "Course"}
              </h3>
              {course?.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{course.description}</p>
              )}

              <ProgressBar value={enrollment.overallProgress} showLabel className="mb-4" />

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{enrollment.moduleProgress.length} module{enrollment.moduleProgress.length !== 1 ? "s" : ""}</span>
                <div className="flex items-center gap-3">
                  {enrollment.overallProgress >= 100 && (
                    <Link
                      to={`/certificates/${courseId}`}
                      className="text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                    >
                      <Award className="h-4 w-4" /> Certificate
                    </Link>
                  )}
                  <Link
                    to={`/courses/${courseId}`}
                    className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    View Details <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

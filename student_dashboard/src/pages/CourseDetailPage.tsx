import { useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  FileQuestion,
  BookOpen,
  ArrowLeft,
  Loader2,
  Award,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { courseService, enrollmentService } from "@/services";
import { Card, Spinner, Badge, ProgressBar, Button } from "@/components/ui";
import type { ICourse, IModule, ISubmodule, IEnrollment, IModuleProgress } from "@/types";
import clsx from "clsx";
import toast from "react-hot-toast";

export default function CourseDetailPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [moduleSubmodules, setModuleSubmodules] = useState<Record<string, ISubmodule[]>>({});
  const [loadingSubmodules, setLoadingSubmodules] = useState<Set<string>>(new Set());
  const [updatingProgress, setUpdatingProgress] = useState<string | null>(null);

  const fetchCourse = useCallback(() => courseService.getCourseById(courseId!), [courseId]);
  const { data: course, loading: courseLoading } = useApi<ICourse>(fetchCourse, [courseId]);

  const fetchModules = useCallback(() => courseService.getModulesByCourse(courseId!), [courseId]);
  const { data: modules, loading: modulesLoading } = useApi<IModule[]>(fetchModules, [courseId]);

  const fetchEnrollments = useCallback(() => enrollmentService.getMyEnrollments(), []);
  const { data: enrollments, refetch: refetchEnrollments } = useApi<IEnrollment[]>(
    fetchEnrollments,
    []
  );

  const enrollment = enrollments?.find((e) => {
    const eCourseId = typeof e.course === "object" ? e.course._id : e.course;
    return eCourseId === courseId;
  });

  const getModuleProgress = (moduleId: string): IModuleProgress | undefined => {
    return enrollment?.moduleProgress.find((mp) => mp.module === moduleId);
  };

  const toggleModule = async (moduleId: string) => {
    const next = new Set(expandedModules);
    if (next.has(moduleId)) {
      next.delete(moduleId);
    } else {
      next.add(moduleId);
      if (!moduleSubmodules[moduleId]) {
        setLoadingSubmodules((prev) => new Set(prev).add(moduleId));
        try {
          const res = await courseService.getSubmodulesByModule(moduleId);
          setModuleSubmodules((prev) => ({ ...prev, [moduleId]: res.data.data }));
        } catch {
          toast.error("Failed to load submodules");
        }
        setLoadingSubmodules((prev) => {
          const s = new Set(prev);
          s.delete(moduleId);
          return s;
        });
      }
    }
    setExpandedModules(next);
  };

  const handleToggleSubmodule = async (
    moduleId: string,
    submoduleId: string,
    isCompleted: boolean
  ) => {
    if (!enrollment || updatingProgress) return;
    setUpdatingProgress(submoduleId);
    try {
      await enrollmentService.updateProgress(enrollment._id, {
        moduleId,
        submoduleId,
        action: isCompleted ? "uncomplete" : "complete",
      });
      await refetchEnrollments();
      toast.success(isCompleted ? "Marked as incomplete" : "Marked as complete");
    } catch {
      toast.error("Failed to update progress");
    }
    setUpdatingProgress(null);
  };

  if (courseLoading || modulesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/courses"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Courses
      </Link>

      <Card>
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-primary-500/20 p-3">
            <BookOpen className="h-8 w-8 text-primary-300" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{course?.title}</h1>
            {course?.description && (
              <p className="mt-1 text-slate-400">{course.description}</p>
            )}
            <div className="mt-4 flex items-center gap-4">
              <Badge variant="primary">{modules?.length || 0} Modules</Badge>
              {enrollment && (
                <Badge
                  variant={
                    enrollment.status === "COMPLETED" ? "success" : "info"
                  }
                >
                  {enrollment.status}
                </Badge>
              )}
            </div>
            {enrollment && (
              <ProgressBar
                value={enrollment.overallProgress}
                showLabel
                className="mt-4 max-w-md"
              />
            )}
            {enrollment && enrollment.overallProgress >= 100 && (
              <Link
                to={`/certificates/${courseId}`}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
              >
                <Award className="h-4 w-4" /> Get Certificate
              </Link>
            )}
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {modules?.map((module) => {
          const isExpanded = expandedModules.has(module._id);
          const progress = getModuleProgress(module._id);
          const submodules = moduleSubmodules[module._id] || [];
          const isLoadingSubs = loadingSubmodules.has(module._id);
          const completedCount = progress?.completedSubmodules.length || 0;
          const totalSubs = module.submoduleCount || submodules.length;

          return (
            <Card key={module._id} noPadding>
              <button
                onClick={() => toggleModule(module._id)}
                className="flex w-full cursor-pointer items-center justify-between p-5 text-left transition-colors hover:bg-slate-800/60"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  )}
                  <div>
                    <h3 className="font-semibold text-white">{module.title}</h3>
                    {module.description && (
                      <p className="mt-0.5 text-sm text-slate-400">{module.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {progress && (
                    <Badge
                      variant={
                        progress.status === "COMPLETED"
                          ? "success"
                          : progress.status === "IN_PROGRESS"
                          ? "warning"
                          : "gray"
                      }
                    >
                      {progress.status.replace("_", " ")}
                    </Badge>
                  )}
                  <span className="text-sm text-slate-400">
                    {completedCount}/{totalSubs}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="space-y-2 border-t border-slate-800/80 px-5 py-4">
                  {isLoadingSubs ? (
                    <div className="py-4">
                      <Spinner size="sm" />
                    </div>
                  ) : submodules.length === 0 ? (
                    <p className="py-2 text-sm text-slate-500">No submodules in this module</p>
                  ) : (
                    submodules.map((sub) => {
                      const isCompleted =
                        progress?.completedSubmodules.includes(sub._id) || false;
                      const isUpdating = updatingProgress === sub._id;

                      return (
                        <button
                          key={sub._id}
                          onClick={() =>
                            handleToggleSubmodule(module._id, sub._id, isCompleted)
                          }
                          disabled={isUpdating}
                          className={clsx(
                            "flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 text-left transition-colors",
                            isCompleted
                              ? "bg-emerald-500/20"
                              : "hover:bg-slate-800/60"
                          )}
                        >
                          {isUpdating ? (
                            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                          ) : isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <Circle className="h-5 w-5 text-slate-500" />
                          )}
                          <div>
                            <p
                              className={clsx(
                                "text-sm font-medium",
                                isCompleted ? "text-emerald-300" : "text-white"
                              )}
                            >
                              {sub.title}
                            </p>
                            {sub.description && (
                              <p className="mt-0.5 text-xs text-slate-500">{sub.description}</p>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}

                  {module.test && (
                    <div className="border-t border-slate-800/80 pt-3">
                      <Link to={`/tests/${module.test._id}/take`}>
                        <Button size="sm" leftIcon={<FileQuestion className="h-4 w-4" />}>
                          Take Test
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

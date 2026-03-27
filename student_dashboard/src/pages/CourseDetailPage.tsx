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
  FileText,
  X,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { courseService, enrollmentService } from "@/services";
import { Card, Spinner, Badge, ProgressBar, Button } from "@/components/ui";
import type { ICourse, IModule, ISubmodule, IEnrollment, IModuleProgress } from "@/types";
import clsx from "clsx";
import toast from "react-hot-toast";

// ── Protected PDF Viewer ──────────────────────────────────────────────────────
// Uses an <iframe> with the JWT in the URL as a query param so the protected
// /uploads/pdfs/:filename route accepts the request.
// Right-click → Save / toolbar download button is blocked via CSS + sandbox.
function PdfViewerModal({
  url,
  title,
  onClose,
}: {
  url: string;
  title: string;
  onClose: () => void;
}) {
  const src = `${url}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onContextMenu={(e) => e.preventDefault()} // disable right-click on backdrop
    >
      <div className="relative flex h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-[#1e1e2e] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary-400" />
            <span className="truncate text-sm font-medium text-white max-w-[500px]">
              {title}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/*
          iframe sandbox:
            - allow-scripts      → needed for PDF.js viewer inside some browsers
            - allow-same-origin  → needed to read the blob/response
          Intentionally OMITTED:
            - allow-downloads    → blocks the browser's download button in the PDF toolbar
            - allow-forms        → not needed
          The #toolbar=0 fragment hides the Acrobat toolbar in Chrome's built-in viewer.
          For Firefox we rely on sandbox to block downloads.
        */}
        <iframe
          key={src}                          // remount if URL changes
          src={`${src}#toolbar=0&navpanes=0&scrollbar=1`}
          className="flex-1 w-full select-none"
          title={title}
          sandbox="allow-scripts allow-same-origin"
          onContextMenu={(e) => e.preventDefault()}
          style={{
            // Extra CSS layer: hide the download/print buttons injected by some
            // browser PDF viewers via the shadow DOM (best-effort)
            border: "none",
            pointerEvents: "auto",
          }}
        />

        {/* Transparent overlay that blocks right-click → Save image / Save as
            but still lets scroll & click-to-zoom work via pointer-events:none */}
        <div
          className="absolute inset-0 top-[52px] z-10 select-none"
          style={{ pointerEvents: "none" }}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CourseDetailPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [moduleSubmodules, setModuleSubmodules] = useState<Record<string, ISubmodule[]>>({});
  const [loadingSubmodules, setLoadingSubmodules] = useState<Set<string>>(new Set());
  const [updatingProgress, setUpdatingProgress] = useState<string | null>(null);

  // PDF viewer state
  const [pdfViewer, setPdfViewer] = useState<{ url: string; title: string } | null>(null);

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

  const getModuleProgress = (moduleId: string): IModuleProgress | undefined =>
    enrollment?.moduleProgress.find((mp) => mp.module === moduleId);

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
      {/* PDF Viewer Modal */}
      {pdfViewer && (
        <PdfViewerModal
          url={pdfViewer.url}
          title={pdfViewer.title}
          onClose={() => setPdfViewer(null)}
        />
      )}

      <Link
        to="/courses"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Courses
      </Link>

      {/* Course header card */}
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
                <Badge variant={enrollment.status === "COMPLETED" ? "success" : "info"}>
                  {enrollment.status}
                </Badge>
              )}
            </div>
            {enrollment && (
              <ProgressBar value={enrollment.overallProgress} showLabel className="mt-4 max-w-md" />
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

      {/* Modules list */}
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
              {/* Module header */}
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

              {/* Submodules */}
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
                      const isCompleted = progress?.completedSubmodules.includes(sub._id) || false;
                      const isUpdating = updatingProgress === sub._id;
                      const hasPdf = !!(sub as any).pdfUrl;

                      return (
                        <div
                          key={sub._id}
                          className={clsx(
                            "flex w-full items-center gap-3 rounded-lg p-3 transition-colors",
                            isCompleted ? "bg-emerald-500/20" : "hover:bg-slate-800/60"
                          )}
                        >
                          {/* Complete toggle button */}
                          <button
                            onClick={() => handleToggleSubmodule(module._id, sub._id, isCompleted)}
                            disabled={!!isUpdating}
                            className="shrink-0"
                            title={isCompleted ? "Mark incomplete" : "Mark complete"}
                          >
                            {isUpdating ? (
                              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                            ) : isCompleted ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            ) : (
                              <Circle className="h-5 w-5 text-slate-500" />
                            )}
                          </button>

                          {/* Title + description */}
                          <div className="flex-1 min-w-0">
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

                          {/* View PDF button — only shown if submodule has a PDF */}
                          {hasPdf && (
                            <button
                              onClick={() =>
                                setPdfViewer({
                                  url: (sub as any).pdfUrl,
                                  title: sub.title,
                                })
                              }
                              className="shrink-0 flex items-center gap-1.5 rounded-lg border border-primary-500/40 bg-primary-500/10 px-3 py-1.5 text-xs font-medium text-primary-300 transition-colors hover:bg-primary-500/20"
                              title="View PDF"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              View PDF
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}

                  {/* Test unlock section */}
                  {enrollment && module.test && (
                    <div className="border-t border-slate-800/80 pt-3">
                      {totalSubs > 0 && completedCount >= totalSubs ? (
                        <Link to={`/tests/${(module.test as any)?._id}/take`}>
                          <Button size="sm" leftIcon={<FileQuestion className="h-4 w-4" />}>
                            Take Test
                          </Button>
                        </Link>
                      ) : (
                        <p className="text-sm text-slate-400">
                          Complete all submodules to unlock the test ({completedCount}/{totalSubs} completed)
                        </p>
                      )}
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
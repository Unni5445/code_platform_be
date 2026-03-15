import { useCallback, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  ArrowRight,
  Search,
  CheckCircle,
  Calendar,
  Clock,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { courseService, enrollmentService } from "@/services";
import type { IBatch } from "@/services/course.service";
import { Card, Spinner, EmptyState, Badge, Modal, Button } from "@/components/ui";
import type { ICourse, IEnrollment } from "@/types";
import toast from "react-hot-toast";

interface PaginatedCourses {
  courses: ICourse[];
  total: number;
  page: number;
  limit: number;
}

export default function AllCoursesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchModalCourseId, setBatchModalCourseId] = useState("");
  const [batches, setBatches] = useState<IBatch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState("");

  const fetchCourses = useCallback(
    () => courseService.getCourses({ search: debouncedSearch }),
    [debouncedSearch]
  );

  const { data, loading } = useApi<PaginatedCourses>(fetchCourses, [debouncedSearch]);
  const courses = data?.courses ?? [];

  useEffect(() => {
    enrollmentService
      .getMyEnrollments()
      .then((res) => {
        const ids = new Set<string>();
        (res.data.data as IEnrollment[]).forEach((e) => {
          const courseId = typeof e.course === "object" ? e.course._id : e.course;
          ids.add(courseId);
        });
        setEnrolledCourseIds(ids);
      })
      .catch(() => {});
  }, []);

  const openBatchPicker = async (courseId: string) => {
    setBatchModalCourseId(courseId);
    setSelectedBatchId("");
    setBatches([]);
    setBatchModalOpen(true);
    setBatchesLoading(true);
    try {
      const res = await courseService.getCourseBatches(courseId);
      setBatches(res.data.data as IBatch[]);
    } catch {
      setBatches([]);
    }
    setBatchesLoading(false);
  };

  const handleEnroll = async () => {
    if (!selectedBatchId || !batchModalCourseId) return;
    setEnrollingId(batchModalCourseId);
    try {
      await enrollmentService.selfEnroll(batchModalCourseId, selectedBatchId);
      setEnrolledCourseIds((prev) => new Set(prev).add(batchModalCourseId));
      setBatchModalOpen(false);
      toast.success("Enrolled successfully!");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to enroll";
      toast.error(msg);
    }
    setEnrollingId(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    const timer = (window as Window & { __courseSearchTimer?: number }).__courseSearchTimer;
    if (timer) clearTimeout(timer);
    (window as Window & { __courseSearchTimer?: number }).__courseSearchTimer = window.setTimeout(
      () => setDebouncedSearch(value),
      400
    );
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">All Courses</h1>
          {!loading && (
            <p className="mt-1 text-sm text-slate-400">
              {data?.total ?? 0} course{(data?.total ?? 0) !== 1 ? "s" : ""} available
            </p>
          )}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search courses..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 py-2 pl-9 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && courses.length === 0 && (
        <Card>
          <EmptyState
            icon={<BookOpen className="h-10 w-10 text-primary-400" />}
            title="No Courses Found"
            description={
              debouncedSearch
                ? `No courses match "${debouncedSearch}". Try a different search.`
                : "No courses have been created yet."
            }
          />
        </Card>
      )}

      {!loading && courses.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course._id);

            return (
              <Card
                key={course._id}
                className="flex flex-col transition-shadow duration-200 hover:shadow-lg"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="rounded-lg bg-primary-500/20 p-2">
                    <BookOpen className="h-5 w-5 text-primary-300" />
                  </div>
                  <div className="flex items-center gap-2">
                    {isEnrolled && (
                      <Badge variant="success">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Enrolled
                        </span>
                      </Badge>
                    )}
                    {course.status && !isEnrolled && (
                      <Badge
                        variant={
                          course.status === "PUBLISHED"
                            ? "success"
                            : course.status === "DRAFT"
                            ? "gray"
                            : "primary"
                        }
                      >
                        {course.status}
                      </Badge>
                    )}
                  </div>
                </div>

                <h3 className="mb-1 text-lg font-semibold text-white">{course.title}</h3>

                {course.description && (
                  <p className="mb-4 line-clamp-2 text-sm text-slate-400">{course.description}</p>
                )}

                <div className="mt-auto flex items-center justify-between border-t border-slate-800/80 pt-3 text-sm">
                  {isEnrolled ? (
                    <Link
                      to={`/courses/${course._id}`}
                      className="flex items-center gap-1 font-medium text-primary-400 hover:text-primary-300"
                    >
                      Continue Learning <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <>
                      <Link
                        to={`/courses/${course._id}`}
                        className="flex items-center gap-1 font-medium text-slate-400 hover:text-white"
                      >
                        View Details <ArrowRight className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => openBatchPicker(course._id)}
                        className="rounded-lg bg-primary-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-400 transition-colors cursor-pointer"
                      >
                        Enroll
                      </button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        title="Select a Batch"
        footer={
          <>
            <Button variant="ghost" onClick={() => setBatchModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEnroll}
              disabled={!selectedBatchId}
              isLoading={enrollingId === batchModalCourseId}
            >
              Enroll
            </Button>
          </>
        }
      >
        {batchesLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : batches.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-400">No upcoming batches available for this course.</p>
            <p className="mt-1 text-xs text-slate-500">
              Please contact your admin to create a batch.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="mb-3 text-sm text-slate-400">Choose a batch to enroll in:</p>
            {batches.map((batch) => {
              const isSelected = selectedBatchId === batch._id;
              const orgName =
                typeof batch.organisation === "object" ? batch.organisation.name : "";
              return (
                <div
                  key={batch._id}
                  onClick={() => setSelectedBatchId(batch._id)}
                  className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all ${
                    isSelected
                      ? "border-primary-500 bg-primary-500/20"
                      : "border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/60"
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected ? "border-primary-500" : "border-slate-600"
                    }`}
                  >
                    {isSelected && <div className="h-3 w-3 rounded-full bg-primary-500" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{batch.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3">
                      {orgName && <span className="text-xs text-slate-500">{orgName}</span>}
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="h-3 w-3" /> {batch.duration}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar className="h-3 w-3" />{" "}
                        {formatDate(batch.startDate)} – {formatDate(batch.endDate)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}

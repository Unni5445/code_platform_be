import { useCallback, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ArrowRight, Search, CheckCircle, Loader2, Calendar, Clock } from "lucide-react";
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

  // Batch picker state
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

  // Fetch student's enrollments to know which courses they're already in
  useEffect(() => {
    enrollmentService.getMyEnrollments().then((res) => {
      const ids = new Set<string>();
      (res.data.data as IEnrollment[]).forEach((e) => {
        const courseId = typeof e.course === "object" ? e.course._id : e.course;
        ids.add(courseId);
      });
      setEnrolledCourseIds(ids);
    }).catch(() => {});
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
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to enroll";
      toast.error(msg);
    }
    setEnrollingId(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    clearTimeout((window as any).__courseSearchTimer);
    (window as any).__courseSearchTimer = setTimeout(() => {
      setDebouncedSearch(value);
    }, 400);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">All Courses</h1>
          {!loading && (
            <p className="text-sm text-gray-500 mt-1">
              {data?.total ?? 0} course{(data?.total ?? 0) !== 1 ? "s" : ""} available
            </p>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search courses..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      )}

      {/* Empty */}
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

      {/* Grid */}
      {!loading && courses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course._id);

            return (
              <Card
                key={course._id}
                className="hover:shadow-card-hover transition-shadow duration-200 flex flex-col"
              >
                {/* Icon + status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <BookOpen className="h-5 w-5 text-primary-600" />
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

                {/* Title */}
                <h3 className="font-semibold text-gray-900 text-lg mb-1">
                  {course.title}
                </h3>

                {/* Description */}
                {course.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                    {course.description}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-sm mt-auto pt-3 border-t border-gray-100">
                  {isEnrolled ? (
                    <Link
                      to={`/courses/${course._id}`}
                      className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                    >
                      Continue Learning <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <>
                      <Link
                        to={`/courses/${course._id}`}
                        className="text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1"
                      >
                        View Details <ArrowRight className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => openBatchPicker(course._id)}
                        className="px-4 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors cursor-pointer"
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

      {/* Batch Selection Modal */}
      <Modal
        isOpen={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        title="Select a Batch"
        footer={
          <>
            <Button variant="ghost" onClick={() => setBatchModalOpen(false)}>Cancel</Button>
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
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : batches.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-gray-500">No upcoming batches available for this course.</p>
            <p className="text-xs text-gray-400 mt-1">Please contact your admin to create a batch.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 mb-3">Choose a batch to enroll in:</p>
            {batches.map((batch) => {
              const isSelected = selectedBatchId === batch._id;
              const orgName = typeof batch.organisation === "object" ? batch.organisation.name : "";
              return (
                <div
                  key={batch._id}
                  onClick={() => setSelectedBatchId(batch._id)}
                  className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border-2 ${
                    isSelected
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? "border-primary-500" : "border-gray-300"
                  }`}>
                    {isSelected && <div className="w-3 h-3 rounded-full bg-primary-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{batch.name}</p>
                    <div className="flex items-center flex-wrap gap-3 mt-1">
                      {orgName && (
                        <span className="text-xs text-gray-500">{orgName}</span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" /> {batch.duration}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" /> {formatDate(batch.startDate)} – {formatDate(batch.endDate)}
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

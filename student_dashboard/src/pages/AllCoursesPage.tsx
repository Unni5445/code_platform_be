import { useCallback, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  ArrowRight,
  Search,
  CheckCircle,
  Calendar,
  Clock,
  Zap,
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
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white border border-slate-200 p-8 rounded-3xl shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
           <BookOpen className="h-32 w-32 text-primary-900 rotate-12" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Academic Catalog</h1>
          {!loading && (
            <p className="mt-1 text-sm font-bold text-slate-400 uppercase tracking-widest">
              Deployment Terminal: {data?.total ?? 0} Modules Available
            </p>
          )}
        </div>

        <div className="relative w-full md:w-80 z-10">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search learning modules..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/5 transition-all shadow-inner"
          />
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-32 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && courses.length === 0 && (
        <Card className="bg-white border-slate-200 shadow-xl py-20 text-center">
          <EmptyState
            icon={<BookOpen className="h-16 w-16 text-slate-200 mx-auto mb-4" />}
            title="Registry Empty"
            description={
              debouncedSearch
                ? `No intelligence modules match "${debouncedSearch}". Refine your search query.`
                : "No course data has been synchronized yet."
            }
          />
        </Card>
      )}

      {!loading && courses.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course._id);

            return (
              <Card
                key={course._id}
                className="flex flex-col h-full bg-white border-slate-200 hover:border-primary-300 hover:shadow-2xl transition-all duration-300 p-6 rounded-3xl group/card"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-2xl bg-primary-50 border border-primary-100 p-3 shadow-inner group-hover/card:scale-110 group-hover/card:bg-primary-100 transition-transform">
                    <BookOpen className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    {isEnrolled && (
                      <Badge variant="success" className="font-black text-[10px] uppercase tracking-widest px-3 py-1 border-emerald-100 shadow-sm">
                        <span className="flex items-center gap-1.5 ">
                          <CheckCircle className="h-3.5 w-3.5" /> Enrolled
                        </span>
                      </Badge>
                    )}
                    {course.status && !isEnrolled && (
                      <Badge
                        className="font-black text-[10px] uppercase tracking-widest px-3 py-1 border-slate-100 shadow-sm"
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

                <h3 className="mb-2 text-xl font-black text-slate-900 tracking-tight group-hover/card:text-primary-600 transition-colors line-clamp-1">{course.title}</h3>

                {course.description && (
                  <p className="mb-6 line-clamp-2 text-sm font-medium text-slate-500 leading-relaxed">{course.description}</p>
                )}

                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                  {isEnrolled ? (
                    <Link
                      to={`/courses/${course._id}`}
                      className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-primary-600 hover:text-primary-700 transition-colors group"
                    >
                      Continue Training <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ) : (
                    <>
                      <Link
                        to={`/courses/${course._id}`}
                        className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                      >
                        Module Specs <ArrowRight className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => openBatchPicker(course._id)}
                        className="rounded-xl bg-slate-900 px-6 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-black hover:shadow-lg active:scale-95 transition-all cursor-pointer shadow-md"
                      >
                        Deploy
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
        title="Sync Learning Batch"
        footer={
          <div className="flex gap-3 w-full sm:justify-end">
            <Button variant="ghost" onClick={() => setBatchModalOpen(false)} className="font-bold rounded-xl px-6">
              Abort
            </Button>
            <Button
              onClick={handleEnroll}
              disabled={!selectedBatchId}
              isLoading={enrollingId === batchModalCourseId}
              className="bg-primary-600 hover:bg-primary-700 border-none text-white font-bold px-8 rounded-xl shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
            >
              Initiate Enrollment
            </Button>
          </div>
        }
      >
        {batchesLoading ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : batches.length === 0 ? (
          <div className="py-20 text-center bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
            <Clock className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-lg font-black text-slate-900 tracking-tight">No Active Batches</p>
            <p className="mt-1 text-sm font-medium text-slate-500 max-w-xs mx-auto">
              Deployment scheduled. Please coordinate with command for batch initialization.
            </p>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <p className="mb-4 text-xs font-black text-slate-400 uppercase tracking-widest">Available Sectors:</p>
            {batches.map((batch) => {
              const isSelected = selectedBatchId === batch._id;
              const orgName =
                typeof batch.organisation === "object" ? batch.organisation.name : "";
              return (
                <div
                  key={batch._id}
                  onClick={() => setSelectedBatchId(batch._id)}
                  className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-5 transition-all relative overflow-hidden group ${
                    isSelected
                      ? "border-primary-500 bg-primary-50/50 shadow-lg"
                      : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50 shadow-sm"
                  }`}
                >
                   {isSelected && <div className="absolute top-0 right-0 p-4 opacity-5"><Zap className="h-12 w-12 text-primary-900" /></div>}
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      isSelected ? "border-primary-500 bg-primary-500 shadow-inner" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    {isSelected && <div className="h-2 w-2 rounded-full bg-white shadow-sm" />}
                  </div>
                  <div className="min-w-0 flex-1 relative z-10">
                    <p className={`text-base font-black tracking-tight ${isSelected ? 'text-primary-900' : 'text-slate-900'}`}>{batch.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-4">
                      {orgName && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{orgName}</span>}
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Clock className="h-3.5 w-3.5 text-primary-500" /> {batch.duration}
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Calendar className="h-3.5 w-3.5 text-primary-500" />{" "}
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

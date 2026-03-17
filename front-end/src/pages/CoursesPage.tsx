import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Users, BookOpen, LayoutGrid, List, Eye, Globe } from "lucide-react";
import { courseService, organisationService } from "@/services";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks";
import { Button, Card, Badge, Modal, Input, Select, ConfirmDialog, EmptyState, SearchInput, Spinner, Pagination } from "@/components/ui";
import { useModal } from "@/hooks";
import type { ICourse } from "@/types";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

const PAGE_SIZE = 9;

export default function CoursesPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN";
  const navigate = useNavigate();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState<ICourse | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<ICourse | null>(null);

  const addModal = useModal();
  const editModal = useModal();
  const deleteModal = useModal();

  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formIsGlobal, setFormIsGlobal] = useState(false);
  const [formOrg, setFormOrg] = useState("");

  const debouncedSearch = useDebounce(search, 300);

  const fetchCourses = useCallback(
    () => courseService.getCourses({ page: currentPage, limit: PAGE_SIZE, search: debouncedSearch || undefined }),
    [currentPage, debouncedSearch]
  );

  const fetchOrgs = useCallback(() => organisationService.getOrganisations(), []);

  const { data, loading, refetch } = useApi(fetchCourses, [currentPage, debouncedSearch]);
  const { data: orgs } = useApi(fetchOrgs, []);

  const courses = data?.courses ?? [];
  const totalPages = data?.totalPages ?? 1;
  const orgList = orgs ?? [];

  const openEdit = (course: ICourse) => {
    setSelectedCourse(course);
    setFormTitle(course.title);
    setFormDesc(course.description || "");
    setFormIsGlobal(course.isGlobal);
    setFormOrg(course.organisation || "");
    editModal.open();
  };

  const openAdd = () => {
    setFormTitle("");
    setFormDesc("");
    setFormIsGlobal(false);
    setFormOrg("");
    addModal.open();
  };

  const handleCreate = async () => {
    try {
      await courseService.createCourse({ title: formTitle, description: formDesc, isGlobal: formIsGlobal, ...(formOrg && !formIsGlobal ? { organisation: formOrg } : {}) });
      addModal.close();
      toast.success("Course created successfully");
      refetch();
    } catch {
      toast.error("Failed to create course");
    }
  };

  const handleUpdate = async () => {
    if (!selectedCourse) return;
    try {
      await courseService.updateCourse(selectedCourse._id, { title: formTitle, description: formDesc, isGlobal: formIsGlobal, organisation: formIsGlobal ? undefined : formOrg || undefined });
      editModal.close();
      setSelectedCourse(null);
      toast.success("Course updated successfully");
      refetch();
    } catch {
      toast.error("Failed to update course");
    }
  };

  const handleDelete = async () => {
    if (!courseToDelete) return;
    try {
      await courseService.deleteCourse(courseToDelete._id);
      deleteModal.close();
      setCourseToDelete(null);
      toast.success("Course deleted successfully");
      refetch();
    } catch {
      toast.error("Failed to delete course");
    }
  };

  const getStudentCount = (course: ICourse) => course.enrolledCount ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-72">
            <SearchInput placeholder="Search courses..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
          </div>
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView("grid")}
              className={`p-2 rounded-md transition-colors cursor-pointer ${view === "grid" ? "bg-white shadow-sm text-primary-600" : "text-gray-400 hover:text-gray-600"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2 rounded-md transition-colors cursor-pointer ${view === "list" ? "bg-white shadow-sm text-primary-600" : "text-gray-400 hover:text-gray-600"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
        {!isAdmin && <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openAdd}>Add Course</Button>}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : courses.length === 0 ? (
        <EmptyState title="No courses found" description="Create your first course to get started." action={<Button onClick={openAdd}>Create Course</Button>} />
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map((course) => (
            <Card key={course._id} className="hover:shadow-card-hover transition-shadow duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 bg-primary-100 rounded-xl">
                  <BookOpen className="h-5 w-5 text-primary-600" />
                </div>
                {course.isGlobal ? <Badge variant="warning"><Globe className="h-3 w-3 inline mr-1" />Global</Badge> : <Badge variant="success">Org</Badge>}
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1 cursor-pointer hover:text-primary-600 transition-colors" onClick={() => navigate(`/courses/${course._id}`)}>{course.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-4">{course.description}</p>
              <div className="flex items-center justify-between pt-4 border-t border-surface-border">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Users className="h-4 w-4" />
                  {getStudentCount(course)} students
                </div>
                <div className="flex gap-1">
                  <button onClick={() => navigate(`/courses/${course._id}`)} className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer">
                    <Eye className="h-4 w-4" />
                  </button>
                  {!isAdmin && (
                    <>
                      <button onClick={() => openEdit(course)} className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => { setCourseToDelete(course); deleteModal.open(); }} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-surface rounded-xl shadow-card border border-surface-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-secondary border-b border-surface-border">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Course</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Description</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Scope</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Students</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Created</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {courses.map((course) => (
                <tr key={course._id} className="hover:bg-primary-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary-100 rounded-lg">
                        <BookOpen className="h-4 w-4 text-primary-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{course.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-sm text-gray-500 line-clamp-1">{course.description}</span>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    {course.isGlobal ? <Badge variant="warning">Global</Badge> : <Badge variant="gray">Org</Badge>}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="info">{getStudentCount(course)} enrolled</Badge>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="text-sm text-gray-500">{new Date(course.createdAt).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => navigate(`/courses/${course._id}`)} className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer">
                        <Eye className="h-4 w-4" />
                      </button>
                      {!isAdmin && (
                        <>
                          <button onClick={() => openEdit(course)} className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => { setCourseToDelete(course); deleteModal.open(); }} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}

      {/* Add Course Modal */}
      <Modal
        isOpen={addModal.isOpen}
        onClose={addModal.close}
        title="Add New Course"
        footer={
          <>
            <Button variant="ghost" onClick={addModal.close}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!formTitle.trim()}>Create Course</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Course Title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g., React.js Fundamentals" required />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-gray-400 hover:border-gray-400 transition-colors"
              placeholder="Course description..."
            />
          </div>
          {!formIsGlobal && (
            <Select
              label="Organisation"
              value={formOrg}
              onChange={(e) => setFormOrg(e.target.value)}
              options={[
                { value: "", label: "Select Organisation" },
                ...orgList.map((o) => ({ value: o._id, label: o.name })),
              ]}
            />
          )}
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={formIsGlobal} onChange={(e) => { setFormIsGlobal(e.target.checked); if (e.target.checked) setFormOrg(""); }} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <div>
              <span className="text-sm font-medium text-gray-700">Global Course</span>
              <p className="text-xs text-gray-500">Available to all organisations</p>
            </div>
          </label>
        </div>
      </Modal>

      {/* Edit Course Modal */}
      <Modal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        title="Edit Course"
        footer={
          <>
            <Button variant="ghost" onClick={editModal.close}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={!formTitle.trim()}>Update Course</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Course Title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-gray-400 hover:border-gray-400 transition-colors"
            />
          </div>
          {!formIsGlobal && (
            <Select
              label="Organisation"
              value={formOrg}
              onChange={(e) => setFormOrg(e.target.value)}
              options={[
                { value: "", label: "Select Organisation" },
                ...orgList.map((o) => ({ value: o._id, label: o.name })),
              ]}
            />
          )}
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={formIsGlobal} onChange={(e) => { setFormIsGlobal(e.target.checked); if (e.target.checked) setFormOrg(""); }} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <div>
              <span className="text-sm font-medium text-gray-700">Global Course</span>
              <p className="text-xs text-gray-500">Available to all organisations</p>
            </div>
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => { deleteModal.close(); setCourseToDelete(null); }}
        onConfirm={handleDelete}
        title="Delete Course"
        message={`Are you sure you want to delete "${courseToDelete?.title}"? This will remove all associated data.`}
      />
    </div>
  );
}

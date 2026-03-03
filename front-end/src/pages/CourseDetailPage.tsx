import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, Edit, Trash2, ChevronDown, ChevronRight,
  GripVertical, BookOpen, FileText, ClipboardList, HelpCircle,
  UserMinus, Clock, Award,
} from "lucide-react";
import { courseService, moduleService, submoduleService, enrollmentService, testService, questionService } from "@/services";
import { useApi } from "@/hooks/useApi";
import { useModal } from "@/hooks";
import {
  Button, Card, Badge, Modal, Input, Select, ConfirmDialog,
  EmptyState, Spinner, Tabs, SearchInput, Pagination,
} from "@/components/ui";
import { QuestionForm } from "@/components/tests/QuestionForm";
import type { IModule, ISubmodule, IEnrollment, ITest, IQuestion } from "@/types";
import toast from "react-hot-toast";

const ENROLLMENT_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DROPPED", label: "Dropped" },
  { value: "EXPIRED", label: "Expired" },
];

export default function CourseDetailPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("modules");

  // ─── Course fetch ───
  const fetchCourse = useCallback(() => courseService.getCourseById(courseId!), [courseId]);
  const { data: course, loading: courseLoading } = useApi(fetchCourse, [courseId]);

  // ─── Modules fetch ───
  const fetchModules = useCallback(() => moduleService.getModulesByCourse(courseId!), [courseId]);
  const { data: modules, loading: modulesLoading, refetch: refetchModules } = useApi(fetchModules, [courseId]);

  // ─── Enrollments ───
  const [enrollPage, setEnrollPage] = useState(1);
  const [enrollSearch, setEnrollSearch] = useState("");
  const [enrollStatusFilter, setEnrollStatusFilter] = useState("");
  const fetchEnrollments = useCallback(
    () => enrollmentService.getEnrollmentsByCourse(courseId!, { page: enrollPage, limit: 20, status: enrollStatusFilter || undefined, search: enrollSearch || undefined }),
    [courseId, enrollPage, enrollStatusFilter, enrollSearch]
  );
  const { data: enrollData, loading: enrollLoading, refetch: refetchEnrollments } = useApi(fetchEnrollments, [courseId, enrollPage, enrollStatusFilter, enrollSearch]);

  // ─── Module State ───
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [moduleSubmodules, setModuleSubmodules] = useState<Record<string, ISubmodule[]>>({});
  const [loadingSubmodules, setLoadingSubmodules] = useState<Set<string>>(new Set());

  // ─── Module Test & Questions State ───
  const [moduleTests, setModuleTests] = useState<Record<string, ITest | null>>({});
  const [moduleQuestions, setModuleQuestions] = useState<Record<string, IQuestion[]>>({});
  const [loadingTests, setLoadingTests] = useState<Set<string>>(new Set());

  // ─── Module Form ───
  const addModuleModal = useModal();
  const editModuleModal = useModal();
  const deleteModuleModal = useModal();
  const [moduleForm, setModuleForm] = useState({ title: "", description: "" });
  const [selectedModule, setSelectedModule] = useState<IModule | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<IModule | null>(null);

  // ─── Submodule Form ───
  const addSubmoduleModal = useModal();
  const editSubmoduleModal = useModal();
  const deleteSubmoduleModal = useModal();
  const [subForm, setSubForm] = useState({ title: "", description: "" });
  const [parentModuleId, setParentModuleId] = useState("");
  const [selectedSubmodule, setSelectedSubmodule] = useState<ISubmodule | null>(null);
  const [subToDelete, setSubToDelete] = useState<ISubmodule | null>(null);

  // ─── Test Form ───
  const addTestModal = useModal();
  const editTestModal = useModal();
  const [testForm, setTestForm] = useState({ title: "", description: "", duration: "", isActive: true });
  const [testModuleId, setTestModuleId] = useState("");
  const [editingTest, setEditingTest] = useState<ITest | null>(null);

  // ─── Question Form ───
  const addQuestionModal = useModal();
  const editQuestionModal = useModal();
  const deleteQuestionModal = useModal();
  const [questionModuleId, setQuestionModuleId] = useState("");
  const [editingQuestion, setEditingQuestion] = useState<IQuestion | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<{ question: IQuestion; moduleId: string } | null>(null);
  const [savingQuestion, setSavingQuestion] = useState(false);

  // ─── Enrollment modals ───
  const deleteEnrollModal = useModal();
  const [enrollToDelete, setEnrollToDelete] = useState<IEnrollment | null>(null);

  // ─── Toggle expand module ───
  const toggleModule = async (moduleId: string) => {
    const next = new Set(expandedModules);
    if (next.has(moduleId)) {
      next.delete(moduleId);
    } else {
      next.add(moduleId);
      // Load submodules
      if (!moduleSubmodules[moduleId]) {
        setLoadingSubmodules((prev) => new Set(prev).add(moduleId));
        try {
          const res = await submoduleService.getSubmodulesByModule(moduleId);
          setModuleSubmodules((prev) => ({ ...prev, [moduleId]: res.data.data }));
        } catch { /* empty */ }
        setLoadingSubmodules((prev) => { const s = new Set(prev); s.delete(moduleId); return s; });
      }
      // Load test & questions for this module
      if (!(moduleId in moduleTests)) {
        fetchModuleTestAndQuestions(moduleId);
      }
    }
    setExpandedModules(next);
  };

  const fetchModuleTestAndQuestions = async (moduleId: string) => {
    setLoadingTests((prev) => new Set(prev).add(moduleId));
    try {
      const testRes = await testService.getTests({ course: courseId, module: moduleId, limit: 1 });
      const tests = testRes.data.data.tests;
      const test = tests.length > 0 ? tests[0] : null;
      setModuleTests((prev) => ({ ...prev, [moduleId]: test }));

      // Fetch questions for this module
      const qRes = await questionService.getQuestions({ course: courseId, module: moduleId, limit: 100 });
      setModuleQuestions((prev) => ({ ...prev, [moduleId]: qRes.data.data.questions }));
    } catch {
      setModuleTests((prev) => ({ ...prev, [moduleId]: null }));
      setModuleQuestions((prev) => ({ ...prev, [moduleId]: [] }));
    }
    setLoadingTests((prev) => { const s = new Set(prev); s.delete(moduleId); return s; });
  };

  const refreshSubmodules = async (moduleId: string) => {
    try {
      const res = await submoduleService.getSubmodulesByModule(moduleId);
      setModuleSubmodules((prev) => ({ ...prev, [moduleId]: res.data.data }));
    } catch { /* empty */ }
  };

  // ─── Module CRUD ───
  const handleCreateModule = async () => {
    try {
      await moduleService.createModule({ title: moduleForm.title, description: moduleForm.description, course: courseId });
      addModuleModal.close();
      setModuleForm({ title: "", description: "" });
      toast.success("Module created");
      refetchModules();
    } catch { toast.error("Failed to create module"); }
  };

  const openEditModule = (mod: IModule) => {
    setSelectedModule(mod);
    setModuleForm({ title: mod.title, description: mod.description || "" });
    editModuleModal.open();
  };

  const handleUpdateModule = async () => {
    if (!selectedModule) return;
    try {
      await moduleService.updateModule(selectedModule._id, { title: moduleForm.title, description: moduleForm.description });
      editModuleModal.close();
      toast.success("Module updated");
      refetchModules();
    } catch { toast.error("Failed to update module"); }
  };

  const handleDeleteModule = async () => {
    if (!moduleToDelete) return;
    try {
      await moduleService.deleteModule(moduleToDelete._id);
      deleteModuleModal.close();
      setModuleToDelete(null);
      toast.success("Module deleted");
      refetchModules();
    } catch { toast.error("Failed to delete module"); }
  };

  // ─── Submodule CRUD ───
  const openAddSubmodule = (moduleId: string) => {
    setParentModuleId(moduleId);
    setSubForm({ title: "", description: "" });
    addSubmoduleModal.open();
  };

  const handleCreateSubmodule = async () => {
    try {
      await submoduleService.createSubmodule({
        title: subForm.title,
        description: subForm.description,
        module: parentModuleId,
      });
      addSubmoduleModal.close();
      toast.success("Submodule created");
      refreshSubmodules(parentModuleId);
      refetchModules();
    } catch { toast.error("Failed to create submodule"); }
  };

  const openEditSubmodule = (sub: ISubmodule) => {
    setSelectedSubmodule(sub);
    setParentModuleId(sub.module);
    setSubForm({ title: sub.title, description: sub.description || "" });
    editSubmoduleModal.open();
  };

  const handleUpdateSubmodule = async () => {
    if (!selectedSubmodule) return;
    try {
      await submoduleService.updateSubmodule(selectedSubmodule._id, {
        title: subForm.title,
        description: subForm.description,
      });
      editSubmoduleModal.close();
      toast.success("Submodule updated");
      refreshSubmodules(parentModuleId);
    } catch { toast.error("Failed to update submodule"); }
  };

  const handleDeleteSubmodule = async () => {
    if (!subToDelete) return;
    try {
      await submoduleService.deleteSubmodule(subToDelete._id);
      deleteSubmoduleModal.close();
      toast.success("Submodule deleted");
      refreshSubmodules(subToDelete.module);
      refetchModules();
      setSubToDelete(null);
    } catch { toast.error("Failed to delete submodule"); }
  };

  // ─── Test CRUD ───
  const openCreateTest = (moduleId: string) => {
    setTestModuleId(moduleId);
    setTestForm({ title: "", description: "", duration: "60", isActive: true });
    addTestModal.open();
  };

  const handleCreateTest = async () => {
    try {
      await testService.createTest({
        title: testForm.title,
        description: testForm.description || undefined,
        course: courseId,
        module: testModuleId,
        duration: Number(testForm.duration) || 60,
        isActive: testForm.isActive,
      });
      addTestModal.close();
      toast.success("Test created");
      fetchModuleTestAndQuestions(testModuleId);
      refetchModules();
    } catch { toast.error("Failed to create test"); }
  };

  const openEditTest = (test: ITest, moduleId: string) => {
    setEditingTest(test);
    setTestModuleId(moduleId);
    setTestForm({
      title: test.title,
      description: test.description || "",
      duration: test.duration?.toString() || "60",
      isActive: test.isActive,
    });
    editTestModal.open();
  };

  const handleUpdateTest = async () => {
    if (!editingTest) return;
    try {
      await testService.updateTest(editingTest._id, {
        title: testForm.title,
        description: testForm.description || undefined,
        duration: Number(testForm.duration) || 60,
        isActive: testForm.isActive,
      });
      editTestModal.close();
      toast.success("Test updated");
      fetchModuleTestAndQuestions(testModuleId);
    } catch { toast.error("Failed to update test"); }
  };

  // ─── Question CRUD ───
  const openAddQuestion = (moduleId: string) => {
    setQuestionModuleId(moduleId);
    setEditingQuestion(null);
    addQuestionModal.open();
  };

  const handleCreateQuestion = async (data: Partial<IQuestion>) => {
    setSavingQuestion(true);
    try {
      await questionService.createQuestion({
        ...data,
        course: courseId,
        module: questionModuleId,
      });
      addQuestionModal.close();
      toast.success("Question created");
      fetchModuleTestAndQuestions(questionModuleId);
    } catch { toast.error("Failed to create question"); }
    setSavingQuestion(false);
  };

  const openEditQuestion = (question: IQuestion, moduleId: string) => {
    setQuestionModuleId(moduleId);
    setEditingQuestion(question);
    editQuestionModal.open();
  };

  const handleUpdateQuestion = async (data: Partial<IQuestion>) => {
    if (!editingQuestion) return;
    setSavingQuestion(true);
    try {
      await questionService.updateQuestion(editingQuestion._id, data);
      editQuestionModal.close();
      toast.success("Question updated");
      fetchModuleTestAndQuestions(questionModuleId);
    } catch { toast.error("Failed to update question"); }
    setSavingQuestion(false);
  };

  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;
    try {
      await questionService.deleteQuestion(questionToDelete.question._id);
      deleteQuestionModal.close();
      toast.success("Question deleted");
      fetchModuleTestAndQuestions(questionToDelete.moduleId);
      setQuestionToDelete(null);
    } catch { toast.error("Failed to delete question"); }
  };

  // ─── Enrollment actions ───
  const handleChangeEnrollStatus = async (enrollment: IEnrollment, status: string) => {
    try {
      await enrollmentService.updateEnrollmentStatus(enrollment._id, status);
      toast.success("Status updated");
      refetchEnrollments();
    } catch { toast.error("Failed to update status"); }
  };

  const handleRemoveEnrollment = async () => {
    if (!enrollToDelete) return;
    try {
      await enrollmentService.removeEnrollment(enrollToDelete._id);
      deleteEnrollModal.close();
      setEnrollToDelete(null);
      toast.success("Enrollment removed");
      refetchEnrollments();
    } catch { toast.error("Failed to remove enrollment"); }
  };

  if (courseLoading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  const moduleList = (modules as IModule[]) ?? [];
  const enrollments = enrollData?.enrollments ?? [];
  const enrollTotalPages = enrollData?.totalPages ?? 1;

  // ─── Difficulty badge color ───
  const difficultyVariant = (d: string) => {
    if (d === "Easy") return "success";
    if (d === "Hard") return "danger";
    return "warning";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/courses")} className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{course?.title}</h1>
          {course?.description && <p className="text-sm text-gray-500 mt-1">{course.description}</p>}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: "modules", label: "Modules", count: moduleList.length },
          { id: "enrollments", label: "Enrollments", count: enrollData?.totalEnrollments },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* ═══════════ MODULES TAB ═══════════ */}
      {activeTab === "modules" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setModuleForm({ title: "", description: "" }); addModuleModal.open(); }}>
              Add Module
            </Button>
          </div>

          {modulesLoading ? (
            <div className="flex items-center justify-center h-40"><Spinner size="lg" /></div>
          ) : moduleList.length === 0 ? (
            <EmptyState title="No modules yet" description="Add the first module to structure this course." action={<Button onClick={() => { setModuleForm({ title: "", description: "" }); addModuleModal.open(); }}>Add Module</Button>} />
          ) : (
            <div className="space-y-3">
              {moduleList.map((mod, index) => (
                <Card key={mod._id} className="overflow-hidden">
                  {/* Module header */}
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleModule(mod._id)}>
                    <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0" />
                    {expandedModules.has(mod._id) ? (
                      <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <BookOpen className="h-4 w-4 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-400">Module {index + 1}</span>
                        {mod.test && <Badge variant="info" className="text-[10px]">Has Test</Badge>}
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{mod.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="default">{mod.submoduleCount ?? 0} items</Badge>
                      <button onClick={(e) => { e.stopPropagation(); openEditModule(mod); }} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer">
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setModuleToDelete(mod); deleteModuleModal.open(); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {expandedModules.has(mod._id) && (
                    <div className="mt-3 ml-12 space-y-4 border-t border-surface-border pt-3">
                      {/* ── Submodules Section ── */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Submodules</span>
                        </div>
                        {loadingSubmodules.has(mod._id) ? (
                          <div className="flex justify-center py-4"><Spinner /></div>
                        ) : (moduleSubmodules[mod._id] ?? []).length === 0 ? (
                          <p className="text-xs text-gray-400 py-2">No submodules yet</p>
                        ) : (
                          <div className="space-y-1">
                            {(moduleSubmodules[mod._id] ?? []).map((sub) => (
                              <div key={sub._id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 group">
                                <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-800 truncate">{sub.title}</p>
                                  {sub.description && <p className="text-xs text-gray-400 truncate mt-0.5">{sub.description}</p>}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => openEditSubmodule(sub)} className="p-1 rounded text-gray-400 hover:text-primary-600 cursor-pointer">
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                  <button onClick={() => { setSubToDelete(sub); deleteSubmoduleModal.open(); }} className="p-1 rounded text-gray-400 hover:text-red-600 cursor-pointer">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <button onClick={() => openAddSubmodule(mod._id)} className="flex items-center gap-2 px-3 py-2 text-xs text-primary-600 hover:bg-primary-50 rounded-lg transition-colors cursor-pointer w-full">
                          <Plus className="h-3.5 w-3.5" /> Add Submodule
                        </button>
                      </div>

                      {/* ── Test Section ── */}
                      <div className="border-t border-surface-border pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <ClipboardList className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Module Test</span>
                        </div>
                        {loadingTests.has(mod._id) ? (
                          <div className="flex justify-center py-4"><Spinner /></div>
                        ) : moduleTests[mod._id] ? (
                          <div className="px-3 py-3 rounded-lg bg-blue-50/50 border border-blue-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-blue-100 rounded-lg">
                                  <ClipboardList className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900">{moduleTests[mod._id]!.title}</h4>
                                  <div className="flex items-center gap-3 mt-0.5">
                                    {moduleTests[mod._id]!.duration && (
                                      <span className="flex items-center gap-1 text-xs text-gray-500">
                                        <Clock className="h-3 w-3" /> {moduleTests[mod._id]!.duration} min
                                      </span>
                                    )}
                                    {moduleTests[mod._id]!.totalPoints != null && (
                                      <span className="flex items-center gap-1 text-xs text-gray-500">
                                        <Award className="h-3 w-3" /> {moduleTests[mod._id]!.totalPoints} pts
                                      </span>
                                    )}
                                    <Badge variant={moduleTests[mod._id]!.isActive ? "success" : "gray"} className="text-[10px]">
                                      {moduleTests[mod._id]!.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => openEditTest(moduleTests[mod._id]!, mod._id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => openCreateTest(mod._id)}
                            className="flex items-center gap-2 px-3 py-3 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer w-full border border-dashed border-blue-200"
                          >
                            <Plus className="h-4 w-4" /> Create Test for this Module
                          </button>
                        )}
                      </div>

                      {/* ── Questions Section ── */}
                      <div className="border-t border-surface-border pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Questions ({(moduleQuestions[mod._id] ?? []).length})
                            </span>
                          </div>
                          <button
                            onClick={() => openAddQuestion(mod._id)}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Plus className="h-3 w-3" /> Add
                          </button>
                        </div>
                        {loadingTests.has(mod._id) ? (
                          <div className="flex justify-center py-4"><Spinner /></div>
                        ) : (moduleQuestions[mod._id] ?? []).length === 0 ? (
                          <p className="text-xs text-gray-400 py-2">No questions yet. Add questions to this module's test.</p>
                        ) : (
                          <div className="space-y-1">
                            {(moduleQuestions[mod._id] ?? []).map((q, qIdx) => (
                              <div key={q._id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 group">
                                <span className="text-xs font-mono text-gray-300 w-5 text-right flex-shrink-0">{qIdx + 1}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-800 truncate">{q.title}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant={difficultyVariant(q.difficulty)} className="text-[10px]">{q.difficulty}</Badge>
                                    <span className="text-[10px] text-gray-400 uppercase">{q.type.replace("_", " ")}</span>
                                    <span className="text-[10px] text-gray-400">{q.points} pts</span>
                                  </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => openEditQuestion(q, mod._id)} className="p-1 rounded text-gray-400 hover:text-primary-600 cursor-pointer">
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                  <button onClick={() => { setQuestionToDelete({ question: q, moduleId: mod._id }); deleteQuestionModal.open(); }} className="p-1 rounded text-gray-400 hover:text-red-600 cursor-pointer">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════ ENROLLMENTS TAB ═══════════ */}
      {activeTab === "enrollments" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="w-64">
              <SearchInput placeholder="Search students..." value={enrollSearch} onChange={(e) => { setEnrollSearch(e.target.value); setEnrollPage(1); }} />
            </div>
            <Select
              options={[{ value: "", label: "All Statuses" }, ...ENROLLMENT_STATUS_OPTIONS]}
              value={enrollStatusFilter}
              onChange={(e) => { setEnrollStatusFilter(e.target.value); setEnrollPage(1); }}
            />
          </div>

          {enrollLoading ? (
            <div className="flex items-center justify-center h-40"><Spinner size="lg" /></div>
          ) : enrollments.length === 0 ? (
            <EmptyState title="No enrollments" description="Enroll students into this course to see them here." />
          ) : (
            <div className="bg-surface rounded-xl shadow-card border border-surface-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-secondary border-b border-surface-border">
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Enrolled</th>
                    <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {enrollments.map((enrollment) => {
                    const student = typeof enrollment.student === "object" ? enrollment.student : null;
                    return (
                      <tr key={enrollment._id} className="hover:bg-primary-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{student?.name || "—"}</p>
                            <p className="text-xs text-gray-500">{student?.email || "—"}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={enrollment.status}
                            onChange={(e) => handleChangeEnrollStatus(enrollment, e.target.value)}
                            className="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white cursor-pointer"
                          >
                            {ENROLLMENT_STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[120px]">
                              <div
                                className="h-full bg-primary-500 rounded-full transition-all"
                                style={{ width: `${enrollment.overallProgress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{enrollment.overallProgress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <span className="text-sm text-gray-500">{new Date(enrollment.createdAt).toLocaleDateString()}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => { setEnrollToDelete(enrollment); deleteEnrollModal.open(); }}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Remove enrollment"
                          >
                            <UserMinus className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!enrollLoading && enrollTotalPages > 1 && (
            <div className="flex justify-center">
              <Pagination currentPage={enrollPage} totalPages={enrollTotalPages} onPageChange={setEnrollPage} />
            </div>
          )}
        </div>
      )}

      {/* ═══════════ MODALS ═══════════ */}

      {/* Add Module */}
      <Modal isOpen={addModuleModal.isOpen} onClose={addModuleModal.close} title="Add Module"
        footer={<><Button variant="ghost" onClick={addModuleModal.close}>Cancel</Button><Button onClick={handleCreateModule} disabled={!moduleForm.title.trim()}>Create</Button></>}>
        <div className="space-y-4">
          <Input label="Module Title" value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} placeholder="e.g., Introduction to React" required />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea value={moduleForm.description} onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })} rows={3} className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-gray-400 hover:border-gray-400 transition-colors" placeholder="Module description..." />
          </div>
        </div>
      </Modal>

      {/* Edit Module */}
      <Modal isOpen={editModuleModal.isOpen} onClose={editModuleModal.close} title="Edit Module"
        footer={<><Button variant="ghost" onClick={editModuleModal.close}>Cancel</Button><Button onClick={handleUpdateModule} disabled={!moduleForm.title.trim()}>Update</Button></>}>
        <div className="space-y-4">
          <Input label="Module Title" value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} required />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea value={moduleForm.description} onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })} rows={3} className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-gray-400 hover:border-gray-400 transition-colors" />
          </div>
        </div>
      </Modal>

      {/* Add Submodule */}
      <Modal isOpen={addSubmoduleModal.isOpen} onClose={addSubmoduleModal.close} title="Add Submodule"
        footer={<><Button variant="ghost" onClick={addSubmoduleModal.close}>Cancel</Button><Button onClick={handleCreateSubmodule} disabled={!subForm.title.trim()}>Create</Button></>}>
        <div className="space-y-4">
          <Input label="Title" value={subForm.title} onChange={(e) => setSubForm({ ...subForm, title: e.target.value })} placeholder="e.g., Setting up dev environment" required />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea value={subForm.description} onChange={(e) => setSubForm({ ...subForm, description: e.target.value })} rows={2} className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-gray-400 hover:border-gray-400 transition-colors" placeholder="Optional description..." />
          </div>
        </div>
      </Modal>

      {/* Edit Submodule */}
      <Modal isOpen={editSubmoduleModal.isOpen} onClose={editSubmoduleModal.close} title="Edit Submodule"
        footer={<><Button variant="ghost" onClick={editSubmoduleModal.close}>Cancel</Button><Button onClick={handleUpdateSubmodule} disabled={!subForm.title.trim()}>Update</Button></>}>
        <div className="space-y-4">
          <Input label="Title" value={subForm.title} onChange={(e) => setSubForm({ ...subForm, title: e.target.value })} required />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea value={subForm.description} onChange={(e) => setSubForm({ ...subForm, description: e.target.value })} rows={2} className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-gray-400 hover:border-gray-400 transition-colors" />
          </div>
        </div>
      </Modal>

      {/* Create Test */}
      <Modal isOpen={addTestModal.isOpen} onClose={addTestModal.close} title="Create Module Test"
        footer={<><Button variant="ghost" onClick={addTestModal.close}>Cancel</Button><Button onClick={handleCreateTest} disabled={!testForm.title.trim()}>Create</Button></>}>
        <div className="space-y-4">
          <Input label="Test Title" value={testForm.title} onChange={(e) => setTestForm({ ...testForm, title: e.target.value })} placeholder="e.g., Module 1 Assessment" required />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea value={testForm.description} onChange={(e) => setTestForm({ ...testForm, description: e.target.value })} rows={2} className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-gray-400 hover:border-gray-400 transition-colors" placeholder="Optional description..." />
          </div>
          <Input label="Duration (minutes)" type="number" value={testForm.duration} onChange={(e) => setTestForm({ ...testForm, duration: e.target.value })} placeholder="60" />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={testForm.isActive} onChange={(e) => setTestForm({ ...testForm, isActive: e.target.checked })} className="w-4 h-4 rounded text-primary-600 border-gray-300 focus:ring-primary-500" />
            <span className="text-sm text-gray-700">Active</span>
          </label>
        </div>
      </Modal>

      {/* Edit Test */}
      <Modal isOpen={editTestModal.isOpen} onClose={editTestModal.close} title="Edit Test"
        footer={<><Button variant="ghost" onClick={editTestModal.close}>Cancel</Button><Button onClick={handleUpdateTest} disabled={!testForm.title.trim()}>Update</Button></>}>
        <div className="space-y-4">
          <Input label="Test Title" value={testForm.title} onChange={(e) => setTestForm({ ...testForm, title: e.target.value })} required />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea value={testForm.description} onChange={(e) => setTestForm({ ...testForm, description: e.target.value })} rows={2} className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-gray-400 hover:border-gray-400 transition-colors" />
          </div>
          <Input label="Duration (minutes)" type="number" value={testForm.duration} onChange={(e) => setTestForm({ ...testForm, duration: e.target.value })} placeholder="60" />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={testForm.isActive} onChange={(e) => setTestForm({ ...testForm, isActive: e.target.checked })} className="w-4 h-4 rounded text-primary-600 border-gray-300 focus:ring-primary-500" />
            <span className="text-sm text-gray-700">Active</span>
          </label>
        </div>
      </Modal>

      {/* Add Question */}
      <Modal isOpen={addQuestionModal.isOpen} onClose={addQuestionModal.close} title="Add Question" size="lg">
        <QuestionForm
          onSubmit={handleCreateQuestion}
          onCancel={addQuestionModal.close}
          isLoading={savingQuestion}
        />
      </Modal>

      {/* Edit Question */}
      <Modal isOpen={editQuestionModal.isOpen} onClose={editQuestionModal.close} title="Edit Question" size="lg">
        <QuestionForm
          question={editingQuestion}
          onSubmit={handleUpdateQuestion}
          onCancel={editQuestionModal.close}
          isLoading={savingQuestion}
        />
      </Modal>

      {/* Delete confirms */}
      <ConfirmDialog isOpen={deleteModuleModal.isOpen} onClose={() => { deleteModuleModal.close(); setModuleToDelete(null); }} onConfirm={handleDeleteModule} title="Delete Module" message={`Delete "${moduleToDelete?.title}"? All submodules under it will also be removed.`} />
      <ConfirmDialog isOpen={deleteSubmoduleModal.isOpen} onClose={() => { deleteSubmoduleModal.close(); setSubToDelete(null); }} onConfirm={handleDeleteSubmodule} title="Delete Submodule" message={`Delete "${subToDelete?.title}"?`} />
      <ConfirmDialog isOpen={deleteQuestionModal.isOpen} onClose={() => { deleteQuestionModal.close(); setQuestionToDelete(null); }} onConfirm={handleDeleteQuestion} title="Delete Question" message={`Delete "${questionToDelete?.question.title}"? This cannot be undone.`} />
      <ConfirmDialog isOpen={deleteEnrollModal.isOpen} onClose={() => { deleteEnrollModal.close(); setEnrollToDelete(null); }} onConfirm={handleRemoveEnrollment} title="Remove Enrollment" message="This will remove the student's enrollment and all progress data for this course." />
    </div>
  );
}

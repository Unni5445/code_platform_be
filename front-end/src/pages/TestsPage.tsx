import React, { useState, useCallback, useRef } from "react";
import { Plus, Edit, Trash2, Code, CheckCircle, ListChecks, MessageSquare, Clock, Award, Upload, Download, FileUp, AlertCircle, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import { testService, questionService, courseService } from "@/services";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks";
import { Button, Badge, Modal, Input, Select, Tabs, ConfirmDialog, EmptyState, SearchInput, Spinner, Pagination } from "@/components/ui";
import { QuestionForm } from "@/components/tests/QuestionForm";
import { useModal } from "@/hooks";
import type { ITest, IQuestion, QuestionType } from "@/types";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

const questionTypeConfig: Record<QuestionType, { label: string; icon: React.ReactNode; variant: "primary" | "secondary" | "info" | "success" }> = {
  SINGLE_CHOICE: { label: "Single Choice", icon: <CheckCircle className="h-3.5 w-3.5" />, variant: "info" },
  MULTIPLE_CHOICE: { label: "Multiple Choice", icon: <ListChecks className="h-3.5 w-3.5" />, variant: "secondary" },
  CODING: { label: "Coding", icon: <Code className="h-3.5 w-3.5" />, variant: "primary" },
  BEHAVIORAL: { label: "Behavioral", icon: <MessageSquare className="h-3.5 w-3.5" />, variant: "success" },
};

export default function TestsPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN";
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const isAnyAdmin = isAdmin || isSuperAdmin;
  const [activeTab, setActiveTab] = useState("questions");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [diffFilter, setDiffFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [testToDelete, setTestToDelete] = useState<ITest | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<IQuestion | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<IQuestion | null>(null);
  const [editingTest, setEditingTest] = useState<ITest | null>(null);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

  const addTestModal = useModal();
  const editTestModal = useModal();
  const addQuestionModal = useModal();
  const editQuestionModal = useModal();
  const bulkUploadModal = useModal();
  const deleteModal = useModal();

  // Bulk upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkParsed, setBulkParsed] = useState<Partial<IQuestion>[]>([]);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [bulkImporting, setBulkImporting] = useState(false);

  // Test form state
  const [testTitle, setTestTitle] = useState("");
  const [testCourse, setTestCourse] = useState("");
  const [testDuration, setTestDuration] = useState("");
  const [testPoints, setTestPoints] = useState("");

  const debouncedSearch = useDebounce(search, 300);

  const fetchTests = useCallback(
    () => testService.getTests({ search: debouncedSearch || undefined, course: "none", module: "none" }),
    [debouncedSearch]
  );

  const fetchQuestions = useCallback(
    () => questionService.getQuestions({
      search: debouncedSearch || undefined,
      type: typeFilter || undefined,
      difficulty: diffFilter || undefined,
      course: "none",
      module: "none",
      page: currentPage,
      limit: itemsPerPage,
    }),
    [debouncedSearch, typeFilter, diffFilter, currentPage, itemsPerPage]
  );

  const fetchCourses = useCallback(() => courseService.getCourses({ limit: 100 }), []);

  const { data: testsData, loading: testsLoading, refetch: refetchTests } = useApi(fetchTests, [debouncedSearch]);
  const { data: questionsData, loading: questionsLoading, refetch: refetchQuestions } = useApi(fetchQuestions, [debouncedSearch, typeFilter, diffFilter, currentPage, itemsPerPage]);
  const { data: coursesData } = useApi(fetchCourses, []);

  const tests = testsData?.tests ?? [];
  const questions = questionsData?.questions ?? [];
  const coursesList = coursesData?.courses ?? [];

  const tabs = [
    // { id: "tests", label: "Tests", count: testsData?.totalTests ?? 0 },
    { id: "questions", label: "Question Bank", count: questionsData?.totalQuestions ?? 0 },
  ];

  const getCourseName = (courseId: string) => {
    if (typeof courseId === "object" && courseId !== null && "title" in courseId) {
      return (courseId as unknown as { title: string }).title;
    }
    return coursesList.find((c) => c._id === courseId)?.title || "Unknown";
  };

  // ── Test handlers ──
  const resetTestForm = () => { setTestTitle(""); setTestCourse(""); setTestDuration(""); setTestPoints(""); };

  const handleCreateTest = async () => {
    try {
      await testService.createTest({ title: testTitle, course: testCourse, duration: Number(testDuration) || 30, totalPoints: Number(testPoints) || 0 });
      addTestModal.close();
      resetTestForm();
      toast.success("Test created successfully");
      refetchTests();
    } catch {
      toast.error("Failed to create test");
    }
  };

  const openEditTest = (test: ITest) => {
    setEditingTest(test);
    setTestTitle(test.title);
    setTestCourse(typeof test.course === "object" && test.course !== null ? (test.course as unknown as { _id: string })._id : test.course);
    setTestDuration(test.duration?.toString() || "");
    setTestPoints(test.totalPoints?.toString() || "");
    editTestModal.open();
  };

  const handleEditTest = async () => {
    if (!editingTest) return;
    try {
      await testService.updateTest(editingTest._id, { title: testTitle, course: testCourse, duration: Number(testDuration) || 30, totalPoints: Number(testPoints) || 0 });
      editTestModal.close();
      setEditingTest(null);
      resetTestForm();
      toast.success("Test updated successfully");
      refetchTests();
    } catch {
      toast.error("Failed to update test");
    }
  };

  // ── Question handlers ──
  const handleCreateQuestion = async (data: Partial<IQuestion>) => {
    try {
      await questionService.createQuestion(data);
      addQuestionModal.close();
      toast.success("Question created successfully");
      refetchQuestions();
    } catch {
      toast.error("Failed to create question");
    }
  };

  const handleEditQuestion = async (data: Partial<IQuestion>) => {
    if (!editingQuestion) return;
    try {
      await questionService.updateQuestion(editingQuestion._id, data);
      editQuestionModal.close();
      setEditingQuestion(null);
      toast.success("Question updated successfully");
      refetchQuestions();
    } catch {
      toast.error("Failed to update question");
    }
  };

  const openEditQuestion = (question: IQuestion) => {
    setEditingQuestion(question);
    editQuestionModal.open();
  };

  // ── Bulk upload handlers ──
  const resetBulkState = () => {
    setBulkFile(null);
    setBulkParsed([]);
    setBulkErrors([]);
    setBulkImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkFile(file);
    setBulkErrors([]);
    setBulkParsed([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;

        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(text);
          const questions = Array.isArray(parsed) ? parsed : parsed.questions;
          if (!Array.isArray(questions)) {
            setBulkErrors(["JSON must be an array of questions or an object with a \"questions\" array."]);
            return;
          }
          validateAndSetQuestions(questions);
        } else if (file.name.endsWith(".csv")) {
          const lines = text.split("\n").filter((l) => l.trim());
          if (lines.length < 2) {
            setBulkErrors(["CSV must have a header row and at least one data row."]);
            return;
          }
          const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
          const questions = lines.slice(1).map((line) => {
            const values = parseCSVLine(line);
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => { obj[h] = values[i]?.trim() || ""; });
            return {
              title: obj.title,
              type: (obj.type || "SINGLE_CHOICE").toUpperCase(),
              difficulty: obj.difficulty || "Medium",
              points: Number(obj.points) || 10,
              course: obj.course || "",
              tags: obj.tags ? obj.tags.split(";").map((t: string) => t.trim()) : undefined,
              options: obj.options ? obj.options.split(";").map((o: string) => o.trim()) : undefined,
              correctAnswer: obj.correctanswer || obj.correct_answer || undefined,
              company: obj.company || undefined,
              description: obj.description || undefined,
            } as Partial<IQuestion>;
          });
          validateAndSetQuestions(questions);
        } else {
          setBulkErrors(["Unsupported file format. Please upload a .json or .csv file."]);
        }
      } catch {
        setBulkErrors(["Failed to parse file. Please check the format."]);
      }
    };
    reader.readAsText(file);
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === "," && !inQuotes) { result.push(current); current = ""; }
      else { current += char; }
    }
    result.push(current);
    return result;
  };

  const validateAndSetQuestions = (questions: Partial<IQuestion>[]) => {
    const errors: string[] = [];
    const valid: Partial<IQuestion>[] = [];

    questions.forEach((q, i) => {
      const row = i + 1;
      if (!q.title?.trim()) { errors.push(`Row ${row}: Missing title`); return; }
      const validTypes = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "CODING", "BEHAVIORAL"];
      if (q.type && !validTypes.includes(q.type)) { errors.push(`Row ${row}: Invalid type "${q.type}"`); return; }
      valid.push(q);
    });

    setBulkParsed(valid);
    setBulkErrors(errors);
  };

  const handleBulkImport = async () => {
    if (bulkParsed.length === 0) return;
    setBulkImporting(true);
    try {
      const res = await questionService.bulkImportQuestions(bulkParsed);
      const imported = res.data?.data?.imported ?? bulkParsed.length;
      bulkUploadModal.close();
      resetBulkState();
      toast.success(`${imported} question(s) imported successfully`);
      refetchQuestions();
    } catch {
      toast.error("Failed to import questions");
    } finally {
      setBulkImporting(false);
    }
  };

  const downloadTemplate = (format: "json" | "csv") => {
    if (format === "json") {
      const template = JSON.stringify([
        {
          title: "What is React?",
          type: "SINGLE_CHOICE",
          difficulty: "Easy",
          points: 10,
          options: ["A library", "A framework", "A language", "An OS"],
          correctAnswer: "0",
          tags: ["react", "basics"],
          company: "Google",
        },
        {
          title: "Implement a Stack",
          type: "CODING",
          difficulty: "Medium",
          points: 20,
          description: "<p>Implement a stack data structure.</p>",
          languages: ["javascript", "python"],
          tags: ["dsa", "stack"],
        },
      ], null, 2);
      downloadFile(template, "questions-template.json", "application/json");
    } else {
      const csv = `title,type,difficulty,points,options,correctAnswer,tags,company,description
"What is React?",SINGLE_CHOICE,Easy,10,"A library;A framework;A language;An OS",0,"react;basics",Google,""
"Explain closures",BEHAVIORAL,Medium,15,,,"javascript;closures",,""`;
      downloadFile(csv, "questions-template.csv", "text/csv");
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Export questions ──
  const handleExportQuestions = () => {
    if (questions.length === 0) {
      toast.error("No questions to export");
      return;
    }

    const exported = questions.map((q: IQuestion) => {
      const obj: Record<string, any> = {
        title: q.title,
        type: q.type,
        difficulty: q.difficulty,
        points: q.points,
      };
      if (q.description) obj.description = q.description;
      if (q.options?.length) obj.options = q.options.map((o: any) => o.text || o);
      if (q.correctAnswer != null) obj.correctAnswer = q.correctAnswer;
      if (q.tags?.length) obj.tags = q.tags;
      if (q.company) obj.company = q.company;
      if (q.languages?.length) obj.languages = q.languages;
      if (q.starterCode) obj.starterCode = q.starterCode;
      if (q.testCases?.length) obj.testCases = q.testCases.map((tc: any) => ({
        input: tc.input,
        output: tc.output,
        ...(tc.weight ? { weight: tc.weight } : {}),
        ...(tc.hidden ? { hidden: tc.hidden } : {}),
      }));
      return obj;
    });

    const json = JSON.stringify(exported, null, 2);
    downloadFile(json, `questions-export-${Date.now()}.json`, "application/json");
    toast.success(`${exported.length} question(s) exported`);
  };

  // ── Delete handler ──
  const handleDelete = async () => {
    try {
      if (testToDelete) {
        await testService.deleteTest(testToDelete._id);
        setTestToDelete(null);
        refetchTests();
      }
      if (questionToDelete) {
        await questionService.deleteQuestion(questionToDelete._id);
        setQuestionToDelete(null);
        refetchQuestions();
      }
      deleteModal.close();
      toast.success("Deleted successfully");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const isLoading = activeTab === "tests" ? testsLoading : questionsLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={(tab) => { setActiveTab(tab); setSearch(""); }} />
        {isAnyAdmin && (
          <div className="flex gap-2">
            {activeTab === "questions" && (
              <>
                <Button
                  variant="outline"
                  leftIcon={<Download className="h-4 w-4" />}
                  onClick={handleExportQuestions}
                >
                  Export
                </Button>
                <Button
                  variant="outline"
                  leftIcon={<Upload className="h-4 w-4" />}
                  onClick={() => { resetBulkState(); bulkUploadModal.open(); }}
                >
                  Bulk Upload
                </Button>
              </>
            )}
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => (activeTab === "tests" ? addTestModal.open() : addQuestionModal.open())}
            >
              {activeTab === "tests" ? "Add Test" : "Add Question"}
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="w-72">
          <SearchInput
            placeholder={activeTab === "tests" ? "Search tests..." : "Search questions..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {activeTab === "questions" && (
          <>
            <Select
              options={[
                { value: "", label: "All Types" },
                { value: "SINGLE_CHOICE", label: "Single Choice" },
                { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
                { value: "CODING", label: "Coding" },
                { value: "BEHAVIORAL", label: "Behavioral" },
              ]}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-40"
            />
            <Select
              options={[
                { value: "", label: "All Difficulty" },
                { value: "Easy", label: "Easy" },
                { value: "Medium", label: "Medium" },
                { value: "Hard", label: "Hard" },
              ]}
              value={diffFilter}
              onChange={(e) => setDiffFilter(e.target.value)}
              className="w-40"
            />
          </>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Tests Tab */}
          {activeTab === "tests" && (
            <div className="bg-surface rounded-xl shadow-card border border-surface-border overflow-hidden">
              {tests.length === 0 ? (
                <EmptyState title="No tests found" description="Create your first test to get started." />
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-secondary border-b border-surface-border">
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Test</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Course</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Questions</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Duration</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Points</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      {isAnyAdmin && <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {tests.map((test) => {
                      const isExpanded = expandedTestId === test._id;
                      const testQuestions = Array.isArray(test.questions) ? test.questions : [];
                      return (
                        <React.Fragment key={test._id}>
                          <tr className="hover:bg-primary-50/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setExpandedTestId(isExpanded ? null : test._id)}
                                  className="p-1 rounded text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                >
                                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </button>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{test.title}</p>
                                  {test.description && <p className="text-xs text-gray-500 mt-0.5">{test.description}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 hidden md:table-cell">
                              <span className="text-sm text-gray-600">{getCourseName(test.course)}</span>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="gray">{testQuestions.length} questions</Badge>
                            </td>
                            <td className="px-6 py-4 hidden lg:table-cell">
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Clock className="h-3.5 w-3.5" />
                                {test.duration || 0} min
                              </div>
                            </td>
                            <td className="px-6 py-4 hidden lg:table-cell">
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Award className="h-3.5 w-3.5" />
                                {test.totalPoints || 0}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={test.isActive ? "success" : "gray"}>{test.isActive ? "Active" : "Inactive"}</Badge>
                            </td>
                            {isAnyAdmin && (
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1">
                                  <button onClick={() => openEditTest(test)} className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer">
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button onClick={() => { setTestToDelete(test); deleteModal.open(); }} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} className="px-6 py-4 bg-gray-50/50">
                                {testQuestions.length === 0 ? (
                                  <p className="text-sm text-gray-500 text-center py-3">No questions in this test yet.</p>
                                ) : (
                                  <div className="space-y-2">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Test Questions</p>
                                    {testQuestions.map((q: any, idx: number) => {
                                      const qObj = typeof q === "object" ? q : null;
                                      if (!qObj) return null;
                                      const config = questionTypeConfig[qObj.type as QuestionType];
                                      return (
                                        <div key={qObj._id || idx} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-surface-border">
                                          <div className="flex items-center gap-3 min-w-0">
                                            <span className="text-xs text-gray-400 shrink-0">{idx + 1}.</span>
                                            <span className="text-sm font-medium text-gray-900 truncate">{qObj.title}</span>
                                          </div>
                                          <div className="flex items-center gap-2 shrink-0">
                                            {config && <Badge variant={config.variant}><span className="flex items-center gap-1">{config.icon} {config.label}</span></Badge>}
                                            <Badge variant={qObj.difficulty === "Easy" ? "success" : qObj.difficulty === "Hard" ? "danger" : "warning"}>
                                              {qObj.difficulty}
                                            </Badge>
                                            <span className="text-xs text-gray-500">{qObj.points} pts</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Questions Tab */}
          {activeTab === "questions" && (
            <div className="bg-surface rounded-xl shadow-card border border-surface-border overflow-hidden">
              {questions.length === 0 ? (
                <EmptyState title="No questions found" description="Create your first question to get started." />
              ) : (
                <>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface-secondary border-b border-surface-border">
                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">S.No</th>
                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Question</th>
                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Difficulty</th>
                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Points</th>
                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Tags</th>
                        {isAnyAdmin && <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {questions.map((question, index) => {
                        const config = questionTypeConfig[question.type];
                        const serialNumber = (currentPage - 1) * itemsPerPage + index + 1;
                        return (
                          <tr key={question._id} className="hover:bg-primary-50/30 transition-colors">
                            <td className="px-6 py-4">
                              <span className="text-sm font-medium text-gray-900">{serialNumber}</span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-medium text-gray-900 line-clamp-1">{question.title}</p>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={config.variant}>
                                <span className="flex items-center gap-1">{config.icon} {config.label}</span>
                              </Badge>
                            </td>
                            <td className="px-6 py-4 hidden md:table-cell">
                              <Badge variant={question.difficulty === "Easy" ? "success" : question.difficulty === "Medium" ? "warning" : "danger"}>
                                {question.difficulty}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 hidden lg:table-cell">
                              <span className="text-sm font-medium text-gray-900">{question.points}</span>
                            </td>
                            <td className="px-6 py-4 hidden lg:table-cell">
                              <div className="flex gap-1 flex-wrap">
                                {question.tags?.slice(0, 2).map((tag) => (
                                  <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{tag}</span>
                                ))}
                                {(question.tags?.length || 0) > 2 && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">+{(question.tags?.length || 0) - 2}</span>
                                )}
                              </div>
                            </td>
                            {isAnyAdmin && (
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1">
                                  <button onClick={() => openEditQuestion(question)} className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer">
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button onClick={() => { setQuestionToDelete(question); deleteModal.open(); }} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {/* Pagination */}
                  {questionsData?.totalPages && questionsData.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-surface-border flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Showing {questions.length} of {questionsData.totalQuestions} questions
                      </div>
                      <Pagination
                        currentPage={currentPage}
                        totalPages={questionsData.totalPages}
                        onPageChange={(page) => {
                          setCurrentPage(page);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Add Test Modal ── */}
      <Modal
        isOpen={addTestModal.isOpen}
        onClose={addTestModal.close}
        title="Add New Test"
        footer={
          <>
            <Button variant="ghost" onClick={addTestModal.close}>Cancel</Button>
            <Button onClick={handleCreateTest} disabled={!testTitle.trim()}>Create Test</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Test Title" value={testTitle} onChange={(e) => setTestTitle(e.target.value)} placeholder="e.g., React Basics Assessment" required />
          <Select
            label="Course"
            options={[{ value: "", label: "Select Course" }, ...coursesList.map((c) => ({ value: c._id, label: c.title }))]}
            value={testCourse}
            onChange={(e) => setTestCourse(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Duration (min)" type="number" value={testDuration} onChange={(e) => setTestDuration(e.target.value)} placeholder="30" />
            <Input label="Total Points" type="number" value={testPoints} onChange={(e) => setTestPoints(e.target.value)} placeholder="100" />
          </div>
        </div>
      </Modal>

      {/* ── Edit Test Modal ── */}
      <Modal
        isOpen={editTestModal.isOpen}
        onClose={() => { editTestModal.close(); setEditingTest(null); resetTestForm(); }}
        title="Edit Test"
        footer={
          <>
            <Button variant="ghost" onClick={() => { editTestModal.close(); setEditingTest(null); resetTestForm(); }}>Cancel</Button>
            <Button onClick={handleEditTest} disabled={!testTitle.trim()}>Update Test</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Test Title" value={testTitle} onChange={(e) => setTestTitle(e.target.value)} placeholder="e.g., React Basics Assessment" required />
          <Select
            label="Course"
            options={[{ value: "", label: "Select Course" }, ...coursesList.map((c) => ({ value: c._id, label: c.title }))]}
            value={testCourse}
            onChange={(e) => setTestCourse(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Duration (min)" type="number" value={testDuration} onChange={(e) => setTestDuration(e.target.value)} placeholder="30" />
            <Input label="Total Points" type="number" value={testPoints} onChange={(e) => setTestPoints(e.target.value)} placeholder="100" />
          </div>
        </div>
      </Modal>

      {/* ── Add Question Modal ── */}
      <Modal isOpen={addQuestionModal.isOpen} onClose={addQuestionModal.close} title="Add New Question" size="xl">
        <QuestionForm onSubmit={handleCreateQuestion} onCancel={addQuestionModal.close} />
      </Modal>

      {/* ── Edit Question Modal ── */}
      <Modal
        isOpen={editQuestionModal.isOpen}
        onClose={() => { editQuestionModal.close(); setEditingQuestion(null); }}
        title="Edit Question"
        size="xl"
      >
        <QuestionForm
          question={editingQuestion}
          onSubmit={handleEditQuestion}
          onCancel={() => { editQuestionModal.close(); setEditingQuestion(null); }}
        />
      </Modal>

      {/* ── Bulk Upload Modal ── */}
      <Modal
        isOpen={bulkUploadModal.isOpen}
        onClose={() => { bulkUploadModal.close(); resetBulkState(); }}
        title="Bulk Upload Questions"
        size="lg"
      >
        <div className="space-y-6">
          {/* Template download */}
          <div className="bg-blue-50 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Download className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">Download a template to get started</p>
                <p className="text-xs text-blue-700 mt-1">
                  Use our template to format your questions correctly. Supports JSON and CSV formats.
                </p>
              </div>
            </div>
            <div className="flex gap-2 ml-8">
              <Button variant="outline" size="sm" onClick={() => downloadTemplate("json")}>JSON Template</Button>
              <Button variant="outline" size="sm" onClick={() => downloadTemplate("csv")}>CSV Template</Button>
            </div>
          </div>

          {/* File upload */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Upload File</label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">
                {bulkFile ? bulkFile.name : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-gray-500 mt-1">Supports .json and .csv files (max 100 questions)</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              onChange={handleBulkFileChange}
              className="hidden"
            />
          </div>

          {/* Validation errors */}
          {bulkErrors.length > 0 && (
            <div className="bg-red-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">{bulkErrors.length} validation error(s)</span>
              </div>
              <ul className="ml-6 space-y-1 max-h-32 overflow-y-auto">
                {bulkErrors.map((err, i) => (
                  <li key={i} className="text-xs text-red-700">{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview */}
          {bulkParsed.length > 0 && (
            <div className="bg-green-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">{bulkParsed.length} question(s) ready to import</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {bulkParsed.slice(0, 10).map((q, i) => (
                  <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-green-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-gray-400 shrink-0">{i + 1}.</span>
                      <span className="text-sm text-gray-900 truncate">{q.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="gray">{q.type}</Badge>
                      <Badge variant={q.difficulty === "Easy" ? "success" : q.difficulty === "Hard" ? "danger" : "warning"}>
                        {q.difficulty || "Medium"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {bulkParsed.length > 10 && (
                  <p className="text-xs text-gray-500 text-center">...and {bulkParsed.length - 10} more</p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-surface-border">
            <Button variant="ghost" onClick={() => { bulkUploadModal.close(); resetBulkState(); }}>Cancel</Button>
            <Button
              onClick={handleBulkImport}
              disabled={bulkParsed.length === 0 || bulkImporting}
              isLoading={bulkImporting}
              leftIcon={<Upload className="h-4 w-4" />}
            >
              Import {bulkParsed.length > 0 ? `${bulkParsed.length} Questions` : "Questions"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => { deleteModal.close(); setTestToDelete(null); setQuestionToDelete(null); }}
        onConfirm={handleDelete}
        title={testToDelete ? "Delete Test" : "Delete Question"}
        message={`Are you sure you want to delete "${testToDelete?.title || questionToDelete?.title}"? This action cannot be undone.`}
      />
    </div>
  );
}

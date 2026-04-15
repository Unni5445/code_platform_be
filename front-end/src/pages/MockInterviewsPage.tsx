import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Clock,
  Eye,
  MessageSquare,
  FileText,
  Briefcase,
  Building,
} from "lucide-react";
import { interviewService } from "@/services";
import type { IMockInterview, IInterviewQuestion } from "@/services/interview.service";
import { useApi } from "@/hooks/useApi";
import {
  Button,
  Badge,
  Modal,
  Input,
  Select,
  ConfirmDialog,
  EmptyState,
  SearchInput,
  Spinner,
} from "@/components/ui";
import { useModal } from "@/hooks";
import toast from "react-hot-toast";

export default function MockInterviewsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Form state
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [duration, setDuration] = useState("45");
  const [requiredLevel, setRequiredLevel] = useState("0");
  const [topicsText, setTopicsText] = useState("");
  const [questions, setQuestions] = useState<IInterviewQuestion[]>([]);

  // Question form state
  const [qText, setQText] = useState("");
  const [qCategory, setQCategory] = useState<"technical" | "behavioral" | "system-design">("technical");
  const [qHintsText, setQHintsText] = useState("");
  const [qExpectedText, setQExpectedText] = useState("");

  const [editingInterview, setEditingInterview] = useState<IMockInterview | null>(null);
  const [interviewToDelete, setInterviewToDelete] = useState<IMockInterview | null>(null);
  const [viewingInterview, setViewingInterview] = useState<IMockInterview | null>(null);

  const addModal = useModal();
  const editModal = useModal();
  const deleteModal = useModal();
  const viewModal = useModal();

  const fetchInterviews = useCallback(
    () =>
      interviewService.getAdminInterviews({
        status: statusFilter || undefined,
        limit: 50,
      }),
    [statusFilter]
  );

  const { data, loading, refetch } = useApi(fetchInterviews, [statusFilter]);
  const interviews = data?.interviews ?? [];

  const filtered = search
    ? interviews.filter(
        (i) =>
          i.company.toLowerCase().includes(search.toLowerCase()) ||
          i.role.toLowerCase().includes(search.toLowerCase())
      )
    : interviews;

  // Helpers
  const resetForm = () => {
    setCompany("");
    setRole("");
    setDifficulty("Medium");
    setDuration("45");
    setRequiredLevel("0");
    setTopicsText("");
    setQuestions([]);
    setFormErrors({});
    resetQuestionForm();
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!company.trim()) errors.company = "Company name is required";
    if (!role.trim()) errors.role = "Role is required";

    const dur = Number(duration);
    if (!duration.trim() || isNaN(dur) || dur < 1 || dur > 300) {
      errors.duration = "Duration must be between 1 and 300 minutes";
    }

    const lvl = Number(requiredLevel);
    if (requiredLevel.trim() !== "" && (isNaN(lvl) || lvl < 0)) {
      errors.requiredLevel = "Required level must be a non-negative number";
    }

    if (questions.length === 0) {
      errors.questions = "At least one question is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetQuestionForm = () => {
    setQText("");
    setQCategory("technical");
    setQHintsText("");
    setQExpectedText("");
  };

  const handleAddQuestion = () => {
    if (!qText.trim()) return toast.error("Question text is required");
    const newQ: IInterviewQuestion = {
      question: qText.trim(),
      category: qCategory,
      hints: qHintsText.split(",").map((h) => h.trim()).filter(Boolean),
      expectedPoints: qExpectedText.split(",").map((e) => e.trim()).filter(Boolean),
    };
    setQuestions([...questions, newQ]);
    resetQuestionForm();
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? <Badge variant="success">Active</Badge> : <Badge variant="gray">Inactive</Badge>;
  };

  const getDiffBadge = (diff: string) => {
    switch (diff) {
      case "Easy": return <Badge variant="success">Easy</Badge>;
      case "Medium": return <Badge variant="warning">Medium</Badge>;
      case "Hard": return <Badge variant="danger">Hard</Badge>;
      case "Boss": return <Badge variant="primary">Boss</Badge>;
      default: return <Badge variant="gray">{diff}</Badge>;
    }
  };

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case "technical": return "text-blue-700 bg-blue-50 border-blue-200";
      case "behavioral": return "text-emerald-700 bg-emerald-50 border-emerald-200";
      case "system-design": return "text-purple-700 bg-purple-50 border-purple-200";
      default: return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  // Handlers
  const handleCreate = async () => {
    if (!validateForm()) return;
    try {
      await interviewService.createInterview({
        company: company.trim(),
        role: role.trim(),
        duration: Number(duration) || 45,
        difficulty: difficulty as any,
        requiredLevel: Number(requiredLevel) || 0,
        topics: topicsText.split(",").map((t) => t.trim()).filter(Boolean),
        questions,
      });
      addModal.close();
      resetForm();
      toast.success("Interview created successfully");
      refetch();
    } catch {
      toast.error("Failed to create interview");
    }
  };

  const openEdit = (interview: IMockInterview) => {
    setEditingInterview(interview);
    setCompany(interview.company);
    setRole(interview.role);
    setDifficulty(interview.difficulty);
    setDuration(interview.duration.toString());
    setRequiredLevel(interview.requiredLevel.toString());
    setTopicsText(interview.topics.join(", "));
    setQuestions(interview.questions || []);
    resetQuestionForm();
    editModal.open();
  };

  const handleEdit = async () => {
    if (!editingInterview) return;
    if (!validateForm()) return;
    try {
      await interviewService.updateInterview(editingInterview._id, {
        company: company.trim(),
        role: role.trim(),
        duration: Number(duration) || 45,
        difficulty: difficulty as any,
        requiredLevel: Number(requiredLevel) || 0,
        topics: topicsText.split(",").map((t) => t.trim()).filter(Boolean),
        questions,
      });
      editModal.close();
      setEditingInterview(null);
      resetForm();
      toast.success("Interview updated successfully");
      refetch();
    } catch {
      toast.error("Failed to update interview");
    }
  };

  const handleDelete = async () => {
    if (!interviewToDelete) return;
    try {
      await interviewService.deleteInterview(interviewToDelete._id);
      deleteModal.close();
      setInterviewToDelete(null);
      toast.success("Interview deleted successfully");
      refetch();
    } catch {
      toast.error("Failed to delete interview");
    }
  };

  const InterviewForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            label="Company *"
            value={company}
            onChange={(e) => { setCompany(e.target.value); setFormErrors((p) => { const n = { ...p }; delete n.company; return n; }); }}
            placeholder="e.g., Google, Amazon"
            required
          />
          {formErrors.company && <p className="text-xs text-red-500 mt-1">{formErrors.company}</p>}
        </div>
        <div>
          <Input
            label="Role *"
            value={role}
            onChange={(e) => { setRole(e.target.value); setFormErrors((p) => { const n = { ...p }; delete n.role; return n; }); }}
            placeholder="e.g., Frontend Engineer"
            required
          />
          {formErrors.role && <p className="text-xs text-red-500 mt-1">{formErrors.role}</p>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Input
            label="Duration (min) *"
            type="number"
            value={duration}
            onChange={(e) => { setDuration(e.target.value); setFormErrors((p) => { const n = { ...p }; delete n.duration; return n; }); }}
            placeholder="45"
            min={1}
            max={300}
          />
          {formErrors.duration && <p className="text-xs text-red-500 mt-1">{formErrors.duration}</p>}
        </div>
        <Select
          label="Difficulty"
          options={[
            { value: "Easy", label: "Easy" },
            { value: "Medium", label: "Medium" },
            { value: "Hard", label: "Hard" },
            { value: "Boss", label: "Boss" },
          ]}
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        />
        <div>
          <Input
            label="Required Level"
            type="number"
            value={requiredLevel}
            onChange={(e) => { setRequiredLevel(e.target.value); setFormErrors((p) => { const n = { ...p }; delete n.requiredLevel; return n; }); }}
            placeholder="0"
            min={0}
          />
          {formErrors.requiredLevel && <p className="text-xs text-red-500 mt-1">{formErrors.requiredLevel}</p>}
        </div>
      </div>
      <Input
        label="Topics (comma-separated)"
        value={topicsText}
        onChange={(e) => setTopicsText(e.target.value)}
        placeholder="e.g., React, System Design, Data Structures"
      />

      {/* Questions Manager */}
      <div className={`border rounded-xl p-4 bg-gray-50/50 ${formErrors.questions ? 'border-red-300' : 'border-surface-border'}`}>
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center justify-between">
          <span>Questions ({questions.length}) <span className="text-red-500">*</span></span>
        </h4>
        {formErrors.questions && <p className="text-xs text-red-500 mb-3">{formErrors.questions}</p>}

        {/* Existing Questions */}
        {questions.length > 0 && (
          <div className="space-y-2 mb-4">
            {questions.map((q, i) => (
              <div key={i} className="flex flex-col gap-2 p-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-gray-900">{i + 1}. {q.question}</p>
                  <button onClick={() => handleRemoveQuestion(i)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getCategoryTheme(q.category)} capitalize`}>
                    {q.category}
                  </span>
                  <span className="text-xs text-gray-500">{q.expectedPoints.length} points</span>
                  <span className="text-xs text-gray-500">{q.hints.length} hints</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Question */}
        <div className="space-y-3 p-3 bg-surface border border-gray-200 rounded-lg">
          <p className="text-xs font-semibold text-gray-500 uppercase">Add New Question</p>
          <Input
            label="Question Text *"
            value={qText}
            onChange={(e) => setQText(e.target.value)}
            placeholder="e.g., How does React's Virtual DOM work?"
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category *"
              options={[
                { value: "technical", label: "Technical" },
                { value: "behavioral", label: "Behavioral" },
                { value: "system-design", label: "System Design" },
              ]}
              value={qCategory}
              onChange={(e) => setQCategory(e.target.value as any)}
            />
          </div>
          <Input
            label="Expected Points (comma-separated)"
            value={qExpectedText}
            onChange={(e) => setQExpectedText(e.target.value)}
            placeholder="e.g., Diffing algorithm, Reconciliation, Batched updates"
          />
          <Input
            label="Hints (comma-separated)"
            value={qHintsText}
            onChange={(e) => setQHintsText(e.target.value)}
            placeholder="e.g., Think about how the DOM updates, React Fiber"
          />
          <Button variant="secondary" size="sm" onClick={() => { handleAddQuestion(); setFormErrors((p) => { const n = { ...p }; delete n.questions; return n; }); }} className="w-full">
            Add Question
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary-600" />
            Mock Interviews
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage company-specific simulated interview assessments
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { resetForm(); addModal.open(); }}>
          Create Interview
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="w-72">
          <SearchInput
            placeholder="Search company or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          options={[
            { value: "", label: "All Status" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="bg-surface rounded-xl shadow-card border border-surface-border overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState
              title="No interviews found"
              description="Create your first mock interview to get started."
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-surface-secondary border-b border-surface-border">
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Interview
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Difficulty
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Stats
                  </th>
                  <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filtered.map((interview) => (
                  <tr key={interview._id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                          <Building className="h-4 w-4 text-purple-600" />
                          {interview.company}
                        </p>
                        <p className="text-xs text-gray-600 flex items-center gap-1.5 mt-1">
                          <Briefcase className="h-3.5 w-3.5" />
                          {interview.role}
                        </p>
                        {interview.topics?.length > 0 && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {interview.topics.slice(0, 3).map((t, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                {t}
                              </span>
                            ))}
                            {interview.topics.length > 3 && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                                +{interview.topics.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(interview.isActive)}</td>
                    <td className="px-6 py-4 hidden md:table-cell">{getDiffBadge(interview.difficulty)}</td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="text-xs text-gray-600 space-y-1">
                        <p className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" /> {interview.duration} min
                        </p>
                        <p className="flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5" /> {interview.questions?.length || 0} questions
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" /> {interview.participants || 0} attempts
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => navigate(`/interviews/${interview._id}/attempts`)}
                          className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="View Attempts"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setViewingInterview(interview); viewModal.open(); }}
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="View Setup"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEdit(interview)}
                          className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setInterviewToDelete(interview); deleteModal.open(); }}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={addModal.isOpen} onClose={() => { addModal.close(); resetForm(); }} title="Create Mock Interview" size="lg" footer={<><Button variant="ghost" onClick={() => { addModal.close(); resetForm(); }}>Cancel</Button><Button onClick={handleCreate} disabled={!company.trim() || !role.trim() || questions.length === 0}>Create</Button></>}>
        {InterviewForm()}
      </Modal>

      <Modal isOpen={editModal.isOpen} onClose={() => { editModal.close(); setEditingInterview(null); resetForm(); }} title="Edit Mock Interview" size="lg" footer={<><Button variant="ghost" onClick={() => { editModal.close(); setEditingInterview(null); resetForm(); }}>Cancel</Button><Button onClick={handleEdit} disabled={!company.trim() || !role.trim() || questions.length === 0}>Update</Button></>}>
        {InterviewForm()}
      </Modal>

      <ConfirmDialog isOpen={deleteModal.isOpen} onClose={() => { deleteModal.close(); setInterviewToDelete(null); }} onConfirm={handleDelete} title="Delete Mock Interview" message={`Are you sure you want to delete the ${interviewToDelete?.company} ${interviewToDelete?.role} interview?`} confirmLabel="Delete" />

      {/* View Setup Modal */}
      <Modal isOpen={viewModal.isOpen} onClose={() => { viewModal.close(); setViewingInterview(null); }} title="Mock Interview Details" size="lg">
        {viewingInterview && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold flex items-center gap-2"><Building className="h-5 w-5 text-purple-600"/>{viewingInterview.company}</h3>
              {getDiffBadge(viewingInterview.difficulty)}
            </div>
            <p className="text-sm font-medium text-gray-600 flex items-center gap-1.5"><Briefcase className="h-4 w-4"/>{viewingInterview.role}</p>

            <div className="grid grid-cols-3 gap-4 text-sm mt-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Duration</p>
                <p className="text-gray-900 font-medium">{viewingInterview.duration} min</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Unlock Level</p>
                <p className="text-gray-900 font-medium">Lv. {viewingInterview.requiredLevel}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Topic Tags</p>
                <p className="text-gray-900 font-medium truncate" title={viewingInterview.topics?.join(", ")}>
                  {viewingInterview.topics?.length ? viewingInterview.topics.join(", ") : "None"}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-2">Questions Breakdown</h4>
              <div className="space-y-3">
                {viewingInterview.questions?.map((q, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 font-mono text-sm">{idx + 1}.</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-1">{q.question}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getCategoryTheme(q.category)} capitalize`}>
                          {q.category}
                        </span>
                        
                        {(q.expectedPoints?.length > 0 || q.hints?.length > 0) && (
                          <div className="mt-3 grid grid-cols-2 gap-3">
                            {q.expectedPoints?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 mb-1">Expected Points:</p>
                                <ul className="list-disc pl-4 text-xs text-gray-700 space-y-0.5">
                                  {q.expectedPoints.map((pt, i) => <li key={i}>{pt}</li>)}
                                </ul>
                              </div>
                            )}
                            {q.hints?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 mb-1">Hints:</p>
                                <ul className="list-disc pl-4 text-xs text-gray-700 space-y-0.5">
                                  {q.hints.map((hint, i) => <li key={i}>{hint}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

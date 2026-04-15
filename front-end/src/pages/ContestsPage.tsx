import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Trophy,
  Users,
  Clock,
  Calendar,
  Gift,
  Building2,
  Eye,
  Code,
  X,
  Search,
  CheckCircle,
  ListChecks,
  MessageSquare,
  FileText,
} from "lucide-react";
import { contestService, questionService } from "@/services";
import type { IContest } from "@/services/contest.service";
import type { IQuestion, QuestionType } from "@/types";
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

const questionTypeConfig: Record<QuestionType, { label: string; icon: React.ReactNode; variant: "primary" | "secondary" | "info" | "success" }> = {
  SINGLE_CHOICE: { label: "SCQ", icon: <CheckCircle className="h-3 w-3" />, variant: "info" },
  MULTIPLE_CHOICE: { label: "MCQ", icon: <ListChecks className="h-3 w-3" />, variant: "secondary" },
  CODING: { label: "Code", icon: <Code className="h-3 w-3" />, variant: "primary" },
  BEHAVIORAL: { label: "Behav", icon: <MessageSquare className="h-3 w-3" />, variant: "success" },
};

export default function ContestsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [duration, setDuration] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [sponsor, setSponsor] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [rewardsText, setRewardsText] = useState("");

  const [editingContest, setEditingContest] = useState<IContest | null>(null);
  const [contestToDelete, setContestToDelete] = useState<IContest | null>(null);
  const [viewingContest, setViewingContest] = useState<IContest | null>(null);

  // Question management state
  const [questionSearch, setQuestionSearch] = useState("");
  const [questionDiffFilter, setQuestionDiffFilter] = useState("");
  const [questionTypeFilter, setQuestionTypeFilter] = useState("");
  const [availableQuestions, setAvailableQuestions] = useState<IQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [addingQuestions, setAddingQuestions] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

  // Form question selection (used in create/edit modals)
  const [formQuestionIds, setFormQuestionIds] = useState<Set<string>>(new Set());
  const [formQuestionSearch, setFormQuestionSearch] = useState("");
  const [formAvailableQuestions, setFormAvailableQuestions] = useState<IQuestion[]>([]);
  const [formQuestionsLoading, setFormQuestionsLoading] = useState(false);

  const addModal = useModal();
  const editModal = useModal();
  const deleteModal = useModal();
  const viewModal = useModal();
  const questionPickerModal = useModal();

  const fetchContests = useCallback(
    () =>
      contestService.getContests({
        status: statusFilter || undefined,
        limit: 50,
      }),
    [statusFilter]
  );

  const { data, loading, refetch } = useApi(fetchContests, [statusFilter]);
  const contests = data?.contests ?? [];

  const filtered = search
    ? contests.filter(
      (c) =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.sponsor?.toLowerCase().includes(search.toLowerCase())
    )
    : contests;

  // Helpers
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartTime("");
    setEndTime("");
    setDuration("");
    setDifficulty("Medium");
    setSponsor("");
    setMaxParticipants("");
    setRewardsText("");
    setFormQuestionIds(new Set());
    setFormQuestionSearch("");
  };

  // Load questions for form picker
  const loadFormQuestions = async () => {
    setFormQuestionsLoading(true);
    try {
      const res = await questionService.getQuestions({ limit: 200, course: "none", module: "none" });
      setFormAvailableQuestions(res.data.data.questions || []);
    } catch {
      setFormAvailableQuestions([]);
    } finally {
      setFormQuestionsLoading(false);
    }
  };

  const toggleFormQuestion = (id: string) => {
    setFormQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredFormQuestions = formAvailableQuestions.filter((q) => {
    if (formQuestionSearch && !q.title.toLowerCase().includes(formQuestionSearch.toLowerCase())) return false;
    return true;
  });

  const toLocalDatetime = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toISOString().slice(0, 16);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "LIVE":
        return <Badge variant="danger">🔴 Live</Badge>;
      case "UPCOMING":
        return <Badge variant="info">Upcoming</Badge>;
      case "ENDED":
        return <Badge variant="gray">Ended</Badge>;
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  const getDiffBadge = (diff: string) => {
    switch (diff) {
      case "Easy":
        return <Badge variant="success">Easy</Badge>;
      case "Medium":
        return <Badge variant="warning">Medium</Badge>;
      case "Hard":
        return <Badge variant="danger">Hard</Badge>;
      default:
        return <Badge variant="gray">{diff}</Badge>;
    }
  };

  const getContestQuestions = (contest: IContest) => {
    if (!contest.questions) return [];
    return contest.questions.filter((q): q is { _id: string; title: string; difficulty: string; points: number; type?: string; tags?: string[] } => typeof q === "object" && q !== null && "_id" in q);
  };

  // Handlers
  const handleOpenCreate = () => {
    resetForm();
    addModal.open();
    loadFormQuestions();
  };

  const handleCreate = async () => {
    if (!title.trim() || !startTime || !endTime) {
      toast.error("Title, start time, and end time are required");
      return;
    }
    try {
      await contestService.createContest({
        title: title.trim(),
        description,
        startTime,
        endTime,
        duration: Number(duration) || 90,
        difficulty: difficulty as "Easy" | "Medium" | "Hard",
        sponsor: sponsor || undefined,
        maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
        rewards: rewardsText
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean),
        questions: Array.from(formQuestionIds),
      } as any);
      addModal.close();
      resetForm();
      toast.success("Contest created successfully");
      refetch();
    } catch {
      toast.error("Failed to create contest");
    }
  };

  const openEdit = async (contest: IContest) => {
    setEditingContest(contest);
    setTitle(contest.title);
    setDescription(contest.description || "");
    setStartTime(toLocalDatetime(contest.startTime));
    setEndTime(toLocalDatetime(contest.endTime));
    setDuration(contest.duration?.toString() || "");
    setDifficulty(contest.difficulty || "Medium");
    setSponsor(contest.sponsor || "");
    setMaxParticipants(contest.maxParticipants?.toString() || "");
    setRewardsText(contest.rewards?.join(", ") || "");
    // Pre-select existing questions
    const existingIds = (contest.questions || []).map((q: any) => typeof q === 'string' ? q : q._id).filter(Boolean);
    setFormQuestionIds(new Set(existingIds));
    setFormQuestionSearch("");
    editModal.open();
    loadFormQuestions();
  };

  const handleEdit = async () => {
    if (!editingContest) return;
    try {
      await contestService.updateContest(editingContest._id, {
        title: title.trim(),
        description,
        startTime,
        endTime,
        duration: Number(duration) || 90,
        difficulty: difficulty as "Easy" | "Medium" | "Hard",
        sponsor: sponsor || undefined,
        maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
        rewards: rewardsText
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean),
        questions: Array.from(formQuestionIds),
      } as any);
      editModal.close();
      setEditingContest(null);
      resetForm();
      toast.success("Contest updated successfully");
      refetch();
    } catch {
      toast.error("Failed to update contest");
    }
  };

  const handleDelete = async () => {
    if (!contestToDelete) return;
    try {
      await contestService.deleteContest(contestToDelete._id);
      deleteModal.close();
      setContestToDelete(null);
      toast.success("Contest deleted successfully");
      refetch();
    } catch {
      toast.error("Failed to delete contest");
    }
  };

  // ── View contest with populated questions ──
  const openView = async (contest: IContest) => {
    try {
      const res = await contestService.getContestById(contest._id);
      setViewingContest(res.data.data);
    } catch {
      setViewingContest(contest);
    }
    viewModal.open();
  };

  // ── Question picker ──
  const openQuestionPicker = async () => {
    setQuestionSearch("");
    setQuestionDiffFilter("");
    setQuestionTypeFilter("");
    setSelectedQuestionIds(new Set());
    setQuestionsLoading(true);
    questionPickerModal.open();
    try {
      const res = await questionService.getQuestions({ limit: 100, course: "none", module: "none" });
      const allQuestions = res.data.data.questions || [];
      // Filter out questions already in the contest
      const existingIds = new Set(
        getContestQuestions(viewingContest!).map((q) => q._id)
      );
      setAvailableQuestions(allQuestions.filter((q) => !existingIds.has(q._id)));
    } catch {
      toast.error("Failed to load questions");
      setAvailableQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const toggleQuestionSelection = (id: string) => {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddSelectedQuestions = async () => {
    if (!viewingContest || selectedQuestionIds.size === 0) return;
    setAddingQuestions(true);
    try {
      const res = await contestService.addQuestions(
        viewingContest._id,
        Array.from(selectedQuestionIds)
      );
      setViewingContest(res.data.data);
      questionPickerModal.close();
      setSelectedQuestionIds(new Set());
      toast.success(`${selectedQuestionIds.size} question(s) added`);
      refetch();
    } catch {
      toast.error("Failed to add questions");
    } finally {
      setAddingQuestions(false);
    }
  };

  const handleRemoveQuestion = async (questionId: string) => {
    if (!viewingContest) return;
    try {
      const res = await contestService.removeQuestion(viewingContest._id, questionId);
      setViewingContest(res.data.data);
      toast.success("Question removed");
      refetch();
    } catch {
      toast.error("Failed to remove question");
    }
  };

  // Filter available questions by search, diff, type
  const filteredAvailable = availableQuestions.filter((q) => {
    if (questionSearch && !q.title.toLowerCase().includes(questionSearch.toLowerCase())) return false;
    if (questionDiffFilter && q.difficulty !== questionDiffFilter) return false;
    if (questionTypeFilter && q.type !== questionTypeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary-600" />
            Contest Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage coding contests for students
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleOpenCreate}>
          Create Contest
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="w-72">
          <SearchInput
            placeholder="Search contests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          options={[
            { value: "", label: "All Status" },
            { value: "live", label: "🔴 Live" },
            { value: "upcoming", label: "Upcoming" },
            { value: "ended", label: "Ended" },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
        />
      </div>

      {/* Contest Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="bg-surface rounded-xl shadow-card border border-surface-border overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState
              title="No contests found"
              description="Create your first contest to get started."
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-surface-secondary border-b border-surface-border">
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Contest
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Difficulty
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Schedule
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Questions
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Participants
                  </th>
                  <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filtered.map((contest) => {
                  const qCount = Array.isArray(contest.questions) ? contest.questions.length : 0;
                  return (
                    <tr key={contest._id} className="hover:bg-primary-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{contest.title}</p>
                          {contest.sponsor && (
                            <p className="text-xs text-purple-600 flex items-center gap-1 mt-0.5">
                              <Building2 className="h-3 w-3" />
                              {contest.sponsor}
                            </p>
                          )}
                          {contest.rewards?.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {contest.rewards.slice(0, 2).map((r, i) => (
                                <span key={i} className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded">
                                  {r}
                                </span>
                              ))}
                              {contest.rewards.length > 2 && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                                  +{contest.rewards.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(contest.status)}</td>
                      <td className="px-6 py-4 hidden md:table-cell">{getDiffBadge(contest.difficulty)}</td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="text-xs text-gray-600 space-y-0.5">
                          <p className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(contest.startTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                          <p className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {contest.duration} min
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <Badge variant={qCount > 0 ? "primary" : "gray"}>
                          <span className="flex items-center gap-1">
                            <Code className="h-3 w-3" />
                            {qCount} {qCount === 1 ? "question" : "questions"}
                          </span>
                        </Badge>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {contest.participants || 0}
                          {contest.maxParticipants ? `/${contest.maxParticipants}` : ""}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => navigate(`/contests/${contest._id}/submissions`)}
                            className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="View Submissions"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openView(contest)}
                            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="View & Manage Questions"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEdit(contest)}
                            className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => { setContestToDelete(contest); deleteModal.open(); }}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={addModal.isOpen}
        onClose={addModal.close}
        title="Create New Contest"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={addModal.close}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!title.trim() || !startTime || !endTime}>
              Create Contest
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Contest Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Weekly Code Sprint #42"
            required
          />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the contest"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <Input
              label="End Time"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Duration (min)"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="90"
            />
            <Select
              label="Difficulty"
              options={[
                { value: "Easy", label: "Easy" },
                { value: "Medium", label: "Medium" },
                { value: "Hard", label: "Hard" },
              ]}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            />
            <Input
              label="Max Participants"
              type="number"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              placeholder="Unlimited"
            />
          </div>
          <Input
            label="Sponsor (optional)"
            value={sponsor}
            onChange={(e) => setSponsor(e.target.value)}
            placeholder="e.g., TechCorp Inc."
          />
          <Input
            label="Rewards (comma-separated)"
            value={rewardsText}
            onChange={(e) => setRewardsText(e.target.value)}
            placeholder="e.g., 500 XP, Exclusive Badge, Certificate"
          />

          {/* ── Inline Question Picker ── */}
          <div className="border-t border-surface-border pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Code className="h-4 w-4 text-primary-600" />
                Questions ({formQuestionIds.size} selected)
              </label>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions to add..."
                value={formQuestionSearch}
                onChange={(e) => setFormQuestionSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              />
            </div>

            {/* Selected questions */}
            {formQuestionIds.size > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {Array.from(formQuestionIds).map((id) => {
                  const q = formAvailableQuestions.find((q) => q._id === id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-800 rounded-lg text-xs border border-primary-200"
                    >
                      {q?.title || id}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFormQuestion(id); }}
                        className="ml-0.5 text-primary-500 hover:text-primary-800 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Available questions list */}
            {formQuestionsLoading ? (
              <div className="flex justify-center py-4">
                <Spinner size="sm" />
              </div>
            ) : (
              <div className="max-h-[200px] overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-2 bg-gray-50">
                {filteredFormQuestions.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3">No questions available</p>
                ) : (
                  filteredFormQuestions.map((q) => {
                    const isSelected = formQuestionIds.has(q._id);
                    const config = questionTypeConfig[q.type];
                    return (
                      <div
                        key={q._id}
                        onClick={() => toggleFormQuestion(q._id)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm ${isSelected
                            ? "bg-primary-50 border border-primary-200"
                            : "bg-white border border-transparent hover:bg-gray-100"
                          }`}
                      >
                        <div
                          className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-primary-600 border-primary-600" : "border-gray-300"
                            }`}
                        >
                          {isSelected && (
                            <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="flex-1 truncate text-gray-900">{q.title}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {config && (
                            <Badge variant={config.variant}>
                              <span className="flex items-center gap-0.5 text-[10px]">{config.icon} {config.label}</span>
                            </Badge>
                          )}
                          <Badge variant={q.difficulty === "Easy" ? "success" : q.difficulty === "Hard" ? "danger" : "warning"}>
                            <span className="text-[10px]">{q.difficulty}</span>
                          </Badge>
                          <span className="text-[10px] text-gray-400 w-8 text-right">{q.points}p</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModal.isOpen}
        onClose={() => { editModal.close(); setEditingContest(null); resetForm(); }}
        title="Edit Contest"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { editModal.close(); setEditingContest(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!title.trim()}>
              Update Contest
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Contest Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Weekly Code Sprint #42"
            required
          />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the contest"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <Input
              label="End Time"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Duration (min)"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="90"
            />
            <Select
              label="Difficulty"
              options={[
                { value: "Easy", label: "Easy" },
                { value: "Medium", label: "Medium" },
                { value: "Hard", label: "Hard" },
              ]}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            />
            <Input
              label="Max Participants"
              type="number"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              placeholder="Unlimited"
            />
          </div>
          <Input
            label="Sponsor (optional)"
            value={sponsor}
            onChange={(e) => setSponsor(e.target.value)}
            placeholder="e.g., TechCorp Inc."
          />
          <Input
            label="Rewards (comma-separated)"
            value={rewardsText}
            onChange={(e) => setRewardsText(e.target.value)}
            placeholder="e.g., 500 XP, Exclusive Badge, Certificate"
          />

          {/* ── Inline Question Picker ── */}
          <div className="border-t border-surface-border pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Code className="h-4 w-4 text-primary-600" />
                Questions ({formQuestionIds.size} selected)
              </label>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions to add..."
                value={formQuestionSearch}
                onChange={(e) => setFormQuestionSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              />
            </div>

            {/* Selected questions */}
            {formQuestionIds.size > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {Array.from(formQuestionIds).map((id) => {
                  const q = formAvailableQuestions.find((q) => q._id === id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-800 rounded-lg text-xs border border-primary-200"
                    >
                      {q?.title || id}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFormQuestion(id); }}
                        className="ml-0.5 text-primary-500 hover:text-primary-800 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Available questions list */}
            {formQuestionsLoading ? (
              <div className="flex justify-center py-4">
                <Spinner size="sm" />
              </div>
            ) : (
              <div className="max-h-[200px] overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-2 bg-gray-50">
                {filteredFormQuestions.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3">No questions available</p>
                ) : (
                  filteredFormQuestions.map((q) => {
                    const isSelected = formQuestionIds.has(q._id);
                    const config = questionTypeConfig[q.type];
                    return (
                      <div
                        key={q._id}
                        onClick={() => toggleFormQuestion(q._id)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm ${isSelected
                            ? "bg-primary-50 border border-primary-200"
                            : "bg-white border border-transparent hover:bg-gray-100"
                          }`}
                      >
                        <div
                          className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-primary-600 border-primary-600" : "border-gray-300"
                            }`}
                        >
                          {isSelected && (
                            <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="flex-1 truncate text-gray-900">{q.title}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {config && (
                            <Badge variant={config.variant}>
                              <span className="flex items-center gap-0.5 text-[10px]">{config.icon} {config.label}</span>
                            </Badge>
                          )}
                          <Badge variant={q.difficulty === "Easy" ? "success" : q.difficulty === "Hard" ? "danger" : "warning"}>
                            <span className="text-[10px]">{q.difficulty}</span>
                          </Badge>
                          <span className="text-[10px] text-gray-400 w-8 text-right">{q.points}p</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* View Modal with Question Management */}
      <Modal
        isOpen={viewModal.isOpen}
        onClose={() => { viewModal.close(); setViewingContest(null); }}
        title="Contest Details & Questions"
        size="xl"
      >
        {viewingContest && (
          <div className="space-y-5">
            {/* Contest Info */}
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-lg font-semibold text-gray-900">{viewingContest.title}</h3>
              {getStatusBadge(viewingContest.status)}
              {getDiffBadge(viewingContest.difficulty)}
            </div>
            {viewingContest.description && (
              <p className="text-sm text-gray-600">{viewingContest.description}</p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Start</p>
                <p className="text-gray-900 font-medium text-xs">
                  {new Date(viewingContest.startTime).toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">End</p>
                <p className="text-gray-900 font-medium text-xs">
                  {new Date(viewingContest.endTime).toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Duration</p>
                <p className="text-gray-900 font-medium">{viewingContest.duration} min</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Participants</p>
                <p className="text-gray-900 font-medium">
                  {viewingContest.participants || 0}
                  {viewingContest.maxParticipants ? ` / ${viewingContest.maxParticipants}` : ""}
                </p>
              </div>
            </div>

            {viewingContest.sponsor && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-purple-500" />
                <span className="text-gray-600">Sponsored by</span>
                <span className="font-medium text-purple-700">{viewingContest.sponsor}</span>
              </div>
            )}

            {viewingContest.rewards?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <Gift className="h-3.5 w-3.5" /> Rewards
                </p>
                <div className="flex gap-2 flex-wrap">
                  {viewingContest.rewards.map((r, i) => (
                    <span key={i} className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-sm border border-amber-200">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Questions Section ── */}
            <div className="border-t border-surface-border pt-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Code className="h-4 w-4 text-primary-600" />
                  Contest Questions ({getContestQuestions(viewingContest).length})
                </h4>
                <Button
                  size="sm"
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                  onClick={openQuestionPicker}
                >
                  Add Questions
                </Button>
              </div>

              {getContestQuestions(viewingContest).length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <Code className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No questions added yet</p>
                  <p className="text-xs text-gray-400 mt-1">Click "Add Questions" to select from the question bank</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {getContestQuestions(viewingContest).map((q, idx) => {
                    const config = q.type ? questionTypeConfig[q.type as QuestionType] : null;
                    return (
                      <div
                        key={q._id}
                        className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-surface-border hover:border-primary-200 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs text-gray-400 font-mono shrink-0 w-6">{idx + 1}.</span>
                          <span className="text-sm font-medium text-gray-900 truncate">{q.title}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {config && (
                            <Badge variant={config.variant}>
                              <span className="flex items-center gap-1">{config.icon} {config.label}</span>
                            </Badge>
                          )}
                          <Badge variant={q.difficulty === "Easy" ? "success" : q.difficulty === "Hard" ? "danger" : "warning"}>
                            {q.difficulty}
                          </Badge>
                          <span className="text-xs text-gray-500 w-12 text-right">{q.points} pts</span>
                          <button
                            onClick={() => handleRemoveQuestion(q._id)}
                            className="ml-1 p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Remove question"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="text-xs text-gray-500 text-right pt-1">
                    Total: {getContestQuestions(viewingContest).reduce((sum, q) => sum + (q.points || 0), 0)} points
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Question Picker Modal */}
      <Modal
        isOpen={questionPickerModal.isOpen}
        onClose={() => { questionPickerModal.close(); setSelectedQuestionIds(new Set()); }}
        title="Add Questions to Contest"
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => { questionPickerModal.close(); setSelectedQuestionIds(new Set()); }}>
              Cancel
            </Button>
            <Button
              onClick={handleAddSelectedQuestions}
              disabled={selectedQuestionIds.size === 0 || addingQuestions}
              isLoading={addingQuestions}
            >
              Add {selectedQuestionIds.size} Question{selectedQuestionIds.size !== 1 ? "s" : ""}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions..."
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              />
            </div>
            <Select
              options={[
                { value: "", label: "All Types" },
                { value: "CODING", label: "Coding" },
                { value: "SINGLE_CHOICE", label: "Single Choice" },
                { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
              ]}
              value={questionTypeFilter}
              onChange={(e) => setQuestionTypeFilter(e.target.value)}
              className="w-36"
            />
            <Select
              options={[
                { value: "", label: "All Difficulty" },
                { value: "Easy", label: "Easy" },
                { value: "Medium", label: "Medium" },
                { value: "Hard", label: "Hard" },
              ]}
              value={questionDiffFilter}
              onChange={(e) => setQuestionDiffFilter(e.target.value)}
              className="w-36"
            />
          </div>

          {/* Selection info */}
          {selectedQuestionIds.size > 0 && (
            <div className="flex items-center justify-between bg-primary-50 rounded-lg px-4 py-2.5 border border-primary-200">
              <span className="text-sm font-medium text-primary-800">
                {selectedQuestionIds.size} question{selectedQuestionIds.size !== 1 ? "s" : ""} selected
              </span>
              <button
                onClick={() => setSelectedQuestionIds(new Set())}
                className="text-xs text-primary-600 hover:text-primary-800 font-medium cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Question list */}
          {questionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : filteredAvailable.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">
                {availableQuestions.length === 0
                  ? "No questions available in the question bank"
                  : "No questions match your filters"}
              </p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
              {filteredAvailable.map((q) => {
                const isSelected = selectedQuestionIds.has(q._id);
                const config = questionTypeConfig[q.type];
                return (
                  <div
                    key={q._id}
                    onClick={() => toggleQuestionSelection(q._id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${isSelected
                        ? "bg-primary-50 border-primary-300 ring-1 ring-primary-200"
                        : "bg-white border-gray-200 hover:border-primary-200 hover:bg-gray-50"
                      }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected
                          ? "bg-primary-600 border-primary-600"
                          : "border-gray-300"
                        }`}
                    >
                      {isSelected && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{q.title}</p>
                      {q.tags && q.tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {q.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 shrink-0">
                      {config && (
                        <Badge variant={config.variant}>
                          <span className="flex items-center gap-1">{config.icon} {config.label}</span>
                        </Badge>
                      )}
                      <Badge variant={q.difficulty === "Easy" ? "success" : q.difficulty === "Hard" ? "danger" : "warning"}>
                        {q.difficulty}
                      </Badge>
                      <span className="text-xs text-gray-500 w-10 text-right">{q.points}p</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => { deleteModal.close(); setContestToDelete(null); }}
        onConfirm={handleDelete}
        title="Delete Contest"
        message={`Are you sure you want to delete "${contestToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}

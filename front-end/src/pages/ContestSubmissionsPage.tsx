import { useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Clock,
  Trophy,
  ChevronDown,
  FileText,
  CheckCircle,
  XCircle,
  Code,
  Eye,
  X,
  CircleDot,
  ListChecks,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { contestService } from "@/services";
import type { IContestSubmissionsResponse, IContestSubmission } from "@/services/contest.service";
import { Spinner, Badge } from "@/components/ui";

export default function ContestSubmissionsPage() {
  const { id: contestId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewCodeData, setViewCodeData] = useState<{ code: string; language: string; title: string } | null>(null);

  const fetchSubmissions = useCallback(
    () => contestService.getContestSubmissions(contestId!),
    [contestId]
  );

  const { data, loading, error } = useApi<IContestSubmissionsResponse>(fetchSubmissions, [contestId]);

  const submissions = data?.submissions ?? [];
  const contestTitle = data?.contest?.title ?? "Contest";

  const formatTime = (seconds?: number) => {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreVariant = (score: number, total: number): "success" | "warning" | "danger" => {
    if (total === 0) return "danger";
    const pct = (score / total) * 100;
    if (pct >= 70) return "success";
    if (pct >= 40) return "warning";
    return "danger";
  };

  const getStudent = (sub: IContestSubmission) => {
    return typeof sub.student === "object"
      ? sub.student
      : { _id: String(sub.student), name: "Unknown", email: "" };
  };

  /** Resolve the display text for a student's MCQ answer index */
  const getAnswerDisplay = (
    answer: any,
    question: { type: string; options?: string[]; correctAnswer?: string | string[] }
  ) => {
    if (question.type === "CODING") return null;

    const options = question.options || [];

    if (question.type === "SINGLE_CHOICE") {
      const idx = parseInt(String(answer), 10);
      if (!isNaN(idx) && options[idx]) {
        return options[idx];
      }
      return answer != null ? String(answer) : "—";
    }

    if (question.type === "MULTIPLE_CHOICE") {
      const indices = Array.isArray(answer) ? answer : [];
      if (indices.length === 0) return "—";
      return indices
        .map((a: any) => {
          const idx = parseInt(String(a), 10);
          return !isNaN(idx) && options[idx] ? options[idx] : String(a);
        })
        .join(", ");
    }

    // Behavioral
    return answer != null ? String(answer) : "—";
  };

  /** Resolve the correct answer display text */
  const getCorrectAnswerDisplay = (
    question: { type: string; options?: string[]; correctAnswer?: string | string[] }
  ) => {
    const options = question.options || [];
    const correct = question.correctAnswer;

    if (question.type === "SINGLE_CHOICE") {
      const idx = parseInt(String(correct), 10);
      if (!isNaN(idx) && options[idx]) {
        return options[idx];
      }
      return correct != null ? String(correct) : "—";
    }

    if (question.type === "MULTIPLE_CHOICE") {
      const indices = Array.isArray(correct) ? correct : [];
      if (indices.length === 0) return "—";
      return indices
        .map((a: any) => {
          const idx = parseInt(String(a), 10);
          return !isNaN(idx) && options[idx] ? options[idx] : String(a);
        })
        .join(", ");
    }

    return "—";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "SINGLE_CHOICE":
        return <CircleDot className="h-3.5 w-3.5" />;
      case "MULTIPLE_CHOICE":
        return <ListChecks className="h-3.5 w-3.5" />;
      case "CODING":
        return <Code className="h-3.5 w-3.5" />;
      default:
        return <FileText className="h-3.5 w-3.5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "SINGLE_CHOICE": return "MCQ (Single)";
      case "MULTIPLE_CHOICE": return "MCQ (Multiple)";
      case "CODING": return "Coding";
      case "BEHAVIORAL": return "Behavioral";
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-gray-500">
        Failed to load submissions.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/contests")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Contests
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary-600" />
            {contestTitle} — Submissions
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {submissions.length} {submissions.length === 1 ? "submission" : "submissions"} total
          </p>
        </div>
      </div>

      {/* Empty state */}
      {submissions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FileText className="h-10 w-10 text-gray-400 mb-3" />
          <p className="text-gray-500 font-medium">No submissions yet</p>
          <p className="text-gray-400 text-sm mt-1">Students haven't attempted this contest.</p>
        </div>
      )}

      {/* Submissions List */}
      {submissions.length > 0 && (
        <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-secondary border-b border-surface-border">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">
                  #
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Solved
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Time Taken
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Submitted At
                </th>
                <th className="px-5 py-3.5 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {submissions.map((sub, idx) => {
                const student = getStudent(sub);
                const isExpanded = expandedId === sub._id;

                return (
                  <>
                    <tr
                      key={sub._id}
                      onClick={() => setExpandedId(isExpanded ? null : sub._id)}
                      className="hover:bg-primary-50/30 transition-colors cursor-pointer group"
                    >
                      {/* Rank */}
                      <td className="px-5 py-4">
                        <span className={`text-sm font-bold ${idx === 0 ? "text-amber-500" : idx === 1 ? "text-gray-400" : idx === 2 ? "text-amber-700" : "text-gray-500"}`}>
                          {idx + 1}
                        </span>
                      </td>

                      {/* Student */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{student.name}</p>
                            {student.email && (
                              <p className="text-xs text-gray-500">{student.email}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Score */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{sub.score}</span>
                          <Badge variant={getScoreVariant(sub.solvedCount, sub.totalQuestions)}>
                            {sub.solvedCount}/{sub.totalQuestions} solved
                          </Badge>
                        </div>
                      </td>

                      {/* Solved */}
                      <td className="px-5 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full transition-all"
                              style={{ width: `${sub.totalQuestions > 0 ? (sub.solvedCount / sub.totalQuestions) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{sub.totalQuestions > 0 ? Math.round((sub.solvedCount / sub.totalQuestions) * 100) : 0}%</span>
                        </div>
                      </td>

                      {/* Time */}
                      <td className="px-5 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTime(sub.timeTaken)}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-gray-500 hidden lg:table-cell">
                        {sub.finishedAt
                          ? new Date(sub.finishedAt).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })
                          : "In progress"}
                      </td>

                      {/* Expand */}
                      <td className="px-5 py-4">
                        <ChevronDown
                          className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </td>
                    </tr>

                    {/* Expanded: Full question-wise details */}
                    {isExpanded && (
                      <tr key={`${sub._id}-detail`}>
                        <td colSpan={7} className="px-5 py-5 bg-gray-50/80">
                          <div className="space-y-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                              Question-wise Details — {student.name}
                            </p>

                            {sub.answers.length === 0 ? (
                              <p className="text-sm text-gray-400 text-center py-3">No answers submitted</p>
                            ) : (
                              <div className="space-y-3">
                                {sub.answers.map((ans, aIdx) => {
                                  const q = typeof ans.question === "object" ? ans.question : null;
                                  const qType = q?.type || "CODING";
                                  const isMCQ = qType === "SINGLE_CHOICE" || qType === "MULTIPLE_CHOICE";
                                  const isCoding = qType === "CODING";

                                  return (
                                    <div
                                      key={aIdx}
                                      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                                    >
                                      {/* Question header row */}
                                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                        <div className="flex items-center gap-3 min-w-0">
                                          <span className="text-xs text-gray-400 font-mono w-6 shrink-0">{aIdx + 1}.</span>
                                          {ans.passed ? (
                                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                          ) : (
                                            <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                                          )}
                                          <span className="text-sm font-medium text-gray-900 truncate">
                                            {q?.title || "Unknown Question"}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            {getTypeIcon(qType)}
                                            <span>{getTypeLabel(qType)}</span>
                                          </div>
                                          {q?.difficulty && (
                                            <Badge variant={q.difficulty === "Easy" ? "success" : q.difficulty === "Hard" ? "danger" : "warning"}>
                                              {q.difficulty}
                                            </Badge>
                                          )}
                                          <Badge variant={ans.passed ? "success" : "danger"}>
                                            {ans.passed ? "Passed" : "Failed"}
                                          </Badge>
                                          <span className="text-sm font-semibold text-gray-900 w-16 text-right">
                                            {ans.score}/{q?.points || 0}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Details body */}
                                      <div className="px-4 py-3 space-y-3">
                                        {/* MCQ: Show options, student answer, correct answer */}
                                        {isMCQ && q && (
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Student's answer */}
                                            <div>
                                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Student's Answer</p>
                                              <div className={`text-sm font-medium px-3 py-2 rounded-lg border ${
                                                ans.passed ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
                                              }`}>
                                                {getAnswerDisplay(ans.answer, q) || "No answer"}
                                              </div>
                                            </div>

                                            {/* Correct answer */}
                                            <div>
                                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Correct Answer</p>
                                              <div className="text-sm font-medium px-3 py-2 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-800">
                                                {getCorrectAnswerDisplay(q)}
                                              </div>
                                            </div>

                                            {/* All options */}
                                            {q.options && q.options.length > 0 && (
                                              <div className="md:col-span-2">
                                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">All Options</p>
                                                <div className="flex flex-wrap gap-2">
                                                  {q.options.map((opt, optIdx) => {
                                                    const isCorrect = Array.isArray(q.correctAnswer)
                                                      ? q.correctAnswer.includes(String(optIdx))
                                                      : String(q.correctAnswer) === String(optIdx);
                                                    const isStudentPick = Array.isArray(ans.answer)
                                                      ? ans.answer.includes(String(optIdx))
                                                      : String(ans.answer) === String(optIdx);

                                                    return (
                                                      <span
                                                        key={optIdx}
                                                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border ${
                                                          isCorrect && isStudentPick
                                                            ? "bg-green-100 border-green-300 text-green-800"
                                                            : isCorrect
                                                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                                            : isStudentPick
                                                            ? "bg-red-50 border-red-200 text-red-700"
                                                            : "bg-gray-50 border-gray-200 text-gray-600"
                                                        }`}
                                                      >
                                                        {isCorrect && <CheckCircle className="h-3 w-3" />}
                                                        {isStudentPick && !isCorrect && <XCircle className="h-3 w-3" />}
                                                        <span className="font-bold text-gray-400 mr-0.5">{String.fromCharCode(65 + optIdx)}.</span>
                                                        {opt}
                                                      </span>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* Coding: Show language, test cases, and view code button */}
                                        {isCoding && (
                                          <div className="space-y-3">
                                            <div className="flex items-center gap-4 flex-wrap">
                                              <div className="flex items-center gap-1.5 text-xs">
                                                <Code className="h-3.5 w-3.5 text-gray-400" />
                                                <span className="text-gray-600 font-medium">{ans.language}</span>
                                              </div>
                                              <Badge variant={ans.passed ? "success" : "danger"}>
                                                {ans.passedTestCases}/{ans.totalTestCases} test cases
                                              </Badge>
                                              {ans.code && (
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setViewCodeData({
                                                      code: ans.code,
                                                      language: ans.language,
                                                      title: q?.title || `Question ${aIdx + 1}`,
                                                    });
                                                  }}
                                                  className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors cursor-pointer"
                                                >
                                                  <Eye className="h-3.5 w-3.5" />
                                                  View Code
                                                </button>
                                              )}
                                            </div>
                                            {!ans.code && (
                                              <p className="text-xs text-gray-400 italic">No code submitted</p>
                                            )}
                                          </div>
                                        )}

                                        {/* Behavioral */}
                                        {qType === "BEHAVIORAL" && (
                                          <div>
                                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Student's Response</p>
                                            <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-200 whitespace-pre-wrap">
                                              {ans.answer || "No response submitted"}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Code Viewer Modal */}
      {viewCodeData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewCodeData(null)}>
          <div
            className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div>
                <h3 className="font-semibold text-gray-900">{viewCodeData.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                  <Code className="h-3 w-3" />
                  {viewCodeData.language}
                </p>
              </div>
              <button
                onClick={() => setViewCodeData(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-5">
              <pre className="text-sm font-mono text-gray-800 bg-gray-50 rounded-lg border border-gray-200 p-4 overflow-x-auto whitespace-pre">
                {viewCodeData.code}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

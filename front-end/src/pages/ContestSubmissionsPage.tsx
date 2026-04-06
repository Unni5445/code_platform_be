import { useCallback } from "react";
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
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { contestService } from "@/services";
import type { IContestSubmissionsResponse, IContestSubmission } from "@/services/contest.service";
import { Spinner, Badge } from "@/components/ui";
import { useState } from "react";

export default function ContestSubmissionsPage() {
  const { id: contestId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

      {/* Table */}
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

                    {/* Expanded: Per-question details */}
                    {isExpanded && (
                      <tr key={`${sub._id}-detail`}>
                        <td colSpan={7} className="px-5 py-4 bg-gray-50/80">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                              Question-wise Breakdown
                            </p>
                            {sub.answers.length === 0 ? (
                              <p className="text-sm text-gray-400 text-center py-3">No answers submitted</p>
                            ) : (
                              <div className="space-y-2">
                                {sub.answers.map((ans, aIdx) => {
                                  const q = typeof ans.question === "object" ? ans.question : null;
                                  return (
                                    <div
                                      key={aIdx}
                                      className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-surface-border"
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <span className="text-xs text-gray-400 font-mono w-6">{aIdx + 1}.</span>
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
                                        <div className="flex items-center gap-1 text-xs">
                                          <Code className="h-3.5 w-3.5 text-gray-400" />
                                          <span className="text-gray-500">{ans.language}</span>
                                        </div>
                                        <Badge variant={ans.passed ? "success" : "danger"}>
                                          {ans.passedTestCases}/{ans.totalTestCases} tests
                                        </Badge>
                                        <span className="text-sm font-semibold text-gray-900 w-14 text-right">
                                          {ans.score} pts
                                        </span>
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
    </div>
  );
}

import { useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Clock,
  ChevronDown,
  FileText,
  Briefcase,
  Building,
  Target,
  Users,
  // MessageSquare,
  // AlertTriangle,
  // Lightbulb,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { interviewService } from "@/services";
import type { IInterviewAttemptsResponse, IInterviewAttempt } from "@/services/interview.service";
import { Spinner, Badge } from "@/components/ui";

export default function MockInterviewAttemptsPage() {
  const { id: interviewId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchAttempts = useCallback(
    () => interviewService.getInterviewAttempts(interviewId!),
    [interviewId]
  );

  const { data, loading, error } = useApi<IInterviewAttemptsResponse>(fetchAttempts, [interviewId]);

  const attempts = data?.attempts ?? [];
  const interview = data?.interview;

  const formatTime = (seconds?: number) => {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreVariant = (score: number) => {
    if (score >= 80) return "success";
    if (score >= 50) return "warning";
    return "danger";
  };

  const getStudent = (attempt: IInterviewAttempt) => {
    return typeof attempt.student === "object"
      ? attempt.student
      : { _id: String(attempt.student), name: "Unknown", email: "" };
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
        Failed to load attempts.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/interviews")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Interviews
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building className="h-5 w-5 text-purple-600" />
            {interview?.company} — <span className="font-medium text-gray-600"><Briefcase className="h-4 w-4 inline mr-1"/>{interview?.role}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {attempts.length} {attempts.length === 1 ? "attempt" : "attempts"} total
          </p>
        </div>
      </div>

      {/* Empty state */}
      {attempts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FileText className="h-10 w-10 text-gray-400 mb-3" />
          <p className="text-gray-500 font-medium">No attempts yet</p>
          <p className="text-gray-400 text-sm mt-1">Students haven't attempted this mock interview.</p>
        </div>
      )}

      {/* Table */}
      {attempts.length > 0 && (
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
                  Overall Score
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Category Breakdown
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Time Taken
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                  Completed At
                </th>
                <th className="px-5 py-3.5 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {attempts.map((attempt, idx) => {
                const student = getStudent(attempt);
                const isExpanded = expandedId === attempt._id;
                const { technicalDepth, communication, edgeCases, problemSolving } = attempt.scores;

                return (
                  <>
                    <tr
                      key={attempt._id}
                      onClick={() => setExpandedId(isExpanded ? null : attempt._id)}
                      className="hover:bg-primary-50/30 transition-colors cursor-pointer group"
                    >
                      {/* Rank */}
                      <td className="px-5 py-4">
                        <span className={`text-sm font-bold ${idx === 0 ? "text-primary-500" : "text-gray-500"}`}>
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
                          <Target className={`h-4 w-4 ${attempt.overallScore >= 80 ? "text-green-500" : attempt.overallScore >= 50 ? "text-amber-500" : "text-red-500"}`} />
                          <span className="font-bold text-gray-900">{attempt.overallScore}</span>
                          <span className="text-gray-500 text-xs">/ 100</span>
                        </div>
                      </td>

                      {/* Score Breakdown Bars */}
                      <td className="px-5 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-3 text-[10px]">
                          <div className="flex flex-col items-center gap-0.5" title={`Tech: ${technicalDepth}`}>
                            <div className="h-6 w-1.5 bg-gray-200 rounded-full flex items-end overflow-hidden">
                              <div className="w-full bg-blue-500 rounded-full" style={{ height: `${technicalDepth}%` }} />
                            </div>
                            <span className="text-gray-500">T</span>
                          </div>
                          <div className="flex flex-col items-center gap-0.5" title={`Comm: ${communication}`}>
                            <div className="h-6 w-1.5 bg-gray-200 rounded-full flex items-end overflow-hidden">
                              <div className="w-full bg-emerald-500 rounded-full" style={{ height: `${communication}%` }} />
                            </div>
                            <span className="text-gray-500">C</span>
                          </div>
                          <div className="flex flex-col items-center gap-0.5" title={`Edge: ${edgeCases}`}>
                            <div className="h-6 w-1.5 bg-gray-200 rounded-full flex items-end overflow-hidden">
                              <div className="w-full bg-purple-500 rounded-full" style={{ height: `${edgeCases}%` }} />
                            </div>
                            <span className="text-gray-500">E</span>
                          </div>
                          <div className="flex flex-col items-center gap-0.5" title={`Prob: ${problemSolving}`}>
                            <div className="h-6 w-1.5 bg-gray-200 rounded-full flex items-end overflow-hidden">
                              <div className="w-full bg-amber-500 rounded-full" style={{ height: `${problemSolving}%` }} />
                            </div>
                            <span className="text-gray-500">P</span>
                          </div>
                        </div>
                      </td>

                      {/* Time */}
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTime(attempt.timeTaken)}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-gray-500 hidden xl:table-cell text-xs">
                        {attempt.completedAt
                          ? new Date(attempt.completedAt).toLocaleDateString("en-IN", {
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

                    {/* Expanded: Detailed answers and exact breakdown */}
                    {isExpanded && (
                      <tr key={`${attempt._id}-detail`}>
                        <td colSpan={7} className="px-5 py-4 bg-gray-50/80">
                          <div className="space-y-4 max-w-4xl">
                            <div className="flex gap-4">
                              <div className="bg-white p-3 rounded-lg border border-gray-200 flex-1 flex flex-col items-center justify-center">
                                <span className="text-xs text-gray-500 uppercase font-semibold mb-1">Technical</span>
                                <span className={`text-lg font-bold ${getScoreVariant(technicalDepth) === 'success' ? 'text-green-600' : 'text-gray-800'}`}>{technicalDepth}%</span>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-gray-200 flex-1 flex flex-col items-center justify-center">
                                <span className="text-xs text-gray-500 uppercase font-semibold mb-1">Communication</span>
                                <span className={`text-lg font-bold ${getScoreVariant(communication) === 'success' ? 'text-green-600' : 'text-gray-800'}`}>{communication}%</span>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-gray-200 flex-1 flex flex-col items-center justify-center">
                                <span className="text-xs text-gray-500 uppercase font-semibold mb-1">Edge Cases</span>
                                <span className={`text-lg font-bold ${getScoreVariant(edgeCases) === 'success' ? 'text-green-600' : 'text-gray-800'}`}>{edgeCases}%</span>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-gray-200 flex-1 flex flex-col items-center justify-center">
                                <span className="text-xs text-gray-500 uppercase font-semibold mb-1">Problem Solving</span>
                                <span className={`text-lg font-bold ${getScoreVariant(problemSolving) === 'success' ? 'text-green-600' : 'text-gray-800'}`}>{problemSolving}%</span>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Answer Log (Self-Evaluated)
                              </p>
                              {attempt.answers.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-3 bg-white rounded-lg border border-gray-200">No responses recorded</p>
                              ) : (
                                <div className="space-y-2">
                                  {attempt.answers.map((ans, aIdx) => (
                                    <div
                                      key={aIdx}
                                      className="bg-white rounded-lg p-3 border border-surface-border text-sm"
                                    >
                                      <div className="flex items-center justify-between mb-2 border-b border-gray-100 pb-2">
                                        <span className="font-semibold text-gray-700">Question {ans.questionIndex + 1}</span>
                                        <Badge variant={ans.selfScore && ans.selfScore >= 4 ? "success" : ans.selfScore && ans.selfScore >= 3 ? "warning" : "danger"}>
                                          Self Score: {ans.selfScore || 0}/5
                                        </Badge>
                                      </div>
                                      <p className="whitespace-pre-wrap text-gray-600 italic">
                                        {ans.response || "— No transcript available —"}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
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

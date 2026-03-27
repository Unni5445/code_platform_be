import { useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Clock, Trophy, ChevronRight, FileText } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { testService } from "@/services";
import { Spinner, Badge } from "@/components/ui";

interface SubmissionRow {
  _id: string;
  student: { _id: string; name: string; email: string } | string;
  totalScore: number;
  maxScore: number;
  attemptedAt: string;
  completedAt?: string;
}

export default function TestSubmissionsPage() {
  const { id: testId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const fetchSubmissions = useCallback(
    () => testService.getTestSubmissions(testId!),
    [testId]
  );

  const { data: submissions, loading, error } = useApi<SubmissionRow[]>(fetchSubmissions, [testId]);

  const getDuration = (start: string, end?: string) => {
    if (!end) return "—";
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  const getScoreVariant = (pct: number): "success" | "warning" | "danger" => {
    if (pct >= 70) return "success";
    if (pct >= 40) return "warning";
    return "danger";
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

  const rows = submissions ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Submissions</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {rows.length} {rows.length === 1 ? "submission" : "submissions"} total
          </p>
        </div>
      </div>

      {/* Empty state */}
      {rows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FileText className="h-10 w-10 text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">No submissions yet</p>
          <p className="text-gray-600 text-sm mt-1">Students haven't attempted this test.</p>
        </div>
      )}

      {/* Table */}
      {rows.length > 0 && (
        <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Attempted At
                </th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {rows.map((sub) => {
                const student =
                  typeof sub.student === "object"
                    ? sub.student
                    : { _id: String(sub.student), name: "Unknown", email: "" };
                const pct =
                  sub.maxScore > 0
                    ? Math.round((sub.totalScore / sub.maxScore) * 100)
                    : 0;

                return (
                  <tr
                    key={sub._id}
                    onClick={() => navigate(`/tests/${testId}/submissions/${sub._id}`)}
                    className="hover:bg-surface-secondary transition-colors cursor-pointer group"
                  >
                    {/* Student */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary-600/20 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-primary-400" />
                        </div>
                        <div>
                          <p className="font-medium ">{student.name}</p>
                          {student.email && (
                            <p className="text-xs text-gray-500">{student.email}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Score */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-gray-500" />
                        <span className="font-semibold ">
                          {sub.totalScore}
                          <span className="text-gray-500 font-normal">/{sub.maxScore}</span>
                        </span>
                        <Badge variant={getScoreVariant(pct)} className="text-xs px-2 py-0.5">
                          {pct}%
                        </Badge>
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Clock className="h-3.5 w-3.5" />
                        {getDuration(sub.attemptedAt, sub.completedAt)}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-gray-400">
                      {new Date(sub.attemptedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    {/* Arrow */}
                    <td className="px-5 py-4">
                      <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-gray-400 transition-colors ml-auto" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

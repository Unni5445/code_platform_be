import { useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, Code2, Clock, Trophy } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { testService } from "@/services";
import type { SubmissionDetail } from "@/services/test.service";
import { Card, Spinner, Badge, Button } from "@/components/ui";

export default function TestResultPage() {
  const { id: submissionId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const fetchSubmission = useCallback(
    () => testService.getSubmission(submissionId!),
    [submissionId]
  );
  const { data: submission, loading } = useApi<SubmissionDetail>(fetchSubmission, [submissionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Submission not found.</p>
        <Button onClick={() => navigate("/tests")} className="mt-4">
          Back to Tests
        </Button>
      </div>
    );
  }

  const maxScore = submission.answers.reduce((sum, a) => sum + a.maxScore, 0);
  const percentage = maxScore > 0 ? Math.round((submission.totalScore / maxScore) * 100) : 0;
  const completedDate = submission.completedAt
    ? new Date(submission.completedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "In Progress";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/tests")} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back
        </Button>
        <div>
          <h1 className="text-xl font-bold text-white">{submission.test.title}</h1>
          {submission.test.description && (
            <p className="text-sm text-slate-400 mt-1">{submission.test.description}</p>
          )}
        </div>
      </div>

      {/* Score Overview */}
      <Card>
        <div className="flex flex-col items-center sm:flex-row sm:justify-between gap-6">
          <div className="flex items-center gap-6">
            <div
              className={`text-5xl font-bold ${
                percentage >= 70
                  ? "text-emerald-400"
                  : percentage >= 40
                  ? "text-amber-400"
                  : "text-red-400"
              }`}
            >
              {percentage}%
            </div>
            <div>
              <div className="flex items-center gap-2 text-white">
                <Trophy className="h-5 w-5 text-emerald-400" />
                <span className="text-2xl font-bold">
                  {submission.totalScore} / {maxScore}
                </span>
              </div>
              <Badge
                variant={percentage >= 70 ? "success" : percentage >= 40 ? "warning" : "danger"}
                className="mt-2"
              >
                {percentage >= 70 ? "Passed" : percentage >= 40 ? "Needs Improvement" : "Failed"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {completedDate}
            </span>
          </div>
        </div>
      </Card>

      {/* Question Breakdown */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Question Breakdown</h2>
        <div className="space-y-3">
          {submission.answers.map((ans, index) => {
            const q = ans.question;
            const isCorrect = ans.score === ans.maxScore && ans.score > 0;
            const isPartial = ans.score > 0 && ans.score < ans.maxScore;

            return (
              <Card key={q._id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : isPartial ? (
                        <CheckCircle2 className="h-5 w-5 text-amber-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-medium text-slate-300">Q{index + 1}.</span>
                        <h3 className="font-medium text-white">{q.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="gray" className="text-xs">
                          {q.type.replace("_", " ")}
                        </Badge>
                        <Badge
                          variant={
                            q.difficulty === "Easy"
                              ? "success"
                              : q.difficulty === "Hard"
                              ? "danger"
                              : "warning"
                          }
                          className="text-xs"
                        >
                          {q.difficulty}
                        </Badge>
                        {q.type === "CODING" && ans.language && (
                          <Badge variant="primary" className="text-xs">
                            <Code2 className="h-3 w-3 mr-1 inline" />
                            {ans.language}
                          </Badge>
                        )}
                      </div>

                      {/* Show answer for non-coding questions */}
                      {q.type !== "CODING" && ans.answer && (
                        <div className="mt-3 text-sm">
                          <span className="text-slate-400">Your answer: </span>
                          <span className="text-slate-200">
                            {Array.isArray(ans.answer) ? ans.answer.join(", ") : ans.answer}
                          </span>
                        </div>
                      )}

                      {/* Show code for coding questions */}
                      {q.type === "CODING" && ans.code && (
                        <div className="mt-3">
                          <p className="text-sm text-slate-400 mb-1">Your code:</p>
                          <pre className="bg-slate-900/80 rounded-lg p-3 text-xs font-mono text-slate-200 overflow-x-auto max-h-40 overflow-y-auto">
                            {ans.code}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-lg font-bold ${
                        isCorrect
                          ? "text-emerald-400"
                          : isPartial
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    >
                      {ans.score}
                    </span>
                    <span className="text-slate-500"> / {ans.maxScore}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

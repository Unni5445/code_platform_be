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
      <div className="flex items-center justify-center py-20 bg-slate-50 min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-20 bg-slate-50 min-h-screen">
        <p className="text-slate-500 font-bold">Submission not found.</p>
        <Button onClick={() => navigate("/tests")} className="mt-4 font-bold px-8">
          Back to Tests Dashboard
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
        <Button variant="secondary" onClick={() => navigate("/tests")} className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{submission.test.title}</h1>
          {submission.test.description && (
            <p className="text-sm font-medium text-slate-500 mt-1">{submission.test.description}</p>
          )}
        </div>
      </div>

      {/* Score Overview */}
      <Card className="bg-white border-slate-200 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 h-32 w-32 bg-primary-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
        <div className="flex flex-col items-center sm:flex-row sm:justify-between gap-8 p-4">
          <div className="flex items-center gap-8">
            <div
              className={`text-6xl font-extrabold pb-1 ${
                percentage >= 70
                  ? "text-emerald-600"
                  : percentage >= 40
                  ? "text-amber-600"
                  : "text-red-600"
              }`}
            >
              {percentage}%
            </div>
            <div className="h-16 w-px bg-slate-100 hidden sm:block" />
            <div>
              <div className="flex items-center gap-3 text-slate-900">
                <Trophy className="h-6 w-6 text-amber-500" />
                <span className="text-3xl font-extrabold">
                  {submission.totalScore} <span className="text-slate-300 text-lg">/ {maxScore}</span>
                </span>
              </div>
              <Badge
                variant={percentage >= 70 ? "success" : percentage >= 40 ? "warning" : "danger"}
                className="mt-3 px-4 py-1.5 rounded-full font-bold uppercase tracking-wider text-[10px]"
              >
                {percentage >= 70 ? "PASSED ASSESSMENT" : percentage >= 40 ? "NEEDS IMPROVEMENT" : "FAILED ASSESSMENT"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Completed on {completedDate}
            </span>
          </div>
        </div>
      </Card>

      {/* Question Breakdown */}
      <div className="pb-8">
        <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-1">Detailed Breakdown</h2>
        <div className="space-y-4">
          {submission.answers.map((ans, index) => {
            const q = ans.question;
            const isCorrect = ans.score === ans.maxScore && ans.score > 0;
            const isPartial = ans.score > 0 && ans.score < ans.maxScore;

            return (
              <Card key={q._id} className="bg-white border-slate-200 shadow-sm hover:border-slate-300 transition-all p-5">
                <div className="flex items-start justify-between gap-8">
                  <div className="flex items-start gap-5 flex-1 min-w-0">
                    <div className="mt-1 shrink-0 p-2 rounded-xl bg-slate-50 border border-slate-100 shadow-xs">
                      {isCorrect ? (
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                      ) : isPartial ? (
                        <CheckCircle2 className="h-6 w-6 text-amber-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-100">Q{index + 1}</span>
                        <h3 className="font-bold text-slate-900 text-lg truncate">{q.title}</h3>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap mb-6">
                        <Badge variant="gray" className="text-[10px] font-bold uppercase tracking-wider py-0.5">
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
                          className="text-[10px] font-bold uppercase tracking-wider py-0.5"
                        >
                          {q.difficulty}
                        </Badge>
                        {q.type === "CODING" && ans.language && (
                          <Badge variant="primary" className="text-[10px] font-bold uppercase tracking-wider py-0.5">
                            <Code2 className="h-3 w-3 mr-1.5 inline" />
                            {ans.language}
                          </Badge>
                        )}
                      </div>

                      {/* Show answer for non-coding questions */}
                      {q.type !== "CODING" && ans.answer && (
                        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 shadow-inner">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Participant Response</span>
                          <span className="text-sm font-bold text-slate-900 leading-relaxed">
                            {Array.isArray(ans.answer) ? ans.answer.join(", ") : ans.answer}
                          </span>
                        </div>
                      )}

                      {/* Show code for coding questions */}
                      {q.type === "CODING" && ans.code && (
                        <div className="mt-4">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Participant Code</p>
                          <pre className="bg-slate-50 rounded-2xl p-6 text-xs font-mono text-slate-700 overflow-x-auto max-h-80 overflow-y-auto leading-relaxed shadow-inner border border-slate-200">
                            {ans.code}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 shadow-inner">
                      <span
                        className={`text-xl font-extrabold ${
                          isCorrect
                            ? "text-emerald-600"
                            : isPartial
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        {ans.score}
                      </span>
                      <span className="text-slate-400 font-bold ml-1">/ {ans.maxScore}</span>
                    </div>
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

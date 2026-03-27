import { useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Clock,
  Trophy,
  CheckCircle,
  XCircle,
  Code2,
  MessageSquare,
  ListChecks,
  Calendar,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { testService } from "@/services";
import { Spinner, Badge } from "@/components/ui";

interface AnswerDetail {
  question: {
    _id: string;
    title: string;
    type: "MCQ" | "MULTIPLE_CHOICE" | "CODING" | "SHORT_ANSWER" | string;
    difficulty: string;
    options?: { label: string; value: string }[];
  } | string;
  answer?: string | string[];
  code?: string;
  language?: string;
  score: number;
  maxScore: number;
}

interface SubmissionDetail {
  _id: string;
  student: { _id: string; name: string; email: string } | string;
  test: { _id: string; title: string } | string;
  answers: AnswerDetail[];
  totalScore: number;
  maxScore: number;
  attemptedAt: string;
  completedAt?: string;
}

export default function SubmissionDetailPage() {
  const { id, submissionId } = useParams<{ id: string; submissionId: string }>();
  const navigate = useNavigate();

  const fetchSubmission = useCallback(
    () => testService.getSubmissionById(submissionId!),
    [id,submissionId]
  );

  const { data: submission, loading, error } = useApi<SubmissionDetail>(fetchSubmission, [submissionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="text-center py-20 text-gray-500">Submission not found.</div>
      </div>
    );
  }

  const student =
    typeof submission.student === "object"
      ? submission.student
      : { _id: String(submission.student), name: "Unknown", email: "" };

  const testTitle =
    typeof submission.test === "object" ? submission.test.title : "Test";

  const pct =
    submission.maxScore > 0
      ? Math.round((submission.totalScore / submission.maxScore) * 100)
      : 0;

  const getDuration = (start: string, end?: string) => {
    if (!end) return "—";
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  const getScoreVariant = (p: number): "success" | "warning" | "danger" =>
    p >= 70 ? "success" : p >= 40 ? "warning" : "danger";

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case "CODING":        return <Code2 className="h-4 w-4" />;
      case "MCQ":
      case "MULTIPLE_CHOICE": return <ListChecks className="h-4 w-4" />;
      default:              return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Submissions
      </button>

      {/* Summary card */}
      <div className="bg-surface rounded-xl border border-surface-border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Student info */}
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary-600/20 flex items-center justify-center shrink-0">
              <User className="h-6 w-6 text-primary-400" />
            </div>
            <div>
              <p className="font-bold text-black text-lg">{student.name}</p>
              {student.email && <p className="text-sm text-gray-500">{student.email}</p>}
              <p className="text-xs text-gray-600 mt-0.5">{testTitle}</p>
            </div>
          </div>

          {/* Score pill */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              <span className="text-2xl font-bold text-white">
                {submission.totalScore}
                <span className="text-gray-500 text-lg font-normal">/{submission.maxScore}</span>
              </span>
            </div>
            <Badge variant={getScoreVariant(pct)} className="text-sm px-3 py-0.5">
              {pct}% — {pct >= 70 ? "Passed" : pct >= 40 ? "Needs Improvement" : "Failed"}
            </Badge>
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-5 pt-5 border-t border-surface-border flex flex-wrap gap-6 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {new Date(submission.attemptedAt).toLocaleDateString("en-IN", {
              day: "numeric", month: "long", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            Duration: {getDuration(submission.attemptedAt, submission.completedAt)}
          </span>
          <span className="text-gray-600 text-xs font-mono">ID: {submission._id}</span>
        </div>
      </div>

      {/* Answers */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Answers ({submission.answers.length})
        </h2>

        {submission.answers.map((ans, idx) => {
          const question =
            typeof ans.question === "object" ? ans.question : null;
          const title   = question?.title ?? `Question ${idx + 1}`;
          const type    = question?.type  ?? "UNKNOWN";
          const diff    = question?.difficulty;
          const scorePct = ans.maxScore > 0 ? Math.round((ans.score / ans.maxScore) * 100) : 0;
          const isCorrect = ans.score >= ans.maxScore;
          const isPartial = ans.score > 0 && ans.score < ans.maxScore;

          return (
            <div
              key={`${ans.question?.toString()}-${idx}`}
              className="bg-surface rounded-xl border border-surface-border overflow-hidden"
            >
              {/* Question header */}
              <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-surface-border">
                <div className="flex items-start gap-3">
                  {/* Score indicator stripe */}
                  <div className={`mt-0.5 shrink-0 ${isCorrect ? "text-emerald-400" : isPartial ? "text-amber-400" : "text-red-400"}`}>
                    {isCorrect
                      ? <CheckCircle className="h-5 w-5" />
                      : <XCircle className="h-5 w-5" />
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs text-gray-500 font-medium">Q{idx + 1}</span>
                      <span className="flex items-center gap-1 text-xs text-gray-500 bg-surface-secondary px-2 py-0.5 rounded-full">
                        {getQuestionIcon(type)}
                        {type.replace("_", " ")}
                      </span>
                      {diff && (
                        <Badge
                          variant={diff === "Easy" ? "success" : diff === "Hard" ? "danger" : "warning"}
                          className="text-xs px-2 py-0"
                        >
                          {diff}
                        </Badge>
                      )}
                    </div>
                    <p className="text-white font-medium text-sm">{title}</p>
                  </div>
                </div>

                {/* Per-question score */}
                <div className="shrink-0 text-right">
                  <span className="text-white font-bold">{ans.score}</span>
                  <span className="text-gray-500">/{ans.maxScore}</span>
                  <div className="text-xs text-gray-600 mt-0.5">{scorePct}%</div>
                </div>
              </div>

              {/* Answer body */}
              <div className="px-5 py-4 space-y-3">
                {/* MCQ / Short answer */}
                {type !== "CODING" && ans.answer !== undefined && ans.answer !== "" && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Answer</p>
                    {Array.isArray(ans.answer) ? (
                      <div className="flex flex-wrap gap-2">
                        {ans.answer.map((a, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-full text-sm bg-surface-secondary text-white border border-surface-border"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-white bg-surface-secondary rounded-lg px-4 py-3 border border-surface-border">
                        {ans.answer || <span className="text-gray-600 italic">No answer provided</span>}
                      </p>
                    )}
                  </div>
                )}

                {/* No answer */}
                {type !== "CODING" && (ans.answer === "" || ans.answer === undefined) && (
                  <p className="text-sm text-gray-600 italic">No answer provided</p>
                )}

                {/* Coding answer */}
                {type === "CODING" && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Code</p>
                      {ans.language && (
                        <span className="text-xs text-gray-500 bg-surface-secondary px-2 py-0.5 rounded font-mono border border-surface-border">
                          {ans.language}
                        </span>
                      )}
                    </div>
                    {ans.code ? (
                      <pre className="text-xs text-gray-300 bg-surface-secondary rounded-lg p-4 border border-surface-border overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">
                        {ans.code}
                      </pre>
                    ) : (
                      <p className="text-sm text-gray-600 italic">No code submitted</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

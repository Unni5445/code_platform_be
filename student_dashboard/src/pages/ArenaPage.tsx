import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  ArrowLeft,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Send,
  Zap,
  Trophy,
  Flame,
  Tag,
  Timer,
  Lightbulb,
  Lock,
  Shield,
  TrendingUp,
  History,
  Eye,
  Clock,
} from "lucide-react";
import { Button, Badge, Spinner, Card } from "@/components/ui";
import { authService, playgroundService } from "@/services";
import { codeService } from "@/services";
import type { IQuestion } from "@/types";
import type { SubmissionHistoryItem } from "@/services/playground.service";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

const MONACO_LANGUAGE_MAP: Record<string, string> = {
  javascript: "javascript",
  python: "python",
  java: "java",
  cpp: "cpp",
  c: "c",
};

const DIFFICULTY_COLORS: Record<string, "success" | "warning" | "danger"> = {
  Easy: "success",
  Medium: "warning",
  Hard: "danger",
};

interface TestResult {
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  hidden?: boolean;
}

// ─── Timer Component ───
function BattleTimer({ isRunning }: { isRunning: boolean }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const iv = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(iv);
  }, [isRunning]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm">
      <Timer className={`h-4 w-4 ${seconds > 600 ? "text-red-500" : seconds > 300 ? "text-amber-500" : "text-primary-500"}`} />
      <span className={`font-mono text-sm font-bold ${seconds > 600 ? "text-red-600" : seconds > 300 ? "text-amber-600" : "text-slate-900"}`}>
        {mm}:{ss}
      </span>
    </div>
  );
}

// ─── Victory Modal ───
function VictoryModal({
  open,
  score,
  passed,
  total,
  onClose,
}: {
  open: boolean;
  score: number;
  passed: number;
  total: number;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md" />
      <div
        className="relative rounded-3xl bg-white border border-slate-200 shadow-2xl p-8 max-w-md w-full text-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative background element */}
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary-50 opacity-50 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-emerald-50 opacity-50 blur-3xl" />
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${8 + Math.random() * 12}px`,
                height: `${8 + Math.random() * 12}px`,
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                background: i % 2 === 0
                  ? "radial-gradient(circle, rgba(16,185,129,0.2), transparent)"
                  : "radial-gradient(circle, rgba(245,158,11,0.2), transparent)",
                animation: `mc-float ${3 + Math.random() * 4}s ease-in-out infinite alternate`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Trophy */}
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-amber-50 to-emerald-50 border border-emerald-100 shadow-xl shadow-emerald-500/10">
          <Trophy className="h-12 w-12 text-amber-500" />
        </div>

        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Quest Complete!</h2>
        <p className="text-slate-500 font-medium text-sm mb-8">You have conquered this challenge</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 shadow-sm">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-xl font-extrabold text-slate-900">+{score}</p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">XP Earned</p>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 shadow-sm">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="h-4 w-4 text-orange-600" />
            </div>
            <p className="text-xl font-extrabold text-slate-900">🔥</p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Streak Up</p>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 shadow-sm">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-xl font-extrabold text-slate-900">{passed}/{total}</p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Passed</p>
          </div>
        </div>

        <Button onClick={onClose} className="w-full">
          Continue Questing
        </Button>
      </div>
    </div>
  );
}

// ─── Hints Panel ───
function HintsPanel({ question }: { question: IQuestion }) {
  const { user, updateUserLocally } = useAuth();
  const [isUnlocking, setIsUnlocking] = useState<number | null>(null);

  const hints =
    question.hints && question.hints.length > 0
      ? question.hints
      : [
        "Think about the edge cases for this problem.",
        "Consider the time complexity of your approach.",
        "Try breaking the problem into smaller sub-problems.",
      ];

  const unlockedIndices =
    user?.unlockedHints
      ?.filter((h) => h.questionId === question._id)
      .map((h) => h.hintIndex) || [];

  const handleUnlock = async (index: number) => {
    const xpCost = (index + 1) * 5;
    setIsUnlocking(index);
    try {
      const res = await authService.unlockHint(question._id, index, xpCost);
      if (res.data.success && res.data.data) {
        updateUserLocally(res.data.data);
        toast.success("Hint unlocked!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to unlock hint");
    } finally {
      setIsUnlocking(null);
    }
  };

  return (
    <Card>
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-500" />
        Hints
      </h2>
      <div className="space-y-3">
        {hints.map((hint, i) => {
          const isUnlocked = unlockedIndices.includes(i);
          const isLoad = isUnlocking === i;

          return (
            <div
              key={i}
              className={`rounded-xl p-3 text-sm transition-all duration-300 border ${isUnlocked
                  ? "bg-amber-50 border-amber-100 text-amber-900 font-medium"
                  : "bg-slate-50 border-slate-100 text-slate-400"
                }`}
            >
              {isUnlocked ? (
                <p>{hint}</p>
              ) : (
                <button
                  onClick={() => !isLoad && handleUnlock(i)}
                  disabled={isLoad}
                  className="flex items-center gap-2 w-full cursor-pointer hover:text-amber-600 transition-colors font-bold disabled:opacity-50"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>{isLoad ? "Unlocking..." : `Unlock Hint ${i + 1}`}</span>
                  {!isLoad && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                      <Zap className="h-3 w-3" /> -{(i + 1) * 5} XP
                    </span>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Submission History Panel ───
function SubmissionHistoryPanel({
  submissions,
  loading,
  onViewCode,
}: {
  submissions: SubmissionHistoryItem[];
  loading: boolean;
  onViewCode: (code: string, language: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
        <History className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-900">No submissions yet</p>
        <p className="text-xs font-medium text-slate-500 mt-1">Your battle history will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {submissions.map((sub) => {
        const allPassed = sub.passedTestCases === sub.totalTestCases && sub.totalTestCases > 0;
        const date = new Date(sub.attemptedAt);
        return (
          <div
            key={sub._id}
            className={`rounded-xl p-4 border transition-all duration-200 shadow-sm ${allPassed
                ? "bg-emerald-50 border-emerald-100 hover:border-emerald-300"
                : "bg-red-50 border-red-100 hover:border-red-300"
              }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {allPassed ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className={`text-sm font-bold ${allPassed ? "text-emerald-800" : "text-red-800"}`}>
                    {allPassed ? "Accepted" : "Wrong Answer"}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Clock className="h-3 w-3" />
                    {date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-700">
                    {sub.passedTestCases}/{sub.totalTestCases} PASSED
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{sub.language}</p>
                </div>
                <button
                  onClick={() => onViewCode(sub.code, sub.language)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:border-primary-500 hover:text-primary-600 transition-all cursor-pointer shadow-sm"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Arena Page ───
export default function ArenaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [question, setQuestion] = useState<IQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("");
  const [timerRunning, setTimerRunning] = useState(false);

  // Run code
  const [isRunning, setIsRunning] = useState(false);
  const [runOutput, setRunOutput] = useState("");
  const [runHasError, setRunHasError] = useState(false);
  const [customInput, setCustomInput] = useState("");

  // Submit solution
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    allPassed: boolean;
    score: number;
    passed: number;
    total: number;
    results: TestResult[];
  } | null>(null);

  // Victory modal
  const [showVictory, setShowVictory] = useState(false);

  // Right panel tab
  const [rightTab, setRightTab] = useState<"description" | "submissions">("description");

  // Submission history
  const [submissions, setSubmissions] = useState<SubmissionHistoryItem[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    if (!id) return;
    setSubmissionsLoading(true);
    try {
      const res = await playgroundService.getSubmissions(id);
      setSubmissions(res.data.data);
    } catch {
      setSubmissions([]);
    }
    setSubmissionsLoading(false);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await playgroundService.getQuestionById(id);
        const q = res.data.data;
        setQuestion(q);
        const defaultLang = q.languages?.[0] || "javascript";
        setLanguage(defaultLang);
        setCode(q.starterCode?.[defaultLang] || "");
        setTimerRunning(true);
      } catch {
        toast.error("Question not found");
        navigate("/quests");
      }
      setLoading(false);
    })();
  }, [id, navigate]);

  useEffect(() => {
    if (rightTab === "submissions") {
      fetchSubmissions();
    }
  }, [rightTab, fetchSubmissions]);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setCode(question?.starterCode?.[newLang] || "");
  };

  const handleRun = async () => {
    if (!question) return;
    if (!customInput.trim()) {
      toast.error("Please provide input before running");
      return;
    }
    setIsRunning(true);
    setRunOutput("");
    setRunHasError(false);
    setSubmitResult(null);

    try {
      const res = await codeService.execute(language, "latest", code, customInput);
      const data = res.data.data;
      if (data.stderr) {
        setRunOutput(data.stderr);
        setRunHasError(true);
      } else {
        setRunOutput(data.stdout || data.output || "(no output)");
      }
    } catch {
      toast.error("Failed to run code");
    }
    setIsRunning(false);
  };

  const handleSubmit = async () => {
    if (!question) return;
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const res = await playgroundService.submitSolution(question._id, language, code);
      const data = res.data.data;
      setSubmitResult(data);

      if (data.allPassed) {
        setShowVictory(true);
        setTimerRunning(false);
      } else {
        toast.error(`${data.passed}/${data.total} test cases passed`);
      }

      // Refresh submissions
      fetchSubmissions();
    } catch {
      toast.error("Failed to submit solution");
    }
    setIsSubmitting(false);
  };

  const handleViewSubmissionCode = (submittedCode: string, lang: string) => {
    setCode(submittedCode);
    setLanguage(lang);
    setRightTab("description");
    toast.success("Loaded previous submission code");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!question) return null;

  const activeResults = submitResult?.results || null;
  const activePassed = submitResult ? submitResult.passed : 0;
  const activeTotal = submitResult ? submitResult.total : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate("/quests")}
          className="mt-1 rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:border-primary-500 hover:text-primary-600 transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900">{question.title}</h1>
            <Badge variant={DIFFICULTY_COLORS[question.difficulty]}>
              {question.difficulty}
            </Badge>
            <BattleTimer isRunning={timerRunning} />
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
            {question.points > 0 && (
              <span className="flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-amber-600" />
                {question.points} XP
              </span>
            )}
            {question.tags && question.tags.length > 0 && (
              <span className="flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-slate-400" />
                {question.tags.join(", ")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Left Panel - Question + Hints */}
        <div className="space-y-4">
          {/* Tabs for Description / Submissions */}
          <div className="flex gap-1 bg-white p-1 rounded-xl w-fit border border-slate-200 shadow-sm">
            <button
              onClick={() => setRightTab("description")}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-2 ${rightTab === "description"
                  ? "bg-primary-50 text-primary-700 border border-primary-100 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
            >
              <Shield className="h-3.5 w-3.5" />
              Quest Info
            </button>
            <button
              onClick={() => setRightTab("submissions")}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-2 ${rightTab === "submissions"
                  ? "bg-primary-50 text-primary-700 border border-primary-100 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
            >
              <History className="h-3.5 w-3.5" />
              Submissions
              {submissions.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary-100 text-primary-700 ml-1">
                  {submissions.length}
                </span>
              )}
            </button>
          </div>

          {rightTab === "description" ? (
            <>
              <Card>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">Description</h2>
                {question.description ? (
                  <div
                    className="prose prose-sm max-w-none text-slate-700 prose-headings:text-slate-900 prose-strong:text-slate-900 prose-code:text-primary-600 prose-pre:bg-slate-50 prose-pre:text-slate-800"
                    dangerouslySetInnerHTML={{ __html: question.description }}
                  />
                ) : (
                  <p className="text-sm text-slate-400">No description provided.</p>
                )}
              </Card>

              {/* Sample Test Cases */}
              {question.testCases && question.testCases.length > 0 && (
                <Card>
                  <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">Examples</h2>
                  <div className="space-y-4">
                    {question.testCases.map((tc, i) => (
                      <div key={i} className="space-y-3 rounded-xl bg-slate-50 p-4 border border-slate-100">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                          Example {i + 1}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="mb-1.5 text-xs font-bold text-slate-400">INPUT</p>
                            <pre className="code-font whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-900 shadow-sm">
                              {tc.input || "(empty)"}
                            </pre>
                          </div>
                          <div>
                            <p className="mb-1.5 text-xs font-bold text-slate-400">EXPECTED OUTPUT</p>
                            <pre className="code-font whitespace-pre-wrap rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-800 shadow-sm font-bold">
                              {tc.output}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Hints */}
              <HintsPanel question={question} />
            </>
          ) : (
            <Card>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <History className="h-4 w-4 text-primary-600" />
                Battle History
              </h2>
              <SubmissionHistoryPanel
                submissions={submissions}
                loading={submissionsLoading}
                onViewCode={handleViewSubmissionCode}
              />
            </Card>
          )}
        </div>

        {/* Right Panel - Editor & Results */}
        <div className="space-y-4">
          {/* Language selector + actions */}
          <div className="flex items-center justify-between">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-sm"
            >
              {(question.languages || ["javascript"]).map((lang) => (
                <option key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button
                onClick={handleRun}
                disabled={isRunning || isSubmitting || !code.trim()}
                leftIcon={
                  isRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )
                }
                size="sm"
                variant="secondary"
              >
                {isRunning ? "Running..." : "Run"}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isRunning || isSubmitting || !code.trim()}
                leftIcon={
                  isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )
                }
                size="sm"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>

          {/* Editor */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Editor
              height="400px"
              language={MONACO_LANGUAGE_MAP[language] || language}
              value={code}
              onChange={(value) => setCode(value || "")}
              theme="light"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on",
                padding: { top: 12 },
              }}
            />
          </div>

          {/* Custom Input */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-2">
              <span className="text-sm font-bold text-slate-700">Custom Input</span>
            </div>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Enter input for your code here..."
              className="w-full resize-none bg-transparent px-4 py-3 font-mono text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
              rows={3}
            />
          </div>

          {/* Run Output */}
          {runOutput && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm mt-4">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2">
                <span className="text-sm font-bold text-slate-700">Output</span>
                {runHasError && (
                  <span className="text-xs font-bold text-red-600">Error</span>
                )}
              </div>
              <pre className={`max-h-48 overflow-y-auto whitespace-pre-wrap px-4 py-3 font-mono text-sm ${runHasError ? "text-red-600 bg-red-50" : "text-slate-800 bg-slate-50"}`}>
                {runOutput}
              </pre>
            </div>
          )}

          {/* Submit success banner */}
          {submitResult?.allPassed && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-800">Quest Complete!</p>
                <p className="mt-0.5 flex items-center gap-3 text-xs font-medium text-emerald-700">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" /> +{submitResult.score} XP
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="h-3 w-3" /> Streak updated
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Test Results */}
          {activeResults && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                <span className="text-sm font-bold text-slate-700">
                  Battle Results
                </span>
                <span
                  className={`text-sm font-bold ${activePassed === activeTotal ? "text-emerald-300" : "text-amber-300"
                    }`}
                >
                  {activePassed}/{activeTotal} Passed
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {activeResults.map((tc, i) => (
                  <div key={i} className="p-3">
                    <div className="mb-2 flex items-center gap-2">
                      {tc.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span
                        className={`text-sm font-bold ${tc.passed ? "text-emerald-700" : "text-red-700"
                          }`}
                      >
                        Test Case {i + 1}
                      </span>
                    </div>
                    {!tc.hidden && (
                      <div className="grid grid-cols-3 gap-3 text-xs code-font">
                        <div>
                          <p className="mb-1 font-bold text-slate-400">INPUT</p>
                          <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 border border-slate-100 p-2 text-slate-800">
                            {tc.input || "(empty)"}
                          </pre>
                        </div>
                        <div>
                          <p className="mb-1 font-bold text-slate-400">EXPECTED</p>
                          <pre className="whitespace-pre-wrap rounded-lg bg-emerald-50 border border-emerald-100 p-2 text-emerald-800 font-bold">
                            {tc.expected}
                          </pre>
                        </div>
                        <div>
                          <p className="mb-1 font-bold text-slate-400">ACTUAL</p>
                          <pre
                            className={`whitespace-pre-wrap rounded-lg p-2 border ${tc.passed ? "bg-emerald-50 border-emerald-100 text-emerald-800 font-bold" : "bg-red-50 border-red-100 text-red-800 font-bold"
                              }`}
                          >
                            {tc.actual || "(empty)"}
                          </pre>
                        </div>
                      </div>
                    )}
                    {tc.hidden && !tc.passed && (
                      <p className="ml-6 text-xs text-slate-500">
                        Hidden test case — wrong answer
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Victory Modal */}
      <VictoryModal
        open={showVictory}
        score={submitResult?.score || 0}
        passed={submitResult?.passed || 0}
        total={submitResult?.total || 0}
        onClose={() => setShowVictory(false)}
      />
    </div>
  );
}

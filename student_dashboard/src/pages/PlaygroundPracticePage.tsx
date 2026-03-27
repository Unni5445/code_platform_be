import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button, Badge, Spinner, Card } from "@/components/ui";
import { playgroundService } from "@/services";
import { codeService } from "@/services";
import type { IQuestion } from "@/types";
import toast from "react-hot-toast";

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

export default function PlaygroundPracticePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [question, setQuestion] = useState<IQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("");

  // Run code (just execute, no test cases)
  const [isRunning, setIsRunning] = useState(false);
  const [runOutput, setRunOutput] = useState("");
  const [runHasError, setRunHasError] = useState(false);
  const [customInput, setCustomInput] = useState("");

  // Submit solution (with streak)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    allPassed: boolean;
    score: number;
    passed: number;
    total: number;
    results: TestResult[];
  } | null>(null);

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
      } catch {
        toast.error("Question not found");
        navigate("/playground");
      }
      setLoading(false);
    })();
  }, [id, navigate]);

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
    if (!customInput.trim()) {
      toast.error("Please provide input before submitting");
      return;
    }
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const res = await playgroundService.submitSolution(question._id, language, code);
      const data = res.data.data;
      setSubmitResult(data);

      if (data.allPassed) {
        toast.success(`All test cases passed! +${data.score} points`);
      } else {
        toast.error(`${data.passed}/${data.total} test cases passed`);
      }
    } catch {
      toast.error("Failed to submit solution");
    }
    setIsSubmitting(false);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate("/playground")}
          className="mt-1 rounded-xl border border-slate-800/90 bg-slate-900/80 p-2 text-slate-300 hover:border-sky-400/80 hover:text-white hover:bg-slate-900/90 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-50">{question.title}</h1>
            <Badge variant={DIFFICULTY_COLORS[question.difficulty]}>
              {question.difficulty}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            {question.points > 0 && (
              <span className="flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-amber-300" />
                {question.points} pts
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left - Question Description */}
        <div className="space-y-4">
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-50">Description</h2>
            {question.description ? (
              <div
                className="prose prose-sm max-w-none text-slate-200 prose-headings:text-slate-100 prose-p:text-slate-300 prose-strong:text-slate-100 prose-code:text-sky-300"
                dangerouslySetInnerHTML={{ __html: question.description }}
              />
            ) : (
              <p className="text-sm text-slate-400">No description provided.</p>
            )}
          </Card>

          {/* Sample Test Cases (visible ones) */}
          {question.testCases && question.testCases.length > 0 && (
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-slate-50">Examples</h2>
              <div className="space-y-3">
                {question.testCases.map((tc, i) => (
                  <div key={i} className="space-y-2 rounded-xl bg-slate-900/80 p-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                      Example {i + 1}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="mb-1 text-xs text-slate-400">Input</p>
                        <pre className="code-font whitespace-pre-wrap rounded border border-slate-800 bg-slate-950/70 p-2 text-xs text-slate-100">
                          {tc.input || "(empty)"}
                        </pre>
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-slate-400">Expected Output</p>
                        <pre className="code-font whitespace-pre-wrap rounded border border-slate-800 bg-slate-950/70 p-2 text-xs text-emerald-200">
                          {tc.output}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right - Code Editor & Results */}
        <div className="space-y-4">
          {/* Language selector + actions */}
          <div className="flex items-center justify-between">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
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
                variant="ghost"
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
          <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950">
            <Editor
              height="400px"
              language={MONACO_LANGUAGE_MAP[language] || language}
              value={code}
              onChange={(value) => setCode(value || "")}
              theme="vs-dark"
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
          <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/80">
            <div className="border-b border-slate-800/80 bg-slate-900/80 px-4 py-2">
              <span className="text-sm font-semibold text-slate-100">Custom Input</span>
            </div>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Enter input for your code here..."
              className="w-full resize-none bg-transparent px-4 py-3 font-mono text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
              rows={3}
            />
          </div>

          {/* Run Output */}
          {runOutput && (
            <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/80">
              <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/80 px-4 py-2">
                <span className="text-sm font-semibold text-slate-100">Output</span>
                {runHasError && (
                  <span className="text-xs font-medium text-red-400">Error</span>
                )}
              </div>
              <pre className={`max-h-48 overflow-y-auto whitespace-pre-wrap px-4 py-3 font-mono text-sm ${runHasError ? "text-red-400" : "text-slate-100"}`}>
                {runOutput}
              </pre>
            </div>
          )}

          {/* Submit success banner */}
          {submitResult?.allPassed && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
                <Trophy className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-200">Solution Accepted!</p>
                <p className="mt-0.5 flex items-center gap-3 text-xs text-emerald-200/80">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" /> +{submitResult.score} points
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
            <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/80">
              <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/80 px-4 py-3">
                <span className="text-sm font-semibold text-slate-100">
                  Submission Results
                </span>
                <span
                  className={`text-sm font-semibold ${
                    activePassed === activeTotal ? "text-emerald-300" : "text-amber-300"
                  }`}
                >
                  {activePassed}/{activeTotal} Passed
                </span>
              </div>
              <div className="divide-y divide-slate-800/80">
                {activeResults.map((tc, i) => (
                  <div key={i} className="p-3">
                    <div className="mb-2 flex items-center gap-2">
                      {tc.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          tc.passed ? "text-emerald-200" : "text-red-300"
                        }`}
                      >
                        Test Case {i + 1}
                      </span>
                    </div>
                    {!tc.hidden && (
                      <div className="grid grid-cols-3 gap-3 text-xs code-font">
                        <div>
                          <p className="mb-1 font-sans text-slate-400">Input</p>
                          <pre className="whitespace-pre-wrap rounded bg-slate-900/80 p-2 text-slate-100">
                            {tc.input || "(empty)"}
                          </pre>
                        </div>
                        <div>
                          <p className="mb-1 font-sans text-slate-400">Expected</p>
                          <pre className="whitespace-pre-wrap rounded bg-slate-900/80 p-2 text-emerald-200">
                            {tc.expected}
                          </pre>
                        </div>
                        <div>
                          <p className="mb-1 font-sans text-slate-400">Actual</p>
                          <pre
                            className={`whitespace-pre-wrap rounded p-2 ${
                              tc.passed ? "bg-emerald-500/10 text-emerald-200" : "bg-red-500/10 text-red-200"
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
    </div>
  );
}

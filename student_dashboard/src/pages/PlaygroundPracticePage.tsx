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
  csharp: "csharp",
  ruby: "ruby",
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

  // Run test cases (no streak)
  const [isRunning, setIsRunning] = useState(false);
  const [runResults, setRunResults] = useState<TestResult[] | null>(null);
  const [runPassed, setRunPassed] = useState(0);
  const [runTotal, setRunTotal] = useState(0);

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
    if (question?.starterCode?.[newLang] && !code.trim()) {
      setCode(question.starterCode[newLang]);
    }
  };

  const handleRun = async () => {
    if (!question) return;
    setIsRunning(true);
    setRunResults(null);
    setSubmitResult(null);

    try {
      const res = await codeService.runTestCases(question._id, language, code);
      const data = res.data.data;
      setRunResults(data.results);
      setRunPassed(data.passed);
      setRunTotal(data.total);
    } catch {
      toast.error("Failed to run test cases");
    }
    setIsRunning(false);
  };

  const handleSubmit = async () => {
    if (!question) return;
    setIsSubmitting(true);
    setRunResults(null);
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

  const activeResults = submitResult?.results || runResults;
  const activePassed = submitResult ? submitResult.passed : runPassed;
  const activeTotal = submitResult ? submitResult.total : runTotal;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate("/playground")}
          className="mt-1 p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-gray-900">{question.title}</h1>
            <Badge variant={DIFFICULTY_COLORS[question.difficulty]}>
              {question.difficulty}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {question.points > 0 && (
              <span className="flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                {question.points} pts
              </span>
            )}
            {question.tags && question.tags.length > 0 && (
              <span className="flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                {question.tags.join(", ")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left - Question Description */}
        <div className="space-y-4">
          <Card>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Description</h2>
            {question.description ? (
              <div
                className="prose prose-sm max-w-none text-gray-600"
                dangerouslySetInnerHTML={{ __html: question.description }}
              />
            ) : (
              <p className="text-sm text-gray-500">No description provided.</p>
            )}
          </Card>

          {/* Sample Test Cases (visible ones) */}
          {question.testCases && question.testCases.length > 0 && (
            <Card>
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Examples</h2>
              <div className="space-y-3">
                {question.testCases.map((tc, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                      Example {i + 1}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Input</p>
                        <pre className="text-xs font-mono bg-white rounded p-2 whitespace-pre-wrap border border-gray-100">
                          {tc.input || "(empty)"}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Expected Output</p>
                        <pre className="text-xs font-mono bg-white rounded p-2 whitespace-pre-wrap border border-gray-100">
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
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
          <div className="rounded-2xl overflow-hidden border border-gray-200">
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

          {/* Submit success banner */}
          {submitResult?.allPassed && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Trophy className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800">Solution Accepted!</p>
                <p className="text-xs text-emerald-600 flex items-center gap-3 mt-0.5">
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
            <div className="rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  {submitResult ? "Submission Results" : "Test Results"}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    activePassed === activeTotal ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {activePassed}/{activeTotal} Passed
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {activeResults.map((tc, i) => (
                  <div key={i} className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      {tc.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          tc.passed ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        Test Case {i + 1}
                      </span>
                    </div>
                    {!tc.hidden && (
                      <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                        <div>
                          <p className="text-gray-500 mb-1 font-sans">Input</p>
                          <pre className="bg-gray-50 rounded p-2 whitespace-pre-wrap">
                            {tc.input || "(empty)"}
                          </pre>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1 font-sans">Expected</p>
                          <pre className="bg-gray-50 rounded p-2 whitespace-pre-wrap">
                            {tc.expected}
                          </pre>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1 font-sans">Actual</p>
                          <pre
                            className={`rounded p-2 whitespace-pre-wrap ${
                              tc.passed ? "bg-emerald-50" : "bg-red-50"
                            }`}
                          >
                            {tc.actual || "(empty)"}
                          </pre>
                        </div>
                      </div>
                    )}
                    {tc.hidden && !tc.passed && (
                      <p className="text-xs text-gray-400 ml-6">
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

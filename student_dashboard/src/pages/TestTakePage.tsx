import { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Send, AlertTriangle, Maximize, Minimize } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useTimer } from "@/hooks/useTimer";
import { testService } from "@/services";
import type { TestSubmissionAnswer } from "@/services/test.service";
import { Spinner, Button, Badge, Card, Modal } from "@/components/ui";
import { QuestionRenderer } from "@/components/tests/QuestionRenderer";
import { TestTimer } from "@/components/tests/TestTimer";
import { QuestionNavigator } from "@/components/tests/QuestionNavigator";
import type { ITest, IQuestion } from "@/types";
import toast from "react-hot-toast";

interface QuestionAnswer {
  answer: string | string[];
  code: string;
  language: string;
}

export default function TestTakePage() {
  const { id: testId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [submittedCoding, setSubmittedCoding] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<{ totalScore: number; maxScore: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isTestActive = hasStarted && !showResults;

  const fetchTest = useCallback(() => testService.getTestById(testId!), [testId]);
  const { data: test, loading } = useApi<ITest>(fetchTest, [testId]);

  const questions = useMemo(() => {
    if (!test?.questions) return [];
    return test.questions.filter((q): q is IQuestion => typeof q === "object" && "_id" in q);
  }, [test]);

  const duration = (test?.duration || 60) * 60;

  const handleExpire = useCallback(() => {
    toast.error("Time's up! Submitting your test...");
    handleSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { formatted, timeLeft, start } = useTimer(duration, handleExpire);

  // ── Prevent accidental close/refresh while test is active ──────────────────
  useEffect(() => {
    if (!isTestActive) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers show their own message; setting returnValue keeps legacy support.
      e.returnValue = "Your test is still in progress. Are you sure you want to leave?";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isTestActive]);

  // ── Fullscreen helpers ─────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        toast.error("Fullscreen is not supported in this browser.");
      }
    } else {
      try {
        await document.exitFullscreen();
      } catch {
        // ignore
      }
    }
  }, []);

  // Keep isFullscreen state in sync with actual fullscreen changes
  // (e.g. user pressing Esc to exit fullscreen)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // ──────────────────────────────────────────────────────────────────────────

  const handleStart = async () => {
    try {
      await testService.startTest(testId!);
      setHasStarted(true);
      start();
    } catch {
      setHasStarted(true);
      start();
    }
  };

  useEffect(() => {
    if (questions.length > 0 && Object.keys(answers).length === 0) {
      const initial: Record<string, QuestionAnswer> = {};
      for (const q of questions) {
        const defaultLang = q.languages?.[0] || "javascript";
        initial[q._id] = {
          answer: q.type === "MULTIPLE_CHOICE" ? [] : "",
          code: q.starterCode?.[defaultLang] || "",
          language: defaultLang,
        };
      }
      setAnswers(initial);
    }
  }, [questions, answers]);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion._id] : null;

  const answeredIndices = useMemo(() => {
    const set = new Set<number>();
    questions.forEach((q, i) => {
      const a = answers[q._id];
      if (!a) return;
      if (q.type === "CODING" && submittedCoding.has(q._id)) set.add(i);
      else if (Array.isArray(a.answer) && a.answer.length > 0) set.add(i);
      else if (typeof a.answer === "string" && a.answer.trim()) set.add(i);
    });
    return set;
  }, [answers, questions, submittedCoding]);

  const handleSubmit = async () => {
    setShowSubmitConfirm(false);
    setIsSubmitting(true);

    const submissionAnswers: TestSubmissionAnswer[] = questions.map((q) => {
      const a = answers[q._id];
      if (q.type === "CODING") {
        return { question: q._id, code: a?.code || "", language: a?.language || "javascript" };
      }
      return { question: q._id, answer: a?.answer || "" };
    });

    try {
      const res = await testService.submitTest(testId!, submissionAnswers);
      setResults({
        totalScore: res.data.data.totalScore,
        maxScore: res.data.data.maxScore,
      });
      setShowResults(true);
      toast.success("Test submitted successfully!");
      // Exit fullscreen after submission
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {
      toast.error("Failed to submit test. Please try again.");
    }

    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <Spinner size="lg" />
      </div>
    );
  }

  // Results screen
  if (showResults && results) {
    const percentage = Math.round((results.totalScore / results.maxScore) * 100);
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <Card className="max-w-md w-full mx-4">
          <div className="text-center">
            <div
              className={`text-6xl font-bold mb-2 ${
                percentage >= 70
                  ? "text-emerald-600"
                  : percentage >= 40
                  ? "text-amber-600"
                  : "text-red-600"
              }`}
            >
              {percentage}%
            </div>
            <p className="text-gray-500 mb-1">Your Score</p>
            <p className="text-2xl font-bold text-white mb-6">
              {results.totalScore} / {results.maxScore}
            </p>
            <Badge
              variant={percentage >= 70 ? "success" : percentage >= 40 ? "warning" : "danger"}
              className="text-sm px-4 py-1 mb-6"
            >
              {percentage >= 70 ? "Passed" : percentage >= 40 ? "Needs Improvement" : "Failed"}
            </Badge>
            <div className="mt-6">
              <Button onClick={() => navigate("/tests")} className="w-full">
                Back to Tests
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Start screen
  if (!hasStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <Card className="max-w-lg w-full mx-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">{test?.title}</h1>
            {test?.description && <p className="text-gray-500 mb-6">{test.description}</p>}
            <div className="flex items-center justify-center gap-6 mb-8 text-sm text-gray-600">
              <div>
                <span className="block text-2xl font-bold text-white">{questions.length}</span>
                Questions
              </div>
              <div className="h-10 w-px bg-gray-200" />
              <div>
                <span className="block text-2xl font-bold text-white">{test?.duration || 60}</span>
                Minutes
              </div>
              <div className="h-10 w-px bg-gray-200" />
              <div>
                <span className="block text-2xl font-bold text-white">{test?.totalPoints || 0}</span>
                Points
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Before you begin:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>The timer starts once you begin the test</li>
                    <li>You can navigate between questions freely</li>
                    <li>The test auto-submits when time runs out</li>
                    <li>Do not close or refresh the tab during the test</li>
                  </ul>
                </div>
              </div>
            </div>
            <Button onClick={handleStart} size="lg" className="w-full">
              Start Test
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-surface border-b border-surface-border px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-white">{test?.title}</h1>
          <p className="text-xs text-gray-500">
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <TestTimer formatted={formatted} timeLeft={timeLeft} />

          {/* Fullscreen toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            leftIcon={
              isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )
            }
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </Button>

          <Button
            onClick={() => setShowSubmitConfirm(true)}
            variant="danger"
            leftIcon={<Send className="h-4 w-4" />}
            isLoading={isSubmitting}
          >
            Submit Test
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Question Navigator Sidebar */}
        <div className="w-64 shrink-0 p-4 border-r border-surface-border bg-surface min-h-[calc(100vh-64px)]">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Questions</h3>
          <QuestionNavigator
            total={questions.length}
            current={currentIndex}
            answeredIndices={answeredIndices}
            onNavigate={setCurrentIndex}
          />
          <div className="mt-4 space-y-1 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-primary-600" /> Current
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-emerald-100" /> Answered
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-gray-100" /> Unanswered
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 p-6 max-w-4xl">
          {currentQuestion && currentAnswer && (
            <div className="space-y-6">
              {/* Question Header */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="primary">Q{currentIndex + 1}</Badge>
                  <Badge variant="gray">{currentQuestion.type.replace("_", " ")}</Badge>
                  <Badge
                    variant={
                      currentQuestion.difficulty === "Easy"
                        ? "success"
                        : currentQuestion.difficulty === "Hard"
                        ? "danger"
                        : "warning"
                    }
                  >
                    {currentQuestion.difficulty}
                  </Badge>
                  <span className="text-sm text-gray-500">{currentQuestion.points} pts</span>
                </div>
                <h2 className="text-lg font-semibold text-white">{currentQuestion.title}</h2>
                {currentQuestion.description && (
                  <div
                    className="text-sm text-gray-600 mt-2 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: currentQuestion.description }}
                  />
                )}
              </div>

              {/* Question Body */}
              <QuestionRenderer
                question={currentQuestion}
                answer={currentAnswer.answer}
                code={currentAnswer.code}
                language={currentAnswer.language}
                onAnswerChange={(answer) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [currentQuestion._id]: { ...prev[currentQuestion._id], answer },
                  }))
                }
                onCodeChange={(code) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [currentQuestion._id]: { ...prev[currentQuestion._id], code },
                  }))
                }
                onLanguageChange={(language) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [currentQuestion._id]: { ...prev[currentQuestion._id], language },
                  }))
                }
                onSubmitCode={() =>
                  setSubmittedCoding((prev) => new Set(prev).add(currentQuestion._id))
                }
              />

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-surface-border">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                  leftIcon={<ChevronLeft className="h-4 w-4" />}
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                  disabled={currentIndex === questions.length - 1}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        title="Submit Test"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowSubmitConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleSubmit} isLoading={isSubmitting}>
              Submit Test
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">Are you sure you want to submit your test?</p>
          <div className="rounded-xl p-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Answered:</span>
              <span className="font-medium text-white">
                {answeredIndices.size} / {questions.length}
              </span>
            </div>
            {answeredIndices.size < questions.length && (
              <p className="text-amber-600 text-sm mt-2 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                You have {questions.length - answeredIndices.size} unanswered question(s)
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
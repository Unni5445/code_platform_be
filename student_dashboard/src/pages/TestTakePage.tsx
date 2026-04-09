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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  // Results screen
  if (showResults && results) {
    const percentage = Math.round((results.totalScore / results.maxScore) * 100);
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full shadow-2xl border-slate-200">
          <div className="text-center">
            <div
              className={`text-6xl font-extrabold mb-4 ${
                percentage >= 70
                  ? "text-emerald-600"
                  : percentage >= 40
                  ? "text-amber-600"
                  : "text-red-600"
              }`}
            >
              {percentage}%
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-1">Your Final Score</p>
            <p className="text-3xl font-extrabold text-slate-900 mb-8">
              {results.totalScore} <span className="text-slate-400 text-lg font-medium">/ {results.maxScore}</span>
            </p>
            <Badge
              variant={percentage >= 70 ? "success" : percentage >= 40 ? "warning" : "danger"}
              className="text-sm px-6 py-1.5 mb-8 rounded-full font-bold uppercase tracking-wide"
            >
              {percentage >= 70 ? "PASSED" : percentage >= 40 ? "NEEDS IMPROVEMENT" : "FAILED"}
            </Badge>
            <div className="mt-4">
              <Button onClick={() => navigate("/tests")} className="w-full font-bold py-4 rounded-2xl shadow-lg shadow-primary-500/20">
                Back to Tests Dashboard
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-xl w-full shadow-2xl border-slate-200">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-3">{test?.title}</h1>
            {test?.description && <p className="text-slate-500 font-medium text-sm mb-8 leading-relaxed px-4">{test.description}</p>}
            <div className="grid grid-cols-3 gap-4 mb-10">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="block text-2xl font-extrabold text-slate-900">{questions.length}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Questions</span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="block text-2xl font-extrabold text-slate-900">{test?.duration || 60}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Minutes</span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="block text-2xl font-extrabold text-slate-900">{test?.totalPoints || 0}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Points</span>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-8 text-left shadow-xs">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-bold mb-2 uppercase tracking-wide text-xs">Important Guidelines:</p>
                  <ul className="space-y-1.5 font-medium opacity-90">
                    <li className="flex items-center gap-2 text-xs"><div className="h-1 w-1 rounded-full bg-amber-400" /> The timer starts immediately</li>
                    <li className="flex items-center gap-2 text-xs"><div className="h-1 w-1 rounded-full bg-amber-400" /> Free navigation between tasks</li>
                    <li className="flex items-center gap-2 text-xs"><div className="h-1 w-1 rounded-full bg-amber-400" /> Auto-submission on timeout</li>
                    <li className="flex items-center gap-2 text-xs"><div className="h-1 w-1 rounded-full bg-amber-400" /> Do not close or refresh the browser</li>
                  </ul>
                </div>
              </div>
            </div>
            <Button onClick={handleStart} size="lg" className="w-full font-bold py-4 rounded-2xl shadow-xl shadow-primary-500/20">
              Start Challenge Now
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="font-bold text-slate-900">{test?.title}</h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Question {currentIndex + 1} <span className="text-slate-300">/</span> {questions.length}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <TestTimer formatted={formatted} timeLeft={timeLeft} />

          {/* Fullscreen toggle */}
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleFullscreen}
            className="text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 shadow-xs"
            leftIcon={
              isFullscreen ? (
                <Minimize className="h-3.5 w-3.5" />
              ) : (
                <Maximize className="h-3.5 w-3.5" />
              )
            }
          >
            {isFullscreen ? "Exit" : "Full View"}
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
        <div className="w-64 shrink-0 p-6 border-r border-slate-200 bg-white min-h-[calc(100vh-64px)] shadow-sm">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Questions</h3>
          <QuestionNavigator
            total={questions.length}
            current={currentIndex}
            answeredIndices={answeredIndices}
            onNavigate={setCurrentIndex}
          />
          <div className="mt-8 space-y-2 text-[10px] font-bold text-slate-500 border-t border-slate-50 pt-6">
            <div className="flex items-center gap-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-primary-600 shadow-sm shadow-primary-500/30" /> CURRENT
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30" /> ANSWERED
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-slate-200" /> UNANSWERED
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
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{currentQuestion.points} POINTS</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">{currentQuestion.title}</h2>
                {currentQuestion.description && (
                  <div
                    className="text-sm font-medium text-slate-600 mt-3 prose prose-slate max-w-none"
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
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                  className="font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                  leftIcon={<ChevronLeft className="h-4 w-4" />}
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                  disabled={currentIndex === questions.length - 1}
                  className="font-bold px-8 shadow-md"
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Next Task
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
        <div className="space-y-6">
          <p className="text-slate-600 font-medium">Are you sure you want to finish your assessment and submit all answers?</p>
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 shadow-inner">
            <div className="flex justify-between items-center text-sm mb-3">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Total Answered</span>
              <span className="font-extrabold text-slate-900 border bg-white px-3 py-1 rounded-lg">
                {answeredIndices.size} / {questions.length}
              </span>
            </div>
            {answeredIndices.size < questions.length && (
              <div className="bg-red-50 text-red-600 text-[11px] font-bold p-3 rounded-xl flex items-center gap-2 border border-red-100">
                <AlertTriangle className="h-4 w-4" />
                Missing {questions.length - answeredIndices.size} answers in your assessment
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
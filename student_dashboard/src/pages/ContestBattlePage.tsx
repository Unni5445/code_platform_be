import { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Send, AlertTriangle, Maximize, Minimize } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useTimer } from "@/hooks/useTimer";
import { contestService } from "@/services";
import { Spinner, Button, Badge, Card, Modal } from "@/components/ui";
import { QuestionRenderer } from "@/components/tests/QuestionRenderer";
import { TestTimer } from "@/components/tests/TestTimer";
import { QuestionNavigator } from "@/components/tests/QuestionNavigator";
import type { Contest } from "@/services/contest.service";
import toast from "react-hot-toast";

interface QuestionAnswer {
  answer: string | string[];
  code: string;
  language: string;
}

export default function ContestBattlePage() {
  const { id: contestId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [submittedCoding, setSubmittedCoding] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<{ totalScore: number; maxScore: number; solvedCount: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isTestActive = hasStarted && !showResults;

  // Fetch the battle data (full questions)
  const fetchBattle = useCallback(() => contestService.getContestBattle(contestId!), [contestId]);
  const { data: contest, loading, error } = useApi<Contest>(fetchBattle, [contestId]);

  const questions = useMemo(() => {
    if (!contest?.questions) return [];
    return contest.questions;
  }, [contest]);

  const duration = (contest?.duration || 60) * 60; // in seconds

  const handleExpire = useCallback(() => {
    toast.error("Time's up! Submitting your contest...");
    handleSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { formatted, timeLeft, start } = useTimer(duration, handleExpire);

  // Prevent accidental close/refresh
  useEffect(() => {
    if (!isTestActive) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Your contest is still in progress. Are you sure you want to leave?";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isTestActive]);

  // Fullscreen helpers
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Initialize answers when questions load
  useEffect(() => {
    if (questions.length > 0 && Object.keys(answers).length === 0) {
      const initial: Record<string, QuestionAnswer> = {};
      for (const q of questions) {
        const starterCodeMap = (q as any).starterCode || {};
        const defaultLang = (q as any).languages?.[0] || Object.keys(starterCodeMap)[0] || "javascript";

        initial[q._id] = {
          answer: q.type === "MULTIPLE_CHOICE" ? [] : "",
          code: starterCodeMap[defaultLang] || "",
          language: defaultLang,
        };
      }
      setAnswers(initial);
    }
  }, [questions, answers]);

  const currentQuestion = questions[currentIndex];
  const currentQ = currentQuestion as any;
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

  // Handlers
  const handleStart = async () => {
    try {
      await contestService.startContest(contestId!);
      setHasStarted(true);
      start();
    } catch (err: any) {
      const message = err?.response?.data?.message || "";
      if (message.includes("already completed") || message.includes("already submitted")) {
        toast.error("You have already submitted this contest.");
        navigate("/contests");
        return;
      }
      // Otherwise assume they already started (e.g. page refresh)
      setHasStarted(true);
      start();
    }
  };

  const handleSubmit = async () => {
    setShowSubmitConfirm(false);
    setIsSubmitting(true);

    const submissionAnswers = questions.map((q) => {
      const a = answers[q._id];
      if (q.type === "CODING") {
        return { question: q._id, code: a?.code || "", language: a?.language || "javascript" };
      }
      return { question: q._id, answer: a?.answer || "" };
    });

    try {
      const res = await contestService.submitContest(contestId!, submissionAnswers);
      setResults({
        totalScore: res.data.data.totalScore,
        maxScore: res.data.data.maxScore,
        solvedCount: res.data.data.solvedCount,
      });
      setShowResults(true);
      toast.success("Contest submitted successfully!");
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit contest. Please try again.");
    }
    setIsSubmitting(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error || !contest) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <h2 className="text-xl font-extrabold text-slate-900">Contest Unavailable</h2>
        <p className="text-slate-500 font-medium">Are you registered and is the contest currently live?</p>
        <Button variant="secondary" className="font-bold px-8 rounded-2xl" onClick={() => navigate("/contests")}>
          Back to Contests
        </Button>
      </div>
    );
  }

  // Results screen
  if (showResults && results) {
    const percentage = results.maxScore > 0 ? Math.round((results.totalScore / results.maxScore) * 100) : 0;
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
            <p className="text-3xl font-extrabold text-slate-900 mb-2">
              {results.totalScore} <span className="text-slate-400 text-lg font-medium">/ {results.maxScore}</span>
            </p>
            <p className="text-sm font-bold text-slate-500 mb-8">
              Solved {results.solvedCount} of {questions.length} questions
            </p>
            <Badge
              variant={percentage >= 70 ? "success" : percentage >= 40 ? "warning" : "danger"}
              className="text-sm px-6 py-1.5 mb-8 rounded-full font-bold uppercase tracking-wide"
            >
              {percentage >= 70 ? "EXCELLENT" : percentage >= 40 ? "NEEDS IMPROVEMENT" : "KEEP PRACTICING"}
            </Badge>
            <div className="mt-4">
              <Button onClick={() => navigate("/contests")} className="w-full font-bold py-4 rounded-2xl shadow-lg shadow-primary-500/20">
                Back to Contests
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
            <h1 className="text-3xl font-extrabold text-slate-900 mb-3">{contest.title}</h1>
            {contest.description && <p className="text-slate-500 font-medium text-sm mb-8 leading-relaxed px-4">{contest.description}</p>}
            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="block text-2xl font-extrabold text-slate-900">{questions.length}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Questions</span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="block text-2xl font-extrabold text-slate-900">{contest.duration || 60}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Minutes</span>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-8 text-left shadow-xs">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-bold mb-2 uppercase tracking-wide text-xs">Important Guidelines:</p>
                  <ul className="space-y-1.5 font-medium opacity-90">
                    <li className="flex items-center gap-2 text-xs"><div className="h-1 w-1 rounded-full bg-amber-400" /> The timer starts immediately</li>
                    <li className="flex items-center gap-2 text-xs"><div className="h-1 w-1 rounded-full bg-amber-400" /> Free navigation between questions</li>
                    <li className="flex items-center gap-2 text-xs"><div className="h-1 w-1 rounded-full bg-amber-400" /> Auto-submission on timeout</li>
                    <li className="flex items-center gap-2 text-xs"><div className="h-1 w-1 rounded-full bg-amber-400" /> Only one submission allowed</li>
                    <li className="flex items-center gap-2 text-xs"><div className="h-1 w-1 rounded-full bg-amber-400" /> Do not close or refresh the browser</li>
                  </ul>
                </div>
              </div>
            </div>
            <Button onClick={handleStart} size="lg" className="w-full font-bold py-4 rounded-2xl shadow-xl shadow-primary-500/20">
              Start Contest Now
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Main contest UI (matches TestTakePage layout)
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="font-bold text-slate-900">{contest.title}</h1>
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
            Submit Contest
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
                  <Badge variant="gray">{(currentQuestion.type || "CODING").replace("_", " ")}</Badge>
                  <Badge
                    variant={
                      currentQ.difficulty === "Easy"
                        ? "success"
                        : currentQ.difficulty === "Hard"
                        ? "danger"
                        : "warning"
                    }
                  >
                    {currentQ.difficulty || "Medium"}
                  </Badge>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{currentQ.points || 0} POINTS</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">{currentQ.title}</h2>
                {currentQ.description && (
                  <div
                    className="text-sm font-medium text-slate-600 mt-3 prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: currentQ.description }}
                  />
                )}
              </div>

              {/* Question Body */}
              <QuestionRenderer
                question={currentQ}
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
                  Next Question
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
        title="Submit Contest"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowSubmitConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleSubmit} isLoading={isSubmitting}>
              Submit Contest
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <p className="text-slate-600 font-medium">Are you sure you want to submit your contest? This action cannot be undone.</p>
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
                Missing {questions.length - answeredIndices.size} answers in your contest
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

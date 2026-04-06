import { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Send, AlertTriangle, Maximize, Minimize, Loader2 } from "lucide-react";
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

  // We fetch the "Battle" specifically which exposes the full questions
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

  // Fullscreen tracking
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

  // Ready questions
  useEffect(() => {
    if (questions.length > 0 && Object.keys(answers).length === 0) {
      const initial: Record<string, QuestionAnswer> = {};
      for (const q of questions) {
        // Try mapping starter languages if any. If not provided, fallback javascript
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
  // Cast safely since our backend might return a generic object that matches we hope
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
    } catch {
      // If they already started (maybe refresh?), we can just let them in.
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-secondary gap-4">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <h2 className="text-xl text-white">Cannot Load Battle</h2>
        <p className="text-slate-400">Are you registered and is the contest currently live?</p>
        <Button onClick={() => navigate("/contests")}>Go Back</Button>
      </div>
    );
  }

  // --- Post Submission Rules / Results Screen ---
  if (showResults && results) {
    const percentage = Math.round((results.totalScore / results.maxScore) * 100);
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <Card className="max-w-md w-full mx-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Battle Complete!</h2>
            <p className="text-slate-400 mb-6">Your performance has been logged.</p>
            
            <div
              className={`text-6xl font-bold mb-2 text-primary-500`}
            >
              {results.totalScore} <span className="text-2xl text-slate-500">XP</span>
            </div>
            
            <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-slate-800">
               <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Percentage</p>
                  <p className={`text-xl font-bold ${percentage >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>{percentage}%</p>
               </div>
               <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Solved</p>
                  <p className="text-xl font-bold text-white">{results.solvedCount}/{questions.length}</p>
               </div>
            </div>

            <div className="mt-8">
              <Button onClick={() => navigate("/contests")} className="w-full">
                Leave Arena
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // --- Initialization Screen ---
  if (!hasStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary p-4 relative overflow-hidden">
        {/* Dynamic bloody pulse for the "battle" */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[100px] pointer-events-none animate-pulse duration-3000" />
        
        <Card className="max-w-lg w-full relative z-10 border-red-500/20 bg-slate-900/90 backdrop-blur-xl">
          <div className="text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20 border border-red-500/40 text-red-500 mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{contest.title}</h1>
            {contest.description && <p className="text-gray-400 mb-6">{contest.description}</p>}
            
            <div className="flex items-center justify-center gap-8 mb-8">
              <div className="text-center">
                <span className="block text-3xl font-black text-white">{questions.length}</span>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Questions</span>
              </div>
              <div className="h-12 w-px bg-slate-800" />
              <div className="text-center">
                <span className="block text-3xl font-black text-amber-500">{contest.duration}</span>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Minutes</span>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8 text-left">
              <p className="font-semibold text-red-400 mb-2">Engagement Protocols:</p>
              <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-300">
                <li>Timer starts immediately upon entry.</li>
                <li>Submit your test case evaluations via the internal IDE.</li>
                <li>Leaving the page will not stop the timer.</li>
                <li>Once the contest window concludes, no further submissions are accepted.</li>
              </ul>
            </div>
            
            <Button onClick={handleStart} size="lg" className="w-full bg-red-600 hover:bg-red-500 text-white border-none shadow-[0_0_20px_rgba(220,38,38,0.4)]">
              Enter The Arena
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // --- Main Battle Arena ---
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top Header Panel */}
      <div className="bg-slate-900 border-b border-red-900/40 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-lg relative z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setShowSubmitConfirm(true)} className="text-slate-400 hover:text-white">
            <ChevronLeft className="h-4 w-4 mr-1" /> Retreat
          </Button>
          <div>
            <h1 className="font-bold text-white text-sm">{contest.title}</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              Battle in progress
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <TestTimer formatted={formatted} timeLeft={timeLeft} />

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-slate-400 hover:text-white hidden sm:flex"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>

          <Button
            onClick={() => setShowSubmitConfirm(true)}
            size="sm"
            className="bg-red-600 hover:bg-red-500 border-none text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]"
            leftIcon={isSubmitting ? <Loader2 className="h-3 w-3 animate-spin"/> : <Send className="h-3 w-3" />}
          >
            Submit Run
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <div className="w-16 sm:w-64 shrink-0 border-r border-slate-800 bg-slate-900 overflow-y-auto hidden md:block">
          <div className="p-4">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Challenges</h3>
            <QuestionNavigator
              total={questions.length}
              current={currentIndex}
              answeredIndices={answeredIndices}
              onNavigate={setCurrentIndex}
            />
          </div>
        </div>

        {/* Content Region */}
        <div className="flex-1 flex flex-col min-w-0 bg-surface-secondary relative overflow-hidden">
          {currentQuestion && currentAnswer ? (
            <div className="flex flex-col h-full overflow-y-auto">
              <div className="p-4 sm:p-6 pb-24">
                <div className="max-w-5xl mx-auto space-y-6">
                  {/* Current Q Header */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-red-500/10 text-red-400 text-xs font-black rounded-lg border border-red-500/20">
                        Q{currentIndex + 1}
                      </span>
                      <Badge variant="gray" className="capitalize">{(currentQuestion.type || "CODING").replace("_", " ")}</Badge>
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
                      <span className="text-sm font-semibold text-amber-500">{currentQ.points || 0} XP</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">{currentQ.title}</h2>
                    {currentQ.description && (
                      <div
                        className="text-sm text-slate-300 mt-2 prose prose-sm prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: currentQ.description }}
                      />
                    )}
                  </div>

                  {/* IDE / Mult-Choice Engine */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
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
                  </div>
                </div>
              </div>

              {/* Bottom Nav Bar docked */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 flex items-center justify-between z-10 w-full max-w-5xl mx-auto">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                  className="text-slate-400 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" /> Prev
                </Button>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest md:hidden">
                   {currentIndex + 1} / {questions.length}
                </div>
                <Button
                  onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                  disabled={currentIndex === questions.length - 1}
                  className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                >
                  Next <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="m-auto flex flex-col items-center justify-center p-8 text-center text-slate-500">
               <Loader2 className="h-8 w-8 animate-spin text-slate-600 mb-4" />
               <p>Preparing Battle environment...</p>
            </div>
          )}
        </div>
      </div>

      {/* Warning submission modal */}
      <Modal
        isOpen={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        title="Submit Battle Analysis"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowSubmitConfirm(false)}>
              Back to Battle
            </Button>
            <Button variant="danger" onClick={handleSubmit} isLoading={isSubmitting}>
              Submit Everything
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-slate-300">Are you sure you want to end this sequence? You cannot alter answers past this point.</p>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Locked In:</span>
              <span className="font-bold text-white">
                {answeredIndices.size} / {questions.length}
              </span>
            </div>
            {answeredIndices.size < questions.length && (
              <p className="text-amber-500 text-xs font-medium flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                You have {questions.length - answeredIndices.size} unanswered challenge(s).
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

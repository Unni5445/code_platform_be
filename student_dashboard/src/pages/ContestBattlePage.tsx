import { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Send, AlertTriangle, Maximize, Minimize, Loader2, Trophy, Shield, CheckCircle2, Zap } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500 border border-red-100 shadow-inner">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Battle Connection Lost</h2>
        <p className="text-slate-500 font-medium">Are you registered and is the contest currently live?</p>
        <Button variant="secondary" className="font-bold px-8 rounded-2xl" onClick={() => navigate("/contests")}>Back to Arena</Button>
      </div>
    );
  }

  // --- Post Submission Results Screen ---
  if (showResults && results) {
    const percentage = Math.round((results.totalScore / results.maxScore) * 100);
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <Card className="max-w-md w-full border-slate-200 shadow-2xl p-8 rounded-3xl group">
          <div className="text-center">
            <div className="relative inline-block mb-6">
               <Trophy className="h-20 w-20 text-amber-500 drop-shadow-xl animate-bounce" />
               <div className="absolute -top-4 -right-4 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border-2 border-white shadow-lg">New XP</div>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Battle Concluded</h2>
            <p className="text-slate-500 font-medium mb-8">Deployment successful. Your performance has been synchronized.</p>
            
            <div className="relative mb-8 p-6 rounded-3xl bg-slate-50 border border-slate-100 shadow-inner">
              <div className="text-5xl font-black text-primary-600 tracking-tighter mb-1">
                {results.totalScore} <span className="text-xl text-slate-400 uppercase tracking-widest">XP</span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Acquired Credits</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-10">
               <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Proficiency</p>
                  <p className={`text-2xl font-black ${percentage >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>{percentage}%</p>
               </div>
               <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Solved</p>
                  <p className="text-2xl font-black text-slate-900">{results.solvedCount}/{questions.length}</p>
               </div>
            </div>

            <Button onClick={() => navigate("/contests")} variant="primary" className="w-full py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary-500/20 active:scale-95 transition-all">
              Return to Sector
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // --- Initialization Screen ---
  if (!hasStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
        {/* Dynamic ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-100/50 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        
        <Card className="max-w-xl w-full relative z-10 border-slate-200 bg-white shadow-2xl p-10 rounded-3xl">
          <div className="text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 border border-red-100 text-red-600 shadow-inner mb-6">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">{contest.title}</h1>
            {contest.description && <p className="text-slate-500 font-medium text-lg mb-10 leading-relaxed">{contest.description}</p>}
            
            <div className="flex items-center justify-center gap-12 mb-10">
              <div className="text-center">
                <span className="block text-4xl font-black text-slate-900 tracking-tighter">{questions.length}</span>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1 block">Nodes</span>
              </div>
              <div className="h-16 w-px bg-slate-100" />
              <div className="text-center">
                <span className="block text-4xl font-black text-primary-600 tracking-tighter">{contest.duration}</span>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1 block">Minutes</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-10 text-left relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Shield className="h-12 w-12 text-primary-900" />
               </div>
              <p className="font-black text-slate-900 uppercase tracking-widest text-[10px] mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Deployment Protocols:
              </p>
              <ul className="space-y-3 text-sm font-bold text-slate-600">
                <li className="flex gap-3 items-start"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> Sequence begins immediately upon entry.</li>
                <li className="flex gap-3 items-start"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> Submit evaluations via the provided terminal.</li>
                <li className="flex gap-3 items-start"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> Timer maintains persistence across disconnects.</li>
                <li className="flex gap-3 items-start"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> Submissions are locked post-conclusion.</li>
              </ul>
            </div>
            
            <Button onClick={handleStart} size="lg" className="w-full py-5 rounded-2xl font-black text-xl bg-slate-900 hover:bg-black text-white border-none shadow-2xl shadow-slate-900/20 active:scale-95 transition-all">
              Initiate Battle Run
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // --- Main Battle Arena ---
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-primary-100">
      {/* Top Header Panel */}
      <div className="bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between shrink-0 shadow-sm relative z-50">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="sm" onClick={() => setShowSubmitConfirm(true)} className="text-slate-500 font-bold hover:bg-slate-50 rounded-xl px-4 group">
            <ChevronLeft className="h-5 w-5 mr-1.5 group-hover:-translate-x-1 transition-transform" /> Retreat
          </Button>
          <div className="h-8 w-px bg-slate-100 hidden sm:block" />
          <div className="min-w-0">
            <h1 className="font-extrabold text-slate-900 text-sm truncate max-w-[200px]">{contest.title}</h1>
            <p className="text-[9px] text-red-500 uppercase tracking-[0.2em] font-black flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live Engagement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 shadow-inner">
             <TestTimer formatted={formatted} timeLeft={timeLeft} />
          </div>

          <div className="h-8 w-px bg-slate-100 hidden sm:block" />

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl p-2 hidden sm:flex"
          >
            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </Button>

          <Button
            onClick={() => setShowSubmitConfirm(true)}
            size="sm"
            className="bg-primary-600 hover:bg-primary-700 border-none text-white font-bold px-6 rounded-xl shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
            leftIcon={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
          >
            Submit Deployment
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Navigation Sidebar */}
        <div className="w-16 sm:w-72 shrink-0 border-r border-slate-100 bg-slate-50/50 overflow-y-auto hidden md:block">
          <div className="p-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
               <Shield className="h-3 w-3" /> Command Center
            </h3>
            <QuestionNavigator
              total={questions.length}
              current={currentIndex}
              answeredIndices={answeredIndices}
              onNavigate={setCurrentIndex}
            />
          </div>
        </div>

        {/* Content Region */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50 relative overflow-hidden">
          {currentQuestion && currentAnswer ? (
            <div className="flex flex-col h-full overflow-y-auto">
              <div className="p-4 sm:p-8 pb-32">
                <div className="max-w-6xl mx-auto space-y-8">
                  {/* Current Q Header */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                       <Zap className="h-32 w-32 text-primary-900 rotate-12" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-6 flex-wrap">
                        <span className="px-4 py-1.5 bg-primary-50 text-primary-700 text-xs font-black rounded-xl border border-primary-100 uppercase tracking-widest shadow-sm">
                          Terminal Node {currentIndex + 1}
                        </span>
                        <Badge variant="gray" className="capitalize font-bold text-[10px] px-3">{(currentQuestion.type || "CODING").replace("_", " ")}</Badge>
                        <Badge
                          className="font-black text-[10px] tracking-widest px-3"
                          variant={
                            currentQ.difficulty === "Easy"
                              ? "success"
                              : currentQ.difficulty === "Hard"
                              ? "danger"
                              : "warning"
                          }
                        >
                          {currentQ.difficulty?.toUpperCase() || "MEDIUM"}
                        </Badge>
                        <div className="h-6 w-px bg-slate-100 mx-1" />
                        <span className="text-xs font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 shadow-sm">{currentQ.points || 0} XP Reward</span>
                      </div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight mb-4">{currentQ.title}</h2>
                      {currentQ.description && (
                        <div
                          className="text-slate-600 font-medium leading-relaxed prose prose-slate prose-lg max-w-none prose-headings:text-slate-900 prose-strong:text-slate-900 prose-code:text-primary-600 prose-code:bg-primary-50 prose-code:px-1.5 prose-code:rounded prose-pre:bg-slate-900 prose-pre:rounded-2xl"
                          dangerouslySetInnerHTML={{ __html: currentQ.description }}
                        />
                      )}
                    </div>
                  </div>

                  {/* IDE / Mult-Choice Engine */}
                  <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50">
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
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-50 flex items-center justify-center">
                <div className="max-w-6xl w-full flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                    disabled={currentIndex === 0}
                    className="text-slate-500 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 rounded-xl px-6 group"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Previous Node
                  </Button>
                  <div className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] bg-slate-50 px-6 py-2 rounded-full border border-slate-100 shadow-inner">
                     Sector <span className="text-primary-600 font-black">{currentIndex + 1}</span> of {questions.length}
                  </div>
                  <Button
                    onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                    disabled={currentIndex === questions.length - 1}
                    variant="secondary"
                    className="font-black uppercase tracking-widest text-[10px] rounded-xl px-6 py-3 shadow-md group"
                  >
                    Next Node <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="m-auto flex flex-col items-center justify-center p-12 text-center">
               <div className="relative mb-6">
                  <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
                  <Zap className="h-4 w-4 text-primary-600 absolute inset-0 m-auto" />
               </div>
               <p className="text-lg font-black text-slate-900 tracking-tight">Syncing Battleground...</p>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Initializing Node Environment</p>
            </div>
          )}
        </div>
      </div>

      {/* Warning submission modal */}
      <Modal
        isOpen={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        title="Finalize Deployment"
        footer={
          <div className="flex gap-3 w-full sm:justify-end">
            <Button variant="ghost" onClick={() => setShowSubmitConfirm(false)} className="font-bold rounded-xl px-6">
              Back to Battle
            </Button>
            <Button onClick={handleSubmit} isLoading={isSubmitting} className="bg-primary-600 hover:bg-primary-700 border-none text-white font-bold px-8 rounded-xl shadow-lg shadow-primary-500/20 active:scale-95 transition-all">
              Execute Final Submission
            </Button>
          </div>
        }
      >
        <div className="space-y-6 py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 border border-amber-100 shadow-inner mb-2 mx-auto">
             <AlertTriangle className="h-8 w-8" />
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-slate-900 tracking-tight mb-2">Final Confirmation</p>
            <p className="text-sm font-medium text-slate-500 leading-relaxed">Are you certain you wish to terminate the session? Submissions are permanent and cannot be altered past this vector.</p>
          </div>
          
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-inner">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified Nodes:</span>
              <span className="font-black text-primary-600 text-lg">
                {answeredIndices.size} / {questions.length}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mt-3">
               <div className="h-full bg-primary-500 rounded-full transition-all duration-1000" style={{ width: `${(answeredIndices.size / questions.length) * 100}%` }} />
            </div>
            {answeredIndices.size < questions.length && (
              <p className="text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mt-4 text-center justify-center">
                <AlertTriangle className="h-3.5 w-3.5" />
                Warning: {questions.length - answeredIndices.size} Inactive Node(s)
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

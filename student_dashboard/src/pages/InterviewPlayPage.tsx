import { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  Building2,
  Clock,
  MessageSquare,
  Star,
  ArrowLeft,
  Shield,
  CheckCircle2,
  Brain,
  Target,
  Lightbulb,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useTimer } from "@/hooks/useTimer";
import { interviewService } from "@/services/interview.service";
import type { InterviewDetail } from "@/services/interview.service";
import { Spinner, Button, Badge, Card, Modal } from "@/components/ui";
import toast from "react-hot-toast";

interface QuestionAnswer {
  response: string;
  selfScore: number;
}

const SELF_SCORE_OPTIONS = [
  { value: 1, label: "Struggled", emoji: "😰", color: "border-red-300 bg-red-50 text-red-700 hover:border-red-400" },
  { value: 2, label: "Weak", emoji: "😕", color: "border-orange-300 bg-orange-50 text-orange-700 hover:border-orange-400" },
  { value: 3, label: "Okay", emoji: "🙂", color: "border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-400" },
  { value: 4, label: "Good", emoji: "😊", color: "border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400" },
  { value: 5, label: "Nailed It", emoji: "🔥", color: "border-green-300 bg-green-50 text-green-700 hover:border-green-400" },
];

const categoryTheme: Record<string, { bg: string; text: string; border: string; icon: typeof Brain }> = {
  technical: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", icon: Brain },
  behavioral: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: MessageSquare },
  "system-design": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", icon: Target },
};

export default function InterviewPlayPage() {
  const { id: interviewId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, QuestionAnswer>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [results, setResults] = useState<{
    overallScore: number;
    scores: { technicalDepth: number; communication: number; edgeCases: number; problemSolving: number };
  } | null>(null);

  // Fetch interview data
  const fetchInterview = useCallback(
    () => interviewService.getInterviewById(interviewId!),
    [interviewId]
  );
  const { data: interview, loading, error } = useApi<InterviewDetail>(fetchInterview, [interviewId]);

  const questions = useMemo(() => interview?.questions || [], [interview]);
  const duration = (interview?.duration || 45) * 60; // seconds

  const handleExpire = useCallback(() => {
    toast.error("Time's up! Submitting your interview...");
    doSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { formatted, timeLeft, start } = useTimer(duration, handleExpire);

  // Prevent accidental close
  useEffect(() => {
    if (!hasStarted || showResults) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Your interview is still in progress. Are you sure you want to leave?";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasStarted, showResults]);

  // Initialize answers when questions load
  useEffect(() => {
    if (questions.length > 0 && Object.keys(answers).length === 0) {
      const initial: Record<number, QuestionAnswer> = {};
      questions.forEach((_, i) => {
        initial[i] = { response: "", selfScore: 0 };
      });
      setAnswers(initial);
    }
  }, [questions, answers]);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentIndex];

  const answeredCount = useMemo(() => {
    return Object.values(answers).filter((a) => a.response.trim().length > 0 && a.selfScore > 0).length;
  }, [answers]);

  // Handlers
  const handleStart = () => {
    setHasStarted(true);
    start();
  };

  const handleResponseChange = (text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: { ...prev[currentIndex], response: text },
    }));
  };

  const handleSelfScore = (score: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: { ...prev[currentIndex], selfScore: score },
    }));
  };

  const doSubmit = async () => {
    setShowSubmitConfirm(false);
    setIsSubmitting(true);

    const elapsed = duration - timeLeft;
    const submissionAnswers = Object.entries(answers).map(([idx, a]) => ({
      questionIndex: Number(idx),
      response: a.response,
      selfScore: a.selfScore || 3,
    }));

    try {
      const res = await interviewService.submitAttempt(interviewId!, {
        answers: submissionAnswers,
        timeTaken: elapsed,
      });
      setResults({
        overallScore: res.data.data.overallScore,
        scores: res.data.data.scores,
      });
      setShowResults(true);
      toast.success("Interview submitted successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit. Try again.");
    }
    setIsSubmitting(false);
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  // ── Error ──
  if (error || !interview) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <h2 className="text-xl font-extrabold text-slate-900">Interview Unavailable</h2>
        <p className="text-slate-500 font-medium">This interview may not exist or you don't have access.</p>
        <Button variant="secondary" className="font-bold px-8 rounded-2xl" onClick={() => navigate("/interviews")}>
          Back to Interviews
        </Button>
      </div>
    );
  }

  // ── Results ──
  if (showResults && results) {
    const score = results.overallScore;
    const categories = [
      { label: "Technical Depth", score: results.scores.technicalDepth, icon: Brain, color: "bg-sky-500" },
      { label: "Communication", score: results.scores.communication, icon: MessageSquare, color: "bg-emerald-500" },
      { label: "Edge Cases", score: results.scores.edgeCases, icon: AlertTriangle, color: "bg-amber-500" },
      { label: "Problem Solving", score: results.scores.problemSolving, icon: Target, color: "bg-purple-500" },
    ];

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-lg w-full shadow-2xl border-slate-200">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-bold text-slate-500">{interview.company}</span>
              <span className="text-slate-300">·</span>
              <span className="text-sm font-medium text-slate-500">{interview.role}</span>
            </div>
            <div
              className={`text-6xl font-extrabold mb-2 ${
                score >= 70 ? "text-emerald-600" : score >= 40 ? "text-amber-600" : "text-red-600"
              }`}
            >
              {score}%
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">Overall Performance</p>
            <Badge
              variant={score >= 70 ? "success" : score >= 40 ? "warning" : "danger"}
              className="text-sm px-6 py-1.5 rounded-full font-bold uppercase tracking-wide"
            >
              {score >= 70 ? "INTERVIEW READY" : score >= 40 ? "KEEP PRACTICING" : "NEEDS WORK"}
            </Badge>
          </div>

          {/* Category breakdown */}
          <div className="space-y-3 mb-8">
            {categories.map((cat) => (
              <div key={cat.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                    <cat.icon className="h-3.5 w-3.5 text-slate-400" />
                    {cat.label}
                  </span>
                  <span className="text-xs font-bold text-slate-700">{cat.score}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${cat.color} transition-all duration-700`}
                    style={{ width: `${cat.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <Button onClick={() => navigate("/interviews")} className="w-full font-bold py-4 rounded-2xl shadow-lg shadow-primary-500/20">
            Back to Interviews
          </Button>
        </Card>
      </div>
    );
  }

  // ── Start Screen ──
  if (!hasStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-xl w-full shadow-2xl border-slate-200">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-bold text-slate-500">{interview.company}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-1">{interview.role} Interview</h1>
            <Badge variant={interview.difficulty === "Easy" ? "success" : interview.difficulty === "Hard" ? "danger" : interview.difficulty === "Boss" ? "primary" : "warning"}>
              {interview.difficulty}
            </Badge>

            <div className="grid grid-cols-3 gap-4 mt-8 mb-10">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="block text-2xl font-extrabold text-slate-900">{questions.length}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Questions</span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="block text-2xl font-extrabold text-slate-900">{interview.duration}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Minutes</span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="block text-2xl font-extrabold text-slate-900">{interview.attempts || 0}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Past Tries</span>
              </div>
            </div>

            {interview.topics?.length > 0 && (
              <div className="flex gap-2 flex-wrap justify-center mb-8">
                {interview.topics.map((t) => (
                  <span key={t} className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-8 text-left shadow-xs">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-bold mb-2 uppercase tracking-wide text-xs">How it works:</p>
                  <ul className="space-y-1.5 font-medium opacity-90">
                    <li className="flex items-center gap-2 text-xs"><div className="h-1 w-1 rounded-full bg-amber-400" /> Answer each question in your own words</li>
                    <li className="flex items-center gap-2 text-xs"><div className="h-1 w-1 rounded-full bg-amber-400" /> Rate your own confidence for each answer</li>
                    <li className="flex items-center gap-2 text-xs"><div className="h-1 w-1 rounded-full bg-amber-400" /> Use hints if you get stuck (no penalty)</li>
                    <li className="flex items-center gap-2 text-xs"><div className="h-1 w-1 rounded-full bg-amber-400" /> Timer starts immediately — auto-submits on timeout</li>
                    <li className="flex items-center gap-2 text-xs"><div className="h-1 w-1 rounded-full bg-amber-400" /> You can navigate freely between questions</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="font-bold px-6 rounded-2xl" onClick={() => navigate("/interviews")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={handleStart} size="lg" className="flex-1 font-bold py-4 rounded-2xl shadow-xl shadow-primary-500/20">
                <Shield className="h-5 w-5 mr-2" /> Begin Interview
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ── Main Interview UI ──
  const theme = categoryTheme[currentQuestion?.category] || categoryTheme.technical;
  const ThemeIcon = theme.icon;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-purple-600" />
            {interview.company} — {interview.role}
          </h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Question {currentIndex + 1} <span className="text-slate-300">/</span> {questions.length}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Timer */}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono text-sm font-bold ${
              timeLeft < 60
                ? "border-red-200 bg-red-50 text-red-600 animate-pulse"
                : timeLeft < 300
                ? "border-amber-200 bg-amber-50 text-amber-600"
                : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
          >
            <Clock className="h-4 w-4" />
            {formatted}
          </div>

          <Button
            onClick={() => setShowSubmitConfirm(true)}
            variant="danger"
            leftIcon={<Send className="h-4 w-4" />}
            isLoading={isSubmitting}
          >
            Submit
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Question Navigator Sidebar */}
        <div className="w-64 shrink-0 p-6 border-r border-slate-200 bg-white min-h-[calc(100vh-64px)] shadow-sm">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Questions</h3>
          <div className="grid grid-cols-4 gap-2">
            {questions.map((q, i) => {
              const answered = answers[i]?.response.trim().length > 0 && answers[i]?.selfScore > 0;
              const isCurrent = i === currentIndex;
              const cat = categoryTheme[q.category] || categoryTheme.technical;
              return (
                <button
                  key={i}
                  onClick={() => { setCurrentIndex(i); setShowHints(false); }}
                  className={`h-10 w-10 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-primary-600 text-white shadow-lg shadow-primary-500/30 scale-110"
                      : answered
                      ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                      : `${cat.bg} ${cat.text} border ${cat.border} hover:scale-105`
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

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

          {/* Progress */}
          <div className="mt-8 border-t border-slate-50 pt-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Progress</p>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
              />
            </div>
            <p className="text-xs font-bold text-slate-500 mt-1.5">
              {answeredCount} / {questions.length} complete
            </p>
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 p-8 max-w-4xl">
          {currentQuestion && currentAnswer && (
            <div className="space-y-6">
              {/* Question Header */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="primary">Q{currentIndex + 1}</Badge>
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${theme.bg} ${theme.text} ${theme.border}`}>
                    <ThemeIcon className="h-3.5 w-3.5" />
                    {currentQuestion.category}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 leading-relaxed">{currentQuestion.question}</h2>
              </div>

              {/* Hints Toggle */}
              {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowHints(!showHints)}
                    className="flex items-center gap-2 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors cursor-pointer"
                  >
                    <Lightbulb className="h-4 w-4" />
                    {showHints ? "Hide Hints" : `Show ${currentQuestion.hints.length} Hint${currentQuestion.hints.length > 1 ? "s" : ""}`}
                  </button>
                  {showHints && (
                    <div className="mt-2 bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-1.5">
                      {currentQuestion.hints.map((hint, i) => (
                        <p key={i} className="text-sm text-amber-800 flex items-start gap-2">
                          <span className="text-amber-400 font-bold">💡</span> {hint}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Response Textarea */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  Your Answer
                </label>
                <textarea
                  value={currentAnswer.response}
                  onChange={(e) => handleResponseChange(e.target.value)}
                  rows={8}
                  placeholder="Type your answer here... Be as detailed as you would be in a real interview. Cover key concepts, examples, and edge cases."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none resize-y transition-all font-medium leading-relaxed"
                />
                <p className="text-[10px] text-slate-400 font-medium mt-1 text-right">
                  {currentAnswer.response.length} characters
                </p>
              </div>

              {/* Self Score */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block flex items-center gap-2">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  How confident are you in this answer?
                </label>
                <div className="flex gap-2">
                  {SELF_SCORE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleSelfScore(opt.value)}
                      className={`flex-1 py-3 rounded-xl border-2 text-center transition-all cursor-pointer ${
                        currentAnswer.selfScore === opt.value
                          ? `${opt.color} scale-105 shadow-md ring-2 ring-offset-1 ring-current/20`
                          : "border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-lg block">{opt.emoji}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider block mt-0.5">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <Button
                  variant="secondary"
                  onClick={() => { setCurrentIndex((i) => Math.max(0, i - 1)); setShowHints(false); }}
                  disabled={currentIndex === 0}
                  className="font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                  leftIcon={<ChevronLeft className="h-4 w-4" />}
                >
                  Previous
                </Button>

                {currentIndex === questions.length - 1 ? (
                  <Button
                    onClick={() => setShowSubmitConfirm(true)}
                    className="font-bold px-8 shadow-md bg-emerald-600 hover:bg-emerald-700"
                    leftIcon={<CheckCircle2 className="h-4 w-4" />}
                  >
                    Finish & Submit
                  </Button>
                ) : (
                  <Button
                    onClick={() => { setCurrentIndex((i) => Math.min(questions.length - 1, i + 1)); setShowHints(false); }}
                    className="font-bold px-8 shadow-md"
                    rightIcon={<ChevronRight className="h-4 w-4" />}
                  >
                    Next Question
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        title="Submit Interview"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowSubmitConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={doSubmit} isLoading={isSubmitting}>
              Submit Interview
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <p className="text-slate-600 font-medium">
            Are you sure you want to submit? This action cannot be undone.
          </p>
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 shadow-inner">
            <div className="flex justify-between items-center text-sm mb-3">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Answered</span>
              <span className="font-extrabold text-slate-900 border bg-white px-3 py-1 rounded-lg">
                {answeredCount} / {questions.length}
              </span>
            </div>
            {answeredCount < questions.length && (
              <div className="bg-red-50 text-red-600 text-[11px] font-bold p-3 rounded-xl flex items-center gap-2 border border-red-100">
                <AlertTriangle className="h-4 w-4" />
                {questions.length - answeredCount} question{questions.length - answeredCount > 1 ? "s" : ""} still incomplete
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

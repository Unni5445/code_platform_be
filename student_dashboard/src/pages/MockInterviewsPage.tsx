import { useState, useCallback, useMemo } from "react";
import {
  Shield,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  Brain,
  Target,
  AlertTriangle,
  Building2,
  Clock,
  Lock,
  Play,
  BarChart3,
} from "lucide-react";
import { Card, Badge, Spinner } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { interviewService } from "@/services/interview.service";
import type { MockInterviewItem, InterviewStats } from "@/services/interview.service";

const difficultyEmoji: Record<string, string> = {
  Easy: "⚡",
  Medium: "🔥",
  Hard: "💀",
  Boss: "👹",
};

const difficultyBadge: Record<string, "success" | "warning" | "danger" | "primary"> = {
  Easy: "success",
  Medium: "warning",
  Hard: "danger",
  Boss: "primary",
};

function InterviewCard({ interview, onStart }: { interview: MockInterviewItem; onStart: (id: string) => void }) {
  const isLocked = interview.status === "locked";
  const isCompleted = interview.status === "completed";
  const questionsCount = interview.questions?.length || 0;

  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-300 relative overflow-hidden ${
        isLocked
          ? "border-slate-700/40 bg-slate-900/30 opacity-60"
          : isCompleted
          ? "border-emerald-500/30 bg-emerald-500/5"
          : interview.difficulty === "Boss"
          ? "border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-red-500/5 hover:border-purple-400/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.08)]"
          : "border-slate-800/80 bg-slate-900/60 hover:border-primary-500/40"
      }`}
    >
      {/* Boss glow */}
      {interview.difficulty === "Boss" && !isLocked && (
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />
      )}

      <div className="flex items-start justify-between gap-4 relative">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-md">
                {interview.company}
              </span>
            </div>
            <Badge variant={difficultyBadge[interview.difficulty] || "gray"}>
              {difficultyEmoji[interview.difficulty] || ""} {interview.difficulty === "Boss" ? "Boss Battle" : interview.difficulty}
            </Badge>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" /> Defeated
              </span>
            )}
          </div>

          <h3 className="text-base font-semibold text-white mb-1">{interview.role} Interview</h3>

          <div className="flex items-center gap-3 text-xs text-slate-400 mb-3 flex-wrap">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {questionsCount} questions
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {interview.duration} min
            </span>
            {interview.attempts > 0 && (
              <span className="flex items-center gap-1">
                <Target className="h-3.5 w-3.5" />
                {interview.attempts} attempt{interview.attempts !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Topics */}
          {interview.topics && interview.topics.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {interview.topics.map((topic) => (
                <span
                  key={topic}
                  className="text-xs px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}

          {/* Best Score */}
          {interview.bestScore != null && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    interview.bestScore >= 80
                      ? "bg-emerald-500"
                      : interview.bestScore >= 50
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${interview.bestScore}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-300">{interview.bestScore}%</span>
            </div>
          )}
        </div>

        {/* Action */}
        <div className="shrink-0">
          {isLocked ? (
            <div className="flex flex-col items-center gap-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/60 border border-slate-700/40">
                <Lock className="h-5 w-5 text-slate-600" />
              </div>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide">LVL {interview.requiredLevel}</span>
            </div>
          ) : (
            <button
              onClick={() => onStart(interview._id)}
              className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 cursor-pointer ${
                interview.difficulty === "Boss"
                  ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30"
                  : isCompleted
                  ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
                  : "bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 hover:scale-110 border border-primary-500/30"
              }`}
            >
              <Play className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReadinessScoreCard({ score }: { score: number }) {
  const getLevel = () => {
    if (score >= 90) return { label: "Interview Ready", color: "text-emerald-300", bg: "bg-emerald-500" };
    if (score >= 70) return { label: "Almost There", color: "text-amber-300", bg: "bg-amber-500" };
    if (score >= 50) return { label: "Needs Practice", color: "text-orange-300", bg: "bg-orange-500" };
    return { label: "Just Starting", color: "text-red-300", bg: "bg-red-500" };
  };
  const level = getLevel();

  return (
    <Card>
      <div className="text-center">
        <h3 className="text-sm font-semibold text-slate-50 mb-4 flex items-center justify-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary-400" />
          Interview Readiness
        </h3>
        <div className="relative mx-auto w-28 h-28 mb-3">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(30 41 59 / 0.8)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke="url(#readinessGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${score * 2.64} ${264 - score * 2.64}`}
            />
            <defs>
              <linearGradient id="readinessGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00e5a8" />
                <stop offset="100%" stopColor="#2d9cff" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{score}%</span>
          </div>
        </div>
        <p className={`text-sm font-medium ${level.color}`}>{level.label}</p>
      </div>
    </Card>
  );
}

function FeedbackCard({ stats }: { stats?: InterviewStats }) {
  const categories = [
    { label: "Technical Depth", score: stats?.scores.technicalDepth || 0, icon: Brain, color: "bg-sky-500" },
    { label: "Communication", score: stats?.scores.communication || 0, icon: MessageSquare, color: "bg-emerald-500" },
    { label: "Edge Cases", score: stats?.scores.edgeCases || 0, icon: AlertTriangle, color: "bg-amber-500" },
    { label: "Problem Solving", score: stats?.scores.problemSolving || 0, icon: Target, color: "bg-purple-500" },
  ];

  return (
    <Card>
      <h3 className="text-sm font-semibold text-slate-50 mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-amber-400" />
        Skill Breakdown
      </h3>
      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-300 flex items-center gap-1.5">
                <cat.icon className="h-3.5 w-3.5 text-slate-400" />
                {cat.label}
              </span>
              <span className="text-xs font-medium text-slate-300">{cat.score}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${cat.color} transition-all duration-700`}
                style={{ width: `${cat.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function MockInterviewsPage() {
  const [tab, setTab] = useState<"all" | "available" | "completed">("all");

  const fetchInterviews = useCallback(() => interviewService.getInterviews(), []);
  const fetchStats = useCallback(() => interviewService.getStats(), []);

  const { data: interviewsData, loading: interviewsLoading } = useApi(fetchInterviews);
  const { data: statsData } = useApi(fetchStats);

  const mockInterviews = interviewsData || [];
  const stats = statsData || undefined;

  const filtered = mockInterviews.filter((i) => {
    if (tab === "available") return i.status === "available";
    if (tab === "completed") return i.status === "completed";
    return true;
  });

  const completedCount = mockInterviews.filter((i) => i.status === "completed").length;
  const avgScore = stats?.averageScore || 0;

  // Extract a few random questions for quick practice module
  const quickPracticeQuestions = useMemo(() => {
    if (!mockInterviews.length) return [];
    const allQuestions = mockInterviews.flatMap(i => i.questions || []);
    // Shuffle and pick 3
    return allQuestions.sort(() => 0.5 - Math.random()).slice(0, 3);
  }, [mockInterviews]);

  const handleStartInterview = (id: string) => {
    // In real implementation, navigate to interview practice page
    console.log("Starting interview:", id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl mc-glass p-6">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-red-500/10 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-500/30">
              <Shield className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Boss Battles</h1>
              <p className="text-sm text-slate-400">
                Practice real interviews, company-specific challenges
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-slate-400">Defeated</p>
              <p className="text-lg font-bold text-emerald-300">{completedCount}/{mockInterviews.length}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Avg Score</p>
              <p className="text-lg font-bold text-amber-300">{Math.round(avgScore)}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interview list */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl w-fit border border-slate-700/60">
            {(["all", "available", "completed"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer capitalize ${
                  tab === t
                    ? "bg-primary-500/30 text-white border border-primary-500/50 shadow-lg shadow-primary-500/10 text-shadow-glow"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                {t === "all" ? "All Bosses" : t}
              </button>
            ))}
          </div>

          {/* Interview list */}
          {interviewsLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800/80">
              <Shield className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No mock interviews available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((interview) => (
                <InterviewCard
                  key={interview._id}
                  interview={interview}
                  onStart={handleStartInterview}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: Stats sidebar */}
        <div className="space-y-4">
          <ReadinessScoreCard score={Math.round(avgScore)} />
          <FeedbackCard stats={stats} />

          {/* Quick Practice */}
          {quickPracticeQuestions.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-50 mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-sky-400" />
                Quick Practice
              </h3>
              <div className="space-y-2">
                {quickPracticeQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    className="w-full text-left rounded-xl bg-slate-800/60 border border-slate-700/40 p-3 hover:border-primary-500/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-2">
                      <Badge
                        variant={
                          q.category === "technical" ? "info" : q.category === "behavioral" ? "warning" : "primary"
                        }
                        className="shrink-0 mt-0.5"
                      >
                        {q.category}
                      </Badge>
                      <p className="text-xs text-slate-300 line-clamp-2">{q.question}</p>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

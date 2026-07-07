import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Card, Badge, Spinner, EmptyState, Modal, Button } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { interviewService } from "@/services/interview.service";
import type { MockInterviewItem, InterviewStats } from "@/services/interview.service";
import { paymentService } from "@/services/payment.service";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

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
          ? "border-slate-100 bg-slate-50 opacity-60"
          : isCompleted
          ? "border-emerald-200 bg-emerald-50"
          : interview.difficulty === "Boss"
          ? "border-purple-200 bg-linear-to-br from-purple-50 to-red-50 hover:border-purple-300 hover:shadow-md"
          : "border-slate-200 bg-white hover:border-primary-300 hover:shadow-sm"
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
              <Building2 className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                {interview.company}
              </span>
            </div>
            <Badge variant={difficultyBadge[interview.difficulty] || "gray"}>
              {difficultyEmoji[interview.difficulty] || ""} {interview.difficulty === "Boss" ? "Boss Battle" : interview.difficulty}
            </Badge>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" /> Defeated
              </span>
            )}
          </div>

          <h3 className="text-base font-semibold text-slate-900 mb-1">{interview.role} Interview</h3>

          <div className="flex items-center gap-3 text-xs text-slate-500 mb-3 flex-wrap">
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
                  className="text-xs px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-100"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}

          {/* Best Score */}
          {interview.bestScore != null && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
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
              <span className="text-xs font-medium text-slate-600">{interview.bestScore}%</span>
            </div>
          )}
        </div>

        {/* Action */}
        <div className="shrink-0">
          {isLocked ? (
            <div className="flex flex-col items-center gap-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">LVL {interview.requiredLevel}</span>
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
        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center justify-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary-600" />
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
            <span className="text-2xl font-bold text-slate-900">{score}%</span>
          </div>
        </div>
        <p className={`text-sm font-medium ${level.color.replace('300', '600')}`}>{level.label}</p>
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
      <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-amber-600" />
        Skill Breakdown
      </h3>
      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <cat.icon className="h-3.5 w-3.5 text-slate-400" />
                {cat.label}
              </span>
              <span className="text-xs font-medium text-slate-700">{cat.score}%</span>
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
    </Card>
  );
}

export default function MockInterviewsPage() {
  const [tab, setTab] = useState<"all" | "available" | "completed">("all");
  const { user: currentUser, refreshUser } = useAuth();
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [tiers, setTiers] = useState<any[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(false);

  const loadTiers = useCallback(async () => {
    setLoadingTiers(true);
    try {
      const res = await paymentService.getSubscriptionTiers();
      const activeTiers = res.data.data.filter((t: any) => t.name !== "NONE");
      setTiers(activeTiers);
    } catch {
      toast.error("Failed to load pricing packages");
    } finally {
      setLoadingTiers(false);
    }
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async (tier: any) => {
    setUpgradeLoading(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load Razorpay SDK. Please check your connection.");
        setUpgradeLoading(false);
        return;
      }

      const orderRes = await paymentService.createOrder(tier._id);
      const { orderId, amount, currency, keyId } = orderRes.data.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: "Morattu Coder",
        description: `Upgrade to ${tier.name} Subscription`,
        order_id: orderId,
        handler: async (response: any) => {
          setUpgradeLoading(true);
          try {
            await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              tierId: tier._id,
            });
            
            toast.success("Subscription upgraded successfully! Premium features unlocked.");
            await refreshUser();
            window.location.reload();
          } catch (err: any) {
            const msg = err?.response?.data?.message || "Payment verification failed";
            toast.error(msg);
          } finally {
            setUpgradeLoading(false);
          }
        },
        prefill: {
          name: currentUser?.name || "",
          email: currentUser?.email || "",
        },
        theme: {
          color: "#7c3aed",
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to initiate payment";
      toast.error(msg);
    } finally {
      setUpgradeLoading(false);
    }
  };

  const fetchInterviews = useCallback(() => interviewService.getInterviews(), []);
  const fetchStats = useCallback(() => interviewService.getStats(), []);

  const { data: interviewsData, loading: interviewsLoading, error: interviewsError } = useApi(fetchInterviews);
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

  const navigate = useNavigate();

  const handleStartInterview = (id: string) => {
    navigate(`/interviews/${id}/play`);
  };

  useEffect(() => {
    if (interviewsError) {
      loadTiers();
    }
  }, [interviewsError, loadTiers]);

  if (interviewsError) {
    return (
      <div className="space-y-8 pb-10 max-w-4xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-2xl p-8 md:p-12 text-center">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Shield className="h-64 w-64 text-primary-900 rotate-12" />
          </div>
          
          <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4 drop-shadow-md" />
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Premium Access Restricted</h2>
          <p className="mt-3 text-sm font-medium text-slate-500 max-w-lg mx-auto leading-relaxed">
            {interviewsError}
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-2xl mx-auto">
            {loadingTiers ? (
              <div className="col-span-2 flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : (
              tiers.map((tier) => {
                const isPremium = tier.name === "PREMIUM";
                return (
                  <div
                    key={tier._id}
                    className={`rounded-2xl border-2 p-6 flex flex-col justify-between transition-all duration-300 relative ${
                      isPremium
                        ? "border-purple-500 bg-purple-50/20 shadow-lg shadow-purple-500/5 scale-105"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    {isPremium && (
                      <span className="absolute -top-3.5 right-6 text-[10px] font-black uppercase tracking-widest text-white bg-purple-600 px-3 py-1 rounded-full border border-purple-400 shadow-md">
                        Best Value
                      </span>
                    )}

                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">{tier.name}</h3>
                      <div className="mt-3 flex items-baseline text-slate-900">
                        <span className="text-3xl font-black tracking-tight">₹{tier.price}</span>
                        <span className="ml-1 text-xs font-semibold text-slate-400">/one-time</span>
                      </div>

                      <ul className="mt-6 space-y-3">
                        {tier.features.includes("courses") && (
                          <li className="flex items-start text-xs font-medium text-slate-600 gap-2">
                            <span className="text-green-500 shrink-0">✔</span> Access to learning modules
                          </li>
                        )}
                        {tier.features.includes("interviews") && (
                          <li className="flex items-start text-xs font-medium text-slate-600 gap-2">
                            <span className="text-green-500 shrink-0">✔</span> AI Mock Interview prep battles
                          </li>
                        )}
                        {isPremium ? (
                          <li className="flex items-start text-xs font-medium text-slate-600 gap-2">
                            <span className="text-green-500 shrink-0">✔</span> Premium skill breakdown radar
                          </li>
                        ) : (
                          <li className="flex items-start text-xs font-medium text-slate-400 line-through gap-2">
                            <span className="text-slate-300 shrink-0">✘</span> AI Mock Interview prep battles
                          </li>
                        )}
                      </ul>
                    </div>

                    <button
                      onClick={() => handleUpgrade(tier)}
                      disabled={upgradeLoading}
                      className={`mt-8 w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-2 ${
                        isPremium
                          ? "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20"
                          : "bg-slate-900 hover:bg-black text-white"
                      }`}
                    >
                      {upgradeLoading ? <Spinner size="sm" /> : `Unlock ${tier.name}`}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-xl p-8 group">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-50 rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-red-50 rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 border border-purple-100 shadow-inner">
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Interview Prep Battles</h1>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Master the art of coding interviews with real-world scenarios and instant feedback.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 self-start md:self-center">
            <div className="text-right border-r border-slate-200 pr-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Success Rate</p>
              <p className="text-2xl font-black text-emerald-600">{Math.round((completedCount / (mockInterviews.length || 1)) * 100)}%</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Average Score</p>
              <p className="text-2xl font-black text-amber-600">{Math.round(avgScore)}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Interview list */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-2xl w-fit shadow-inner relative z-10">
            {(["all", "available", "completed"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-6 py-2.5 text-xs font-black rounded-xl transition-all duration-300 cursor-pointer uppercase tracking-widest ${
                  tab === t
                    ? "bg-white text-primary-600 shadow-lg shadow-primary-500/10 border border-slate-100"
                    : "text-slate-400 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                {t === "all" ? "All Tracks" : t}
              </button>
            ))}
          </div>

          {/* Interview list */}
          {interviewsLoading ? (
            <div className="flex justify-center items-center py-32 bg-white rounded-3xl border border-slate-100 shadow-sm transition-all">
              <Spinner size="lg" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="bg-white border-slate-200 shadow-xl py-20 text-center">
              <EmptyState
                icon={<Shield className="h-16 w-16 text-slate-200 mx-auto" />}
                title="No Tracks Available"
                description="Our selection of interview battles is currently being updated. Return later for fresh challenges!"
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
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
        <div className="space-y-6">
          <ReadinessScoreCard score={Math.round(avgScore)} />
          <FeedbackCard stats={stats} />

          {/* Quick Practice */}
          {quickPracticeQuestions.length > 0 && (
            <Card 
              className="bg-white border-slate-200 shadow-xl overflow-hidden" 
              header={
                <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
                  <MessageSquare className="h-6 w-6 text-sky-600 drop-shadow-sm" />
                  Quick Warmup
                </h3>
              }
            >
              <div className="space-y-4">
                {quickPracticeQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    className="w-full text-left rounded-2xl bg-slate-50 border border-slate-100 p-4 hover:border-primary-300 hover:bg-white hover:shadow-xl transition-all cursor-pointer group/q"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <Badge
                          variant={
                            q.category === "technical" ? "info" : q.category === "behavioral" ? "warning" : "primary"
                          }
                          className="font-bold text-[9px] uppercase tracking-widest px-2 py-0"
                        >
                          {q.category}
                        </Badge>
                      </div>
                      <p className="text-xs font-bold text-slate-600 line-clamp-3 group-hover/q:text-slate-900 leading-relaxed transition-colors">{q.question}</p>
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

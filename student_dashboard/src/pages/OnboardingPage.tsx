import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services";
import { Button, Badge, Card } from "@/components/ui";
import toast from "react-hot-toast";
import {
  Swords,
  Brain,
  Target,
  Shield,
  Crown,
  Sparkles,
  ChevronRight,
  Flame,
  CheckCircle2,
  Zap,
  Loader2,
} from "lucide-react";

type ClassType = "Apprentice" | "Warrior" | "Champion";
type StepType = 1 | 2 | 3;

/* ─────────────────────────────────────────
   Static data
───────────────────────────────────────── */
const CLASSES = [
  {
    id: "Apprentice" as ClassType,
    icon: Shield,
    title: "Apprentice",
    subtitle: "Foundation Path",
    desc: "Starting fresh. Focus on core fundamentals and building steady momentum.",
    tags: ["Beginner Friendly", "Guided"],
    /* per-card accent tokens (all teal-ish — matches primary) */
    glow: "0 0 36px rgba(0,229,168,0.18)",
    borderIdle: "rgba(0,229,168,0.18)",
    borderActive: "#00e5a8",
    iconBg: "rgba(0,229,168,0.1)",
    iconColor: "#00e5a8",
    tagStyle: { background: "rgba(0,229,168,0.08)", color: "rgba(0,229,168,0.75)" },
    activeBg: "linear-gradient(160deg, rgba(0,229,168,0.08) 0%, rgba(0,229,168,0.02) 100%)",
  },
  {
    id: "Warrior" as ClassType,
    icon: Swords,
    title: "Warrior",
    subtitle: "Battle Path",
    desc: "Battle-tested. Ready for intermediate challenges and real project fights.",
    tags: ["Intermediate", "Project-based"],
    glow: "0 0 36px rgba(45,156,255,0.18)",
    borderIdle: "rgba(45,156,255,0.18)",
    borderActive: "#2d9cff",
    iconBg: "rgba(45,156,255,0.1)",
    iconColor: "#2d9cff",
    tagStyle: { background: "rgba(45,156,255,0.08)", color: "rgba(45,156,255,0.75)" },
    activeBg: "linear-gradient(160deg, rgba(45,156,255,0.08) 0%, rgba(45,156,255,0.02) 100%)",
  },
  {
    id: "Champion" as ClassType,
    icon: Crown,
    title: "Champion",
    subtitle: "Mastery Path",
    desc: "Advanced. Seeking algorithmic depth, competitive edge, and peak mastery.",
    tags: ["Advanced", "Competitive"],
    glow: "0 0 36px rgba(139,92,246,0.2)",
    borderIdle: "rgba(139,92,246,0.2)",
    borderActive: "#8b5cf6",
    iconBg: "rgba(139,92,246,0.1)",
    iconColor: "#8b5cf6",
    tagStyle: { background: "rgba(139,92,246,0.08)", color: "rgba(139,92,246,0.75)" },
    activeBg: "linear-gradient(160deg, rgba(139,92,246,0.08) 0%, rgba(139,92,246,0.02) 100%)",
  },
];

const GOALS = [
  { value: 1, title: "Casual", desc: "1 problem / day", sub: "Great for consistent, pressure-free practice.", icon: Target, xp: "50 XP / day", iconColor: "#94a3b8" },
  { value: 3, title: "Committed", desc: "3 problems / day", sub: "The sweet spot for steady, meaningful progress.", icon: Flame, xp: "150 XP / day", iconColor: "#fb923c" },
  { value: 5, title: "Hardcore", desc: "5+ problems / day", sub: "For those who want to level up as fast as possible.", icon: Sparkles, xp: "300 XP / day", iconColor: "#facc15" },
];

const TEST_QUESTIONS = [
  { q: "What is 2 + 2 in JS when concatenated with a string?", a: ["4", '"22"', "NaN", "TypeError"], answer: 1 },
  { q: "Which operator enforces strict type equality?", a: ["==", "===", "=", "=>"], answer: 1 },
  { q: "What does HTML stand for?", a: ["Hyper Text Markup Language", "Home Tool Markup Language", "Hyperlinks Text Mark Language"], answer: 0 },
];

const STEP_META = [
  { label: "Class", sub: "Choose your path" },
  { label: "Aptitude", sub: "Calibrate your rank" },
  { label: "Daily Goal", sub: "Set your commitment" },
];

/* ─────────────────────────────────────────
   Component
───────────────────────────────────────── */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const { updateUserLocally, user } = useAuth();

  const [step, setStep] = useState<StepType>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playerClass, setPlayerClass] = useState<ClassType | null>(null);
  const [dailyGoal, setDailyGoal] = useState<number>(3);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [testComplete, setTestComplete] = useState(false);
  const [answeredIdx, setAnsweredIdx] = useState<number | null>(null);

  useEffect(() => {
    if (user?.hasCompletedOnboarding) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleNextStep = () => {
    if (step === 1 && !playerClass) return toast.error("Choose your class!");
    if (step === 2 && !testComplete) return toast.error("Complete the assessment!");
    setStep(p => (p + 1) as StepType);
  };

  const submitOnboarding = async () => {
    if (!playerClass) return;
    setIsSubmitting(true);
    try {
      const res = await authService.completeOnboarding({ playerClass, dailyGoal });
      toast.success("Character Profile Created!");
      updateUserLocally(res.data.data);
      navigate("/dashboard", { replace: true });
    } catch {
      toast.error("Failed to complete onboarding");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswer = (idx: number) => {
    if (answeredIdx !== null) return;
    setAnsweredIdx(idx);
    if (idx === TEST_QUESTIONS[currentQuestion].answer) setScore(s => s + 1);
    setTimeout(() => {
      setAnsweredIdx(null);
      if (currentQuestion < TEST_QUESTIONS.length - 1) setCurrentQuestion(c => c + 1);
      else setTestComplete(true);
    }, 650);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* ── Background decoration ── */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-100/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-100/30 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <div className="w-full max-w-4xl relative z-10">

        {/* ══ STEP TRACKER ══ */}
        <div className="flex items-center justify-center gap-1 mb-16 max-w-xl mx-auto">
          {STEP_META.map((s, i) => {
            const n = i + 1 as StepType;
            const active = step === n;
            const done = step > n;
            return (
              <div key={s.label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  {/* Node */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black border-2 transition-all duration-500 ${
                      done
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                        : active
                        ? "bg-white border-primary-500 text-primary-600 shadow-xl shadow-primary-500/10"
                        : "bg-white border-slate-200 text-slate-300"
                    }`}
                  >
                    {done ? <CheckCircle2 className="w-6 h-6" /> : n}
                  </div>
                  {/* Labels */}
                  <div className="mt-3 text-center">
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-300 ${active ? 'text-primary-600' : done ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {s.label}
                    </p>
                  </div>
                </div>

                {/* Connector */}
                {i < STEP_META.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded-full transition-all duration-700 ${
                      done ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ══════════════════════════════════════
            STEP 1 — CLASS SELECTION
        ══════════════════════════════════════ */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">
                Choose Your Legend
              </h1>
              <p className="text-slate-500 text-lg font-medium max-w-xl mx-auto leading-relaxed">
                Determine your starting trajectory. This choice calibrates your initial missions and XP scaling.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {CLASSES.map(cls => {
                const isSelected = playerClass === cls.id;
                const Icon = cls.icon;
                return (
                  <button
                    key={cls.id}
                    onClick={() => setPlayerClass(cls.id)}
                    className={`text-left flex flex-col p-8 rounded-[32px] border-2 transition-all duration-500 relative overflow-hidden group/card bg-white ${
                      isSelected
                        ? "border-primary-500 shadow-2xl shadow-primary-500/10 -translate-y-2"
                        : "border-slate-100 hover:border-slate-300 hover:-translate-y-1 shadow-sm"
                    }`}
                  >
                    {/* Selected Indicator */}
                    <div className={`absolute top-4 right-4 transition-all duration-500 ${isSelected ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                      <Badge variant="success" className="font-black text-[9px] uppercase tracking-widest px-3 py-1">DEPLOYED</Badge>
                    </div>

                    {/* Left Accent Glow */}
                    {isSelected && (
                      <div className="absolute left-0 inset-y-0 w-1.5 bg-primary-500 shadow-[2px_0_15px_rgba(0,229,168,0.5)]" />
                    )}

                    {/* Icon Container */}
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 border ${
                        isSelected
                          ? "bg-primary-50 border-primary-200 shadow-inner"
                          : "bg-slate-50 border-slate-200 group-hover/card:bg-white group-hover/card:border-primary-100"
                      }`}
                    >
                      <Icon className={`w-8 h-8 ${isSelected ? 'text-primary-600' : 'text-slate-400 group-hover/card:text-primary-400'}`} />
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">{cls.title}</h3>
                    <p className={`text-[10px] font-black tracking-[0.2em] mb-4 uppercase ${isSelected ? 'text-primary-500' : 'text-slate-400'}`}>
                      {cls.subtitle}
                    </p>
                    <p className="text-slate-500 font-medium leading-relaxed mb-6 flex-1 text-sm">{cls.desc}</p>

                    {/* Action Area */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50">
                      {cls.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-xl bg-slate-50 text-slate-400 border border-slate-100">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Hover Shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-50/10 to-transparent -translate-x-full group-hover/card:translate-x-full transition-transform duration-1000 pointer-events-none" />
                  </button>
                );
              })}
            </div>

            <div className="mt-14 flex justify-center">
              <Button
                onClick={handleNextStep}
                disabled={!playerClass}
                size="lg"
                className="px-12 py-6 rounded-3xl font-black text-xl uppercase tracking-widest bg-slate-900 hover:bg-black text-white shadow-2xl active:scale-95 transition-all disabled:opacity-20"
              >
                Assemble Profile <ChevronRight className="w-6 h-6 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            STEP 2 — ASSESSMENT
        ══════════════════════════════════════ */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-2xl mx-auto w-full">
            <div className="text-center mb-10">
              <div className="w-20 h-20 rounded-3xl bg-purple-50 border border-purple-100 flex items-center justify-center mx-auto mb-6 shadow-inner text-purple-600">
                <Brain className="w-10 h-10" />
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Cognitive Benchmark</h1>
              <p className="text-slate-500 font-medium text-lg">Initial calibration. Analyze the patterns and execute.</p>
            </div>

            {!testComplete ? (
              <Card className="bg-white border-slate-200 shadow-2xl p-8 sm:p-12 rounded-[40px] relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-slate-50">
                   <div 
                    className="h-full bg-primary-500 transition-all duration-700 shadow-[0_0_15px_rgba(0,229,168,0.5)]" 
                    style={{ width: `${((currentQuestion + 1) / TEST_QUESTIONS.length) * 100}%` }}
                   />
                </div>

                <div className="flex items-center justify-between mb-10">
                  <span className="text-[10px] font-black tracking-[0.3em] uppercase text-primary-600 bg-primary-50 px-4 py-1.5 rounded-2xl border border-primary-100">
                    Node {currentQuestion + 1} of {TEST_QUESTIONS.length}
                  </span>
                </div>

                <h2 className="text-2xl font-black text-slate-900 leading-tight mb-10">
                  {TEST_QUESTIONS[currentQuestion].q}
                </h2>

                <div className="space-y-4">
                  {TEST_QUESTIONS[currentQuestion].a.map((ans, idx) => {
                    const isCorrect = idx === TEST_QUESTIONS[currentQuestion].answer;
                    const isAnswered = answeredIdx !== null;
                    const isThisOne = answeredIdx === idx;

                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        disabled={isAnswered}
                        className={`w-full flex items-center gap-4 p-5 rounded-3xl border-2 text-left font-bold transition-all duration-300 relative group/opt ${
                          !isAnswered
                            ? "bg-white border-slate-100 hover:border-primary-500 hover:bg-primary-50/30 hover:translate-x-2"
                            : isThisOne && isCorrect
                            ? "bg-emerald-50 border-emerald-500 text-emerald-900"
                            : isThisOne && !isCorrect
                            ? "bg-red-50 border-red-500 text-red-900"
                            : !isThisOne && isCorrect
                            ? "bg-emerald-50/50 border-emerald-200 text-emerald-700 opacity-60"
                            : "bg-slate-50 border-slate-100 text-slate-300 opacity-40"
                        }`}
                      >
                        <span className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black transition-colors ${
                             !isAnswered ? 'bg-slate-100 text-slate-500 group-hover/opt:bg-primary-500 group-hover/opt:text-white' 
                             : isThisOne && isCorrect ? 'bg-emerald-500 text-white'
                             : isThisOne && !isCorrect ? 'bg-red-500 text-white'
                             : 'bg-slate-200 text-slate-400'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-lg">{ans}</span>
                        
                        {isAnswered && isThisOne && isCorrect && <CheckCircle2 className="ml-auto h-6 w-6 text-emerald-500" />}
                      </button>
                    );
                  })}
                </div>
              </Card>
            ) : (
              <Card className="bg-white border-slate-200 shadow-2xl p-12 text-center rounded-[40px] relative overflow-hidden">
                <div className="absolute inset-0 bg-primary-50 opacity-20 pointer-events-none" />
                <div className="relative z-10">
                  <div className="w-24 h-24 rounded-[32px] bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/10">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                  </div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Diagnostics Sync</h2>
                  <div className="inline-block p-6 rounded-3xl bg-slate-50 border border-slate-100 mb-8">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Proficiency Score</p>
                    <p className="text-5xl font-black text-primary-600 tracking-tighter">{score} / {TEST_QUESTIONS.length}</p>
                  </div>
                  <p className="text-slate-500 font-medium text-lg mb-10 max-w-sm mx-auto leading-relaxed">Intelligence verified. Data has been successfully integrated into your profile.</p>
                  <Button
                    onClick={handleNextStep}
                    size="lg"
                    className="px-12 py-6 rounded-3xl font-black text-xl uppercase tracking-widest bg-slate-900 hover:bg-black text-white shadow-2xl active:scale-95 transition-all"
                  >
                    Set Targets <ChevronRight className="w-6 h-6 ml-2" />
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════
            STEP 3 — DAILY GOAL
        ══════════════════════════════════════ */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center mb-12">
              <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-6 shadow-inner text-amber-600">
                <Target className="w-10 h-10" />
              </div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">
                Daily Vow
              </h1>
              <p className="text-slate-500 text-lg font-medium max-w-xl mx-auto leading-relaxed">
                Consistency builds the legend. Select a daily mission intensity that matches your hunger for mastery.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {GOALS.map(g => {
                const isSelected = dailyGoal === g.value;
                const Icon = g.icon;
                return (
                  <button
                    key={g.value}
                    onClick={() => setDailyGoal(g.value)}
                    className={`relative flex flex-col items-start p-8 rounded-[32px] border-2 text-left bg-white transition-all duration-500 group/goal ${
                      isSelected
                        ? "border-amber-500 shadow-2xl shadow-amber-500/10 -translate-y-2"
                        : "border-slate-100 hover:border-slate-300 hover:-translate-y-1 shadow-sm"
                    }`}
                  >
                    {/* Status Pill */}
                    <div className={`absolute top-4 right-4 transition-all duration-500 ${isSelected ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                       <Badge variant="warning" className="font-black text-[9px] uppercase tracking-widest px-3 py-1">ACTIVE VOW</Badge>
                    </div>

                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 border ${
                        isSelected 
                          ? "bg-amber-50 border-amber-200 shadow-inner" 
                          : "bg-slate-50 border-slate-200 group-hover/goal:bg-white"
                      }`}
                    >
                      <Icon className={`w-7 h-7 ${isSelected ? 'text-amber-600' : 'text-slate-400 group-hover/goal:text-amber-400'}`} />
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">{g.title}</h3>
                    <p className={`text-[10px] font-black tracking-[0.2em] mb-4 uppercase ${isSelected ? 'text-amber-500' : 'text-slate-400'}`}>{g.desc}</p>
                    <p className="text-slate-500 font-medium leading-relaxed mb-8 flex-1 text-sm">{g.sub}</p>

                    {/* XP Indicator */}
                    <div
                      className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all duration-500 shadow-sm border ${
                        isSelected ? "bg-amber-100 text-amber-900 border-amber-200" : "bg-slate-50 text-slate-400 border-slate-100"
                      }`}
                    >
                      <Zap className={`w-4 h-4 ${isSelected ? 'animate-pulse' : ''}`} /> {g.xp}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Profile sync board */}
            <div className="max-w-md mx-auto mb-14 bg-white border border-slate-200 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group/board">
               <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover/board:opacity-[0.08] transition-opacity">
                  <Shield className="h-24 w-24 text-primary-900" />
               </div>
               <div className="relative z-10">
                <p className="text-[10px] font-black tracking-[0.3em] uppercase text-primary-600 mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500" /> Identity Matrix
                </p>
                <div className="space-y-4">
                  {[
                    ["Class", playerClass ?? "—", "text-slate-900 font-black"],
                    ["Performance", `${score} / ${TEST_QUESTIONS.length}`, "text-primary-600 font-black"],
                    ["Daily Vow", GOALS.find(g => g.value === dailyGoal)?.desc ?? "—", "text-amber-600 font-black"],
                  ].map(([k, v, s]) => (
                    <div key={k} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{k}</span>
                      <span className={`text-sm ${s}`}>{v}</span>
                    </div>
                  ))}
                </div>
               </div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={submitOnboarding}
                disabled={isSubmitting}
                size="lg"
                className="px-14 py-7 rounded-[32px] font-black text-xl uppercase tracking-widest bg-slate-900 hover:bg-black text-white shadow-2xl active:scale-95 transition-all shadow-slate-900/40"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Initializing Sector…
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    Initialize Deployment <Sparkles className="w-6 h-6" />
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
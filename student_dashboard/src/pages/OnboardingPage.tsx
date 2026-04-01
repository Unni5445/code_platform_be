import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services";
import { Button } from "@/components/ui";
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

  const selectedCls = CLASSES.find(c => c.id === playerClass);

  return (
    <div className="mc-page min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">

      {/* ── Floating ambient particles (from theme) ── */}
      <div className="mc-hero-particles">
        <span style={{ width: 420, height: 420, top: "5%", left: "8%", animationDuration: "18s" }} />
        <span style={{ width: 320, height: 320, bottom: "8%", right: "6%", animationDuration: "22s" }} />
        <span style={{ width: 240, height: 240, top: "55%", left: "55%", animationDuration: "26s" }} />
      </div>

      {/* ── Reactive class glow ── */}
      {selectedCls && (
        <div
          className="pointer-events-none fixed inset-0 transition-all duration-1000"
          style={{
            background: `radial-gradient(ellipse at 15% 80%, ${selectedCls.iconColor}18 0%, transparent 55%),
                         radial-gradient(ellipse at 85% 15%, ${selectedCls.iconColor}0d 0%, transparent 50%)`,
          }}
        />
      )}

      <div className="w-full max-w-4xl relative z-10">

        {/* ══ STEP TRACKER ══ */}
        <div className="flex items-start justify-center gap-0 mb-14 mc-fade-up">
          {STEP_META.map((s, i) => {
            const n = i + 1 as StepType;
            const active = step === n;
            const done = step > n;
            return (
              <div key={s.label} className="flex items-center">
                <div className="flex flex-col items-center w-28">
                  {/* Node */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300"
                    style={{
                      borderColor: done || active ? "#00e5a8" : "rgba(148,163,184,0.2)",
                      background: done ? "linear-gradient(135deg,#00e5a8,#2d9cff)"
                        : active ? "rgba(0,229,168,0.12)"
                          : "rgba(15,23,42,0.6)",
                      color: done ? "#0b1220"
                        : active ? "#00e5a8"
                          : "rgba(148,163,184,0.4)",
                      boxShadow: active ? "0 0 18px rgba(0,229,168,0.35)" : done ? "0 0 14px rgba(0,229,168,0.25)" : "none",
                    }}
                  >
                    {done ? <CheckCircle2 className="w-4 h-4" /> : n}
                  </div>
                  {/* Labels */}
                  <p className="mt-2 text-xs font-semibold transition-colors duration-300"
                    style={{ color: active ? "#e5e7eb" : done ? "rgba(0,229,168,0.6)" : "rgba(148,163,184,0.35)" }}>
                    {s.label}
                  </p>
                  <p className="text-[10px] transition-colors duration-300"
                    style={{ color: active ? "#6b7280" : "rgba(148,163,184,0.2)" }}>
                    {s.sub}
                  </p>
                </div>

                {/* Connector */}
                {i < STEP_META.length - 1 && (
                  <div
                    className="w-16 h-px mx-1 mb-6 transition-all duration-500"
                    style={{
                      background: done
                        ? "linear-gradient(90deg,#00e5a8,#2d9cff)"
                        : "rgba(148,163,184,0.1)",
                    }}
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
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="text-center mb-10">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
                <span className="mc-gradient-text">Choose Your Class</span>
              </h1>
              <p className="text-slate-400 text-base max-w-lg mx-auto leading-relaxed">
                Every legend has a beginning. Pick the path that matches your current experience level.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {CLASSES.map(cls => {
                const isSelected = playerClass === cls.id;
                const Icon = cls.icon;
                return (
                  <button
                    key={cls.id}
                    onClick={() => setPlayerClass(cls.id)}
                    className="text-left flex flex-col p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                    style={{
                      borderColor: isSelected ? cls.borderActive : cls.borderIdle,
                      background: isSelected ? cls.activeBg : "rgba(15,23,42,0.6)",
                      boxShadow: isSelected ? cls.glow : "0 8px 32px rgba(15,23,42,0.5)",
                      backdropFilter: "blur(14px)",
                      transform: isSelected ? "translateY(-4px) scale(1.02)" : undefined,
                    }}
                  >
                    {/* Selected badge */}
                    {isSelected && (
                      <span
                        className="absolute top-4 right-4 text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full border"
                        style={{ borderColor: cls.borderActive, color: cls.iconColor, background: "rgba(15,23,42,0.8)" }}
                      >
                        SELECTED
                      </span>
                    )}

                    {/* Left accent bar */}
                    {isSelected && (
                      <div
                        className="absolute left-0 inset-y-0 w-0.5 rounded-full"
                        style={{ background: cls.borderActive, boxShadow: `0 0 8px ${cls.iconColor}` }}
                      />
                    )}

                    {/* Icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300"
                      style={{ background: cls.iconBg, boxShadow: isSelected ? `0 0 16px ${cls.iconColor}40` : "none" }}
                    >
                      <Icon className="w-6 h-6" style={{ color: cls.iconColor }} />
                    </div>

                    <p className="text-lg font-bold text-white mb-0.5">{cls.title}</p>
                    <p className="text-[11px] font-semibold tracking-widest mb-3 uppercase" style={{ color: "rgba(148,163,184,0.5)" }}>
                      {cls.subtitle}
                    </p>
                    <p className="text-sm text-slate-400 leading-relaxed mb-5 flex-1">{cls.desc}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {cls.tags.map(tag => (
                        <span key={tag} className="text-[11px] font-medium px-2.5 py-0.5 rounded-full" style={cls.tagStyle}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Shimmer */}
                    <div className="absolute inset-0 -translate-x-full hover:translate-x-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent skew-x-[-20deg] transition-transform duration-700 pointer-events-none" />
                  </button>
                );
              })}
            </div>

            <div className="mt-10 flex justify-center">
              <button
                onClick={handleNextStep}
                disabled={!playerClass}
                className="mc-btn-gradient flex items-center gap-2 px-10 py-3 rounded-full text-base font-semibold disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none"
              >
                Forge Path <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            STEP 2 — APTITUDE TEST
        ══════════════════════════════════════ */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 max-w-2xl mx-auto w-full">
            <div className="text-center mb-8">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)" }}
              >
                <Brain className="w-7 h-7" style={{ color: "#8b5cf6" }} />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">Aptitude Check</h1>
              <p className="text-slate-400 text-sm">Calibrating your starting rank. Answer honestly!</p>
            </div>

            {!testComplete ? (
              <div className="mc-glass rounded-2xl p-6 sm:p-8">
                {/* Progress row */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#00e5a8" }}>
                    Question {currentQuestion + 1} / {TEST_QUESTIONS.length}
                  </span>
                  <div className="flex gap-1.5">
                    {TEST_QUESTIONS.map((_, i) => (
                      <div
                        key={i}
                        className="h-1.5 w-8 rounded-full transition-all duration-300"
                        style={{
                          background: i < currentQuestion ? "linear-gradient(90deg,#00e5a8,#2d9cff)"
                            : i === currentQuestion ? "rgba(0,229,168,0.5)"
                              : "rgba(148,163,184,0.12)",
                        }}
                      />
                    ))}
                  </div>
                </div>

                <h2 className="text-lg sm:text-xl font-semibold text-white leading-snug mb-7">
                  {TEST_QUESTIONS[currentQuestion].q}
                </h2>

                <div className="space-y-3">
                  {TEST_QUESTIONS[currentQuestion].a.map((ans, idx) => {
                    const isCorrect = idx === TEST_QUESTIONS[currentQuestion].answer;
                    const isAnswered = answeredIdx !== null;
                    const isThisOne = answeredIdx === idx;

                    let borderColor = "rgba(148,163,184,0.15)";
                    let bgColor = "rgba(15,23,42,0.4)";
                    let textColor = "#94a3b8";
                    let letterBg = "rgba(15,23,42,0.6)";

                    if (!isAnswered) {
                      borderColor = "rgba(148,163,184,0.15)";
                      textColor = "#cbd5e1";
                    } else if (isThisOne && isCorrect) {
                      borderColor = "#00e5a8"; bgColor = "rgba(0,229,168,0.08)"; textColor = "#00e5a8"; letterBg = "rgba(0,229,168,0.15)";
                    } else if (isThisOne && !isCorrect) {
                      borderColor = "#f87171"; bgColor = "rgba(248,113,113,0.08)"; textColor = "#f87171"; letterBg = "rgba(248,113,113,0.15)";
                    } else if (!isThisOne && isCorrect) {
                      borderColor = "rgba(0,229,168,0.3)"; textColor = "rgba(0,229,168,0.5)";
                    } else {
                      borderColor = "rgba(148,163,184,0.07)"; textColor = "rgba(148,163,184,0.3)";
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        disabled={isAnswered}
                        className="w-full flex items-center gap-3.5 p-4 rounded-xl border text-left text-sm font-medium transition-all duration-200 hover:enabled:border-primary-500/40 hover:enabled:bg-slate-800/60"
                        style={{ borderColor, background: bgColor, color: textColor }}
                      >
                        <span
                          className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{ background: letterBg, color: textColor }}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        {ans}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mc-glass rounded-2xl p-10 text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: "rgba(0,229,168,0.1)", border: "1px solid rgba(0,229,168,0.25)" }}
                >
                  <CheckCircle2 className="w-8 h-8" style={{ color: "#00e5a8" }} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Assessment Complete</h2>
                <p className="text-slate-400 text-sm mb-1">
                  You scored <span className="font-semibold text-white">{score} / {TEST_QUESTIONS.length}</span>
                </p>
                <p className="text-slate-500 text-xs mb-8">Baseline stats recorded. Your journey will be calibrated accordingly.</p>
                <button
                  onClick={handleNextStep}
                  className="mc-btn-gradient inline-flex items-center gap-2 px-10 py-3 rounded-full font-semibold"
                >
                  Set Your Goals <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════
            STEP 3 — DAILY GOAL
        ══════════════════════════════════════ */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="text-center mb-10">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.2)" }}
              >
                <Target className="w-7 h-7" style={{ color: "#fb923c" }} />
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
                <span className="mc-gradient-text">Vow of Consistency</span>
              </h1>
              <p className="text-slate-400 text-base max-w-md mx-auto leading-relaxed">
                Mastery is earned one problem at a time. Set your daily target — adjust it anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
              {GOALS.map(g => {
                const isSelected = dailyGoal === g.value;
                const Icon = g.icon;
                return (
                  <button
                    key={g.value}
                    onClick={() => setDailyGoal(g.value)}
                    className="relative flex flex-col items-start p-6 rounded-2xl border text-left transition-all duration-300 hover:-translate-y-1"
                    style={{
                      borderColor: isSelected ? "#00e5a8" : "rgba(0,229,168,0.12)",
                      background: isSelected
                        ? "linear-gradient(160deg, rgba(0,229,168,0.08) 0%, rgba(45,156,255,0.04) 100%)"
                        : "rgba(15,23,42,0.6)",
                      boxShadow: isSelected ? "0 0 32px rgba(0,229,168,0.15)" : "0 8px 32px rgba(15,23,42,0.5)",
                      backdropFilter: "blur(14px)",
                      transform: isSelected ? "translateY(-4px) scale(1.02)" : undefined,
                    }}
                  >
                    {isSelected && (
                      <div className="absolute inset-y-0 left-0 w-0.5 rounded-full"
                        style={{ background: "linear-gradient(180deg,#00e5a8,#2d9cff)", boxShadow: "0 0 8px #00e5a8" }} />
                    )}
                    {isSelected && (
                      <span className="absolute top-4 right-4 text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full border"
                        style={{ borderColor: "#00e5a8", color: "#00e5a8", background: "rgba(15,23,42,0.8)" }}>
                        ACTIVE
                      </span>
                    )}

                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-all duration-300"
                      style={{
                        background: isSelected ? "rgba(0,229,168,0.12)" : "rgba(15,23,42,0.8)",
                        border: `1px solid ${isSelected ? "rgba(0,229,168,0.25)" : "rgba(148,163,184,0.1)"}`,
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color: g.iconColor }} />
                    </div>

                    <p className="text-lg font-bold text-white mb-0.5">{g.title}</p>
                    <p className="text-sm font-medium mb-2" style={{ color: "#94a3b8" }}>{g.desc}</p>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4 flex-1">{g.sub}</p>

                    {/* XP pill */}
                    <div
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors duration-300"
                      style={{
                        background: isSelected ? "rgba(0,229,168,0.12)" : "rgba(148,163,184,0.07)",
                        color: isSelected ? "#00e5a8" : "#64748b",
                      }}
                    >
                      <Zap className="w-3 h-3" /> {g.xp}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Profile summary */}
            <div
              className="max-w-sm mx-auto mb-10 rounded-2xl p-5"
              style={{
                background: "rgba(15,23,42,0.7)",
                border: "1px solid rgba(148,163,184,0.12)",
                backdropFilter: "blur(14px)",
              }}
            >
              <p className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: "rgba(0,229,168,0.5)" }}>
                Profile Summary
              </p>
              <div className="space-y-2.5 text-sm">
                {[
                  ["Class", playerClass ?? "—"],
                  ["Aptitude", `${score} / ${TEST_QUESTIONS.length}`],
                  ["Daily Goal", GOALS.find(g => g.value === dailyGoal)?.desc ?? "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-semibold text-white">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={submitOnboarding}
                disabled={isSubmitting}
                className="mc-btn-gradient flex items-center gap-2 px-12 py-3.5 rounded-full text-base font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Initializing…
                  </>
                ) : (
                  <>Initialize Dashboard <Sparkles className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
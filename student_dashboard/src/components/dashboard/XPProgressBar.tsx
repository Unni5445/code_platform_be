import { Sparkles, Star } from "lucide-react";

interface XPProgressBarProps {
  totalPoints: number;
  playerClass?: string;
}

function getLevelInfo(totalPoints: number) {
  let level = 1;
  let pointsLeft = totalPoints;
  let pointsRequired = 100;

  while (pointsLeft >= pointsRequired) {
    level++;
    pointsLeft -= pointsRequired;
    pointsRequired = Math.floor(pointsRequired * 1.5);
  }

  return {
    level,
    currentXP: pointsLeft,
    nextLevelXP: pointsRequired,
    progressPercentage: Math.min(100, Math.max(0, (pointsLeft / pointsRequired) * 100)),
  };
}

export function XPProgressBar({ totalPoints, playerClass }: XPProgressBarProps) {
  const { level, currentXP, nextLevelXP, progressPercentage } = getLevelInfo(totalPoints || 0);

  return (
    <div className="mc-glass relative overflow-hidden rounded-2xl p-6 sm:p-8">
      {/* Background Decor */}
      <div className="pointer-events-none absolute right-0 top-0 -translate-y-1/3 translate-x-1/3 opacity-20">
        <div className="h-64 w-64 animate-pulse rounded-full bg-primary-500 mix-blend-screen blur-[80px]" />
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">

        {/* Level Box */}
        <div className="flex items-center gap-5">
          <div className="relative flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border border-primary-500/30 bg-primary-500/10 shadow-[0_0_20px_rgba(59,130,246,0.15)] backdrop-blur-md">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary-400">Level</span>
            <span className="text-3xl font-extrabold text-white">{level}</span>
            <div className="absolute -right-2 -top-2 rounded-full border border-slate-700 bg-slate-800 p-1.5 shadow-lg">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              {playerClass || "Apprentice"} <Sparkles className="h-5 w-5 text-yellow-400" />
            </h2>
            <p className="text-sm font-medium text-slate-400">
              Rank progressing nicely! You are in the top 15% of your class.
            </p>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="flex w-full max-w-sm flex-col justify-center sm:text-right">
          <div className="mb-2 flex items-center justify-between sm:justify-end sm:gap-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 sm:hidden">
              Progress
            </span>
            <span className="text-sm font-bold text-white">
              <span className="text-primary-400">{currentXP}</span> / {nextLevelXP} XP
            </span>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full border border-slate-700/50 bg-slate-800/50">
            <div
              className="mc-bg-gradient h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.6)] transition-all duration-1000 ease-out bg-primary-600"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] font-medium text-slate-500">
            {nextLevelXP - currentXP} XP to next level
          </p>
        </div>
      </div>
    </div>
  );
}

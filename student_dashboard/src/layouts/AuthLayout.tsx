import { Outlet, Link } from "react-router-dom";
import {Code2, Flame, Award } from "lucide-react";
import logo from "@/assets/logo.jpeg";

export default function AuthLayout() {
  return (
    <div className="mc-page flex min-h-screen flex-col">
      {/* Navbar */}
      <header className="mc-navbar-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-14 w-14 bg-black rounded-xl flex items-center p-1 justify-center overflow-hidden">
              <img src={logo} alt="Logo" className="h-full w-full text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">
                Morattu Coder
              </p>
              <p className="text-sm font-semibold text-white">
                Level Up Your <span className="mc-gradient-text">Coding Skills</span>
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-1 text-[11px] text-slate-300">
              <Flame className="h-3.5 w-3.5 text-emerald-400" />
              New mock contests every week
            </span>
            <Link
              to="/login"
              className="mc-btn-outline hidden sm:inline-flex items-center px-4 py-1.5 text-xs"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="mc-btn-gradient inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 pb-10 pt-6 sm:px-6 lg:flex-row lg:items-center lg:pt-10">
        {/* Left – Auth card */}
        <div className="w-full lg:w-[430px]">
          <div className="mc-glass-soft mc-gradient-border rounded-2xl p-6 sm:p-7">
            <Outlet />
          </div>
        </div>

        {/* Right – Hero */}
        <div className="relative hidden flex-1 lg:block">
          <div className="mc-hero-particles">
            <span className="h-40 w-40 -left-10 top-0" />
            <span className="h-52 w-52 right-[-40px] top-[18%]" />
            <span className="h-48 w-48 left-[10%] bottom-[-32px]" />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="mc-fade-up space-y-4">
              <p className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.28em] text-emerald-200">
                New · Mock contests every week
              </p>
              <h2 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
                Master coding with{" "}
                <span className="mc-gradient-text font-semibold">live practice</span>,{" "}
                real contests, and a{" "}
                <span className="mc-gradient-text font-semibold">supportive leaderboard</span>.
              </h2>
              <p className="max-w-xl text-sm text-slate-300">
                From beginner to advanced, Morattu Coder keeps you consistent with daily problems,
                mock tests, and detailed feedback on every submission.
              </p>
            </div>

            {/* Floating live coding card */}
            <div className="mc-floating-card mc-glass-soft mc-gradient-border relative mt-4 inline-flex w-full max-w-md flex-col gap-4 rounded-2xl px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-primary-500 via-emerald-400 to-secondary-400 text-slate-950">
                    <Code2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">Live Coding Session</p>
                    <p className="text-[11px] text-slate-400">Optimize subarray sum · 120 XP</p>
                  </div>
                </div>
                <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                  Rank #27
                </div>
              </div>

              <div className="rounded-xl border border-slate-700/80 bg-slate-950/70 p-3 text-[11px] font-medium text-emerald-100 shadow-inner shadow-slate-900/60">
                <div className="mb-1.5 flex items-center justify-between text-[10px] text-slate-400">
                  <span>you / morattu_coder</span>
                  <span className="text-emerald-300">Runtime · 0.89 ms</span>
                </div>
                <pre className="code-font whitespace-pre text-[10px] leading-relaxed text-emerald-50">
{`def solve(arr):
    # TODO: optimize DP solution
    return max_subarray(arr)`}
                </pre>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 items-center rounded-full bg-emerald-500/15 px-2 text-[10px] font-semibold text-emerald-300">
                    +120 XP Daily Streak
                  </span>
                  <span className="inline-flex h-6 items-center rounded-full bg-sky-500/10 px-2 text-[10px] font-semibold text-sky-300">
                    Next contest starts in 02:14:32
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Award className="h-3.5 w-3.5 text-amber-300" />
                  <span>Grinding like a pro</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

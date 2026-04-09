import { Outlet, Link } from "react-router-dom";
import {Code2, Flame, Award } from "lucide-react";
import logo from "@/assets/logo.jpeg";

export default function AuthLayout() {
  return (
    <div className="mc-page flex min-h-screen flex-col">
      {/* Navbar */}
      <header className="mc-navbar-blur border-b border-slate-100">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-14 w-14 bg-white rounded-xl flex items-center p-1 justify-center overflow-hidden border border-slate-100 shadow-sm">
              <img src={logo} alt="Logo" className="h-full w-full" />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary-600/80">
                Morattu Coder
              </p>
              <p className="text-sm font-bold text-slate-900">
                Level Up Your <span className="mc-gradient-text">Coding Skills</span>
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600 font-bold">
              <Flame className="h-3.5 w-3.5 text-emerald-600" />
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
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xl shadow-slate-200/50">
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
              <p className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.28em] text-emerald-700">
                New · Mock contests every week
              </p>
              <h2 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
                Master coding with{" "}
                <span className="mc-gradient-text font-bold">live practice</span>,{" "}
                real contests, and a{" "}
                <span className="mc-gradient-text font-bold">supportive leaderboard</span>.
              </h2>
              <p className="max-w-xl text-sm text-slate-600 leading-relaxed font-medium">
                From beginner to advanced, Morattu Coder keeps you consistent with daily problems,
                mock tests, and detailed feedback on every submission.
              </p>
            </div>

            {/* Floating live coding card */}
            <div className="mc-floating-card relative mt-4 inline-flex w-full max-w-md flex-col gap-4 rounded-2xl bg-white p-5 border border-slate-200 shadow-2xl shadow-slate-200/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-primary-100 to-secondary-100 text-primary-700 border border-primary-200">
                    <Code2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Live Coding Session</p>
                    <p className="text-[11px] font-medium text-slate-500">Optimize subarray sum · 120 XP</p>
                  </div>
                </div>
                <div className="font-bold rounded-full bg-emerald-50 px-3 py-1 text-[11px] text-emerald-700 border border-emerald-100">
                  Rank #27
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-[11px] font-medium text-slate-700 shadow-inner">
                <div className="mb-1.5 flex items-center justify-between text-[10px] text-slate-500">
                  <span>you / morattu_coder</span>
                  <span className="text-emerald-600 font-bold">Runtime · 0.89 ms</span>
                </div>
                <pre className="code-font whitespace-pre text-[10px] leading-relaxed text-slate-800">
{`def solve(arr):
    # TODO: optimize DP solution
    return max_subarray(arr)`}
                </pre>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 items-center rounded-full bg-emerald-50 px-2 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                    +120 XP Daily Streak
                  </span>
                  <span className="inline-flex h-6 items-center rounded-full bg-primary-50 px-2 text-[10px] font-bold text-primary-700 border border-primary-100">
                    Next contest starts in 02:14:32
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Award className="h-3.5 w-3.5 text-amber-600" />
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

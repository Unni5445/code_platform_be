export default function Hero() {
  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.querySelector(id);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="px-6 pt-18 pb-18 max-md:px-[1.15rem]" id="hero">
      <div className="mx-auto grid max-w-[1120px] grid-cols-[minmax(0,1.2fr)_minmax(0,1.1fr)] items-center gap-14 max-[960px]:grid-cols-1">
        <div className="landing-reveal">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-green-500/50 bg-green-600/12 px-3 py-0.5 text-xs text-green-200">
            New &bull; Mock Contests Every Week
          </span>
          <h1 className="mb-4 text-[clamp(2.35rem,4vw,3rem)] leading-[1.1] max-[480px]:text-[2rem]">
            Level Up Your{" "}
            <span className="bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
              Coding Skills
            </span>
          </h1>
          <p className="max-w-[32rem] text-[0.98rem] text-gray-400">
            Practice coding problems, take mock tests, and prepare for technical
            interviews with <strong className="text-gray-200">Morattu Coder</strong>. Designed for students
            and developers who want to push their limits.
          </p>
          <div className="mt-7 flex flex-wrap gap-3.5">
            <a href="#features" className="relative overflow-hidden rounded-full bg-gradient-to-br from-green-500 to-blue-500 px-5 py-2 text-sm font-medium text-gray-50 no-underline shadow-[0_10px_30px_rgba(34,197,94,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(34,197,94,0.55)]" onClick={(e) => scrollTo(e, "#features")}>
              Start Practicing
            </a>
            <a href="#topics" className="rounded-full border border-slate-400/80 bg-transparent px-5 py-2 text-sm font-medium text-gray-200 no-underline transition-all duration-300 hover:border-blue-400/90 hover:bg-[radial-gradient(circle,rgba(37,99,235,0.35),transparent)] hover:shadow-[0_0_24px_rgba(59,130,246,0.35)]" onClick={(e) => scrollTo(e, "#topics")}>
              Explore Problems
            </a>
          </div>
          <div className="mt-7 flex flex-wrap gap-5 text-xs text-gray-400">
            <div className="inline-flex items-center gap-1.5">
              <span className="h-[7px] w-[7px] rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.9)]"></span>
              <span>Real interview-style problems</span>
            </div>
            <div className="inline-flex items-center gap-1.5">
              <span className="h-[7px] w-[7px] rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.9)]"></span>
              <span>Instant feedback &amp; detailed solutions</span>
            </div>
          </div>
        </div>

        <div className="landing-reveal max-[960px]:-order-1">
          <div className="relative overflow-hidden rounded-[20px] border border-slate-400/40 bg-[radial-gradient(circle_at_top_left,#0b1120,#020617)] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.9)] before:pointer-events-none before:absolute before:inset-[-40%] before:bg-[conic-gradient(from_220deg,rgba(34,197,94,0.05),rgba(59,130,246,0.2),rgba(34,197,94,0.08),transparent)] before:opacity-90 before:mix-blend-screen">
            <div className="relative z-10 mb-4 flex items-center justify-between gap-3">
              <span className="mr-2 h-2 w-2 rounded-full bg-green-500 shadow-[0_0_14px_rgba(34,197,94,0.9)]"></span>
              <span className="text-xs text-gray-400">Live Coding Session</span>
              <span className="rounded-full border border-blue-500/60 bg-blue-600/20 px-3 py-0.5 text-[0.7rem] text-blue-200">
                Morattu Coder
              </span>
            </div>
            <div className="relative z-10">
              <div className="overflow-hidden rounded-[14px] border border-blue-800/70 bg-[#020617]">
                <div className="flex gap-1.5 border-b border-blue-800/90 bg-slate-900/90 px-2.5 py-2">
                  <span className="h-2 w-2 rounded-full bg-slate-400/45"></span>
                  <span className="h-2 w-2 rounded-full bg-slate-400/45"></span>
                  <span className="h-2 w-2 rounded-full bg-slate-400/45"></span>
                </div>
                <div className="p-3.5 font-mono text-[0.78rem] text-gray-200">
                  <p className="mb-0.5"><span className="mr-1.5 text-green-500">$</span> def solve(arr):</p>
                  <p className="mb-0.5 pl-4 text-gray-400"># TODO: Optimize DP solution</p>
                  <p className="mb-0.5 pl-4 text-gray-400">return max_subarray(arr)</p>
                  <p><span className="mr-1.5 text-green-500">$</span> Runtime: <span className="text-green-500">0.89 ms</span></p>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-3">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-blue-500 text-xs font-semibold">
                  MC
                </div>
                <div>
                  <p className="text-[0.85rem]">You</p>
                  <p className="text-xs text-gray-400">Grinding Code Like a Pro</p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -top-3.5 -right-2 animate-[landing-float_6s_ease-in-out_infinite] rounded-[14px] border border-slate-400/50 bg-slate-900/90 px-3.5 py-3 text-[0.7rem] text-gray-400 shadow-[0_16px_40px_rgba(15,23,42,0.9)] backdrop-blur-[18px]">
            <p className="font-medium text-gray-200">+120 <span className="text-green-500">XP</span></p>
            <span className="text-xs text-green-500">Daily Streak</span>
          </div>
          <div className="absolute right-[-30px] bottom-[14%] animate-[landing-float_6s_ease-in-out_infinite_0.9s] rounded-[14px] border border-slate-400/50 bg-slate-900/90 px-3.5 py-3 text-[0.7rem] text-gray-400 shadow-[0_16px_40px_rgba(15,23,42,0.9)] backdrop-blur-[18px]">
            <p className="font-medium text-gray-200">Contest Starts In</p>
            <span className="text-xs text-green-500">02:14:32</span>
          </div>
          <div className="absolute top-[15%] -left-6 animate-[landing-float_6s_ease-in-out_infinite_1.8s] rounded-[14px] border border-slate-400/50 bg-slate-900/90 px-3.5 py-3 text-[0.7rem] text-gray-400 shadow-[0_16px_40px_rgba(15,23,42,0.9)] backdrop-blur-[18px]">
            <p className="font-medium text-gray-200">Rank</p>
            <span className="text-xs text-green-500">#27</span>
          </div>
        </div>
      </div>
    </section>
  );
}

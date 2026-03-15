import { useEffect, useRef, useState } from "react";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function StatNumber({ target }: { target: number }) {
  const [display, setDisplay] = useState("0+");
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          const duration = 1800;
          const startTime = performance.now();

          function step(currentTime: number) {
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const eased = easeOutCubic(progress);
            const current = Math.floor(target * eased);
            const text = target >= 1000 ? current.toLocaleString() + "+" : current + "+";

            if (progress < 1) {
              setDisplay(text);
              requestAnimationFrame(step);
            } else {
              setDisplay(target >= 1000 ? target.toLocaleString() + "+" : target + "+");
            }
          }

          requestAnimationFrame(step);
          observer.unobserve(el);
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, started]);

  return (
    <span ref={ref} className="mb-1.5 block bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-[1.6rem] font-semibold text-transparent">
      {display}
    </span>
  );
}

export default function Stats() {
  const stats = [
    { target: 10000, label: "Problems Solved" },
    { target: 5000, label: "Active Coders" },
    { target: 200, label: "Mock Tests" },
    { target: 100, label: "Company Question Sets" },
  ];

  return (
    <section className="px-6 pt-6 pb-18 max-md:px-[1.15rem]" id="stats">
      <div className="landing-reveal mx-auto max-w-[1120px] rounded-[26px] border border-blue-600/60 bg-[radial-gradient(circle_at_top,#020617,#020617)] px-8 py-10 shadow-[0_26px_80px_rgba(15,23,42,1)] max-md:px-5">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-2xl font-bold">Trusted by a Growing Community</h2>
          <p className="text-sm text-gray-400">Track your progress and see how far you've come.</p>
        </div>
        <div className="grid grid-cols-4 gap-6 max-[960px]:grid-cols-2 max-[480px]:grid-cols-1">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <StatNumber target={s.target} />
              <span className="text-xs text-gray-400">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

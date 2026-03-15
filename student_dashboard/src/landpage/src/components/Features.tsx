export default function Features() {
  const features = [
    {
      icon: "</>",
      iconClass: "bg-green-600/15 text-green-200",
      title: "Coding Challenges",
      desc: "Solve hundreds of coding problems and improve your logic.",
      btn: "Practice Now",
    },
    {
      icon: "\u23F1",
      iconClass: "bg-blue-600/18 text-blue-200",
      title: "Mock Tests & Contests",
      desc: "Take timed coding tests and compete with coders worldwide.",
      btn: "Take a Test",
    },
    {
      icon: "\uD83D\uDCBC",
      iconClass: "bg-purple-500/18 text-pink-200",
      title: "Interview Preparation",
      desc: "Prepare with company-wise questions and curated coding kits.",
      btn: "Start Preparing",
    },
  ];

  return (
    <section className="px-6 py-18 max-md:px-[1.15rem]" id="features">
      <div className="landing-reveal mb-11 text-center">
        <h2 className="mb-2.5 text-[1.6rem] font-bold">Master Coding with Powerful Features</h2>
        <p className="text-[0.95rem] text-gray-400">
          From beginner to advanced, Morattu Coder helps you stay consistent,
          competitive, and interview-ready.
        </p>
      </div>
      <div className="mx-auto grid max-w-[1120px] grid-cols-3 gap-6 max-[960px]:grid-cols-2 max-md:grid-cols-1">
        {features.map((f, i) => (
          <article
            key={i}
            className="landing-reveal group relative overflow-hidden rounded-[14px] border border-slate-400/35 bg-[radial-gradient(circle_at_top_left,#020617,#020617)] p-5 shadow-[0_16px_45px_rgba(15,23,42,0.85)] transition-all duration-300 before:pointer-events-none before:absolute before:inset-[-20%] before:bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.2),transparent)] before:opacity-0 before:transition-opacity before:duration-[450ms] hover:-translate-y-2.5 hover:border-blue-500/80 hover:shadow-[0_26px_60px_rgba(15,23,42,0.98)] hover:before:opacity-100"
          >
            <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-[14px] text-[1.1rem] ${f.iconClass}`}>
              <span>{f.icon}</span>
            </div>
            <h3 className="mb-2 text-[1.05rem] font-bold">{f.title}</h3>
            <p className="mb-4 text-sm text-gray-400">{f.desc}</p>
            <button className="cursor-pointer rounded-full border border-slate-400/70 bg-slate-900/90 px-4 py-2 text-[0.78rem] font-medium text-gray-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-green-500/90 hover:bg-[radial-gradient(circle,rgba(34,197,94,0.3),transparent)] hover:shadow-[0_16px_32px_rgba(34,197,94,0.45)]">
              {f.btn}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function Footer() {
  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.querySelector(id);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <footer className="text-white border-t border-blue-800/80 bg-[radial-gradient(circle_at_top,#020617,#020617)]">
      <div className="mx-auto grid max-w-[1120px] grid-cols-[minmax(0,1.3fr)_repeat(2,minmax(0,1fr))] gap-10 px-6 pt-9 pb-6 max-md:grid-cols-1">
        <div>
          <div className="inline-flex items-center gap-2.5">
            <span className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-blue-500 text-[0.95rem] font-bold text-emerald-50 shadow-[0_0_25px_rgba(34,197,94,0.7)]">
              &lt;/&gt;
            </span>
            <span className="font-semibold tracking-wide">
              Morattu{" "}
              <span className="bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
                Coder
              </span>
            </span>
          </div>
          <p className="mt-3 max-w-[20rem] text-[0.86rem] text-gray-400">
            A modern platform to practice coding, compete in contests, and crush
            your next interview.
          </p>
        </div>
        <div>
          <h4 className="mb-2.5 text-[0.92rem] font-bold">Quick Links</h4>
          <ul className="list-none">
            <li><a href="#features" onClick={(e) => scrollTo(e, "#features")} className="mb-2 inline-block text-[0.85rem] text-gray-400 no-underline transition-all duration-200 hover:translate-x-1 hover:text-gray-200">Problems</a></li>
            <li><a href="#features" onClick={(e) => scrollTo(e, "#features")} className="mb-2 inline-block text-[0.85rem] text-gray-400 no-underline transition-all duration-200 hover:translate-x-1 hover:text-gray-200">Mock Tests</a></li>
            <li><a href="#cta" onClick={(e) => scrollTo(e, "#cta")} className="mb-2 inline-block text-[0.85rem] text-gray-400 no-underline transition-all duration-200 hover:translate-x-1 hover:text-gray-200">Compiler</a></li>
            <li><a href="#cta" onClick={(e) => scrollTo(e, "#cta")} className="mb-2 inline-block text-[0.85rem] text-gray-400 no-underline transition-all duration-200 hover:translate-x-1 hover:text-gray-200">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-2.5 text-[0.92rem] font-bold">Connect</h4>
          <div className="flex gap-2.5">
            <a href="#" aria-label="GitHub" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-400/70 bg-slate-900/90 text-[0.65rem] text-gray-400 no-underline transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/90 hover:bg-[radial-gradient(circle,rgba(37,99,235,0.4),transparent)] hover:shadow-[0_16px_32px_rgba(59,130,246,0.5)]">
              GH
            </a>
            <a href="#" aria-label="LinkedIn" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-400/70 bg-slate-900/90 text-[0.65rem] text-gray-400 no-underline transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/90 hover:bg-[radial-gradient(circle,rgba(37,99,235,0.4),transparent)] hover:shadow-[0_16px_32px_rgba(59,130,246,0.5)]">
              IN
            </a>
            <a href="#" aria-label="Twitter" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-400/70 bg-slate-900/90 text-[0.65rem] text-gray-400 no-underline transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/90 hover:bg-[radial-gradient(circle,rgba(37,99,235,0.4),transparent)] hover:shadow-[0_16px_32px_rgba(59,130,246,0.5)]">
              TW
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-900/90 px-6 pt-3.5 pb-6 text-center text-[0.78rem] text-gray-400">
        <p>&copy; {new Date().getFullYear()} Morattu Coder. All rights reserved.</p>
      </div>
    </footer>
  );
}

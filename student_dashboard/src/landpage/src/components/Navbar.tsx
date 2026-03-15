import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext.tsx";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleLinkClick = () => setIsOpen(false);

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.querySelector(id);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    handleLinkClick();
  };

  return (
    <header className="sticky top-0 z-50">
      <nav className="mx-auto flex max-w-[1120px] items-center justify-between gap-4 border-b border-slate-400/30 bg-gradient-to-br from-slate-900/85 to-slate-900/65 px-6 py-4 backdrop-blur-[22px] max-md:px-[1.15rem]">
        <div className="flex items-center gap-11 max-md:gap-4">
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
          <ul
            className={`flex list-none items-center gap-6 max-md:pointer-events-none max-md:fixed max-md:inset-x-5 max-md:top-[72px] max-md:flex-col max-md:items-start max-md:gap-3.5 max-md:rounded-2xl max-md:border max-md:border-blue-900/90 max-md:bg-slate-900/[0.98] max-md:p-4 max-md:opacity-0 max-md:backdrop-blur-[20px] max-md:transition-all max-md:duration-200 max-md:ease-out ${isOpen ? "max-md:pointer-events-auto max-md:translate-y-0 max-md:opacity-100" : "max-md:-translate-y-4"}`}
          >
            <li><a href="#features" onClick={(e) => scrollTo(e, "#features")} className="relative pb-0.5 text-sm text-gray-400 no-underline transition-colors duration-200 ease-out hover:text-gray-200 hover:after:w-full after:absolute after:bottom-[-0.25rem] after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-gradient-to-r after:from-green-500 after:to-blue-500 after:transition-[width] after:duration-300">Problems</a></li>
            <li><a href="#features" onClick={(e) => scrollTo(e, "#features")} className="relative pb-0.5 text-sm text-gray-400 no-underline transition-colors duration-200 ease-out hover:text-gray-200 hover:after:w-full after:absolute after:bottom-[-0.25rem] after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-gradient-to-r after:from-green-500 after:to-blue-500 after:transition-[width] after:duration-300">Mock Tests</a></li>
            <li><a href="#features" onClick={(e) => scrollTo(e, "#features")} className="relative pb-0.5 text-sm text-gray-400 no-underline transition-colors duration-200 ease-out hover:text-gray-200 hover:after:w-full after:absolute after:bottom-[-0.25rem] after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-gradient-to-r after:from-green-500 after:to-blue-500 after:transition-[width] after:duration-300">Contests</a></li>
            <li><a href="#cta" onClick={(e) => scrollTo(e, "#cta")} className="relative pb-0.5 text-sm text-gray-400 no-underline transition-colors duration-200 ease-out hover:text-gray-200 hover:after:w-full after:absolute after:bottom-[-0.25rem] after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-gradient-to-r after:from-green-500 after:to-blue-500 after:transition-[width] after:duration-300">Compiler</a></li>
            <li><a href="#topics" onClick={(e) => scrollTo(e, "#topics")} className="relative pb-0.5 text-sm text-gray-400 no-underline transition-colors duration-200 ease-out hover:text-gray-200 hover:after:w-full after:absolute after:bottom-[-0.25rem] after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-gradient-to-r after:from-green-500 after:to-blue-500 after:transition-[width] after:duration-300">Learn</a></li>
            <li><a href="#stats" onClick={(e) => scrollTo(e, "#stats")} className="relative pb-0.5 text-sm text-gray-400 no-underline transition-colors duration-200 ease-out hover:text-gray-200 hover:after:w-full after:absolute after:bottom-[-0.25rem] after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-gradient-to-r after:from-green-500 after:to-blue-500 after:transition-[width] after:duration-300">Leaderboard</a></li>
          </ul>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link to="/dashboard" className="rounded-full bg-gradient-to-br from-green-500 to-blue-500 px-5 py-2 text-sm font-medium text-gray-50 no-underline shadow-[0_10px_30px_rgba(34,197,94,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(34,197,94,0.55)]">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="rounded-full border border-slate-400/70 bg-slate-900/85 px-5 py-2 text-sm font-medium text-gray-200 no-underline transition-all duration-300 hover:border-indigo-400/90 hover:bg-blue-800/35 max-md:hidden">
                Login
              </Link>
              <Link to="/signup" className="rounded-full bg-gradient-to-br from-green-500 to-blue-500 px-5 py-2 text-sm font-medium text-gray-50 no-underline shadow-[0_10px_30px_rgba(34,197,94,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(34,197,94,0.55)]">
                Sign Up
              </Link>
            </>
          )}
          <button
            className={`hidden h-[34px] w-[34px] cursor-pointer flex-col items-center justify-center gap-1 rounded-full border border-slate-400/60 bg-slate-900/90 max-md:inline-flex`}
            aria-label="Toggle navigation"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className={`h-0.5 w-4 rounded-full bg-gray-200 transition-transform duration-[250ms] ease-out ${isOpen ? "translate-y-[3px] rotate-45" : ""}`}></span>
            <span className={`h-0.5 w-4 rounded-full bg-gray-200 transition-transform duration-[250ms] ease-out ${isOpen ? "-translate-y-[3px] -rotate-45" : ""}`}></span>
          </button>
        </div>
      </nav>
    </header>
  );
}

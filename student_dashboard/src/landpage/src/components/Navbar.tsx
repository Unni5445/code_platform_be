import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext.tsx";
import  logo from "@/assets/logo.jpeg";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50">
      <nav className="mx-auto flex max-w-[1120px] items-center justify-between gap-4 border-b border-slate-400/30 bg-gradient-to-br from-slate-900/85 to-slate-900/65 px-6 py-4 backdrop-blur-[22px] max-md:px-[1.15rem]">
        <div className="flex items-center gap-11 max-md:gap-4">
          <div className="inline-flex items-center gap-2.5">
            <div className="h-14 w-14 bg-black rounded-xl flex items-center p-1 justify-center overflow-hidden">
              <img src={logo} alt="Logo" className="h-full w-full text-white" />
            </div>
            <span className="font-semibold tracking-wide">
              Morattu{" "}
              <span className="bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
                Coder
              </span>
            </span>
          </div>
        
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

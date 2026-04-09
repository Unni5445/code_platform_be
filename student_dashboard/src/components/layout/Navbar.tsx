import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  Trophy,
  LogOut,
  Swords,
  Shield,
  Medal,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { PATHS } from "@/config/routes";
import { useAuth } from "@/context/AuthContext";
import clsx from "clsx";
import logo from "@/assets/logo.jpeg";
import { Avatar } from "@/components/ui";

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { path: PATHS.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
  { path: PATHS.QUESTS, label: "Quests", icon: Swords },
  { path: PATHS.CONTESTS, label: "Contests", icon: Medal },
  { path: PATHS.MOCK_INTERVIEWS, label: "Interviews", icon: Shield },
  { path: PATHS.COURSES, label: "Courses", icon: BookOpen },
  { path: PATHS.TESTS, label: "Tests", icon: FileQuestion },
  { path: PATHS.LEADERBOARD, label: "Leaderboard", icon: Trophy },
];

export function Navbar() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/60">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-black rounded-xl flex items-center p-1 justify-center overflow-hidden">
              <img src={logo} alt="Logo" className="h-full w-full text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-slate-900 font-bold text-sm leading-tight">Morattu Coder</h1>
              <p className="text-slate-500 text-[10px]">Student Portal</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== PATHS.DASHBOARD && location.pathname.startsWith(item.path));

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary-50 text-primary-700 border border-primary-200 shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon
                    className={clsx("h-4 w-4 shrink-0", isActive ? "text-primary-400" : "text-slate-500")}
                  />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right section: Profile & Mobile Toggle */}
          <div className="flex items-center gap-4">
            <NavLink 
              to="/profile"
              className="hidden sm:flex items-center gap-3 pr-4 border-r border-slate-200 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user?.name || "Student"}</p>
                <p className="text-xs text-slate-500">{user?.email || ""}</p>
              </div>
              <Avatar name={user?.name || "Student"} size="sm" />
            </NavLink>

            <button
              onClick={() => logout()}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800/60 hover:text-white transition-all duration-200 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden xl:block">Sign Out</span>
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer shadow-sm"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white shadow-xl">
          <div className="px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== PATHS.DASHBOARD && location.pathname.startsWith(item.path));

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary-50 text-primary-700 border border-primary-200"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon
                    className={clsx("h-5 w-5 shrink-0", isActive ? "text-primary-400" : "text-slate-500")}
                  />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
            
            <NavLink 
              to="/profile"
              onClick={() => setMobileOpen(false)}
              className="mt-4 pt-4 border-t border-slate-100 text-center flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
            >
                 <Avatar name={user?.name || "Student"} size="md" />
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium text-slate-900">{user?.name || "Student"}</p>
                    <p className="text-xs text-slate-500">{user?.email || ""}</p>
                  </div>
            </NavLink>
            
            <button
              onClick={() => {
                setMobileOpen(false);
                logout();
              }}
              className="mt-4 flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

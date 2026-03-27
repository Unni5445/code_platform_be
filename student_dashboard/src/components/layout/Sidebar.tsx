import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  Trophy,
  Calendar,
  UserRound,
  LogOut,
  Code2,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { PATHS } from "@/config/routes";
import { useAuth } from "@/context/AuthContext";
import clsx from "clsx";
import logo from "@/assets/logo.jpeg"

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { path: PATHS.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
  { path: PATHS.COURSES, label: "My Courses", icon: BookOpen },
  { path: PATHS.TESTS, label: "Tests", icon: FileQuestion },
  { path: PATHS.PLAYGROUND, label: "Playground", icon: Code2 },
  { path: PATHS.LEADERBOARD, label: "Leaderboard", icon: Trophy },
  { path: PATHS.ACTIVITY, label: "Activity", icon: Calendar },
  { path: PATHS.PROFILE, label: "Profile", icon: UserRound },
];

export function Sidebar() {
  const location = useLocation();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button - fixed overlay trigger */}
      <button
        onClick={() => setMobileOpen((p) => !p)}
        className="lg:hidden fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/90 text-slate-200 backdrop-blur-sm cursor-pointer"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - left fixed, same structure as before */}
      <aside
        className={clsx(
          "fixed left-0 top-0 z-40 h-screen w-64 flex flex-col bg-sidebar border-r border-slate-800/80 transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="px-6 py-6 flex items-center gap-3">
          <div className="h-14 w-14 bg-black rounded-xl flex items-center p-1 justify-center overflow-hidden">
            <img src={logo} alt="Logo" className="h-full w-full text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Morattu Coder</h1>
            <p className="text-slate-400 text-xs">Student Portal</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                    ? "bg-primary-500/20 text-white border border-primary-500/40 shadow-lg shadow-primary-500/10"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                )}
              >
                <item.icon
                  className={clsx("h-5 w-5 shrink-0", isActive ? "text-primary-400" : "text-slate-500")}
                />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-slate-800/80">
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800/60 hover:text-white transition-all duration-200 cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  Trophy,
  Calendar,
  UserRound,
  LogOut,
  GraduationCap,
  Code2,
} from "lucide-react";
import { PATHS } from "@/config/routes";
import { useAuth } from "@/context/AuthContext";
import clsx from "clsx";

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

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar flex flex-col z-40">
      {/* Brand */}
      <div className="px-6 py-6 flex items-center gap-3">
        <div className="h-10 w-10 bg-primary-600 rounded-xl flex items-center justify-center">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg leading-tight">Skill & Brains</h1>
          <p className="text-sidebar-text text-xs">Student Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== PATHS.DASHBOARD && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-active text-sidebar-text-active shadow-lg shadow-primary-900/20"
                  : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
              )}
            >
              {isActive && (
                <div className="absolute left-0 w-1 h-8 bg-primary-500 rounded-r-full" />
              )}
              <item.icon className={clsx("h-5 w-5", isActive && "text-primary-400")} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-sidebar-text hover:bg-sidebar-hover hover:text-white transition-all duration-200 cursor-pointer"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
